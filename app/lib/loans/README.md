# Loans & Capital

Customer workspace: `/dashboard/loans`. `/dashboard/loans?action=apply` opens and focuses the loan calculator from Overview. Existing `CardSurface`, `MetricCard`, `ActionButton`, `PageHeader`, `CardSelect`, search, pagination and the native mobile-sheet dialog establish the same design as Overview / Cards Vault. Financial components consume transport DTOs; they do not import fixtures.

## Audit and replacement map

| Original card | Replacement and corrected behavior |
| --- | --- |
| Lombard leverage pool | `PersonalCredit`: shared available stock/crypto holdings and common market marks, explicit eligible selection, per-asset LTV capacity, no reused pending collateral; submission is a request, not a fictitious approval. |
| Buffer shield | Approved limit, drawn balance, draw, repay and enable/disable commands. Cannot disable while drawn. State survives reload; no unsupported automatic debit coverage or stale grace-period claims. |
| Pricing core | Verified discounts from one policy; current rate is derived, not a contradictory fixture field. Expandable eligibility explanations replace fake BOOST buttons. |
| Standard retail / corporate loans | `CreditCalculator`: all six products per segment, valid amounts/terms and guided amount sliders, amortization and application review. Product switching resets inputs together. The slider uses catalog steps; typed amounts accept exact cents within the product limits. Empty or partial edits keep the payment illustration stable and disable Continue. |
| Revenue growth + duplicate liquidity simulator | One RBF engine in `BusinessCredit`: connected sources only, common factor policy, pending capacity deducted, configurable sales share, fee/total/duration estimate. Factor fees are not labelled APR. |
| Corporate facilities | Per-business approved facilities, available limits and principal commands; equipment loan appears once in agreements instead of double-counting it as a facility. |
| Corporate risk optimizer | Derived revenue and debt-service indicators. Revenue coverage is explicitly not a DSCR or credit score. No fabricated accounting connection or score optimization. |
| e-Factura liquidity | Explicit invoice currency, net advance after fee, expiry, mixed-currency exclusion and pending invoice reservation/cancellation. Funded is not confused with collected. No ANAF integration is claimed. |
| Capital matching | Persisted preferences per business, anonymous/identifiable profile review and scoped suggestions. Demo has no external disclosure or investor contact. |
| Flexibility | Real pause/refinance review requests linked to an agreement. Existing dates stay unchanged until lender approval; external debt remains in its original currency. |
| Download documents | Actual CSV report containing scoped agreements, facilities, applications, audit and full illustrative schedules. No pretend legal agreement or inert download timer. |
| Missing servicing UI | `CreditRepayments`: per-agreement balance/payment charts, period controls, accessible schedules, prepayments; application filters, detail, cancellation and activity pagination. |

The former ten disconnected UI implementations were removed. Historical fixture/types files are retained for compatibility; the active module no longer uses the standalone retail/capital calculations. Demo credit starts at USD 12,500 (11,250 personal loan + 1,250 buffer) to reconcile with Overview. The old two Lombard fixtures had conflicting custody/debt/rate data and are not treated as real pledged positions.

## Data ownership and accounting

- `contracts.ts`: JSON DTOs and repository interface. Monetary values use decimal strings, rates integer basis points, dates ISO days and timestamps UTC RFC3339. Currency is explicit. `engine.ts` performs posted money arithmetic in integer cents using the shared wallet decimal helpers.
- `seed.ts`: explicit demo company membership and catalog. Every demo customer receives the named demo company fixture; this is not inferred from an email or a production company registry. Production gets zero or more verified businesses from authenticated service membership. Unverified/unlinked companies cannot access business operations.
- `CreditState` lives **inside the canonical wallet event journal**, not a mirrored local credit balance. One `credit` event validates and atomically posts principal, account balance, application/invoice changes and audit. Storage failures leave all balances unchanged. Old wallet journals replay with the opening credit seed and no extra cash deposit.
- Personal draw/repayment updates the same USD account used by Overview, Wallet, Transfers and trading. Overview credit is projected from personal principal plus drawn personal facilities. Credit cash activity carries incoming/outgoing direction; Overview's activity table respects it.
- Business funds are separate scoped cash accounts inside the same atomic journal. They are not part of personal Overview or available personal trading cash. This app does not yet have a general business-wallet module. Go must map these balances to real business ledger accounts.
- Available Lombard capacity uses shared *available* holdings, excluding existing trade/transfer reservations. Pending requests cannot reuse selected assets. A pending application does not lock custody; transfer/trading remains possible, and underwriting must revalue/revalidate holdings and atomically reserve collateral on approval. There is no automated margin call/liquidation simulator.
- Each command requires the current credit `expected_version`, plus a stable idempotency key reused for retries. Changed payload with the same key fails. Reload/focus/wallet events re-read the shared snapshot. Stale dialogs must be closed/refreshed and reviewed again.
- Applications move through `submitted`, `under_review`, `funded`, `declined`, `cancelled`; the customer can submit/cancel pending requests. The demo deliberately does not impersonate lender decisions. Underwriting, signed offers, documentation and disbursement are server-owned workflows. Incoming HTTP snapshots can reflect their outcomes and new agreements.

