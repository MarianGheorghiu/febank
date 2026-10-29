# Business Analytics: reporting authorities and Go handoff

Route: `/dashboard/admin/analytics`. The workspace covers Executive overview, Financial performance, Products, Customers & growth, Funding & balance, Global operations and Data quality. It is a read-only management reporting surface, with explicit export auditing.

## Data authorities

The existing 182-day EUR warehouse remains an **illustrative closed financial dataset** in demo mode. It is not a live sum of the smaller operational fixtures and is never presented as today's recognized revenue. Its complete reporting date and generation cutoff remain visible. `ILLUSTRATIVE_WAREHOUSE` versus `BOOKED_WAREHOUSE` provenance is part of the transport and export, not an inferred UI label.

The new operational overlay reads the actual shared registries: User Management, Subscriptions, Referrals, saved wallet journals, Card Issuing, Risk Control and Rates. Changes in those modules refresh Business Analytics through existing application events, cross-tab storage events, focus and a one-minute refresh. The collector never provisions customers, migrates or initializes wallets, seeds financial operations, settles payments or rewrites operational journals. Sources fail independently; unavailable data is null with ERROR coverage, never an invented zero. Source scopes and revisions are exported.

The populations are intentionally separate. A seeded subscription/customer/referral registry is not necessarily the same population as managed identities or observed wallets. Counts across sources are not added or used to derive unsupported penetration rates. Contracted MRR and earned reward liabilities are not recognized income. A queued payout is unpaid; historical paid referral fixtures are not proof of a wallet credit.

Observed wallets cover saved journals visible to this browser session. Their positions include the same illustrative opening balances shown to customers. No wallet is created merely by opening Business Analytics. Available/reserved and settled incoming/outgoing amounts are aggregated with integer asset arithmetic and serialized as exact decimal strings. USD, EUR, crypto and stock units are never combined or converted to fabricate bank-wide AUM, revenue or liquidity. Transfer outcome counts use an explicit trailing 30-day initiation window; outcomes are current as of capture.

Demo sources are captured independently (`BEST_EFFORT`), not in a cross-store transaction. The Go aggregator should use a consistent ledger/warehouse cutoff where possible and explicitly return `CONSISTENT_CUTOFF` only when that guarantee exists. Source observation timestamps must not exceed the snapshot timestamp. Operational and financial cutoffs remain distinct.

## Financial correctness

The original reporting definitions are retained and enforced:

- Net recognized revenue = gross recognized income − refunds/reversals.
- Product contribution = net revenue − directly attributable costs. Funding interest is included in direct lending costs. Contribution excludes shared overhead and credit provisions.
- Operating result before tax = net revenue − direct product costs − payroll − infrastructure − compliance − attributed acquisition expense − credit provision expense. There is no net-profit or tax claim.
- Client deposits are liabilities; settled transaction notional is activity. Neither is recognized revenue.
- Opening deposits + external inflows − external outflows + signed `deposit_adjustments_minor` = closing deposits. Other client ledger postings cover interest, fees, loan credits and corrections; they must not be relabelled as external cash flows. Missing adjustment values are legacy zero. The initial fixture has zero adjustments.
- Liquid assets + gross loans + other assets = client deposits + other liabilities + book equity. Equity can be signed. NPL exposure is bounded by gross loans and is a stock, not a realized period loss.
- Attributed acquisition expense reconciles to channel spend. Verified/funded/active acquisition outcomes remain subsets of registrations. Customer-base snapshots and overlapping populations are never summed over days.
- Ratios with zero denominators return null/N/A. Changes from a negative baseline use the absolute prior denominator; improvement from a loss is not shown as deterioration. If the prior value is zero, percentage change is unavailable and the signed absolute change remains visible.

Coverage validation requires current and immediately preceding equal-length periods, opening balances, explicit zero rows, unique category/date/segment keys, valid dates, safe integer precision and complete product/channel coverage. Accounting, deposit, attribution and population mismatches block financial totals. Signed results and negative equity are preserved. This remains a simplified management balance sheet without a separate accumulated impairment allowance or tax balance; the schema must evolve before claiming statutory accounting or regulatory ratios.

The default window is 30 complete UTC days; 90 days and custom dates within the latest 90 days are available. Both segments are disjoint warehouse populations. Trend buckets are daily up to 31 days and weekly thereafter, including the final partial bucket. Previous-period chart points are aligned by elapsed day offset, and use buckets of the same length. Funding trends use each bucket's closing stock, not the sum of daily balances. All graph EUR values are display projections of integer minor-unit source values; exact daily amounts are included in reports.

