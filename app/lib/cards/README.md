# Cards Vault

Cards Vault uses the shared issuing registry, not the retired standalone user card mocks. The user workspace and admin Card Issuing see the same cards, versions, limits, delivery states and audit. Every account receives an explicit Demo card option in the selector: a default demo physical card (USD, ending 4242), example payments and spending insights. This is demo setup only and never moves wallet funds; accounts already holding cards retain those cards alongside the demo option. Demo cards do not consume the open-card policy allowance. Every signed-in demo customer receives an isolated profile automatically, including accounts absent from the initial demo list. That list is not an access list. Existing account/KYC restrictions remain effective. New demo profiles start verified, as with the application's simulated login; production eligibility must come from the authenticated customer service.

`createCardsRepository(email, name)` is the UI boundary. `CustomerCardsSnapshot` and `CustomerCardCommand` in `contracts.ts` describe transport data. Select `NEXT_PUBLIC_CARDS_MODE=demo|http` (defaults to the existing transfers mode, then demo); `NEXT_PUBLIC_CARDS_API_URL` defaults to the shared transfers API URL. No Go server is included.

The machine-readable API definition is `openapi.json`.

## HTTP contract for Go

- `GET /v1/me/cards` returns a complete version 1 snapshot.
- `POST /v1/me/cards/commands` accepts a discriminated customer command and `Idempotency-Key`, returning a complete snapshot after commit.
- Session cookies identify the customer. Never trust the email passed to the frontend factory for authorization. Require CSRF protection for cookie-authenticated mutations and explicit credentialed CORS origins for cross-origin deployment.
- Return `{ "error": { "code": "...", "message": "..." } }` for errors. Use 401 for missing session, 403 for policy restrictions, 409 for stale versions/idempotency conflicts, and 422 for invalid controls. Failures never fall back to demo.
- The snapshot includes customer, cards, funding_accounts, activity, audit, policy and per-card permissions. Each card is the existing admin `IssuedCard` DTO (camelCase JSON tags retained for compatibility); command card/version fields use `card_id` and `expected_version`. The service must provision/resolve a profile for every authenticated customer rather than require membership in a seed list.
- Card and activity rows must belong to the authenticated customer. Funding accounts come from the same wallet used by Overview, Currencies and Trading. Snapshots, registry records and audit contain only masked card data: last4 and expiry. PAN/CVV are fetched separately on explicit reveal and are never persisted; PIN is never exposed.
- Monetary activity and wallet balances are decimal strings. Existing admin limit/usage fields are JSON numbers with at most two decimal places. Decode those with Go `json.Number`, validate exact decimal precision, and store/compare minor currency units; do not use binary float arithmetic in the backend.
- Authorize, verify expected_version, validate limits/channels, update state/version, append audit and commit the idempotency result in one database transaction. Bind keys to authenticated identity and normalized request payload. Replays return the original response; changed payloads return 409.
- FREEZE is reversible only by the customer who applied it. An operations freeze, block, termination, delivery restriction or account/KYC restriction cannot be removed by a customer command. Customer controls cannot exceed the latest operations ceilings or re-enable channels prohibited by operations. Track approved ceilings independently of customer preferences in Go.
- Physical cards require a delivery address and verified delivery before activation. Virtual cards have ATM and contactless disabled. Issuance consumes a policy card slot, but does not credit/debit wallet cash. Keep terminated cards and financial activity for history.

## Demo persistence and financial semantics

The existing `mbank_admin_card_issuing_v1` localStorage record now also stores optional customer profiles. Old registry records still load. Unknown/malformed saved state is preserved and mutations fail closed. Dynamic customers are available in admin lookup, issuance, controls and exports. LocalStorage is a demo mechanism, not a production authorization or cross-tab transaction boundary.

Commands use the shared pure card transition engine through separately authorized admin/customer entry points. Versions reject stale dialogs; retry keys suppress duplicate demo commands. Admin/customer changes refresh both interfaces and storage events synchronize tabs. Wallet events refresh linked account balances.

`activity.ts` contains the single demo ledger keyed to actual registry IDs, with ISO dates and explicit currencies/statuses. These sample settled amounts are already represented by the opening wallet; displaying them must never debit that wallet again. Daily series, category totals and averages derive from those ledger rows for 7/30/90-day periods. No synthetic history, arbitrary forecast, or cross-currency total is used. Issuing usage counters are authoritative and may include activity outside the supplied ledger window. Pending/reversed rows are excluded from spending charts; exports retain their actual status. The UI cannot delete financial history.

Run `npm run test:cards`, `npm run test:card-issuing`, `npx tsc --noEmit` and targeted ESLint checks. Tests cover any authenticated demo account, profile isolation, admin synchronization, ownership, versions, freezes, controls, issuance, idempotency, corrupt storage and chart reconciliation.


## Reveal and presentation

`POST /v1/me/cards/{card_id}/details` is a separate ownership-checked, authenticated, rate-limited reveal endpoint. Return `CardDetails` with an expiry, `Cache-Control: no-store`, and redact sensitive payloads from logs. Apply recent-authentication and CSRF requirements in Go. The UI caps visibility at 60 seconds, hides on tab visibility changes, drops details when selecting/changing a card, and exposes explicit copy-number/copy-details controls. Demo values are test data only; the demo registry never stores PAN/CVV.

The demo card simulates physical-card capabilities so ATM and contactless switches can be explored. Existing virtual demo cards migrate in place without resetting status, identity, history or operations ceilings. Actual virtual cards retain their channel restrictions. Customer preferences can toggle within independently approved ceilings; operations restrictions are explained and disabled in the UI.

The default chart is calendar-month cumulative usage, with a visible monthly limit reference, remaining budget and usage percentage. Future dates are null, not invented spending. Missing opening ledger coverage is reconciled with authoritative issuing usage. A separate Daily view uses bars and 7/30/90-day windows. Twelve demo payments spread across the month total USD 1,840.

Payments render at most 20 rows per page in a fixed-height scroll region (320px on phones, 384px from small tablets). Filtering resets pagination and scroll. Security history is in a dialog opened beside card controls, with its own bounded scroll and 20-row pages. A rendering test verifies that 10,000 supplied payments create only 20 payment rows.


## Customer deletion and pagination

The customer `TERMINATE` command is presented as Delete card with an explicit confirmation checkbox. It closes the card and records `customerDeletedAt` atomically with its audit entry. Customer snapshots and reveal queries exclude deleted cards; the card disappears from the user selector, and deleted demo cards are not regenerated. Operational records remain in the admin registry. Go must implement the same visibility rule and version/idempotency protections. Issuance slots are released, account balances are unchanged, and existing settlement obligations are retained.

Payment and security lists share `cardPage`: 20 records per page, bounded scrolling, previous/next navigation and clamping after data changes. 1–20 records show one page, 21–40 show two, and 41–60 show three. Tests cover navigation through pages 1/3, 2/3 and 3/3 and both rendered surfaces with 41 records.

Demo cards use USD, displayed with `$` (for example `$1,840.00`). Older EUR demo cards migrate in place, preserving status, channel preferences, limits and deletion state. Their sample transactions follow the demo card currency and their funding balance comes from the matching USD wallet account. This changes demonstration data only, not wallet funds.
