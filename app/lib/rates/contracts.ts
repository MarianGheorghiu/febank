import type { AuditEvent } from '../types/admin/audit';
export const OPERATIONS = ['FIAT_TRANSFER','INTERNAL_TRANSFER','CRYPTO_TRANSFER','STOCK_TRANSFER','CRYPTO_TRADE','STOCK_TRADE','FX_EXCHANGE'] as const;
export type RateOperation = typeof OPERATIONS[number];
export const TIERS = ['STANDARD','PREMIUM','METAL'] as const;
export type RateTier = typeof TIERS[number];
/** Wire amounts are integer USD cents; rates are integer basis points. */
export interface RatePolicy {
  id: string; name: string; operation: RateOperation; enabled: boolean;
  rate_bps: number; fixed_minor: number; minimum_minor: number; maximum_minor: number | null;
  spread_bps: number; weekend_bps: number;
  tier_discount_bps: Record<RateTier, number>;
  brackets: { up_to_minor: number | null; rate_bps: number }[];
}
export interface RateRelease {
  origin: 'DEMO'|'LOCAL';
  id: string; policies: RatePolicy[]; version: number; maker: string; created_at: string;
  reason: string; status: 'PENDING'|'PUBLISHED'|'REJECTED'; checker: string | null; decided_at: string | null;
}
export interface RatesSnapshot {
  schema_version: 1; revision: number; mode: 'demo'|'live';
  active: { version: number; policies: RatePolicy[]; published_at: string };
  releases: RateRelease[]; audit: AuditEvent[];
  processed_requests: { key: string; payload: string }[];
}
export type RatesCommand = { expected_revision: number; reason: string } & (
  { action: 'PROPOSE'; policies: RatePolicy[] } |
  { action: 'APPROVE'|'REJECT'; release_id: string }
);
export interface RateCalculation {
  rule_id: string; amount_minor: number; fee_minor: number; variable_minor: number;
  fixed_minor: number; discount_minor: number; spread_minor: number; weekend_minor: number;
  raw_minor: number; cap: 'NONE'|'MINIMUM'|'MAXIMUM'; effective_bps: number; trace: string[];
}
export interface RatesRepository {
  getSnapshot(signal?: AbortSignal): Promise<RatesSnapshot>;
  execute(command: RatesCommand, key: string): Promise<RatesSnapshot>;
}
export const operationLabels: Record<RateOperation,string> = {
  FIAT_TRANSFER:'Bank transfers', INTERNAL_TRANSFER:'Internal transfers', CRYPTO_TRANSFER:'Crypto withdrawals',
  STOCK_TRANSFER:'Stock custody transfers', CRYPTO_TRADE:'Crypto trading', STOCK_TRADE:'Stock trading', FX_EXCHANGE:'Currency exchange',
};