Acquisition channels are mutually exclusive registration attributions. Funded/active outcomes are evaluated at the report cutoff, rather than treated as same-day events. Attributed spend per funded customer is not fully loaded CAC; organic zero spend does not mean acquisition has no cost. LTV, churn, retention, forecasts, regulatory LCR and capital adequacy are not inferred from these inputs.

## Scale and interface

Production transport contains **aggregates only**, not user identities, emails, wallet owners or individual referral records. Payload size follows bounded date/product/channel/asset dimensions, not the number of customers. The parser rejects unexpected user-list fields in aggregate sources. Go must aggregate indexed ledger/warehouse facts server-side. Any future individual-customer drill-down belongs in a separately authorized, filtered, sorted cursor-paginated endpoint; the UI must not download all users or derive totals from a visible page.

Product and channel tables have readable near-white values, named sorting controls, search with clear buttons and explicit details actions. The daily business ledger and observed asset table paginate, with at most the chosen page size mounted. Tables have sticky headers, bounded scrolling and mobile cards. Source and wallet tables use fixed-height scroll regions. Global operating cards have equal fixed heights and scroll their own content; transfer outcomes use a compact metric strip. KPI titles retain their established color; explanations and comparisons have higher contrast. The earnings bridge is an accessible horizontal remaining-balance graphic with exact income/deduction/result values and signed zero positioning.

## Go transport

`createBusinessRepository(actor)` is the transport boundary. Default `NEXT_PUBLIC_BUSINESS_ANALYTICS_MODE=demo`; set it to `http` and optionally set `NEXT_PUBLIC_BUSINESS_ANALYTICS_API_URL`. HTTP mode never falls back to browser fixtures after a network or validation failure. Demo collection marks an individual source unavailable if that source is configured for server execution instead of silently using its local fixtures.

- `GET /v1/admin/business-analytics` → `BusinessSnapshot`: schema version, opaque snapshot ID, mode, capture time, financial basis, consistency guarantee, financial reporting facts and seven operational aggregate readings. The financial facts must cover the comparison/opening interval; latest 182 days of daily rollups are sufficient for this UI.
- `POST /v1/admin/business-analytics/exports` → `BusinessExportReceipt`. Body is `{schema_version:1,...BusinessExportRequest}`; `Idempotency-Key` equals `request_id`. The request includes snapshot ID, financial report ID, filters, format, purpose and SHA-256 content checksum. Actor is derived from the authenticated server session, never trusted from the request body.

DTOs are defined in `contracts.ts`, `../types/admin/business-analytics.ts` and `openapi.json`: snake_case JSON, RFC3339 UTC timestamps, UTC calendar dates, EUR integer minor units, explicit null source failures and decimal-string asset units. The client validates source coverage, aggregate identities, chronology, precision and the returned export receipt. HTTP snapshots must declare live mode and BOOKED_WAREHOUSE financial provenance. Requests use session credentials, no-store caching and cancellation signals.

Go should produce immutable/versioned reporting snapshots from consistent materialized warehouse facts, retaining the ledger/valuation basis and aggregate source coverage. Authenticate/authorize administrators at both endpoints. Enforce query windows and schema limits, durable snapshot retention/expiry, export scope authorization and payload-bound idempotency. Record export evidence and receipt in one database transaction. Use 403 for access denial, 409 for expired/stale snapshot or idempotency conflict, 422 for invalid reporting scope, and 503 for unavailable reporting infrastructure. Backend services and warehouse/ledger ingestion remain to be implemented; this change provides the frontend integration and reporting contract.

## Reviewed exports

Opening the export dialog pins a snapshot, filters and generation time. Auto-refresh does not replace reviewed data. Demo snapshots are retained in a bounded in-memory cache; expired snapshots produce an explicit error rather than exporting different data. CSV/JSON include financial totals, comparisons, product and channel breakdowns, daily rows, chart buckets, current operational aggregates, original asset units, source availability, scopes, revisions and both cutoffs. Local display-only table searches do not truncate the full management report.

The content is constructed once for a given reviewed payload, hashed with SHA-256, and logged through the repository before a download is initiated. Retry keys remain stable for the same content/purpose and change when the reviewed payload changes. The receipt must match snapshot, report, request and checksum. Failed audit persistence or a mismatched server receipt blocks the download. Audit records prove an export request, not that the browser completed a download; the checksum identifies the prepared client content and is not an independent audit attestation. CSV neutralizes formula text while preserving numeric negative values.

Validation: `npm run test:business-analytics` covers accounting identities, signed comparisons/equity, other deposit postings, daily/weekly alignment, scope validation, global source updates, read-only collection, exact wallet units, partial failures, aggregate payloads for millions of customers, export auditing and Go transport. Related Audit, Subscriptions and Referrals tests plus TypeScript/ESLint and responsive browser checks cover integration.
