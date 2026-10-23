# Customer Settings & Security

`/dashboard/settings` replaces page-only state, a fictional identity, simulated protection switches and deletable/generated audit logs with a customer-scoped settings workspace. It reuses Overview surfaces, header actions, inputs, dialogs and the existing global `OperationNotification` component.

## Functional scope

- **Account**: actual signed-in identity from the shared Cards customer record, editable display name, verification/status/address, tracked requests for legal/contact changes. Display name changes update the sidebar and customer views; legal name, email identity and card delivery records are not edited by a nickname change.
- **Portfolio & display**: session timezone/date format, reduced motion, default Analytics period, default linked asset-chart period, default stock settlement currency, integer target cash/crypto/stock allocation totaling 100%.
- **Communications**: explicit optional-email consent per category, all off initially. Required notices, Message Center history and operation toasts cannot be disabled here. Demo saving does not send messages or register delivery channels.
- **Security & devices**: password/MFA/passkey flows, session lookup, current-device indicator, sign out other devices and view signed-out records. There are no fake quantum/retina/IP/insurance controls or arbitrary protection scores.
- **Activity & privacy**: tracked pending requests with cancellation, read-only settings history, full personal-data export request, account closure review showing canonical balances/credit/pending operations/linked businesses. Review does not close accounts, erase records, transfer money or settle credit. Header Export creates an actual local JSON settings report, separate from the requested personal-data package.
- Forms keep drafts when switching tabs. Save validates before persistence. All actions report through global notifications, including discard, save errors, cancellation, security-flow requests, export and manual refresh. Discard and Cancel actions are red.
- Responsive paired cards, intrinsic heights, mobile stacking, cyan hover/focus, keyboard tabs, accessible switches, dialogs and reduced motion.

## Shared integrations

`SettingsProvider` loads once under the authenticated user provider and publishes preferences via `PreferencesContext`. It refreshes on account settings, wallet/card events, storage changes and window focus. Out-of-order responses cannot replace a newer accepted mutation. Settings errors surface in the Settings page; other modules retain safe default preferences.

- `useUser()` overlays the saved display name for the matching authenticated identity. Authentication storage and email/role are unchanged by profile editing. Demo session restoration validates its shape and listens for cross-tab sign-out.
- `useSessionMetadata()` and Sidenav/PageHeader share the saved date/time presentation; the login time is fixed per document/session, not a live clock. HTTP settings use the server current-session ID/start time.
- `DashboardShell` applies reduced-motion CSS; shared financial chart hooks also disable animation. OS reduced motion always takes precedence.
- Analytics uses the default period on entry, the default asset chart period, and target allocation versus actual allocation in the existing portfolio chart/holdings flow.
- Stock order dialogs preselect the saved supported fiat settlement currency. Every order still requires review and explicit confirmation. No setting executes trades or changes balances.

## Demo data and persistence

`mbank_settings_v1:<encoded normalized customer email>` in localStorage stores one validated versioned settings document and bounded idempotency receipts. Wallet holdings, loan balances, identity/KYC and registered address are projected from existing common modules. No second copy of financial balances is written. Demo devices are labeled examples; unknown IP/location stays unknown. Their local revocation is not real server token revocation.

Demo security actions create tracked requests only: MFA status stays `unknown`, passkeys are not enrolled and passwords are never changed. No password, recovery code, authenticator seed or WebAuthn secret is collected or stored. The old password form pretending to save credentials was removed.

Commands are allowlisted; settings cannot accept roles, verification flags or hidden security/password fields. Target totals/ranges, enums, names, request lengths, CAS versions and identifiers are validated. Requests remain pending until a future service processes them. Duplicate open request kinds are rejected; only pending requests can be cancelled. Session revocation cannot revoke the current browser through an “other device” action. Audit rows are read-only, with no user purge action.

A write is validate → construct next state → one localStorage write → notification event. Failed writes leave the prior document intact. Corrupt storage is not silently reset. Idempotency rejects reusing a key with different content. The prototype keeps the latest 500 audit rows/receipts and up to 500 requests/100 sessions. This is not a production audit retention strategy or cross-tab database transaction.

## Future Go service

Set `NEXT_PUBLIC_SETTINGS_MODE=http` and `NEXT_PUBLIC_TRANSFERS_MODE=http`. `NEXT_PUBLIC_SETTINGS_API_URL` falls back to the transfers base URL; empty means same origin. No demo fallback on HTTP errors or invalid responses. Identity comes from the authenticated session, never an email/user ID in an API route/body.

- `GET /v1/me/settings`: validated consistent settings/identity/security/session read model.
- `POST /v1/me/settings/commands`: allowlisted `SettingsCommand`, `expected_version`, `Idempotency-Key`, resulting snapshot. Read model includes server-owned security and identity state.
- `POST /v1/me/settings/security-flows`: `{action, expected_version}` and idempotency key. Returns `{redirect_url, expires_at}` for an unexpired **same-origin** `/auth/secure/...` page. The browser navigates only after validating the response. No credentials are submitted to settings endpoints or an arbitrary external URL.

Use HTTP-only secure session cookies, CSRF/origin protection, authorization and recent step-up authentication for sensitive changes. Keep authentication secrets, credential verification, MFA enrollment/recovery, WebAuthn ceremonies and token revocation in the auth service. It must authorize/expire/complete flows, bind challenges to the signed-in session and apply status updates only on verified completion. A redirect or request creation is not successful enrollment.

Revoke refresh/access credentials server-side when signing out sessions; preserve the current session for “revoke others.” Session IP/location/device metadata comes from the service, not a browser's claim. The existing broader app auth scaffold is still demo authentication; implementing the production auth service is separate backend work.

Persist settings and consent with CAS/idempotency in one transaction. Derive verification/account status from KYC/customer records; legal/contact changes require verified processing and must propagate to identity and card delivery systems as appropriate. Process data access and closure requests asynchronously with secure delivery, eligibility checks, customer verification, outstanding obligations and the bank's retention policy. Do not erase financial audit records through this API. Operational logs should record changed field names and outcomes without secrets or unrestricted form bodies. Production history should be immutable and paginated, not browser-bounded.

`contracts.ts`, `engine.ts` and `openapi.json` define the frontend/service interface. `settingsReport()` uses an explicit export allowlist and does not export session tokens, cookies, credentials or challenge secrets.

## Validation

`npm run test:settings` covers enum/allocation validation, secret-field rejection, persistence/customer isolation, idempotency/version conflicts, failed writes/corrupt data, current-device protection, retained session history, request lifecycle, shared identity/wallet projection, secure redirects, authenticated HTTP scope/errors and export allowlisting. Existing wallet, cards, Analytics, stocks, offers and loans suites provide regression coverage.
