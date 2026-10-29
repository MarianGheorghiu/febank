# System Health

Admin workspace: `/dashboard/admin/system-health`.

The workspace uses the same PageHeader, ActionButton, MetricCard, CardSurface and dialog conventions as Business Analytics. The duplicate title, subtitle and DEMO SNAPSHOT badge have been removed. Overview, Services, Operational controls, Incidents and Infrastructure have separate views. Global metrics always retain their global scope.

## Data ownership

Health is a **global monitoring snapshot**, not an aggregation of the current customer's wallets or browser accounts. Monitoring and financial-operation systems own service checks, queues, reconciliation, latency histograms, incidents and infrastructure measurements. The browser never infers live ledger health from local business data.

`SystemHealthReport` in `app/lib/types/admin/system-health.ts` is the JSON contract (schema v3). It includes `scope: GLOBAL`, a unique snapshot ID, capture time, environment, region, an explicit 24-hour window, source mode and numeric operational targets. Resources have typed categories, numeric metrics and nullable time-series trends. Missing measurements use JSON `null`, including unavailable latency. Dates are RFC3339 timestamps with timezones, normally UTC. Go can use `time.Time`, `*float64` for nullable readings and `int64` for counters; counters must remain within JavaScript's safe-integer range. Arrays serialize as `[]`, not `null`.

The runtime parser validates references, unique IDs, nonnegative counters, request/error relationships, dependency cycles, timestamps, windows and resource data before display. Missing 24-hour request bins yield an unavailable full-window error rate. Connectivity and queue-age/financial-control checks contribute independently to service status. Numeric infrastructure thresholds contribute to platform and overall status. Outage takes precedence over unknown, then degraded, then operational. Dependencies retain their own measured status; a dependency incident does not invent a downstream outage.

Availability is successful synthetic probes divided by total probes over 24 hours. The remaining probe budget uses the explicit availability target and is clamped to 0–100%. HTTP errors are request-weighted. Platform p95 comes from its own histogram; domain percentiles are never averaged. Queue targets apply only when jobs are actually queued.

## Repository selection

Default:

```dotenv
NEXT_PUBLIC_SYSTEM_HEALTH_MODE=demo
```

The deterministic mock contains eight services, twelve controls, ten open incidents, four infrastructure resources and illustrative CPU/replication trends. Its 9 October 2026 observation time stays fixed on refresh. Some incidents remain in monitoring after the associated service recovers. Related incidents describe overlapping impact; queued jobs are counted once from the service registry. Demo telemetry is visibly identified as mock, in a staging environment.

Acknowledgements and export requests use the existing shared browser Audit Logs, including idempotency receipts. Changes propagate between tabs through storage events and within the app through the audit event. This is browser persistence, not a multi-operator server. A review never resolves an incident or pages an on-call team.

Go integration:

```dotenv
NEXT_PUBLIC_SYSTEM_HEALTH_MODE=http
NEXT_PUBLIC_SYSTEM_HEALTH_API_URL=https://api.example.test
```

An empty API URL uses same-origin routes. HTTP requests use credentials, `no-store`, JSON and cancellable snapshot reads. HTTP mode never falls back to fixtures or local audit writes. Live snapshots refresh every 30 seconds; snapshots older than two minutes or more than 30 seconds in the future are marked unavailable. Read failures preserve the last successful snapshot as historical data and block actions. Client role checks are UX only; the Go service must enforce admin authorization and derive operator identity from the session.

### GET /v1/admin/system-health

Returns `SystemHealthReport` schema v3 with `mode: live`. The response includes all domains, the full 24-hour sample window, current open incidents and durable acknowledgements. `as_of` is a consistent source cutoff, not the browser's request time. Server monitoring collectors own the aggregation and freshness of individual probes. Probe ages are checked against capture time with a two-minute limit. Empty collections represent unavailable coverage, never fabricated healthy measurements.

### POST /v1/admin/system-health/incidents/{incident_id}/acknowledgements

Header: `Idempotency-Key: <request_id>`.

```json
{
  "schema_version": 3,
  "request_id": "uuid",
  "snapshot_id": "global-snapshot-id",
  "incident_id": "INC-1050",
  "expected_revision": 1,
  "note": "Reviewed confirmation backlog with the on-call team."
}
```

Returns:

```json
{
  "actor": "operator@example.test",
  "acknowledged_at": "2026-10-29T12:00:00Z",
  "note": "Reviewed confirmation backlog with the on-call team.",
  "audit_event_id": "audit-event-id"
}
```

The server validates the snapshot and incident revision, enforces a 10–500 character note, and atomically persists acknowledgement plus audit evidence. It must return the same result for a repeated identical idempotency key and reject reuse for different payloads. A revision conflict returns HTTP 409 and requires refresh/review. Acknowledgement records review; incident state remains owned by the incident service.

### POST /v1/admin/system-health/exports

Header: `Idempotency-Key: <request_id>`.

```json
{
  "schema_version": 3,
  "request_id": "uuid",
  "snapshot_id": "global-snapshot-id",
  "reason": "Operational incident diagnostic review.",
  "content_sha256": "64-lowercase-hex-characters"
}
```

Returns matching `request_id`, `snapshot_id`, `content_sha256`, plus `audit_event_id` and RFC3339 `recorded_at`. Mismatching receipts block download. The server must authorize access to the snapshot and persist audit evidence before returning success. Snapshot retention must support exports from a dialog opened before the latest refresh; expired snapshots return 409.

The dialog captures an immutable snapshot. The downloaded UTF-8 JSON is exactly `JSON.stringify({schema_version: 3, scope: 'GLOBAL', reason, report}, null, 2)`, with the trimmed reason and captured report; its SHA-256 is recorded before download. UI filters never remove content from the full diagnostic export. Browser hashing is evidence of the downloaded payload, not a server attestation of source authenticity. No operator identity is trusted from the request body.

No Go server is implemented in this frontend repository. Production deployment must configure authenticated routes, credentialed CORS if cross-origin, appropriate CSRF protection for command endpoints, telemetry collection, durable incident/audit storage and snapshot retention.

## Collection layout

- Registry: searchable services and owners, domain and attention filters; a bounded table with sticky column headers on wide layouts and bounded cards on narrow layouts.
- Controls: combined search and domain filter, counts and equal card summaries; a fixed results viewport with internal scrolling.
- Incident desk: ten illustrative incidents, search, state and severity filters, grouping by state/severity/domain/team, per-group counts, collapse/expand all and bounded scrolling. Critical incidents appear first within groups. Overview includes a separate priority search across all incidents, a matching-results count and a bounded scroll pane; it does not truncate results to the first three incidents.
- Infrastructure: search, category filter, optional collapsible category groups, bounded results, and 24-hour CPU/replication charts. Recovery and certificate cards stay compact because they have fewer readings.
- Large result panes are capped at 38rem or 70dvh; dialogs at 90dvh. Filters remain outside the scrolling results. Native search clearing, empty states and keyboard focus remain available. Chart samples have their own bounded table.

## Validation

`npm run test:system-health` covers the wire contract, thresholds, probe freshness, missing bins, resource trends, ten mock incidents, grouping 150 incidents, authenticated HTTP selection/cancellation, conflict errors, matching export receipts, idempotent local audit writes and storage failures. TypeScript and scoped ESLint cover the frontend. Manual browser checks cover search, grouping, bounded scroll, incident dialog details and compact infrastructure cards at desktop, 768px tablet, 390px mobile and 320px narrow mobile widths. The 320px incident dialog stays within its viewport and scrolls vertically; service tables become cards on narrow workspaces.
