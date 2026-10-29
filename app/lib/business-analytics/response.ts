import { assertBusinessReport } from './engine';
import { OPERATIONAL_SOURCES, type BusinessExportReceipt, type BusinessExportRequest, type BusinessSnapshot, type OperationalData } from './contracts';
const count = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const timestamp = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d\d-\d\dT.*Z$/.test(s) && Number.isFinite(Date.parse(s));
const text = (s: unknown): s is string => typeof s === 'string' && !!s.trim();
const exact = (s: unknown, decimals: number) => typeof s === 'string' && /^(0|[1-9]\d*)(\.\d+)?$/.test(s) && (s.split('.')[1]?.length ?? 0) <= decimals;
const counts = (value: object, keys: readonly string[]) => keys.every(key => count((value as Record<string, unknown>)[key]));
export function validOperationalData(key: string, value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const fields: Record<string, string[]> = {
    users: ['clients', 'active', 'blocked', 'verified', 'seen_30d'], subscriptions: ['open', 'active', 'past_due', 'suspended', 'canceling', 'contracted_mrr_minor', 'overdue_minor', 'overdue_invoices', 'renewals_7d', 'plans'], referrals: ['invited', 'registered', 'qualified', 'pending_minor', 'held_minor', 'queued_minor', 'paid_history_minor'], wallets: ['observed_wallets', 'transfers', 'completed', 'pending', 'processing', 'rejected', 'cancelled', 'positions', 'settlements', 'pending_orders', 'credit_applications'], cards: ['total', 'active', 'pending', 'frozen', 'blocked', 'terminated'], risk: ['open_cases', 'critical_cases', 'overdue_cases', 'restricted_accounts'], rates: ['version', 'enabled_products', 'paused_products', 'pending_releases'],
  };
  if (!fields[key] || Object.keys(value).length !== fields[key].length || Object.keys(value).some(field => !fields[key].includes(field))) return false;
  const d = value as OperationalData[keyof OperationalData];
  switch (key) {
    case 'users': {const r = d as OperationalData['users']; return counts(r, ['clients', 'active', 'blocked', 'verified', 'seen_30d']) && r.active + r.blocked === r.clients && r.verified <= r.clients && r.seen_30d <= r.clients;}
    case 'subscriptions': {const r = d as OperationalData['subscriptions']; return counts(r, ['open', 'active', 'past_due', 'suspended', 'canceling', 'contracted_mrr_minor', 'overdue_minor', 'overdue_invoices', 'renewals_7d']) && r.active + r.past_due + r.suspended === r.open && r.canceling <= r.open && r.renewals_7d <= r.open && Array.isArray(r.plans) && r.plans.length === 3 && new Set(r.plans.map(p => p?.plan)).size === 3 && r.plans.every(p => p && ['STANDARD', 'PREMIUM', 'METAL'].includes(p.plan) && count(p.count)) && r.plans.reduce((sum, p) => sum + p.count, 0) === r.open;}
    case 'referrals': {const r = d as OperationalData['referrals']; return counts(r, ['invited', 'registered', 'qualified', 'pending_minor', 'held_minor', 'queued_minor', 'paid_history_minor']) && r.qualified <= r.registered && r.registered <= r.invited;}
    case 'cards': {const r = d as OperationalData['cards']; return counts(r, ['total', 'active', 'pending', 'frozen', 'blocked', 'terminated']) && r.active + r.pending + r.frozen + r.blocked + r.terminated === r.total;}
    case 'risk': {const r = d as OperationalData['risk']; return counts(r, ['open_cases', 'critical_cases', 'overdue_cases', 'restricted_accounts']) && r.critical_cases <= r.open_cases && r.overdue_cases <= r.open_cases;}
    case 'rates': return counts(d, ['version', 'enabled_products', 'paused_products', 'pending_releases']);
    case 'wallets': {
      const r = d as OperationalData['wallets'];
      const precision = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= 36;
      return counts(r, ['observed_wallets', 'transfers', 'completed', 'pending', 'processing', 'rejected', 'cancelled', 'pending_orders', 'credit_applications']) && r.completed + r.pending + r.processing + r.rejected + r.cancelled === r.transfers
        && Array.isArray(r.positions) && new Set(r.positions.map(p => p?.asset)).size === r.positions.length && r.positions.every(p => p && text(p.asset) && ['fiat', 'crypto', 'stock'].includes(p.kind) && precision(p.decimals) && exact(p.available, p.decimals) && exact(p.reserved, p.decimals))
        && Array.isArray(r.settlements) && new Set(r.settlements.map(p => p?.asset)).size === r.settlements.length && r.settlements.every(p => p && text(p.asset) && precision(p.decimals) && exact(p.incoming, p.decimals) && exact(p.outgoing, p.decimals) && count(p.completed) && r.positions.some(a => a.asset === p.asset && a.decimals === p.decimals)) && r.settlements.reduce((sum, p) => sum + p.completed, 0) === r.completed;
    }
    default: return false;
  }
}
export function parseBusinessSnapshot(value: unknown): BusinessSnapshot {
  const s = value as BusinessSnapshot | null;
  if (!s || Object.keys(s).length !== 8 || s.schema_version !== 1 || !text(s.snapshot_id) || !['demo', 'live'].includes(s.mode) || !timestamp(s.as_of) || !['ILLUSTRATIVE_WAREHOUSE', 'BOOKED_WAREHOUSE'].includes(s.financial_basis) || !['BEST_EFFORT', 'CONSISTENT_CUTOFF'].includes(s.consistency)) throw new Error('Invalid business analytics snapshot.');
  assertBusinessReport(s.report);
  const o = s.operations;
  if (Date.parse(s.report.as_of) > Date.parse(s.as_of) || !o || !timestamp(o.as_of) || Date.parse(o.as_of) > Date.parse(s.as_of) || !timestamp(o.window_from) || !timestamp(o.window_to) || Date.parse(o.window_to) > Date.parse(o.as_of) || Date.parse(o.window_from) > Date.parse(o.window_to) || !o.sources || Object.keys(o.sources).length !== OPERATIONAL_SOURCES.length) throw new Error('Invalid analytics cutoffs or source coverage.');
  for (const key of OPERATIONAL_SOURCES) {
    const source = o.sources[key];
    if (!source || Object.keys(source).length !== 6 || !text(source.scope) || !['READY', 'ERROR'].includes(source.status)) throw new Error(`Missing analytics source: ${key}.`);
    if (source.status === 'ERROR') {if (source.data !== null || source.as_of !== null || source.revision !== null || !text(source.error)) throw new Error(`Invalid error coverage for ${key}.`);}
    else if (!timestamp(source.as_of) || Date.parse(source.as_of) > Date.parse(s.as_of) || !text(source.revision) || source.error !== null || !validOperationalData(key, source.data)) throw new Error(`Invalid analytics aggregates for ${key}.`);
  }
  return s;
}
export function parseBusinessExportReceipt(value: unknown, request: BusinessExportRequest): BusinessExportReceipt {
  const r = value as BusinessExportReceipt | null;
  if (!r || r.request_id !== request.request_id || r.snapshot_id !== request.snapshot_id || r.report_id !== request.report_id || r.content_sha256 !== request.content_sha256 || !text(r.audit_event_id) || !timestamp(r.requested_at)) throw new Error('Export receipt does not match the reviewed report. No download was started.');
  return r;
}
