# Referrals workspace and Go handoff

Admin route: `/dashboard/admin/marketing`. Customer summary: Premium Offers → Rewards & activity.

The previous fixed report is now an operational shared registry. The workspace retains the original cohort and registered-customer ranking rules, adds searchable/paginated referral and reward ledgers, recorded invitations, reward holds/releases, payout requests, exact-scope CSV exports and audit evidence. Admin and customer views read the same demo journal. Invitations record attribution only: this frontend does not send email, award qualification or settle payments.

## Authorities and global effects

- `store.ts` strictly reads `mbank_referrals_v1`. Each command commits the report, original invitation terms, payout queue, idempotency receipt and audit event in one storage write. Failed or corrupt storage blocks operations without replacing saved data. Demo storage is shared across this browser; it is not a multi-device database and simultaneous tabs are not transactionally locked.
- User Management supplies current legal names, account status and KYC eligibility. Historical attribution and earned amounts are preserved when an account changes. Existing bank customers, self-referrals and duplicate invitee email attribution cannot receive new invitations.
- Risk Control restrictions exclude a referrer from new invitations and payout requests. Releases from hold do not themselves pay or waive account checks.
- Published production Flags & Config controls `referral_program`, audience/rollout, maintenance mode, `growth.referral_reward_minor` and `growth.referral_expiry_days`. Premium rollout uses the shared subscription tier. Unsupported business/internal audiences fail closed. Configuration publication emits the existing global config event.
- New invitations store their reward, qualification window and configuration revision. The review captures `expected_config_revision`; changing terms invalidates confirmation. Existing fixture invitations retain their historical EUR 25 terms, while new invitations use the published value (EUR 10 by default).
- `mbank:referrals-updated`, account/config/risk/subscription events, focus and cross-tab storage events refresh views. Audit Logs collects a dedicated REFERRALS source.
- The customer summary returns only that referrer's code, counts, program availability and reward totals. Holds and queued payouts appear in that customer's summary immediately. Rewards are EUR cash obligations, separate from loyalty points and USD wallet balances. No wallet credit is manufactured by a payout request.

## Operations and invariants

`INVITE` creates an unregistered attribution with zero earned reward. `HOLD_REWARD` moves an earned PENDING reward to HELD. `RELEASE_REWARD` moves HELD to PENDING. `REQUEST_PAYOUT` moves PENDING to QUEUED and creates one outbox-style request. QUEUED and PAID rewards cannot be changed through these commands. Reusing a request ID with the same actor/payload is idempotent; altered payload reuse, stale registry revisions, missing audit reasons and unauthorized actors are rejected. No command sets PAID or qualifies a customer.

Qualification and expiry processing require trusted onboarding/KYC/activity events in the backend. Settlement requires a payment worker, provider reconciliation and transactional wallet/treasury entries. Existing paid fixtures are explicitly illustrative history. Demo Operations audit includes labelled DEMO / SNAPSHOT evidence from the imported report; it is not presented as previously executed local commands. Existing operator evidence is preserved when adding demo examples.

## Transport

`createReferralsRepository(actor)` uses `NEXT_PUBLIC_REFERRALS_MODE=demo` by default. Set it to `http` and optionally set `NEXT_PUBLIC_REFERRALS_API_URL` to use the Go service. HTTP mode never reads local fixtures or falls back after an error.

- `GET /v1/admin/referrals` → `ReferralSnapshot`: `{schema_version:1,mode:"live",as_of,state,policy,eligible_referrer_ids}`.
- `POST /v1/admin/referrals/commands` → resulting `ReferralSnapshot`. Body: `{schema_version:1,command:ReferralCommand}`; `Idempotency-Key` equals `command.request_id`.
- `GET /v1/me/referrals` → `CustomerReferralSummary`, scoped by the authenticated session. No customer email or actor is sent in the URL or command body.

Requests use authenticated cookies and `cache: no-store`. `contracts.ts` defines exact snake_case DTOs: safe integer EUR minor units, RFC3339 UTC timestamps, string enums, explicit nulls. `parseReferralSnapshot` validates report relationships, lifecycle dates, money, queue consistency, audit journals and published policy fields. The response timestamp must equal the report timestamp. Customer summaries have a separate validator and never expose the admin registry.

Go must derive the actor from its authenticated session; recheck access, campaign revision, customer eligibility, risk restrictions and immutable attribution. Use a database transaction with unique normalized invitee email/code constraints, optimistic revisions, idempotency receipts, audit evidence and a transactional outbox. Return 403 for unauthorized access, 409 for stale revisions or request-key conflicts and 422 for invalid transitions. `EXPORT` validates exact IDs and saves audit evidence before download. Production volumes should move search, pagination and aggregation to the backend while keeping totals over the full filtered scope.

## Reporting semantics and design

The invitation period is inclusive through server `as_of`. Search covers referrer and invitee names, email, customer IDs, referral IDs and codes, with accent-insensitive multiword matching. Registered counts use registration timestamps, including registered customers later rejected. Qualification rate is qualified/scoped invitations; status filtering changes its denominator. Cohorts show current outcomes grouped by UTC invitation date, not historical outcome event dates. Daily buckets cover 30 days; longer periods use weekly buckets including zero-activity intervals. Dates display in Europe/Bucharest.

Portfolio filters apply to metrics, insights, charts and leaderboard. Referrer, reward-state and ledger searches refine registry/reward rows and exports. Operations audit has its own global-history search and is independent of portfolio filters. Leaderboard, records and audit are paginated; desktop tables have bounded scrolling and sticky operations columns, with mobile cards below the tablet breakpoint. All searches have clear controls; the Referrer selector always includes search. Dialogs reuse the Card Issuing customer picker and close on backdrop/Escape outside an active save. Active workspace buttons use the Audit Logs style.

Validation: `npm run test:referrals`, `npm run test:audit`, `npm run test:flags-config`, `npm run test:offers`, TypeScript and targeted ESLint.
