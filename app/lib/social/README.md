# Friends & Social

The page uses `SocialRepository`; React components do not own persistence or fabricate successful operations. The demo adapter stores a versioned snapshot and idempotency receipts per customer in browser session storage. Reloading retains changes; another customer gets separate state. Unreadable storage is preserved and reported. Original mock contacts are only seed input. Presence in demo is simulated.

## Go API integration

Set `NEXT_PUBLIC_SOCIAL_MODE=http` and optionally `NEXT_PUBLIC_SOCIAL_API_URL=https://api.example.com`. Defaults inherit `NEXT_PUBLIC_TRANSFERS_MODE` and `NEXT_PUBLIC_TRANSFERS_API_URL` so a live wallet uses live social data. Unknown modes fail explicitly; HTTP failures never fall back to demo. Configure the transfer adapter in HTTP mode as well for live money movement.

- `GET /v1/me/social` → `SocialSnapshot` from `contracts.ts`.
- `POST /v1/me/social/commands` → updated `SocialSnapshot`, with a `SocialCommand` JSON body and required `Idempotency-Key` header.
- Errors: non-2xx with `{ "error": { "code": "conflict", "message": "Request already resolved" } }`.
- Requests include cookies with `credentials: include`, use `no-store`, and support cancellation for reads. A separate origin must allow the frontend origin, credentials, content type and idempotency headers. Protect mutation endpoints against CSRF and enforce origin checks server-side.

Commands: `invite`, `connection` (accept/decline/cancel), `mute`, `remove`, `request`, `split`, `cancel_request`, `decline_request`. Field names and discriminated payloads are defined in `contracts.ts`. Amounts are plain decimal strings in USD with at most two fractional places; responses use two places. Timestamps are UTC RFC3339. IDs are opaque strings, not UI row numbers. The response validator rejects malformed schema, amounts, destinations, duplicate IDs and dangling pending requests.

The authenticated session determines customer identity. The Go service must validate username existence, prevent self-invitations, enforce relationship permissions and rate limits, provide only authorized contact data, and source presence from its own session/presence service. Demo invitations remain sent until accepted by a future recipient service; they do not create fictional users. Demo accepted incoming invitations deliberately have no invented phone number. Users can provide a recipient phone for transfer review; the payment service must resolve and verify it authoritatively.

Apply commands and store idempotency receipts in one database transaction. Replaying the same key and payload returns the current snapshot without repeating side effects; reuse with a different payload returns a conflict. Prevent concurrent duplicate invitations and serialize conflicting updates. Only recipients can accept/decline incoming invitations and money requests; only senders can cancel outgoing requests. Muting changes social notifications, not payment processing. Removing a friend requires resolving all pending requests and retains historical financial records.

## Money movement and shared expenses

Send and Gift both use the existing `TransferRepository` quote → review → submit flow (`/v1/me/transfers/quotes`, `/v1/me/transfers`). They reserve funds in the shared wallet and appear in Transfers and Overview. Gifts attach a gift reference; they are monetary transfers, not vouchers. Fees, limits, balances and quote expiry are validated by the transfer engine in demo and must be authoritative in Go. Confirmation retries reuse the same idempotency key.

Request and Split record obligations only. Split includes the payer, divides integer cents, and assigns remainder cents deterministically with the payer first, followed by selected friends. Only friends’ shares become requests. Requests and totals are calculated from pending records. Incoming requests can be declined and outgoing requests cancelled; neither action changes a wallet balance. A general transfer does not automatically mark a request paid. Future payment reconciliation must link and settle a request atomically on the server when an associated transfer settles, rather than infer payment from a matching amount. The `paid` state is reserved for that server reconciliation.

Run `npm run test:social`, `npm run test:overview`, and `npm run test:transfers`. Domain tests cover cent allocation, lifecycle/ownership rules, retained history, customer isolation, corrupted storage, idempotent retries and the HTTP transport contract.

## Directory organization and scale

Friends, Invitations and Requests share one full-width workspace with section switching. Each section has a clearable search and explicit pagination (5, 10, 25 or 50 rows), including an editable page number for jumping through large result sets. Filtering, sorting and page-size changes reset the page; mutations clamp it to the remaining results. Only the visible page is rendered. Friend names and exact open-request totals are indexed once per snapshot in linear time, avoiding repeated scans of all requests for every contact.

Split Bill uses a searchable participant picker with five results per page, retained selections across searches/pages, selected-only filtering, removable selection chips, and the service's existing maximum of 50 friends per bill. Its allocation preview is also paginated. Searches match usernames and names without case or accent differences.

The current v1 transport still loads a whole social snapshot. Rendering and indexes support 10,000 contacts; an eventual Go deployment with larger datasets should provide server-side search/sort and cursor or page queries plus aggregate summaries instead of downloading the entire directory. Keep selections by opaque friend ID when changing that transport.

On laptop and desktop viewports, the directory fills the remaining dashboard height and only the table rows scroll; column headers stay pinned and pagination stays outside the scroll area. Very short landscape windows retain page scrolling so controls cannot become inaccessible. Phones use normal page scrolling, five rows by default, compact summary tiles and labelled filter/sort controls. A manual page-size choice is preserved across viewport changes. Search, filter, section and page changes reset table scrolling; opening row actions brings them into view.

All social dialogs share a mobile bottom sheet below 768px: bottom-anchored full width, rounded top corners, reduced-motion-aware entrance, fixed title/close area, internal content scrolling and a sticky action footer. Safe-area padding and VisualViewport resize/scroll listeners keep the sheet within the visible screen when a phone keyboard changes the viewport. Mobile opening focuses the title so the keyboard appears only when the user chooses a field. Desktop dialogs remain centered. Native dialog focus containment, Escape handling and focus restoration are retained. Header icon actions have explicit 44px square touch targets; responsive label visibility applies to the actual label wrapper so hidden text cannot offset the icon.