## Financial illustration limits

Fixed-rate term calculations use a reducing monthly balance, round interest to cents and adjust the last payment to settle principal exactly. The initial monthly estimate uses the annuity formula; subsequent posted schedule values use integer cents. This is not the legally disclosed APR/DAE and excludes fees, insurance, day-count adjustments and accrued interest. Production origination must issue an authoritative signed offer and official servicing schedule.

Lombard illustrates simple interest over the selected months with principal due at maturity. RBF has one factor policy: 1.08× at up to 10% sales share and 1.05× above 10%, supplied in the snapshot policy. Forecast days assume stable selected revenue. Factoring uses invoice face amount × advance ratio minus fee; net RON proceeds are never added to USD cash on submission.

Extra principal repayments reduce principal immediately and recalculate the *illustrative* remaining payments. They do not settle scheduled installments, accrued interest, fees or early-repayment penalties. The demo has no daily-interest accrual, automatic due-date collection or legal loan servicing. A payment pause is a request and never silently skips a payment. Facility draw commands operate only on already approved limits.

## Go HTTP integration

`openapi.json` is the OpenAPI 3.1 wire contract. `response.ts` validates service snapshots before financial values reach components.

```env
NEXT_PUBLIC_LOANS_MODE=http
NEXT_PUBLIC_LOANS_API_URL=https://api.example.test
NEXT_PUBLIC_TRANSFERS_MODE=http
NEXT_PUBLIC_TRANSFERS_API_URL=https://api.example.test
```

Default mode is `demo` for both. Mixed local/remote wallet modes are rejected. A remote error never falls back to fixtures. Configure the same authenticated ledger service for loans and transfers; API URLs are public base URLs, never credentials.

- `GET /v1/me/credit` returns the complete authenticated personal and company snapshot.
- `POST /v1/me/credit/commands` accepts the discriminated command union and `Idempotency-Key`; returns the committed full snapshot.
- Requests use `credentials: include`, JSON and `cache: no-store`. Identity is never supplied via customer email in request data.
- Error shape: `{ "error": { "code": "VERSION_CONFLICT", "message": "Refresh and review this action." } }`. Use 401/403 for access, 409 for stale version/idempotency conflict, 422 for validation and 503 for unavailable service.
- Go must authenticate the cookie, check CSRF and allowed origins, authorize every scope/resource, enforce feature flags, KYC/KYB, application policy, amounts, currency, covenants, current collateral marks, affordability and eligibility. Frontend capability/validation is not a security boundary.
- In one database transaction: lock wallet/credit rows, check version, recompute authoritative quote/terms, reserve affected resources, post balanced ledger entries and audit, increment revision, and persist the idempotency key + canonical payload + result. Repeated identical commands must not post again. No client command can approve a loan or credit unapproved proceeds.
- Use NUMERIC or an exact decimal/money type for Go/SQL; do not unmarshal money into `float64`. Scope business accounts, revenue integrations, invoices, matching and audit independently. Keep repayment, interest and fee entries distinct.
- Supply one personal `buffer` facility (disabled/zero if unavailable). All collections may otherwise be empty. Product and policy limits must be internally consistent. Server snapshot version is the optimistic credit revision.
- Live open banking/accounting, ANAF invoice ingestion, investor introductions, signed contracts, approval/funding and automated servicing require backend integrations. The frontend does not claim these external connections exist.

## Validation

`npm run test:loans` checks atomic posting, shared Overview balances/history, business isolation, forged scopes, stale revisions, retry idempotency, storage failure, capacity, factoring holds, currencies, pending workflows, policy arithmetic for all products, month-end dates, CSV safety and the HTTP boundary. Existing wallet/overview/transfer/stock/crypto tests cover the surrounding canonical journal.
