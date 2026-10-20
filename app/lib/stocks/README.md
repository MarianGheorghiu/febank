# Stocks & Trading service boundary

`createStocksRepository(customer)` is the sole stocks UI data and command boundary. The customer is used only to scope the local adapter. HTTP requests always identify the customer through the authenticated session; never trust a customer ID, role, cost basis, fee or balance sent by a browser.

## Mode and Go integration

Use the same wallet configuration as Overview, Transfers, Currencies and Crypto:

```
NEXT_PUBLIC_TRANSFERS_MODE=http
NEXT_PUBLIC_TRANSFERS_API_URL=https://your-api.example
```

The default local adapter reads the canonical wallet journal and the bank-operated instrument catalog. HTTP mode has no local fallback. `contracts.ts`, `response.ts` and `openapi.json` define the wire contract. Return exact base-10 decimal **strings**, RFC3339 UTC timestamps, ISO calendar dates, schema version 1, and `{error:{code,message}}` errors. In Go, decode money/quantity into a decimal or fixed-point type; do not perform money arithmetic with `float64`.

- `GET /v1/me/stocks`: one internally consistent snapshot including the common wallet, all equity listings, all positions, customer orders, plans, issuer dividends and portfolio history for every period.
- `POST /v1/me/stocks/quotes`: share quantity, side, order type, settlement currency and optional USD target. Returns an opaque quote ID and authoritative execution/target price, fee and settlement amount. No wallet mutation.
- `POST /v1/me/stocks/orders`: `{quote_id}`. Revalidate authorization, expiry (five minutes), instrument/routing versions, account balances, liquidity, fees, risk rules and precision. Commit an order and all cash/quantity changes atomically.
- `POST /v1/me/stocks/orders/{id}/cancel`: atomically cancel only the authenticated customer's pending order and release its own reservation.
- `POST /v1/me/stocks/plans`: create a recurring investment.
- `PATCH /v1/me/stocks/plans/{id}`: update the schedule with `expected_version`.
- `POST /v1/me/stocks/plans/{id}/status`: pause or resume with `expected_version`.

All mutations require `Idempotency-Key`. Persist the request hash and result in a transaction; return the original result on retry and reject key reuse with a different payload. Scope keys by authenticated customer. Use expected versions for plan concurrency (409 on conflict). Enforce same-origin cookies/CSRF protection or the service's explicit origin and CSRF policy. Reads accept AbortSignal; all responses are validated before entering UI state. Error responses never substitute fixtures or reset saved data.

## Accounting and orders

The local adapter uses `executeCustomerCommand` and the same event journal as bank operations. Market fills update quantities, weighted cost basis, pool liquidity and settlement currency once. Limit/stop submission reserves funds or units immediately; the admin engine processes the same order IDs at eligible prices. Cancellations release those reservations. Market, limit and stop remain distinct; a stop target is not a guarantee of the final fill price. Available balances always exclude holds. Stock position value and allocation include available **and reserved** owned shares.

Opening cost metadata is initialized once through the versioned `cost_basis` wallet event. It imports only missing average costs from the existing presentation fixtures; it neither overwrites recorded trade costs nor credits cash/shares. Existing wallet history and legacy executions are replayed unchanged. The event is appended after existing events and replay ignores already-present cost values. This metadata initializer exists only in local mode; the Go service must return the persisted accounting cost basis.

## Research, histories and schedules

Existing catalogs, fundamentals, news, candles, portfolio history anchors, investment plans and issuer announcements remain in the source fixtures. UI components import no fixtures. The adapter supplies all five original periods, normalizes candle prices to the common bank quote, retains original OHLC envelopes, and generates price-anchored chart fixtures for bank listings without research. It never substitutes another company's fundamentals/news. Market cap has one displayed value across market explorer and research.

The portfolio chart's presentation anchors lead into canonical equity movements and the current owned value. Non-equity transactions and stock reservations do not invent equity performance. These fixtures are visual examples, not a time-series performance accounting engine. Go should provide historical valuations with cash-flow-aware returns if returns are required. Unrealized P&L is derived separately from current value and cost basis.

Recurring configuration persists in a customer-scoped auxiliary journal, with idempotency and optimistic versions. Creating/editing/pausing a schedule never debits funds. The Go scheduler is responsible for actual recurring runs: evaluate the calendar in the configured account timezone, clamp monthly dates without drift, recheck available funds/admin/risk permissions, and commit each run once with a unique plan+occurrence key. Do not implement financial scheduling with a browser timer. Bi-weekly and crypto plans from the original catalog are retained.

Dividend announcements retain issuer dates and amounts. Local eligibility is projected from the canonical owned position before the ex-date; later transactions do not rewrite entitlements. `paid_amount_usd` represents actual credited account income, never an inferred payment from the issuer's PAID status. Local fixtures do not credit arbitrary income. Go must snapshot record-date entitlements and post actual paid dividends into the common ledger idempotently, supplying both estimated and credited amounts. For upcoming ex-dates it should return a provisional eligible quantity from current holdings.

The CSV includes positions, orders, schedules and dividend records with original decimal precision and spreadsheet formula escaping. All command errors use the global notifications; quote validation stays inline. Native dialogs close on Escape and outside clicks, contain focus, and become sheets on mobile. Searchable virtualized selectors and four-row pagination bound large catalogs.
