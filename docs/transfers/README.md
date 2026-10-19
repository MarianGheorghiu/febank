# Customer transfers / Go integration

The customer workspace is `/dashboard/transfers`. `app/lib/transfers/contracts.ts` is the JSON contract; `engine.ts` contains exact demo arithmetic and validation; `repository.ts` selects the transport. UI components never import the old independent transfer mocks. All cards, filters, counters, quotes, reservations and cancellations consume one snapshot.

## Enable the Go adapter

```dotenv
NEXT_PUBLIC_TRANSFERS_MODE=http
# Empty means a same-origin reverse proxy to Go. No credentials belong here.
NEXT_PUBLIC_TRANSFERS_API_URL=
```

Default mode is `demo`. HTTP mode never falls back to demo on API errors. Requests use session cookies (`credentials: include`), JSON, `cache: no-store`, AbortSignal for reads, and `Idempotency-Key` for submission/cancellation. Use a same-origin reverse proxy; if serving cross-origin, explicitly allow the application origin and credentials. Go must check Origin/CSRF on mutation requests and use secure, HttpOnly session cookies. The existing app login is a mock; production authentication remains backend work.

| Endpoint | Request | Response |
| --- | --- | --- |
| GET `/v1/me/transfers` | authenticated session | `TransferSnapshot` |
| POST `/v1/me/transfers/quotes` | `TransferDraft` | `TransferQuote` |
| POST `/v1/me/transfers` | `{ "quote_id": "…" }` + idempotency key | latest `TransferSnapshot` |
| POST `/v1/me/transfers/{id}/cancel` | `{}` + idempotency key | latest `TransferSnapshot` |

`openapi.json` specifies requests, responses and errors. `contracts.go` provides equivalent Go structs without third-party dependencies. Responses are plain JSON (no `data` wrapper). Errors use `{ "error": { "code": "insufficient_balance", "message": "…", "field": "amount" } }`; `field` is optional. Use 401/403 for authentication/authorization, 404 for inaccessible resources, 409 for stale state, idempotency conflict or quote expiry, 422 for validation, 429 for throttling, and 503 for unavailable routes. Do not expose stack traces in messages.

All quantities, balances, prices, fees, limits and USD values are base-10 **strings**. Go should parse them with checked integer units or an exact decimal library, never `float64`. Timestamps are RFC3339 UTC (`time.Time`). Identifiers and enum values are stable strings. `schema_version` is 1. ETH precision is 18; BTC 8; SOL 9; supported fiat 2; demo stock custody accepts whole shares. Display formatting stays in React. Value in USD includes fees, rounded up to a cent for limit accounting. Production USD valuation and limits must use server pricing/policy, not submitted prices.

## Dynamic fee policy

Each route may supply `fee_policy: { fixed, rate_bps, minimum, maximum?, debit_account_id }`. Amount fields are exact decimal strings in the debit account's asset and precision; `rate_bps` is an integer (10 = 0.10%). The fee is `fixed + ceil(base × rate_bps / 10000)` in smallest asset units, then clamped to minimum/maximum. The UI uses this policy for immediate estimates on amount, asset and route changes. Empty/invalid/zero amounts show a dash. The server quote recomputes and supplies the binding fee; a changed policy invalidates an uncommitted quote rather than silently charging a different amount.

The demo tariff is illustrative configuration, not a real bank/network rate:

| Route | Fixed + percentage | Bounds / debit asset |
| --- | --- | --- |
| USD/EUR bank | 1 + 0.10% | max 50, source currency |
| RON bank | 5 + 0.10% | max 250 RON |
| USD/EUR phone | 0 + 0.05% | min 0.10, max 10, source currency |
| RON phone | 0 + 0.05% | min 0.50, max 50 RON |
| BTC network | 0.00002000 + 0.05% | BTC |
| ETH network | 0.000100000000000000 + 0.05% | ETH |
| SOL network | 0.000005000 + 0.05% | SOL |
| Stock custody | 2.50 USD + 0.10% of USD position value | min 2.50, max 100 USD |

For stock custody, convert the share quantity to USD using the supplied price with exact arithmetic, then compute the fee. `fee_asset` and `fee_account_id` in quotes/history identify its separate USD debit account. `total` remains the source-account debit (whole shares); review displays both reserved shares and the USD fee. Submission and cancellation reserve/refund both accounts atomically. Daily USD usage includes principal value plus fee. An insufficient USD fee balance rejects a stock request before any reservation.

The legacy `route.fee` remains a fixed-fee fallback when no policy exists. Old history entries without `fee_asset` / `fee_account_id` retain their original same-asset fee during replay. Go should supply the new policy and fee metadata for all new requests, persist the committed amounts, and never reprice historical transfers. Production network fees must be supplied by the backend's network estimator; the UI does not query or invent live gas prices.

## State and ledger invariants

