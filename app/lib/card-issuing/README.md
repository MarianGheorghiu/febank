# Card Issuing admin workspace

Route: `/dashboard/admin/cards`. This module owns customer-card issuance and servicing, not bank trading inventory, customer wallet balances, raw PAN/CVV, PIN administration or processor settlement.

The workspace reuses the refreshed PageHeader, CardSurface, MetricCard, ActionButton and OptionSelect. Registry, fulfilment, cardholders and audit lists use eight records per page with bounded scroll. Customer selection searches names, emails and IDs with multi-word, accent-insensitive matching, explicit selection and keyboard support. The operation dialog closes on backdrop click or Escape unless saving.

## One shared card source

`app/lib/admin/mock-card-issuing-store.ts` remains the canonical demo registry used by admin, Cards Vault, Settings, User Management and global Audit Logs. No second card database was introduced. Registered customers from User Management are available to issue before they first open Cards Vault. Their account status, verification, name and address are resolved against that registry. Card issuance materializes any missing cardholder profile atomically with the new card and its audit event.

Admin-issued customers do not receive an extra active sample card when opening Cards Vault. Existing starter demo cards keep their legacy behavior and do not consume an issued-card slot. Closed or customer-hidden cards are retained in the administrative registry. New demo examples are merged into earlier browser data without overwriting existing cards or resetting operator changes; the merge version is persisted on the next successful card write.

## Operations

- ISSUE creates PENDING. Verified account required; physical cards require a delivery address.
- DISPATCH records tracking against the card's captured address; DELIVER records delivery. ACTIVATE remains a separate operation.
- FREEZE/UNFREEZE, permanent BLOCK, TERMINATE, REPLACE and UPDATE_CONTROLS retain the existing shared-domain transition rules.
- Replacement closes the original and creates one linked pending replacement in one write. It preserves limits and payment channels.
- Expiry occurs at the start of the month following MM/YY, in UTC. Expired cards cannot activate or unfreeze; they can be restricted, replaced or closed.
- Customer controls cannot exceed the operations ceiling, and a customer cannot undo an operations freeze. User Management restrictions prevent restoring payment access.
- EXPORT records the exact selected card IDs and generates a masked CSV only after the audit write succeeds.

Every admin command requires a reason, registry revision and Idempotency-Key. Card mutations additionally verify expectedVersion. A receipt binds key, actor and operation; identical retries do not issue/replace twice. Failed storage writes preserve the preceding registry and audit. Corrupt persisted data blocks reads/mutations rather than silently resetting customer cards. The browser implementation is demonstrative; localStorage is not a production authorization or cross-tab transaction boundary.

## Analytics and preflight

Charts use registry lifecycle counts and actual card creation dates. Usage and authorization limits remain separated by currency; no EUR/USD/RON totals are silently combined. Usage fields are the recorded demo processor snapshot, not a live processor feed.

The authorization sandbox is read-only. It checks card status, expiry, account/KYC, payment channel, international controls, recorded usage, available funding in the card currency and shared Risk Control restrictions. It does not initialize an unobserved wallet or debit/reserve funds. Missing funding evidence yields INCOMPLETE; absent ATM usage cannot produce an approval. Even ELIGIBLE is an indicative local preflight, not a network authorization. Sandbox execution is disabled in HTTP mode until a processor-backed preview is implemented.

## Backend boundary

- `contracts.ts`: admin UI snapshot/repository and discriminated commands.
- `response.ts`: transport validation and exact monetary decoding; rejects PAN/CVV/PIN fields.
- `repository.ts`: shared demo store or authenticated HTTP; no live-to-demo fallback.
- `engine.ts`: portfolio projections, pagination/search and pure authorization preflight.
- `openapi.json`: Go API contract.

Use `NEXT_PUBLIC_CARDS_MODE=demo|http`, falling back to the existing transfers mode. `NEXT_PUBLIC_CARDS_API_URL` falls back to `NEXT_PUBLIC_TRANSFERS_API_URL`.

HTTP endpoints:

- GET `/v1/admin/cards` → complete registry snapshot, cardholders, policy and audit.
- POST `/v1/admin/cards/commands` + Idempotency-Key → authoritative updated snapshot.

Requests use session credentials, JSON and no-store. Preserve supported camelCase card fields for compatibility with the existing domain; add expected_revision for the command boundary. Admin wire monetary values (limits, usage, policy limits/defaults) are exact decimal strings with two fractional digits. The adapter converts these into the established cent-precision card UI numbers. The older `/v1/me/cards` customer contract remains compatible; Go should normalize both facades onto integer minor currency units internally.

The service must derive the actor from the session, enforce admin authorization and CSRF/CORS protections, validate transition/eligibility and expected versions, invoke/reconcile issuer operations, and commit receipt, card changes and audit in a database transaction. Enforce policy caps across concurrent issuance. Return 401/403 for access, 409 for version/idempotency conflicts, 422 for invalid input and 503 for processor unavailability. Never return sensitive card details in this admin snapshot.

For large production registries, replace complete snapshots with server-filtered registry/audit pages and separate aggregate endpoints while preserving the repository boundary and bounded UI. The current complete-snapshot contract supports the requested local prototype; the future Go processor must own authorization counters, holds, settlement, reversals and durable audit evidence.

## Verification

`npm run test:card-issuing`, `npm run test:cards`, `npm run test:issuing-workspace` cover lifecycle, delivery, ownership, limits, replacement, concurrency, idempotency, global identity/card linkage, wallet preservation, expiry, authorization checks, exact HTTP amounts, export scope and pagination with 127 records.
