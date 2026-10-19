# User overview contract

`OverviewSnapshot` in `../types/dashboard.ts` is the JSON response contract; `MOCK_OVERVIEW` is its deterministic fixture. The UI receives snapshots through `OverviewRepository` and passes data to reusable cards, charts and lists. The repository now reads the shared wallet journal also used by Transfers, and selects its HTTP adapter when `NEXT_PUBLIC_TRANSFERS_MODE=http`. See `../wallet/README.md`. No backend or authentication security is implemented by this mock.

Suggested endpoints: `GET /v1/me/overview` and `POST /v1/me/overview/operations`, both returning the updated snapshot. Authentication must determine the customer on the server. Send the operation ID as an idempotency key; the backend must atomically check available balance and post the ledger entry. In HTTP mode the adapter calls these authenticated endpoints against `NEXT_PUBLIC_TRANSFERS_API_URL`. Go must use the same ledger as the transfer endpoints.

## JSON / Go mapping

- `schema_version`: integer (`int`), currently 1.
- `as_of`, `occurred_at`, history point `at`: RFC 3339 UTC timestamps (`time.Time`).
- Amounts, prices, quantities, comparison values and exchange rates: unformatted base-10 **strings** (`string` or a decimal type with string JSON encoding). No currency symbols, grouping separators, percentages or CSS classes in transport data.
- USD amounts allow at most two fractional digits. The mock performs balance arithmetic with integer cents using BigInt, never binary floating point. Go should use decimal arithmetic or validated integer minor units. BTC chart quantities support eight fractional digits. JPY is formatted without fractional digits in the UI.
- `monthly_change_percent` / `change_percent`: decimal strings in percentage points (`"4.2"` means 4.2%, not 420%).
- Position counts: integers. IDs, currency codes, enum values: strings. Nullable fields are omitted, not formatted sentinel text.
- `histories`: maps keyed by `crypto`, `stocks`, `expenses`, then `1W`, `1M`, `3M`, `6M`, `1Y`. Each period has a list of `{ "at": "2026-10-14T12:00:00Z", "value": "2.40500000" }` points and `comparison_value`.
- `transactions`: one unique list. Periods filter that list against `as_of`, using inclusive rolling day windows (30 days for 1M, 365 for 1Y), newest first. Histories remain a fixed mock snapshot after cash operations.

Example Go transaction DTO:

```go
type Transaction struct {
    ID         string    `json:"id"`
    Reference  string    `json:"reference"`
    Type       string    `json:"type"`
    Amount     string    `json:"amount"`
    Currency   string    `json:"currency"`
    Status     string    `json:"status"`
    OccurredAt time.Time `json:"occurred_at"`
}
type Operation struct {
    ID            string `json:"id"`
    Type          string `json:"type"`
    Amount        string `json:"amount"`
    RecipientName string `json:"recipient_name,omitempty"`
    RecipientKind string `json:"recipient_kind,omitempty"`
    Recipient     string `json:"recipient,omitempty"`
}
```

## Mock behavior

Deposit, withdrawal and transfer update the available USD balance, its currency account and the activity list. Validate positive exact-cent amounts, available balance, recipient name, IBAN checksum or international phone syntax. Deposits/withdrawals complete immediately in demo. The Transfer header action opens the full transfer workspace with a fee review. Transfers create pending fee-inclusive reservations using the same transfer service and can be cancelled in Transfers; no real funds move. A native dialog supplies focus containment, Escape handling and scroll locking.

The available balance metric represents the USD account, not an aggregated FX total. Portfolio changes derive from history values; expense changes compare the total to the previous period. Market prices are fictional snapshots. Currency metadata and all formatting stay in the presentation layer.

Operations are stored in `sessionStorage` under `mbank_wallet_v1:<encoded email>` and replayed through validation. Legacy Overview/Transfers journals migrate once. Persistence lasts for the browser-tab session. Corrupt records fail visibly without resetting balances; unavailable storage surfaces an operation error. Deposits are unrestricted mock funding; a real service needs a payment-provider workflow. Overview and Transfers share accounts and activity. Trading and exchange now settle through the same demo wallet journal. See `../wallet/README.md` for the common state, migration rules and remaining Go service boundary. Loan origination remains a separate demo workflow.

Run `npm run test:overview` for financial arithmetic, fixture consistency, filters, validation, idempotency, isolated persistence and corrupt-storage recovery.
