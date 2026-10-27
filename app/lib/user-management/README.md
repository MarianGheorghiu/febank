# User Management

Admin route: `/dashboard/admin/users`. Four operator areas: Users & profiles, Verification reviews, Access & security, History & reports. Profiles have identity, access/KYC, observed accounts/products, sessions, internal notes and an audit trail. Directory filters affect directory/export scope; top metrics use the complete registry.

## Shared data and effects

`mbank_user_registry_v1` is the demo's canonical identity/access registry. Legacy directory fixtures seed identity fields; old scalar `balance` and clearance numbers are not treated as ledger truth. Missing demo identities observed through Cards, Subscriptions, wallets or sign-in are provisioned once, preserving administrative edits. Synthetic subscription customers are explicitly demo identities. Existing IDs and normalized sign-in emails remain stable. Contact email and address changes never migrate wallet ownership or alter historical delivery records.

- Role/status, KYC, risk classification, PEP review, profile edits, notes, recovery requests and session revocations persist with their audit event in one JSON write. Commands require an active admin, reason, expected revision and actor-bound idempotency key. Stale commands cannot overwrite newer data; failed/corrupt storage is preserved and blocks mutation/execution.
- Account blocking rejects sign-in and new shared-wallet payments, deposits, trading, rewards and credit commands. KYC must be verified for these customer financial commands. Role/status changes revoke recorded sessions. Historical journal replay, refunds and cancellation are preserved. Market fills also check current user eligibility. Existing Risk Control restrictions are independent and are not cleared by reactivating a user.
- Cards project customer names, account status, verification and current address from the registry. New issuance/customer controls and detail reveal check eligibility. Changing an address does not rewrite an already-dispatched card's address.
- Subscription customer labels/eligibility use the registry, including new customer IDs. Existing contracts and invoice history are not deleted by blocking a user.
- Settings project identity and MFA enrollment from shared data. Settings and Admin session revocation use the same registry transaction; customer preference versions combine settings version and identity version. Newly registered current sessions have no invented IP/location. Example mobile sessions are illustrative fixtures. This is browser-level simulation, not an authentication/token server.
- UserProvider observes same-tab registry events and cross-tab storage events. Blocked/revoked sessions lose their UI access. Actual authorization, token revocation, least-privilege staff permissions, verification evidence and recovery delivery must be enforced by the Go identity service. Demo suffix-based admin provisioning is not a production authentication mechanism.
- Password/MFA recovery operations record pending requests only; they neither set passwords nor disable enrollment. The console does not display passwords, authentication secrets, full payment-card numbers or government identifiers. Internal notes are append-only in the UI. Personal profile data is intentionally available to authorized administrators.
- The last active admin and the current operator's own administrator access are protected. New profiles start as CLIENT / ACTIVE / IN_REVIEW, without fabricated login credentials or email delivery.

Financial detail reads the canonical wallet only when observed; otherwise it reports unavailable wallet data rather than inventing a balance. Values are decimal USD strings and indicative shared-price valuations. User profiles cannot overwrite booked money. Product histories and risk cases are linked by stable identity; separate modules own their commands.

## Go contract

Set `NEXT_PUBLIC_USER_MANAGEMENT_MODE=http` and optional `NEXT_PUBLIC_USER_MANAGEMENT_API_URL`. Unknown modes, invalid responses and HTTP errors fail; there is no fallback to fixtures.

- `GET /v1/admin/users` → `UserRegistrySnapshot` with `mode: http`, authoritative revision, UTC RFC3339 `as_of`, profiles, session metadata and permitted audit records. Production should paginate large directories and apply filters on the server; this mock's bounded directory filters locally.
- `GET /v1/admin/users/{id}` → `UserDetail`: observed financial summary, masked cards, subscriptions and risk references. Reads are scoped to that user; unavailable dependencies should be reported explicitly, not converted into zero balances.
- `POST /v1/admin/users/commands` with `Idempotency-Key` → updated authoritative snapshot. Discriminated `UserCommand` DTOs are in `contracts.ts`. Expected revision, reason and exact field allowlists protect updates. Identity, permissions and audit actor come from the authenticated server session, never trusted client fields. Enforce command validation in Go, use a database transaction/outbox, return 409 on conflicts, and persist idempotency receipts atomically.

Credential/sign-in email migrations need verified workflows and immutable subject IDs throughout every backend service; no client-side rename of email-keyed wallet journals is attempted. Recovery commands should create durable identity-service work and expose its pending/completed/declined lifecycle. Production role changes and high-impact verification decisions should follow the institution's required authorization/approval policies.

CSV exports filtered directory fields with spreadsheet-formula neutralization. JSON exports selected profiles, notes, sessions and user audit history. Export is recorded before file preparation; audit failure blocks download. No scheduled/background exports or external transmissions occur.
