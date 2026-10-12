# System Health

Admin workspace: `/dashboard/admin/system-health`.

## Operational scope

- Platform: API and identity, risk-screening backlog, audit-ingestion lag, notification backlog, infrastructure capacity and recovery evidence.
- Fiat: core ledger reconciliation, settlement liquidity buffer, payment queue age.
- Crypto: custody reconciliation, RPC block-head lag, confirmation backlog.
- Stocks: primary quote freshness, broker acknowledgement latency, position reconciliation.

The UI retains the shared admin PageHeader with session, snapshot date and operational actions. It prioritizes overall impact and active incidents without a separate row of domain cards. Compact domain selectors scope controls and the service registry; global metrics, incidents and latency trends stay global. Service search and the attention toggle are combined with the selected domain. Registry rows are ordered by outage, unknown, degraded and operational. A narrow content area uses service cards instead of a wide table. Container breakpoints use available workspace width, accounting for the dashboard sidebar.

## Status and measurement semantics

`SystemHealthReport` schema v2 adds explicit operational controls, per-service dependencies and queue-age targets, an availability target and resource probe timestamps.

`controlStatus` supports inclusive minimum and maximum targets. Null, non-finite, malformed, future or more than two-minute-old probes are unknown at snapshot time. A breached control affects its service and domain even when connectivity is healthy. Infrastructure contributes to Platform and overall status. Outages take precedence over unknown, followed by degradation. Direct dependencies show their own measured status without fabricating a downstream outage.

Availability is successful synthetic probes / total probes over 24 hours. Remaining probe error budget uses the explicit availability target for that same window and is clamped to 0–100%. It is not a monthly contractual SLA. HTTP 5xx rate is weighted by request counts. Platform p95 comes from its own histogram; domain percentiles are never averaged. A queued job breaches its age target only when work is actually queued.

## Demo integration boundary

The repository returns isolated copies of a fixed, synthetic snapshot dated 9 October 2026. Refresh deliberately preserves that observation time. Maintenance dates are relative to the snapshot, not to the operator's clock. No automatic polling or live alerting is claimed.

Existing operation notifications cover refresh, export and incident review outcomes. Review notes require 10–500 characters and persist in the existing browser audit journal. Acknowledgement does not resolve incidents or contact on-call teams. Export includes all domains, 24-hour telemetry and matching review events, independent of UI filters; its request is audited before download.

The Go integration boundary remains `SystemHealthRepository.getSnapshot()`, using JSON DTOs in `types/admin/system-health.ts`: snake_case fields, RFC3339 UTC timestamps and nullable unavailable measurements. Suggested authenticated route: `GET /v1/admin/system-health`. Replace both the fixture import and repository when connecting live data; never retain demo fallback after a failed production fetch.

Production integration needs an authenticated server-side repository backed by monitoring and financial-operation sources, schema validation, server-enforced admin authorization, source-owned incident state, durable review audit and an explicit on-call delivery service. Synthetic liquidity and reconciliation values here are illustrative operational checks, not compliance attestations. Never send wallet keys, credentials or customer-level financial records in health telemetry. Audit-write failures block reviews and exports. A future review command must derive operator identity, permissions and incident version server-side, persist atomically with audit and handle duplicate requests idempotently. Backup completion and restore-drill evidence remain separate checks.

## Validation

`npm run test:system-health` covers thresholds, missing and stale probes, domain aggregation, infrastructure failures, dependency references, queue targets, error budget and repository isolation. TypeScript and scoped ESLint checks cover the UI. Browser checks cover domain filtering, search reset, attention filtering, dependency expansion, chart window selection and widths of 320, 390, 768 and 1440 pixels.
