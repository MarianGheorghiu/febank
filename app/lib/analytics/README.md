# Customer Analytics

`/dashboard/analytics` is a read-only customer workspace. It uses the same wallet, account quantities, live demo market marks, reservations, credit, rewards and issuing registry as the other customer modules. It does not keep a second balance store.

## UX

- Overview surfaces, common metric cards, header actions, chart styles and operation notifications.
- Portfolio: assets, available fiat, investments, personal principal; portfolio chart; allocation; **holdings table beside its linked asset price chart**; personal loans; rewards; portfolio coverage; separate businesses.
- Clicking any holdings row selects its symbol, USD unit price chart, period, available/reserved quantities, owned USD value and known unrealized gain. Currency filters, search, pagination, row selection and allocation shortcuts stay connected. Empty search results never leave an unrelated asset chart visible.
- Cash flow & cards: received/sent/net cash movement, monthly comparison, separate financing/rewards/recorded fees, native-currency card spending and category breakdown.
- Activity: period-scoped canonical cash movements, asset transfers, investments, fiat exchanges, financing and reward cash postings, with search, category/status filters and pagination.
- CSV export includes current holdings, actual observed history, clearly separated illustrative trends, period activity, business balances and native card totals. It escapes spreadsheet formulas. Export success/failure uses `OperationNotification`.
- Desktop holdings/chart and the two bottom insight cards use paired CSS grids; tablet/mobile stack with local table scrolling. Hover/focus is cyan. No white Recharts cursors. Reduced motion is respected.

## Calculations and provenance

All accounting uses integer `bigint` cents and asset-specific precision. USD display strings have two decimal places; prices support eight. UI numbers are used for charts only.

- Gross personal assets include **available + reserved** balances, valued with the canonical market/FX mark. A reservation is still owned; it must not look like a loss.
- Personal principal is term loans plus drawn facilities. Net worth = gross personal assets - personal principal. It can be negative. Future interest, undrawn limits, points, potential cashback and company cash are not personal assets.
- Available cash is all available fiat balances valued in USD. Business cash/debt appears separately, never consolidated into personal net worth.
- Cost basis is shown only where recorded in `WalletTrading.cost_basis`. Unknown cost stays null. Unrealized gain and coverage include only known positions. No fabricated Sharpe, volatility, annual return or savings rate.
- Completed external fiat transfers and explicit deposit/withdrawal operations enter cash movement totals. Transfer `value_usd` is its stored quote valuation, including fees. Pending, rejected and cancelled transfers do not enter completed cash flows.
- Transfers of crypto/shares, trading, fiat exchanges, financing and rewards stay in separate activity categories. Internal conversions never create income. Crypto exchange executions are already represented by their order legs; fiat-to-fiat exchanges are projected from the journal.
- Recorded order fees are taken from filled orders. Transfer fees use the quote event's captured price when present; the legacy sample has a USD fee. No spreads, future interest, card fees, taxes or inferred costs are added.
- Historical cashback entries are already in the opening cash balance: Analytics displays them without posting them again. Cash redemption counts once, alongside its wallet credit. Offer save/activation preferences do not create money.
- Cards Vault activity is a separate illustrative demo ledger. It is **not replayed as wallet debits or added to cash-flow totals**. Completed, pending and reversed statuses are separated; currencies are never added without an FX valuation.
- Actual account history is daily end-of-observation snapshots replayed in journal order, plus the current marked snapshot; no values are invented for unobserved days. It is bounded to 400 observations. Current-day last observation wins.
- **Demo charts are populated intentionally** with deterministic daily illustrative price series for every holding, ending at the shared current mark. `demo_history` values today's holdings using those prices and today's personal principal; it is explicitly labeled as illustrative, not actual past balances or investment performance. It never changes balances or cost basis. USD/USD remains a constant 1. Real balance observations remain in the distinct `history` field and CSV section. HTTP mode rejects nonempty `demo_history`.
- Periods are rolling UTC calendar days inclusive of today (30/90/365) or all available. Current balance metrics remain current; period filters affect activity, cash flows, card spending, reward credits and portfolio history. Asset chart periods are independent.

## Go API

Set `NEXT_PUBLIC_ANALYTICS_MODE=http`, `NEXT_PUBLIC_TRANSFERS_MODE=http`, and `NEXT_PUBLIC_CARDS_MODE=http`. Configure `NEXT_PUBLIC_ANALYTICS_API_URL` (fallback: transfers API URL; empty means same origin).

`GET /v1/me/analytics?period=30D|90D|1Y|ALL`, authenticated via the existing HTTP-only session cookie, `credentials: include`, `cache: no-store`, abortable. No customer ID/email is supplied in the route: identity and scope come from the server session. No demo fallback on service errors. `contracts.ts`, `response.ts` and `openapi.json` define the read model.

The Go service should produce a consistent read snapshot from ledger postings, reservations, custody holdings, a versioned price/FX snapshot, credit principal and rewards postings. Card spending should use settled/authorized/reversed card ledger entries linked to the same transactions so it is not posted twice. Business authorization must come from memberships. Never trust demo business or card IDs as authorization.

Use decimal database types / integer minor units, not binary floats for accounting. Persist booked transfer valuation and fees; historical FX should not be recomputed using current prices. Persist actual historical holding balances, corporate actions, market closes, loan balances and cost lots before exposing true performance metrics. Production price histories should be actual quotes with timestamps; `demo_history` must be `[]`. Null cost means unknown, never zero. Add pagination/server aggregation when the ledger exceeds this prototype's bounded journal size. Apply tenant isolation, session authorization, no-store responses, origin/CORS controls and audit logging according to the existing bank backend policy.

The endpoint is read-only. Export is generated locally from the selected snapshot. Backend implementation, market data ingestion and real card settlement are future work; this change prepares the frontend contract and adapter.

## Checks

`npm run test:analytics` covers reservations, negative equity, known basis coverage, financing/rewards separation, UTC boundaries, actual observations versus demo series, native card totals, strict transport, authenticated HTTP errors and CSV escaping. Existing wallet/offers/loans/stocks tests remain relevant integration regressions.
