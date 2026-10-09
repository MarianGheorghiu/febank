export type HealthDomain = "PLATFORM" | "FIAT" | "CRYPTO" | "STOCK";
export type ServiceStatus = "OPERATIONAL" | "DEGRADED" | "OUTAGE" | "UNKNOWN";
export interface HealthService {
  id: string; name: string; domain: HealthDomain; status: ServiceStatus;
  checked_at: string; availability_24h_pct: number | null; latency_p95_ms: number | null;
  queue_depth: number; oldest_job_seconds: number; owner: string; detail: string;
}
export interface HealthSample { timestamp: string; requests: number; server_errors: number; fiat_p95_ms: number; crypto_p95_ms: number; stock_p95_ms: number }
export interface HealthIncident {
  id: string; service_id: string; title: string; severity: "WARNING" | "CRITICAL";
  state: "INVESTIGATING" | "MONITORING"; started_at: string; updated_at: string;
  impact: string; update: string; next_step: string;
}
export interface HealthResource { id: string; name: string; status: ServiceStatus; value: string; detail: string }
export interface SystemHealthReport {
  schema_version: 1; snapshot_id: string; as_of: string; environment: "DEMO"; region: string;
  probe_successes_24h: number; probe_total_24h: number; api_p95_ms: number;
  services: HealthService[]; samples: HealthSample[]; incidents: HealthIncident[]; resources: HealthResource[];
  maintenance: { starts_at: string; ends_at: string; title: string; impact: string };
}
export interface SystemHealthRepository { getSnapshot(): Promise<SystemHealthReport> }
