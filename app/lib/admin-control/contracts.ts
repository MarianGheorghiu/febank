export const DOMAINS = ["FIAT", "CRYPTO", "STOCK"] as const;
export type Domain = typeof DOMAINS[number];
export interface ControlPolicy {
  domain: Domain;
  paused: boolean;
  max_transaction_usd: string;
  exposure_limit_usd: string;
  review_score: number;
  block_score: number;
}
export interface DomainSummary {
  domain: Domain;
  available_usd: string;
  reserved_usd: string;
  volume_24h_usd: string;
  pending_count: number;
  open_cases: number;
  routing_status: "ACTIVE" | "SELL_ONLY" | "HALTED";
  policy: ControlPolicy;
}
export interface ControlActivity {
  id: string; domain: Domain | "PLATFORM"; action: string; target: string;
  actor: string; reason: string; occurred_at: string;
}
export interface ControlCase {
  id: string; domain: Domain; subject: string; severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "INVESTIGATING" | "ESCALATED";
  amount_usd: string; due_at: string;
}
export interface ControlSample {
  at: string; successful_requests: number; failed_requests: number;
  fiat_usd: string; crypto_usd: string; stock_usd: string;
}
export interface ControlLog {
  id: string; occurred_at: string; domain: Domain | "PLATFORM";
  severity: "INFO" | "WARNING" | "CRITICAL";
  event: string; target: string; message: string;
}
/** Decimal strings map to Go decimal types; timestamps are RFC3339 UTC. */
export interface ControlSnapshot {
  schema_version: 1;
  mode: "demo" | "live";
  as_of: string;
  risk_revision: number;
  customer_count: number;
  restricted_customers: number;
  domains: DomainSummary[];
  cases: ControlCase[];
  activity: ControlActivity[];
  telemetry: ControlSample[];
  system_logs: ControlLog[];
}
export interface PolicyRequest {
  expected_revision: number;
  reason: string;
  policy: ControlPolicy;
}
export interface ControlRepository {
  getSnapshot(signal?: AbortSignal): Promise<ControlSnapshot>;
  updatePolicy(request: PolicyRequest, idempotencyKey: string): Promise<void>;
}
