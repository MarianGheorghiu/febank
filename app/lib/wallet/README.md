# Shared customer financial state

The customer application has one opening balance and one journal per customer. Overview, Transfers, Currencies, Crypto, Stocks and Analytics project those same accounts. `state.transfers.accounts` is the canonical account collection; its historical name is retained for compatibility with the existing transfer DTO. There is no separate customer trading cash balance.

## Files and ownership

- `seed.ts`: opening account identities, available quantities, USD marks and transfer fee metadata. Listed instruments without opening funds start at zero. No view creates funds from a fixture fallback.
- `engine.ts`: deterministic event reducer and Overview projection.
- `store.ts`: customer-scoped journal, migration, idempotency, synchronous read/validate/write and notifications.
- `trading.ts`: adapts the matching engine to canonical accounts; settles cash, positions and reservations in the same journal event. Orders, cost basis and execution liquidity deltas are execution metadata, not another account ledger.
- `../markets/seed.ts`: common instrument catalog and fiat conversion rates. The old admin mock module re-exports it for compatibility. Opening prices for existing accounts come from the opening account seed.
- `../markets/use-markets.ts` and `../markets/projections.ts`: reactive customer projections. Bank operational configuration remains in the existing market store.
- `use-wallet.ts`: transport-backed account subscription for non-trading consumers.
- `use-portfolio.ts`: shared asset/valuation projection for customer Analytics.

## Financial invariants

`available` excludes every active transfer and order hold. `reserved` includes both. The matching engine temporarily adds back only its own order holds before calculating availability; transfer holds remain unavailable. A cancellation releases only that operation's reservation. Stock custody fees reserve USD separately from shares. Trading supports eight fractional places; existing ETH account quantities retain eighteen places through settlements.

A trade, two-leg exchange, reservation or cancellation validates against the latest wallet and writes one customer journal key before publishing `mbank:wallet-updated`. Storage failure leaves the committed accounts and history untouched. Command keys are idempotent across modules. Customer identities are case insensitive. Quotes retain the account marks used at commitment so historical replay is independent of later market price changes. Current valuations use the shared instrument catalog.

Account amounts persist as decimal strings and account deltas settle with integer minor units. The existing demo matching/FX engine still calculates quotes using JavaScript numbers, rounded to cents/eight quantity places. This is a demo limitation: Go must calculate prices, fees, FX and quantities with fixed-point/decimal arithmetic throughout. Do not use the browser matching engine to settle real money.

The USD metric is the available USD account, not a sum of currencies. Crypto and equity portfolio values use available quantities consistently across modules. Analytics also reports the fiat sum converted to USD. A transfer is a movement/reservation, not investment performance. Earlier chart points, return percentages and risk histories remain labeled demo history; current account endpoints are real projections of this demo journal. Loan liabilities and loan origination previews remain their separate domain.

The Currencies account list renders canonical accounts directly. Local add/delete buttons were removed because they previously created/deleted display copies, including funded accounts, without changing any ledger. Account opening/closure needs a real account lifecycle command. Stock funding now uses the same deposit/withdrawal command as Overview. P2P opens Transfers with recipient/amount prefilled for fee review; it no longer reports success after a timer.

## Persistence and migration

`sessionStorage[mbank_wallet_v1:<encoded normalized email>]` contains the customer journal. Legacy Overview/Transfers journals merge chronologically on first load. Existing whole-share transfer events remain replayable after fractional stock support.

If the old `localStorage.mbank_markets_v1` contains a customer's trading wallet/orders, migration appends one `trading_migration` event. It imports execution deltas relative to the former trading opening wallet, preserves orders/cost basis and reinstates pending reservations. It never adds the old independent opening cash/positions on top of the canonical opening accounts. Conflicting history (including negative combined balances or unsupported changed assets) blocks visibly and preserves original storage. Old keys remain migration inputs/backups; later customer mutations never write balances back to them.

Persistence lasts for the tab session. Other tabs retain independent demo journals. Catalog/routing changes continue to come from bank operations, but customer execution liquidity is scoped to its journal. Administrator order processing and cancellation also read and settle canonical customer orders through the owner journal. A bulk process commits each customer independently; it is not one transaction across customers. Automatic/background matching and institution-wide pool accounting belong in the shared service. This project does not claim browser storage is a production banking ledger.

## Go integration boundary

Keep the existing authenticated Overview and Transfers HTTP adapters on `NEXT_PUBLIC_TRANSFERS_API_URL`. They must project the same server ledger. When HTTP mode is selected, local trading/exchange explicitly refuses to run rather than silently creating another demo balance. A server wallet/trading adapter is still required before enabling those screens in HTTP mode.

Recommended common API:

- `GET /v1/me/wallet`: schema version, revision, as-of, accounts (available, reserved, price as decimal strings), positions/cost basis and orders.
- `POST /v1/me/wallet/commands`: typed deposit/withdrawal, trade, exchange and cancellation commands with `Idempotency-Key` and expected wallet/quote revision; returns the committed wallet projection.
- Existing `GET /v1/me/overview` and `/v1/me/transfers` are read models of those accounts.
- `GET /v1/markets`: versioned instrument catalog, rates and routing. Server quotes bind the catalog version, fees, expiry and settlement currency.

Authenticate the customer on the server; never trust actor/email sent by the browser. In one database transaction lock affected accounts, check availability/holds/risk, post balanced ledger entries including fee revenue/FX settlement, update reservations and order state, save the idempotency result and append an outbox event. Match pending orders and bank operational actions through this same transaction boundary. Publish revisioned events so all views refresh from the server. HTTP errors must never fall back to mock funds.

## Verification

`npm run test:wallet` verifies cross-module trading/transfer reservations, cancellation isolation, fractional custody, buy/sell/FX/two-leg settlement, idempotency, customer isolation, migration, storage failure and historical quote prices. The Overview, Transfers and Markets suites also remain relevant.
