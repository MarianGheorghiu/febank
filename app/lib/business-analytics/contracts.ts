import type { AuditActor } from '../types/admin/audit';
import type { BusinessAnalyticsFilters, BusinessAnalyticsReport } from '../types/admin/business-analytics';

export interface OperationalData {
  users: {clients: number; active: number; blocked: number; verified: number; seen_30d: number};
  subscriptions: {open: number; active: number; past_due: number; suspended: number; canceling: number; contracted_mrr_minor: number; overdue_minor: number; overdue_invoices: number; renewals_7d: number; plans: {plan: 'STANDARD' | 'PREMIUM' | 'METAL'; count: number}[]};
  referrals: {invited: number; registered: number; qualified: number; pending_minor: number; held_minor: number; queued_minor: number; paid_history_minor: number};
  wallets: {observed_wallets: number; transfers: number; completed: number; pending: number; processing: number; rejected: number; cancelled: number; positions: {asset: string; kind: 'fiat' | 'crypto' | 'stock'; decimals: number; available: string; reserved: string}[]; settlements: {asset: string; decimals: number; incoming: string; outgoing: string; completed: number}[]; pending_orders: number; credit_applications: number};
  cards: {total: number; active: number; pending: number; frozen: number; blocked: number; terminated: number};
  risk: {open_cases: number; critical_cases: number; overdue_cases: number; restricted_accounts: number};
  rates: {version: number; enabled_products: number; paused_products: number; pending_releases: number};
}
export type OperationalSourceKey = keyof OperationalData;
export const OPERATIONAL_SOURCES: OperationalSourceKey[] = ['users', 'subscriptions', 'referrals', 'wallets', 'cards', 'risk', 'rates'];
export interface SourceReading<T> {
  status: 'READY' | 'ERROR'; as_of: string | null; revision: string | null;
  scope: string; error: string | null; data: T | null;
}
export type OperationalSources = {[K in OperationalSourceKey]: SourceReading<OperationalData[K]>};
export interface BusinessSnapshot {
  schema_version: 1; snapshot_id: string; mode: 'demo' | 'live'; as_of: string;
  financial_basis: 'ILLUSTRATIVE_WAREHOUSE' | 'BOOKED_WAREHOUSE';
  consistency: 'BEST_EFFORT' | 'CONSISTENT_CUTOFF';
  report: BusinessAnalyticsReport;
  operations: {as_of: string; window_from: string; window_to: string; sources: OperationalSources};
}
export interface BusinessExportRequest {
  request_id: string; snapshot_id: string; report_id: string; filters: BusinessAnalyticsFilters;
  format: 'CSV' | 'JSON'; reason: string; content_sha256: string;
}
export interface BusinessExportReceipt {
  request_id: string; snapshot_id: string; report_id: string; audit_event_id: string;
  requested_at: string; content_sha256: string;
}
export interface BusinessRepository {
  getSnapshot(signal?: AbortSignal): Promise<BusinessSnapshot>;
  recordExport(request: BusinessExportRequest): Promise<BusinessExportReceipt>;
}
export type BusinessActor = AuditActor;
