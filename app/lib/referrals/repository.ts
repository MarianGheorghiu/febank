import { MOCK_REFERRAL_REPORT } from "@/app/lib/mock/admin/referrals";
import type { ReferralsRepository } from "@/app/lib/types/admin/referrals";
import type { CustomerReferralSummary, ReferralActor, ReferralRepository, ReferralSnapshot } from './contracts';
import { validReferralState } from './operations';
// Kept for report consumers; operational views use createReferralsRepository.
export const mockReferralsRepository: ReferralsRepository = {
  async getReport() { return structuredClone(MOCK_REFERRAL_REPORT); },
};

export function parseReferralSnapshot(value: unknown): ReferralSnapshot {
  const s = value as ReferralSnapshot | null, p = s?.policy;
  if (!s || s.schema_version !== 1 || !['demo', 'live'].includes(s.mode) || typeof s.as_of !== 'string' || !/^\d{4}-\d\d-\d\dT.*Z$/.test(s.as_of) || !Number.isFinite(Date.parse(s.as_of)) || !validReferralState(s.state) || s.state.report.as_of !== s.as_of || !p || !Number.isSafeInteger(p.config_revision) || p.config_revision < 1 || !Number.isSafeInteger(p.reward_minor) || p.reward_minor < 0 || !Number.isSafeInteger(p.qualification_days) || p.qualification_days < 1 || p.qualification_days > 180 || typeof p.program_enabled !== 'boolean' || !Array.isArray(s.eligible_referrer_ids) || new Set(s.eligible_referrer_ids).size !== s.eligible_referrer_ids.length || !s.eligible_referrer_ids.every(id => s.state.report.referrers.some(r => r.id === id))) throw new Error('Invalid referral service response.');
  return s;
}
const apiBase = () => (process.env.NEXT_PUBLIC_REFERRALS_API_URL ?? '').replace(/\/$/, '');
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBase()}/v1/${path}`, {...init, credentials: 'include', cache: 'no-store', headers: {Accept: 'application/json', ...init.headers}});
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(typeof body?.error?.message === 'string' ? body.error.message : `Referral service unavailable (${response.status}).`); }
  return response.json();
}
export function createReferralsRepository(actor: ReferralActor): ReferralRepository {
  if (actor.role !== 'admin' || !actor.email.trim()) throw new Error('Administrator access required.');
  const mode = process.env.NEXT_PUBLIC_REFERRALS_MODE ?? 'demo';
  if (mode === 'demo') return {
    async getSnapshot() { const {getDemoReferralSnapshot} = await import('./store'); return parseReferralSnapshot(await getDemoReferralSnapshot()); },
    async execute(command) { const {executeDemoReferralCommand} = await import('./store'); return parseReferralSnapshot(await executeDemoReferralCommand(command, actor)); },
  };
  if (mode !== 'http') throw new Error('Unknown referral service mode.');
  async function live(path: string, init?: RequestInit) { const s = parseReferralSnapshot(await request(path, init)); if (s.mode !== 'live') throw new Error('Referral service must return live data.'); return s; }
  return {
    getSnapshot: signal => live('admin/referrals', {signal}),
    execute: command => {if (!command.request_id.trim()) throw new Error('Idempotency key required.'); return live('admin/referrals/commands', {method: 'POST', headers: {'Content-Type': 'application/json', 'Idempotency-Key': command.request_id}, body: JSON.stringify({schema_version: 1, command})});},
  };
}

export function parseCustomerReferralSummary(value: unknown): CustomerReferralSummary {
  const s = value as CustomerReferralSummary | null;
  if (!s || s.schema_version !== 1 || !['demo', 'live'].includes(s.mode) || !Number.isFinite(Date.parse(s.as_of)) || s.currency !== 'EUR' || !(s.referral_code === null || typeof s.referral_code === 'string') || typeof s.program_available !== 'boolean' || ![s.invited, s.registered, s.qualified, s.paid_minor, s.pending_minor, s.held_minor, s.queued_minor].every(n => Number.isSafeInteger(n) && n >= 0) || s.qualified > s.registered || s.registered > s.invited) throw new Error('Invalid customer referral summary.');
  return s;
}
export async function getCustomerReferralSummary(email: string, signal?: AbortSignal): Promise<CustomerReferralSummary> {
  const mode = process.env.NEXT_PUBLIC_REFERRALS_MODE ?? 'demo';
  if (mode === 'http') {const s = parseCustomerReferralSummary(await request('me/referrals', {signal})); if (s.mode !== 'live') throw new Error('Referral service must return live data.'); return s;}
  if (mode !== 'demo') throw new Error('Unknown referral service mode.');
  const {getDemoReferralSnapshot} = await import('./store');
  const snapshot = await getDemoReferralSnapshot(), report = snapshot.state.report;
  const referrer = report.referrers.find(r => r.email.toLowerCase() === email.trim().toLowerCase());
  const records = report.referrals.filter(r => r.referrer_id === referrer?.id);
  const total = (status: string) => records.filter(r => r.reward_status === status).reduce((n, r) => n + r.reward_minor, 0);
  return {schema_version: 1, mode: 'demo', as_of: snapshot.as_of, referral_code: referrer?.referral_code ?? null, invited: records.length, registered: records.filter(r => !!r.registered_at).length, qualified: records.filter(r => r.status === 'QUALIFIED').length, paid_minor: total('PAID'), pending_minor: total('PENDING'), held_minor: total('HELD'), queued_minor: total('QUEUED'), currency: 'EUR', program_available: !!referrer && snapshot.eligible_referrer_ids.includes(referrer.id)};
}
