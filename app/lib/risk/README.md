# Risk Control

Admin route: `/dashboard/admin/fraud-control`. The workspace uses the shared PageHeader, CardSurface, MetricCard, ActionButton and OptionSelect. Lists are searched, paged and height bounded. No new dependencies.

## One policy source

The canonical demo store remains `mbank_risk_v1` (`store.ts`). Wallet transfers and cash withdrawals use `enforcePaymentRisk`; market submission and queued execution use `enforceMarketRisk`. Crypto/stock swaps check both legs. Cancellation remains available. Cards' authorization sandbox reads the same risk controls; a real processor is not connected. Admin Control and transaction/user-management snapshots already read this source. Do not create copies of risk policy in feature stores.

`repository.ts` combines these policies with the globally projected market inventory, including observed customer wallet settlements, and the shared User Management directory. Fiat treasury exposure is an explicitly labelled fixture, not customer balances or reconciled bank funds. Inventory and USD execution reserves are distinct assets and are not summed twice. Exposure thresholds trigger monitoring warnings, not transaction blocks.

`use-risk-source.ts` refreshes on risk/wallet/user changes, cross-tab storage and window focus. Global Audit Logs use this same transport and mark sample risk evidence as DEMO. A failed read blocks workspace mutations and exports and preserves existing stored data. Corrupt risk storage fails closed before financial writes.

## Decisions

Investigations: OPEN → INVESTIGATING → ESCALATED / RESOLVED. Assignment precedes resolution, resolved records are immutable, evidence and notes are preserved. Resolution never unfreezes an account.

Restrictions: FREEZE → REQUEST_RELEASE → APPROVE_RELEASE by a different administrator. REJECT_RELEASE clears the request and leaves the restriction active. Rejecting your own request is permitted (withdrawal). Existing funds, reservations and case status stay intact.

Every mutation checks role, expected revision and audit reason and atomically appends evidence. Exports record the exact filtered IDs and produce CSV only after the command succeeds. Formula injection is neutralized. Stable idempotency keys protect modal retries and duplicate confirmation; reused keys with altered payloads fail. Demo receipts are retained with the state and never sent over HTTP.

Screening is an explicitly hypothetical exercise of current policy, not an AML verdict or transaction authorization. KYC/sanctions/score inputs are simulated. Changed policy revisions invalidate the result. The resulting case can be opened with a unique reference. Stress sliders show deterministic marked-inventory markdowns, not VaR, losses or a forecast. Charts use actual case records and resolution audit entries.

## Demo fixtures

`demo.ts` merges 12 additional sample investigations, four resolved outcomes, three isolated restrictions and a pending release plus their decision history. Sample identities use `risk-demo-*@example.test`; no existing customer's wallet is frozen. A persisted fixture version prevents reseeding resolved/released samples. Existing cases, notes, decisions and policies are retained. Opening Risk Control (or its audit source) installs this additive fixture once. It is not used in HTTP mode.

## Go backend contract

`NEXT_PUBLIC_RISK_MODE=demo|http` (fallback: `NEXT_PUBLIC_TRANSFERS_MODE`, then demo). `NEXT_PUBLIC_RISK_API_URL` falls back to `NEXT_PUBLIC_TRANSFERS_API_URL`, then same origin.

- GET `/v1/admin/risk`: versioned snapshot, current policies, cases, restrictions, customers, exposure and evidence.
- POST `/v1/admin/risk/commands`: `{schema_version:1, command}` and `Idempotency-Key`.
- Cookie credentials, no-store requests, optional AbortSignal on reads. No local fallback in HTTP mode; service responses must be `mode:live` with SERVICE exposure provenance.
- USD values travel as decimal strings with two places, including nested audit evidence. Decimal strings are decoded at the UI boundary; financial arithmetic must be fixed point on Go.
- Actor identity/role must come from server authentication, never client JSON. Recheck authorization, current policy, lifecycle, revision and the two-administrator rule in the database transaction. Persist audit and idempotency receipt in that same transaction. Use CSRF protection, secure session cookies and bounded validated request bodies.
- Do not execute local financial writes when risk is configured for HTTP: `readRiskForExecution` rejects that mixed configuration. Payment/trading adapters must call server enforcement atomically with their own writes. Frontend checks cannot secure production payments.
- Backend must supply real provider evidence for AML/KYC/sanctions and reconciled treasury exposure, immutable audit retention, holds/settlement and any regulatory reporting. These are not simulated as completed actions.

`openapi.json` describes the current complete-snapshot prototype. Before large production datasets, introduce server cursor pagination, search and aggregate endpoints; UI pagination currently bounds rendering, not network or storage size. Server snapshots should be consistent across sources with a declared `as_of`. Conflicts return 409 and require refresh/review. Successful idempotent retries must return the committed outcome without repeating writes.

Validation: `npm run test:risk`, workspace transport/integration tests, TypeScript, ESLint, production build.
