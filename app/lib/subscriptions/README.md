# Admin subscriptions / Go handoff

Route: `/dashboard/admin/subscriptions`. UI reuses PageHeader, MetricCard, AuditPanel, AuditSelect, native modal dialogs, Recharts and global operation notifications.

`SubscriptionsRepository` is the replacement boundary. The mock implements `list()` and `execute()` with browser storage. DTOs use snake_case JSON, EUR integer minor units, RFC3339 UTC timestamps, string enums and nullable fields. Synthetic customers prefixed `DEMO-SUB-USER` are isolated demo identities. Catalog prices are illustrative, not production tariffs.

Suggested Go endpoints:
- `GET /v1/admin/subscriptions` returns the portfolio DTO (production should paginate/filter server-side and return aggregates separately).
- `POST /v1/admin/subscriptions/commands` accepts `SubscriptionCommand`; derive actor from authenticated server session, never from request body.
- `GET /v1/admin/subscription-plans` and `GET /v1/admin/subscription-invoices` for production catalogs and ledgers.

Enforce admin authorization, customer eligibility, unique open subscription per customer, state transitions, optimistic `expected_version`, and `request_id` idempotency on the server. Use a database transaction to save state, audit evidence and outbox entries together. Map validation to 422, authorization to 403 and version/idempotency conflicts to 409. The current mock auth and localStorage are not server security controls; simultaneous browser tabs are not transactionally locked.

Plan changes record `pending_change` and take effect at period end. Cancellation clears pending changes and keeps debt/history. Suspending benefits does not freeze the bank account or stop debt. Resumption preserves PAST_DUE while overdue unpaid invoices remain. Payment retry records one queue request; it never sets PAID or debits an account. Production requires a billing scheduler, consent/mandate checks, collection worker, webhook reconciliation, retry backoff and transactional outbox. The demo does not execute scheduled renewal/cancellation. Assignment records entitlement only, has no first invoice, and uses UTC day 1 as first renewal anchor; production must choose and implement its proration policy.

MRR includes current ACTIVE and PAST_DUE prices, normalizes annual price by 12, excludes suspended/canceled contracts and pending changes. It is contracted recurring value, not cash collection or recognized revenue. Collections chart groups invoice paid/unpaid amounts by issue month. Overdue balances use an explicit reference timestamp shown in the UI. Fixtures cover May–October 2026; refresh updates reference time. Churn/retention cannot be inferred from snapshots and are intentionally absent.

Operation evidence is stored atomically alongside subscriptions and ingested in Audit Logs as SUBSCRIPTIONS. CSV exports are filtered, neutralize spreadsheet formula injection and record an export request in the global audit journal before download. Corrupt/unavailable subscription storage shows an error and blocks changes/exports without erasing data.

Rates retains ownership of transaction fees and FX overrides. Production must map subscription plan IDs to that policy. Catalog editing, refunds, tax handling and direct ledger debits require versioned backend workflows and are not simulated by frontend actions.
