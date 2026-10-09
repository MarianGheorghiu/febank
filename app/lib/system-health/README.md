# System Health

Independent, fixed synthetic snapshot for the admin console. No live provider calls, service restarts, trading changes or transactions. Reloading does not advance `as_of`. All display times are UTC.

Go integration boundary: `SystemHealthRepository.getSnapshot()`, with JSON DTOs in `types/admin/system-health.ts`. Suggested authenticated route: `GET /v1/admin/system-health`; snake_case fields, RFC3339 UTC timestamps, nullable unavailable measurements. Enforce admin authorization server-side. Replace the fixture import and repository together when connecting live data; never retain fixture fallback on a failed production fetch.

Availability is successful platform synthetic probes divided by all probes in the previous 24 hours. HTTP server-error rate uses summed 5xx counts / summed requests for the same 24 hourly bins, independent of business transaction success. API p95 uses a separately aggregated last-hour histogram; do not average domain percentiles. Chart points are hourly per-domain p95; the 500ms line is an illustrative investigation threshold. The chart window affects only the chart. Registry domain filters affect only the registry.

Service checks older than 120 seconds relative to snapshot `as_of`, future checks or invalid timestamps become UNKNOWN. A known outage takes precedence. Otherwise any unknown signal makes overall health UNKNOWN; degraded takes precedence over operational. Nonzero queues alone do not imply failure. Venue hours and on-chain confirmations have different operational meanings. This snapshot is explicit demo data; it must not be treated as fresh telemetry relative to wall-clock time.

Diagnostic JSON includes the entire snapshot, all 24 samples and matching local acknowledgements, regardless of UI filters. Export requests and acknowledgements use the existing SYSTEM audit journal; audit-write failure blocks both operations. Acknowledging an incident records local review and leaves its source state unchanged. Browser storage is not a production incident-management system. A future acknowledgement command must derive operator identity, permissions and incident version server-side, persist atomically with audit, and handle duplicate requests idempotently.

Backup completion and restore-drill evidence are separate. Resource thresholds and maintenance schedules are fixtures. No regulatory compliance, customer-fund safety or disaster-recovery guarantee is inferred from health probes.
