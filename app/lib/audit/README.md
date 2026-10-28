# Audit Logs

Route: `/dashboard/admin/audit-logs`.

## Interface

Shared PageHeader/session metadata, CardSurface, MetricCard and ActionButton. Active tabs use the same cyan/blue variants as Card Issuing and Markets, with no extra active ring. Icons use the dedicated icon prop, never a block SVG inside the label.

Inspect opens an inline detail card and scrolls/focuses it like Card Issuing's Manage. Its header and navigation stay visible; its body scrolls within a 36rem maximum card. The event registry has a bounded scroll area, fixed desktop columns, sticky action column and one compact Inspect action per row. Mobile uses paginated cards. Source availability has its own search/status filter, 8-row pages and bounded scroll. Trace, annotations, field differences and expanded chart data are also bounded and paginated where appropriate.

Registry search is placed directly above the table. All scope filters, metrics, charts and exports use the same predicate. Multiword searches ignore accents. Dates are inclusive UTC; display timezone is independent. Timestamp sorting compares instants, including explicit offsets. Advanced actor/category/origin/trace filters collapse; removable scope chips keep hidden filters visible. Large actor dropdowns support search and scroll. Pause freezes results/time; source collection continues.

## Central data

`repository.ts` selects demo or HTTP. `use-audit-events.ts` refreshes on global source events, focus and cross-tab storage; requests are ordered to discard stale completions. Console access is recorded idempotently.

Demo `collector.ts` reads each module independently with Promise.allSettled: User Management, Rates, Cards, Markets, Risk, Transactions, Subscriptions, Flags & Config, and the audit journal. Corrupt sources are excluded and report ERROR; surviving sample events keep DEMO provenance. No reset or repair erases evidence. Source totals/latest event time are independent of investigation filters.

Audit reads use `readWalletForAudit`, which replays existing journals without normalization, migration or business writes. Opening the console does not seed wallets, trading fixtures or risk restrictions. The only intentional audit-entry write on opening is AUDIT_CONSOLE_OPENED. Business modules retain ownership of their data. The journal stores annotations and audit-console operations, not duplicated copies of source histories.

Events identify LOCAL, DEMO or SERVER provenance. Market order projections are explicitly SNAPSHOT evidence, not an immutable transition history. Captured metadata stays null when absent. Equal target or actor does not imply correlation. Legacy sample trace IDs no longer group unrelated template events.

`demo.ts` adds 60 recent events across 15 coherent four-step transfer/risk/review traces, with success, blocked and provider-failure scenarios and two sample investigation notes. IDs/dates are deterministic. The existing 126 legacy events and stored operator evidence remain intact.

## Notes and evidence export

Annotations use review/confirm, role validation, a journal revision and stable idempotency key. Note plus its audit event commit in one local write. Retries return the original result; changed payload/author keys fail. Original source events stay read-only. The repository rejects an unknown event ID.

Opening export captures the exact rows, notes, filters, warnings, sort, display zone and source as_of. Incoming events do not alter the reviewed report. CSV/JSON exports cover all matching pages. Generation metadata is frozen so a retry produces the same bytes and digest. The request records exact event IDs and SHA-256 before browser download; mismatched server receipts block download. A receipt is evidence of a request, not browser download completion or archive integrity.

Payload secrets are redacted by key before journal persistence, source display, differences and exports. CSV formulas are neutralized. Do not enter secrets in free text; key-based redaction is not free-text detection. Missing or corrupt journal data blocks annotation/export writes while preserving the stored bytes.

## Go service

`NEXT_PUBLIC_AUDIT_MODE=demo|http` falls back to `NEXT_PUBLIC_TRANSFERS_MODE`, then demo. `NEXT_PUBLIC_AUDIT_API_URL` falls back to `NEXT_PUBLIC_TRANSFERS_API_URL`, then same origin.

- GET `/v1/admin/audit` returns a versioned, complete snapshot, events, notes, coverage and warnings.
- POST `/v1/admin/audit/access` records console access.
- POST `/v1/admin/audit/notes` appends a note and its audit record atomically.
- POST `/v1/admin/audit/exports` authorizes/records the exact evidence IDs, reason, filter manifest and checksum, returning a matching receipt.

Mutations carry Idempotency-Key. Requests include session credentials and no-store; reads accept AbortSignal. HTTP mode never reads local module data or falls back to browser samples. Service events must have SERVER origin; incomplete/duplicate snapshots are rejected. Source enum entries represent module collectors, not one row per business record. Optional source totals/latestAt describe available evidence, not guaranteed ingestion watermarks or retention.

Go must derive actor/permissions from server authentication, enforce audit-read/annotation/export RBAC, validate scope and idempotency, protect session requests against CSRF, and persist notes/receipts/audit atomically. Business services should publish transitions and failed attempts through a transactional outbox with server timestamps/request/correlation metadata. Keep monetary payload values as decimal strings, preserve per-source schemas, and redact before publishing. Configure real retention, legal holds and durable append-only storage in the service; the browser asserts none of these.

Current API is an explicit complete-snapshot prototype. UI pagination bounds rendering, not network/storage consumption. Before production scale, introduce server cursor search, facets and aggregate endpoints plus a stable snapshot token for cross-page export. Never return a truncated page with complete=true: counts, charts and exports would be incorrect. Do not append arbitrary caller-supplied source events through this admin API.

Contract: `openapi.json`. Validation: audit unit/transport/integration tests, existing module suites, TypeScript, ESLint, production build and desktop/mobile/tablet browser checks.
