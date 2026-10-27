# Admin Control

Entry point: `/dashboard` for an administrator (demo: `admin@admin.com`). The shared `PageHeader`, session metadata, `MetricCard`, `CardSurface` and `ActionButton` match the customer overview. The header leads directly into the metrics; no extra page introduction is rendered.

## Data and behavior

- The demo repository reads canonical risk policies, restrictions, cases, market routing, customer orders and shared wallet journals. Available/reserved holdings combine local-wallet valuations with a fixed illustrative platform portfolio (FIAT $6.4m available / $650k reserved; CRYPTO $7.8m / $450k; STOCK $6.2m / $180k), so exposure bars have visible, distinct fill levels. The added portfolio is display-only, does not represent extra observed customers, and never changes customer balances or execution policies. Local-wallet valuations use exact integer minor units and shared mark prices; they are indicative USD valuations, not treasury cash or reconciled bank reserves.
- Demo monitoring adds deterministic synthetic bank throughput, API request counts, system events and illustrative audit examples. It does not write fictional events into operational stores. Mock audit examples are display fixtures, not evidence of actual historical mutations. Real risk/market actions are merged into the operational audit by timestamp.
- Completed throughput uses the trailing `(as_of - 24h, as_of]` window, one-hour buckets and matching domain totals. Pending/rejected/cancelled operations and opening transfer-history fixtures are excluded. Amounts include source-system fees when present. Withdrawals and deposits are not settlement throughput. Two operations such as a trade and a later transfer are separate activities.
- Monitoring has 6/12/24-hour windows and severity-filtered logs. Risk/audit domain filters do not change global metrics or monitoring. Cases sort by severity and deadline, with text search and a link to the full risk workspace. Audit pagination shows six entries per page. Long lists scroll inside capped, keyboard-focusable regions; chart frames are fixed height and rows stretch consistently.
- Policy editing requires a reason, preview and explicit confirmation. The original revision is captured when the modal opens. Domain stops, restrictions and transaction caps guard new shared-wallet transfers and cash withdrawals before persistence, including quotes created before a policy change. Existing trading guards also use these risk policies. Replay, duplicate successful requests and cancellation/refunds remain available. Deposits, card authorizations and loan operations are outside this stop's scope.
- Corrupt risk/market/wallet data fails closed. Failed refresh retains the previous snapshot and disables mutation/export. Refresh, focus, storage events and shared wallet/risk events update the workspace. No polling or live monitoring claim is made.
- JSON export contains the complete loaded snapshot, regardless of local filters. It is a snapshot download, not a full compliance audit export; use Audit Logs for that workflow.

## Go API integration

Transport DTOs are in `contracts.ts`, validated by `response.ts`. Money is a decimal string with two fractional digits; UTC timestamps are RFC3339, counts/revisions are nonnegative integers and fields use snake_case. `schema_version` is 1. The API snapshot must contain FIAT, CRYPTO and STOCK exactly once.

Set `NEXT_PUBLIC_ADMIN_CONTROL_MODE=http` and optionally `NEXT_PUBLIC_ADMIN_CONTROL_API_URL` (default same origin). Unknown modes fail. HTTP errors never fall back to demo data.

- `GET /v1/admin/control` → `ControlSnapshot` with `mode: live`, 24 chronological hourly telemetry buckets and server-owned system/audit events. Use a coherent server snapshot for balances, policy revision, counts, throughput and telemetry totals.
- `PUT /v1/admin/control/policies/{fiat|crypto|stock}` with `Idempotency-Key` and `PolicyRequest` → `204 No Content` after atomic commit. Identity is derived from the authenticated session, never a browser-supplied actor. The path and policy domain must agree.

Example command:

```json
{
  "expected_revision": 12,
  "reason": "Incident INC-1804: pause new crypto operations",
  "policy": {
    "domain": "CRYPTO",
    "paused": true,
    "max_transaction_usd": "25000.00",
    "exposure_limit_usd": "12000000.00",
    "review_score": 60,
    "block_score": 85
  }
}
```

Server requirements: authenticated administrator authorization, request validation, CSRF protection for cookie authentication, optimistic concurrency (`409` for stale revision), durable idempotency (same key/body returns the original result; conflicting reuse returns `409`), and atomic policy plus audit persistence. The browser's demo role checks are not production authorization. Backend payment/trading execution must enforce controls inside the execution transaction; client-side checks cannot secure live banking. Configure the existing customer service adapters against the same authoritative backend when enabling live mode. The demo repository uses revision checks to prevent duplicate policy writes; durable idempotency belongs to the Go service.

Validation: `npm run test:admin-control`, plus wallet, transfer and risk suites. Browser checks cover 320, 390, 768 and 1440px widths, bounded list scroll, policy review and the shared header.
