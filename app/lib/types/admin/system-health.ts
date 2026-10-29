export type HealthDomain = "PLATFORM" | "FIAT" | "CRYPTO" | "STOCK";
export type ServiceStatus = "OPERATIONAL" | "DEGRADED" | "OUTAGE" | "UNKNOWN";
export interface HealthService {
  id: string; name: string; domain: HealthDomain; status: ServiceStatus;
  checked_at: string; availability_24h_pct: number | null; latency_p95_ms: number | null;
  queue_depth: number; oldest_job_seconds: number; owner: string; detail: string;
  dependencies: string[]; queue_target_seconds: number;
}
export interface HealthControl {
  id: string; service_id: string; domain: HealthDomain; name: string;
  value: number | null; unit: string; threshold: number; direction: "MAX" | "MIN";
  checked_at: string; detail: string;
}
export interface HealthSample { timestamp: string; requests: number; server_errors: number; fiat_p95_ms: number | null; crypto_p95_ms: number | null; stock_p95_ms: number | null }
export interface HealthAcknowledgement { actor: string; acknowledged_at: string; note: string; audit_event_id: string }
export interface HealthIncident {
  id: string; revision: number; service_id: string; title: string; severity: "WARNING" | "CRITICAL";
  state: "INVESTIGATING" | "MONITORING"; started_at: string; updated_at: string;
  impact: string; update: string; next_step: string; acknowledgement: HealthAcknowledgement | null;
}
export interface HealthResourceMetric { name: string; value: number | null; unit: string; threshold: number; direction: "MAX" | "MIN" }
export type HealthResourceCategory = "DATASTORE" | "COMPUTE" | "RECOVERY" | "SECURITY";
export interface HealthResourceTrend { name: string; unit: string; samples: {timestamp: string; value: number | null}[] }
export interface HealthResource { category: HealthResourceCategory; trend: HealthResourceTrend | null; id: string; name: string; status: ServiceStatus; checked_at: string; metrics: HealthResourceMetric[]; detail: string }
/** Global monitoring DTO. No customer records, local account balances or secrets. */
export interface SystemHealthReport {
  schema_version: 3; snapshot_id: string; as_of: string; mode: "demo" | "live";
  scope: "GLOBAL"; environment: "STAGING" | "PRODUCTION"; region: string;
  window: { starts_at: string; ends_at: string; sample_interval_seconds: number };
  probe_successes_24h: number; probe_total_24h: number; api_p95_ms: number | null;
  availability_target_pct: number; latency_target_ms: number;
  services: HealthService[]; controls: HealthControl[]; samples: HealthSample[]; incidents: HealthIncident[]; resources: HealthResource[];
  maintenance: { starts_at: string; ends_at: string; title: string; impact: string } | null;
}
export interface HealthReviewRequest { request_id: string; snapshot_id: string; incident_id: string; expected_revision: number; note: string }
export interface HealthExportRequest { request_id: string; snapshot_id: string; reason: string; content_sha256: string }
export interface HealthExportReceipt { request_id: string; snapshot_id: string; content_sha256: string; audit_event_id: string; recorded_at: string }
export interface SystemHealthRepository {
  getSnapshot(signal?: AbortSignal): Promise<SystemHealthReport>;
  acknowledge(request: HealthReviewRequest): Promise<HealthAcknowledgement>;
  recordExport(request: HealthExportRequest): Promise<HealthExportReceipt>;
}
