# Currencies and the Go wallet service

The UI depends only on `CurrencyRepository` (`contracts.ts`). The demo adapter reads and commits the existing canonical wallet journal; it never saves another balance. The HTTP adapter uses the same origin and mode as Overview and Transfers:

```env
NEXT_PUBLIC_TRANSFERS_MODE=http
NEXT_PUBLIC_TRANSFERS_API_URL=https://your-go-service.example
```

Leave the URL empty for a same-origin reverse proxy. HTTP mode never falls back to demo. The Go service is not implemented in this frontend repository. `openapi.json` describes the proposed v1 API; implement it together with the existing Overview and Transfers contracts against one authenticated customer ledger.

## Endpoints

- `GET /v1/me/currencies`: `CurrencySnapshot`, including accounts, admin-managed exchange assets, and actual journal history.
- `POST /v1/me/currencies/quotes`: `{ "source": "EUR", "target": "RON", "amount": "108.00" }` → `CurrencyQuote`. Quote creation does not move or reserve funds.
- `POST /v1/me/currencies/exchanges`: `{ "quote_id": "opaque-server-id" }`, header `Idempotency-Key` → committed `CurrencySnapshot`.

Authenticate the customer from the session cookie; never trust a customer ID, price, fee, balance or role supplied by the browser. Requests send `credentials: include` and bypass caches. For cross-origin hosting configure an explicit allowed frontend origin and credentialed CORS. Apply the service's session and CSRF policy to POST requests. Errors use `{ "error": { "code": "quote_expired", "message": "Review a new quote." } }` with appropriate 400/401/403/409/422/503 status. Authentication errors and malformed responses are surfaced without a local fallback.

## Decimal and execution semantics

All quantities, prices and money cross JSON as decimal strings, never float64. Use fixed-point integers or an exact decimal type in Go, with per-asset precision (fiat 2; custody up to 18; execution capped by the instrument). Timestamps use RFC3339 UTC with a `Z` suffix. The browser converts values to numbers only for presentation and charting; the HTTP adapter transmits the user's original amount string unchanged.

`requested` is the entered budget/quantity; `debited` and `received` are the actual settlement changes, after spread and fees. Budget purchases can debit less than requested due to instrument precision/whole-unit rules. `fee_usd` is already included, and must not be debited a second time. Asset-to-asset conversion sells through USD and buys the target; residual USD is reported as `remainder_usd` and stays in the same wallet. Existing USD funds must not subsidize a conversion beyond its source proceeds.

New demo exchange events carry `pricing_version: 2` for strict rounded budget enforcement. Existing events retain their original pricing path when the journal replays, preserving saved balances.

Bind a quote valid for 5 minutes (300 seconds) to the authenticated customer, draft, wallet version, market/routing versions and execution prices. On confirmation, lock the relevant ledger accounts and liquidity rows, validate expiry, available balances (excluding holds), current admin restrictions, precision, min/max amounts, risk limits and both liquidity legs. Commit all debits, credits, liquidity updates, orders, audit records and idempotency outcome in one database transaction. A failed second leg must roll back the first. Admin instruments, routing and order processing must read this same ledger and catalog.

Store a unique `(customer_id, idempotency_key)` with its request fingerprint and result. Retries with the same quote/key return the original successful outcome, including after quote expiry; a different payload with that key returns 409. The UI retains the key after a network error. Neither quote nor customer identity should be derived from client-controlled prices or localStorage in live mode.

## History and synchronization

History is supplied by the data adapter as decimal-string USD values with unique IDs and UTC timestamps. The local adapter returns 30 days of presentation data, ending at the canonical opening balances, followed by actual wallet-operation points. These samples only populate the chart; they never create funds or change the ledger. The future Go service can return fixture history through the same DTO for investor presentations. Keep the latest current point when truncating history (local adapter limit: 200 points). No environment or fixture labels appear in the customer UI.

Exchange previews update after 250 ms of input inactivity and refresh every 15 seconds. Selecting Exchange freezes that exact quote and asks for confirmation inline, without a review modal. Confirmation reuses its idempotency key on retry.

The client refreshes on focus, global wallet events, explicit refresh and every 30 seconds. Successful HTTP exchanges dispatch the existing wallet and transfer events, refreshing the other customer modules. A future Go SSE/WebSocket subscriber should dispatch the same wallet event for admin changes. Crypto Terminal uses its own HTTP snapshot adapter at `/v1/me/crypto` and the same shared exchange endpoints (see `../crypto/README.md`). Stocks still uses its legacy market hooks; its live trading adapter is a separate integration task.

Run `npm run test:currencies`, `npm run test:wallet`, and `npm run test:markets` for the HTTP contract, cross-module balances, admin restrictions, exact quote settlement, idempotency, expiry and atomic rollback checks.
