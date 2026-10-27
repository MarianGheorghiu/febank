# Rates & Fee Engine

`/dashboard/admin/rates` uses a shared versioned pricing registry. The UI reuses PageHeader, CardSurface, MetricCard, ActionButton, OptionSelect and native review dialogs from the refreshed dashboard.

## Boundaries

- `contracts.ts`: transport DTOs, integer USD cents, integer basis points, RFC3339 UTC timestamps.
- `engine.ts`: pure validation, progressive pricing, proposal / independent approval / rejection, optimistic revisions and idempotency.
- `repository.ts`: demo persistence or authenticated HTTP transport. HTTP never falls back to local defaults.
- `execution.ts`: new-execution adapters, active subscription tier resolution and quote-version fingerprints.
- `seed.ts`: labeled synthetic published / rejected releases and their corresponding audit events.
- `impact.ts`: a fixed 126-transaction basket. It is an illustration of pricing changes, not realized bank revenue or a forecast.
- `openapi.json`: Go implementation contract.

## Calculation

All operations have exactly one explicit policy; duplicate operation scopes are rejected. Releases and audit history provide search, status/action filters, eight records per page and bounded scroll regions.

The seven supported operations are bank transfers, internal transfers, crypto withdrawals, stock custody transfers, crypto trades, stock trades and fiat FX.

1. Value the transaction in USD cents. Transfer principal keeps its native asset precision; a positive transfer below one USD cent is valued at one cent for minimum-fee calculation.
2. Compute the variable charge. With brackets, each rate applies progressively to its interval of this transaction's USD value; these are not monthly-volume tiers. Round the combined variable charge upward to cents.
3. Add the fixed fee and subtract the plan discount on variable + fixed. Round discounts down to cents.
4. Add the configured spread and weekend charge, each rounded upward.
5. Apply minimum / maximum to the combined total. A zero notional yields zero; paused operations reject new quotes.

Weekend means Saturday / Sunday UTC. Subscription discounts follow the shared subscription registry; only ACTIVE membership qualifies. Unassigned, canceled, suspended or past-due memberships use STANDARD. This module does not collect subscription invoices or network-provider costs.

Transfer fees debit the USD account, separately from non-USD principal. Trading adds fees to purchases and subtracts them from sales. Central spread is an explicit fee component, rather than the legacy catalog's per-side price markup. Fiat-to-fiat FX deducts the USD-equivalent fee from source proceeds before destination rounding. Reference FX values remain owned by the existing shared market catalog, not editable by the pricing module.

## Publication and history

Editing creates a whole-configuration proposal. Exactly one pending proposal is allowed. An administrator with a different email must approve or reject it. Publication atomically replaces the active policies and appends evidence within the same persisted snapshot. Restoring any published version creates another proposal; it never overwrites the active version directly. The initial before-state can also be restored through the release recovery control.

The demo writes to `mbank_rates_v1` in localStorage. This is browser-scoped demonstration state, not an authorization or immutable audit boundary. Audit records carry before/after state and are projected into global Audit Logs. Seed examples are marked DEMO; operator-created releases are marked LOCAL. Corrupt/full storage produces an explicit failure and preserves saved data.

Customer quote adapters use published policies. New reviews include pricing version, tier and UTC weekend context. Changed pricing invalidates outstanding reviews. Events capture pricing context in transfer quotes / trading catalogs, so replay of already booked operations does not reprice balances. Pending market orders use published pricing at processing time; cancellation/refunds remain available. Existing legacy events retain their original pricing behavior.

## Go integration

Default: `NEXT_PUBLIC_RATES_MODE=demo`.

For a service set `NEXT_PUBLIC_RATES_MODE=http` and optionally `NEXT_PUBLIC_RATES_API_URL`. The repository calls:

- `GET /v1/admin/rates`
- `POST /v1/admin/rates/commands` with `Idempotency-Key`, `expected_revision`, action and reason.

Both use authenticated cookies, `cache: no-store`, and JSON responses conforming to RatesSnapshot. Error envelope: `{ "error": { "code": "REVISION_CONFLICT", "message": "Refresh and review again." } }`.

The Go service must derive the actor and role from the authenticated session, enforce maker/checker, validate DTOs and arithmetic limits, and commit active configuration, release decision, idempotency record and audit in one database transaction. Concurrent commands require compare-and-swap on the registry revision. Prefer serializable transactions / row locking, and check the pricing version again when committing financial quotes. Idempotency must bind actor, command and key; only identical retries succeed.

Live customer quote/execution services must apply these policies server-side using exact decimal / integer arithmetic and return authoritative fee breakdowns. Set the existing customer modules to their HTTP adapters when moving to live pricing. Local financial execution intentionally rejects HTTP rates mode to prevent mixing a live admin configuration with demo customer pricing.

## Checks

`npm run test:rates` covers rounding, progressive brackets, bounds, plan discounts, validation, independent approval, stale revisions, retries, publication impact, quote invalidation, replay stability, pause, unavailable storage and the Go HTTP boundary. Existing transfer, currency, stock, crypto, markets, transaction and audit suites cover shared-wallet compatibility.
