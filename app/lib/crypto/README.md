# Crypto Terminal and the Go wallet service

Crypto Terminal reads one `CryptoSnapshot` through `CryptoRepository`. It does not call the legacy local trading hooks or save another balance. Buy, sell and crypto-to-crypto swaps use the same `CurrencyRepository` quote/confirmation endpoints as Currencies.

## Service integration

Use the existing `NEXT_PUBLIC_TRANSFERS_MODE=http` and `NEXT_PUBLIC_TRANSFERS_API_URL` settings. `GET /v1/me/crypto` returns the DTO in `contracts.ts`:

- `schema_version: 1`, `as_of`: RFC3339 UTC timestamp.
- `wallet`: the existing `CurrencySnapshot` contract (all shared accounts, asset catalog and portfolio history).
- `market`: crypto instruments with decimal-string prices, nullable signed decimal-string changes, volume/cap labels, decimal-string sparkline points, and `can_buy`/`can_sell` plus nullable restriction explanations.
- `orders`: only the authenticated customer's crypto orders, with exact decimal-string quantities, prices, fees and totals. No customer identifier is sent from the browser.

The OpenAPI contract references the shared Currencies schema and execution endpoints. HTTP responses are checked at runtime. Authentication, network and schema errors surface in the workspace; they never trigger a local-data fallback.

## Execution and synchronization

A buy is fiat → crypto; a sell is crypto → fiat; a swap is crypto → crypto. USD, EUR and RON use the same global accounts as Overview and Transfers. The UI previews the actual debit and received amount (including spread and fees), then confirms inline. Market-row actions use the shared rounded desktop dialog / mobile bottom sheet, with the selected coin locked to the relevant leg. Quotes last 5 minutes; retries retain the idempotency key.

The server must validate customer ownership, balances excluding reservations, routing and instrument restrictions, quote freshness, liquidity, fees and risk inside the shared atomic ledger transaction described in `../currencies/README.md`. UI trading permissions are informational; server validation remains authoritative. Update the customer order feed, execution inventory and admin audit together. A crypto-to-crypto swap must roll back both legs if either fails.

The client refreshes on wallet events, focus, manual refresh and every 30 seconds. A successful trade updates the shared wallet projection immediately and refreshes the terminal snapshot. Admin changes use the same catalog and wallet events locally; the future Go event subscriber can dispatch `mbank:wallet-updated` for push updates.

## Data and presentation

The local reader derives balances, current prices, orders and eligibility from the canonical wallet/admin catalog. Its investor presentation metadata is seeded from the existing crypto catalog; sparkline endpoints are normalized to the current shared quote. New listings show unknown changes as null, rather than inventing percentages. Historical portfolio values arrive through the shared wallet DTO and finish at the current balance. Presentation history never creates funds.

The old separate P&L history and universal 10% tax estimate were removed: neither represented the customer's actual cost basis or tax jurisdiction. The chart displays portfolio value and period change; it does not claim a realized trading profit or tax liability.

The market has bounded pages and searchable names/symbols. All form asset pickers share the searchable virtual list from Currencies. Reports export only the current customer's crypto orders as escaped CSV, preserving exact decimal strings.

Run `npm run test:crypto`, `npm run test:currencies`, `npm run test:wallet`, and `npm run test:markets` for integration, account isolation, Go transport validation, admin restrictions, atomic execution and report escaping.
