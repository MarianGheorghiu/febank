# Premium Offers / Go integration

Route: `/dashboard/offers`. Three workspaces keep the flow readable: **Offers**, **Travel & experiences**, **Rewards & activity**. Header actions match Currencies/Loans dimensions. All money uses `$`, all points use `pts`. Cards use shared `CardSurface`, `MetricCard`, `ActionButton`, `PageHeader`, `CardSelect`, pagination/search and the accessible native dialog/mobile sheet. Heights follow content; matched grid rows keep related cards aligned. Selectable rewards have hover, selected, disabled and keyboard-focus states with reduced-motion support.

## Audit and replacement

| Previous implementation | Replacement |
| --- | --- |
| Page-local mutable points | Exact, customer-scoped points lots and immutable transaction history inside the canonical wallet journal. Reload does not reset points. |
| “Purge statement charges” | Cashback offer activation on an eligible owned card. This never erases transactions, spends points or invents a cashback payment. |
| Display-only lounge QR string | Explicit visit reservation with a one-hour expiry, quota, cancellation and a clearly marked demo pass reference. No fake QR or claim of provider entry. |
| Past VIP events with free refunds | Future dated experiences, points held for pending requests, one booking per event, availability and cancellation deadlines. Refunds use the original lots and cannot restore expired points. |
| Console concierge and timed fake dispatch | Persisted service requests, review/cancellation and visible status. No fabricated response or booking. |
| Simulated airport proximity / “AI match” | Search, membership eligibility, exact expiry dates and benefits that users can choose without granting location access. No predictive or location claim. |
| One-click unlock of high-yield assets | Specialist information requests. No self-granted suitability clearance and no fabricated 24–38% guaranteed yield. |
| Rounded integer crypto conversion with no wallet posting | Exact points-to-USD redemption credited to the common wallet, plus explicitly pending airline transfers. Crypto conversion was removed because it requires a real market quote and execution workflow. |
| Toast-only conversions and bookings | Reviewed commands, optimistic revisions, stable retry keys, history, expiry and cancellation. Errors do not masquerade as success. |

The five old components were removed. Historical fixture/type files remain for compatibility but are not used by the active module.

## Sources used for product patterns