1. Determine the customer from the authenticated session; never accept a customer ID in a customer endpoint. Check ownership of the source account, quote and transfer on every request.
2. Quotes remain valid for **10 minutes** from issue (the draft has no editing deadline). Quotes are immutable server records bound to the user, normalized draft, route, network, pricing, fee and expiry. The submission accepts a quote ID only. Recheck balance, precision, beneficiary, destination, route availability and limit atomically at submission.
3. `pending` reserves principal and fee, reducing available balances (two accounts for stock custody). Pending reservations count against the daily limit. Lock account/limit rows and write the transfer, reservation, idempotency response and outbox event in one DB transaction. Concurrent requests must not overspend.
4. Workflow: `pending -> processing -> completed|rejected`; `pending -> cancelled|rejected`. Only expose `can_cancel=true` for user-owned outgoing pending requests that the service can actually cancel. Settle once, release reserves once on rejection/cancellation, and never restore funds after external settlement. Cancellation races with dispatch return 409 and the client can refresh.
5. Idempotency keys are scoped to authenticated customer + operation and bind a request fingerprint. Same request returns its committed result; a different body with the same key returns 409. Retain keys beyond all retry/settlement windows. Quote expiration must not prevent replay of an already committed idempotent result.
6. Limit day boundaries are UTC, with `resets_at` supplied by Go. Completed and active outgoing requests count on creation date; rejected/cancelled ones do not. Limit amount and tier come from KYC/risk policy. Another policy can be implemented in Go without changing the widgets.
7. IBAN format/checksum, E.164 syntax, chain-specific address syntax, custody identifiers and precision are checked in demo. Production must additionally validate supported country lengths, address checksum, beneficiary resolution/ownership, custody eligibility/settled positions, sanctions and required authentication. Syntax checks alone do not prove an address is payable.
8. Server owns fees/ETA. Do not promise SEPA Instant or network availability from a static label; return configured routes, `enabled` and actual estimates. A phone route must resolve a verified internal beneficiary before funds can dispatch.

## Admin integration

The corresponding administrative module is `/dashboard/admin/transactions`, not a separate transfers page. `AdminTransferMonitor` projects actual submitted demo requests into that page using the same IDs, amounts and statuses. It is read-only: the existing admin transaction mock's arbitrary status/amount edits never mutate customer requests. The monitor updates on submission/cancellation and on focus; only the current browser session is visible. Session storage is not an authorization boundary.

For Go, implement `GET /v1/admin/transfers?cursor=…&status=…&customer_id=…` with an authorized admin read model, stable cursor pagination and the same transfer IDs. Admin reviews must go through explicit `POST /v1/admin/transfers/{id}/decisions` with `{ decision: "release"|"reject", reason, expected_version }`, RBAC, idempotency and append-only audit. This admin HTTP UI is not implemented by this customer change. Map transfer status to the legacy admin table only as a projection: pending/processing -> PENDING, completed -> COMPLETED, rejected -> FAILED, cancelled -> CANCELLED. A risk flag is an independent hold/review attribute; toggling FLAGGED must never mark a transfer completed. Keep decimal strings in the new admin DTO rather than converting to the legacy table's numeric amounts.

After any transition, publish a transactional outbox event (`transfer.submitted`, `transfer.cancelled`, `transfer.processing`, `transfer.completed`, `transfer.rejected`) carrying transfer ID, customer/account IDs, event ID, version and UTC time. Customer, overview, admin transaction, risk, liquidity and audit projections must consume the same ledger events. Use SSE/polling for live status updates; this UI currently refreshes explicitly and fetches on navigation.

## Demo boundaries and migration

Overview and Transfers now share one per-customer `sessionStorage` event log (`mbank_wallet_v1:<encoded email>`), replayed through validation. Previous Overview and Transfers journals are imported once without deleting the originals. See `../../app/lib/wallet/README.md`. Storage failure surfaces an error before applying a mutation. Corrupt history fails visibly; it is not silently erased. The seed contains three dated historical records and post-history available balances; submitting a new request adds a real pending demo reservation. No network, brokerage or money movement occurs.

Overview reads the same available USD, fiat/crypto/stock accounts, transfer statuses and daily-usage journal as Transfers. Deposits/withdrawals in Overview affect transfer availability immediately; Overview transfers go through the same quote/fee/limit workflow. Portfolio totals derive from the shared account holdings, replacing the old independent summary fixtures. Loan liabilities remain a separate value. Other trading/exchange execution workflows still need the same Go ledger integration before production. Unrelated legacy fixtures remain for backward compatibility.

## Verification

`npm run test:transfers` covers decimal precision, route/destination validation, fee-inclusive balance/limits, reserve/refund invariants, expiration, idempotency, storage failure, isolation, admin projection and HTTP requests/errors. Also run `npm run test:wallet` for cross-module consistency and migration. Run `npx tsc --noEmit`, targeted ESLint and production build. Browser checks should exercise review/submit/cancel/reload, validation failures, filters/empty state, and widths 320, 375, 768 and 1440, including keyboard access and no document overflow.