These informed the flow, not MBank eligibility, rates or merchant partnerships:
- [Amex Offers FAQ](https://www.americanexpress.com/en-us/benefits/offers/): enroll before a qualifying purchase, use the enrolled card, show caps, expiry and individual conditions; reward settlement is separate from activation.
- [Revolut RevPoints](https://www.revolut.com/rev-points/): separate points balance and redemption options, including travel experiences and airline miles.
- [Revolut airline redemption help](https://help.revolut.com/en-AU/help/revpoints/what-is-revpoints/question-how-can-i-redeem-my-revpoints/): airline account belongs to the customer; conversion requires partner/account selection.

All offers, amounts, partners, conversion rates, visit allowances and events in `catalog.ts` are **illustrative demo data**. They are not live benefits or a claim that MBank has those partnerships. All dates/conditions must be maintained in the real service catalog.

## Global data and accounting

- `contracts.ts`: transport DTOs. Points are bounded safe JSON integers. Money is a plain two-place USD decimal string; accounting uses shared integer-cent helpers. Timestamps are RFC3339 UTC; experiences also specify IANA local time zones.
- `catalog.ts`: one shared, versioned offer/benefit/partner/policy catalog. UI does not import fixtures or carry exchange rates of its own. Production supplies it in the authenticated snapshot.
- `seed.ts`: opening demo points lots and actual fixture history. Opening available points: 345,200. Opening merchant cashback: $512, **already included in opening wallet cash**. Loading does not deposit it again. Points expiry is derived from remaining lots, not a decorative badge.
- `engine.ts`: pure validation, expiry, FIFO use, refunds, quota and state transitions. Cash conversion requires exact USD cents; no integer rounding into crypto. Unknown/disabled offers, wrong plans/cards, duplicate bookings, stale catalog versions, insufficient points, fractional points and missed deadlines are rejected before posting.
- `WalletState.rewards` lives in the same journal as cash, transfers, trading and credit. One `rewards` event atomically writes points, business state, USD credit and history. Storage/quota errors leave everything unchanged. Existing wallet journals replay from the new opening seed without duplicating prior money.
- Cash redemption appears as an incoming deposit in Overview and updates available cash in Wallet, Cards Vault, Transfers and trading. Seed merchant cashback stays distinct from cash redeemed from points, both in metrics and charts.
- Point lots are consumed in earliest-expiry order. Pending airline/experience requests spend available points and retain their exact lot allocations. Cancellation returns only allocations whose original expiry has not passed. Read projection computes expiry without silently mutating storage; the next command journals the settled expiry atomically.
- Lounge allowance is scoped to the policy year and membership tier. Used visits and active reservations consume allowance; cancelled/expired reservations do not. One active pass per customer. No new-year allowance is fabricated when the catalog has not rolled over.
- Saving an offer is independent of plan eligibility. Activation requires a live offer, included active membership, and an active owned USD card. Qualifying settlement, refunds and cashback awards are provider-owned events; there is no customer “claim cashback” button.
- Customer subscriptions are read from the existing global subscription store and matched by customer identity. Suspension affects new redemptions/benefits on the next refresh/command. For **unmapped demo identities only**, an explicitly labelled Demo Metal membership is provided. Production never falls back to this entitlement. Corrupt subscription storage blocks access rather than granting demo benefits.
- Airline membership input is masked in customer snapshots/history/CSV. Demo journal commands retain the typed input for idempotency, in session storage only. Production must protect the provider account identifier at rest and must verify the holder identity; the checkbox is not verification.

## API boundary

`repository.ts` supplies `getSnapshot` and `execute`, `response.ts` validates incoming payloads, and `openapi.json` defines the OpenAPI 3.1 contract.

```env
NEXT_PUBLIC_OFFERS_MODE=http
NEXT_PUBLIC_OFFERS_API_URL=https://api.example.test
NEXT_PUBLIC_TRANSFERS_MODE=http
NEXT_PUBLIC_TRANSFERS_API_URL=https://api.example.test
NEXT_PUBLIC_CARDS_MODE=http
```

Default is `demo`. Mixed remote/local money or card modes are rejected; HTTP failures never fall back to local money. Use the same authenticated ledger service for offers and wallet posting.

- `GET /v1/me/offers`: authenticated customer membership, owned eligible cards, versioned catalog, available points/lots, activations, bookings, transfers, passes, requests and rewards history.
- `POST /v1/me/offers/commands`: `OfferCommand` plus `Idempotency-Key`. Commands include the expected customer rewards revision and catalog version. The command semantically accepts the reviewed action and catalog terms version; record consent evidence in the server audit.
- Cookie credentials and `cache: no-store`; no customer email/ID or client-authored membership entitlement is sent in command data. Derive identity from the session.
- Errors: `{ "error": { "code": "VERSION_CONFLICT", "message": "Refresh and review the action again." } }`. Use 401/403 for access, 409 for revision/catalog/idempotency conflict, 422 for validation and 503 for service failure.

In Go, lock customer rewards/wallet rows and relevant benefit capacity, re-read current membership/card state and catalog terms, verify eligibility, reprice the redemption, allocate points, post balanced wallet ledger entries and reward history, persist idempotency and an outbox item in **one database transaction**. Repeat identical keys without posting again; reject changed payload. Never trust browser validation, membership, a stale card list, or the displayed capacity as authorization.

Book/airline transfer requests remain `pending` in demo. Real provider workers move them to processing/confirmed/completed or failed using verified idempotent callbacks. Failure must release the exact unexpired allocations once. Provider seat capacity must be atomically checked across all customers. Lounge usage is only marked `used` by a verified provider event. Official passes/QR credentials require the lounge provider. Concierge requests need a real service queue and notifications; research requests need a suitability workflow before any investment access. None of these external integrations are simulated as completed.

Use exact decimal/NUMERIC types for Go/SQL. Validate session/CSRF/origins, KYC/account restrictions, feature gates, plan entitlement, card ownership, merchant terms, spending caps, partner holder identity and reward-account consistency. No client command can mint points, award cashback, self-upgrade a plan, unlock investment access or declare a provider operation completed.

The frontend refreshes on wallet/card/storage/focus events and every minute while mounted, so time-sensitive passes/expiry stay current. Unavailable/corrupt data blocks operations. Pending dialog amounts bind to the captured revision/catalog and are rejected if stale.

## Charts and exports

`RewardChart` shows 3/6/12-month points earned/refunded versus used/reserved, or posted merchant cashback. It excludes future entries, separates expired points, and does not present redemption proceeds as newly earned cashback. Every chart has exact monthly text totals. There are no fabricated ROI or savings percentages.

CSV contains the current customer summary, rewards activity, activations, bookings, masked airline transfers and request statuses. It neutralizes spreadsheet formulas and never includes full airline membership numbers. It is a rewards report, not an official statement or ticket.

## Checks

`npm run test:offers` covers shared cash/Overview posting, persistence rollback, idempotency, customer isolation, membership/card/date checks, exact conversion, point-lot expiry/refunds, booking deadlines, transfer cancellation, lounge quota, requests, chart aggregates, safe CSV, shared subscription changes and the HTTP boundary. Related wallet/Overview/credit/cards/trading suites must also pass after journal changes.

Action feedback reuses the shared `OperationNotification` component: save/unsave, activation, cash redemption, airline transfers, bookings, lounge reservations, concierge/research requests, cancellations and report export. Errors use its error tone; form errors also remain inline so input can be corrected. There is no custom page-level success banner.
