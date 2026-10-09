# Admin referrals

Route: `/dashboard/admin/marketing` (existing Referrals navigation item).
Read-only report: invitations, registered users, qualified referrals, paid/pending/held rewards, ranking, cohort charts and drill-down to referred customers. No campaign editing, eligibility decisions or reward payouts are executed.

`ReferralReport` in `app/lib/types/admin/referrals.ts` is the JSON contract: snake_case keys, RFC3339 UTC timestamps, explicit nulls for missing registration/qualification dates, EUR integer minor units, string status enums. The mock campaign grants an illustrative EUR 25 to the referrer per qualified referral. Additional identities use `DEMO-` prefixes and `example.test` emails. Existing Users fixtures identify the first four referrers; their historical referral attribution does not imply current account eligibility.

`ReferralsRepository.getReport()` is the backend boundary. Replace `mockReferralsRepository` with an authenticated read-only `GET /v1/admin/referrals/report` Go API. The production endpoint should authorize administrators, apply search/status/invitation-period filters, paginate the leaderboard and individual referrals, and compute aggregate statistics over the entire filtered scope. Never aggregate only the visible page. Derive the snapshot timestamp from the server. Rewards are reporting fields, not payout instructions.

Ranking defaults to registered users, with qualification count and invitation count as tie breakers. Alternative rankings use qualified count or qualified/invited percentage. Unregistered invitations have no invitee ID. SIGNED_UP, KYC_PENDING, QUALIFIED and rejected records with a registration timestamp count as registered. Qualification means the fixture campaign's KYC and activity requirements were met; it is separate from registration and from payout status.

The period filters by `invited_at`, inclusive through `as_of`. Metrics, charts, tables and drill-down use the same cohort and filters. Qualified percentage uses scoped invitations as its denominator; choosing a status filter changes this denominator. Cohort charts group invitations by invitation date and show current outcomes, not the timing of registration events. Daily buckets cover 30 days; weekly buckets cover longer periods, including zero activity. The final bucket can be partial. This is not a historical conversion forecast.

Custom `scrollbar-thin`, 360px table regions, sticky headers and mobile cards keep the report compact. Dates display in Europe/Bucharest. Refresh reloads the fixed demo snapshot and uses the existing global notifications. `npm run test:referrals` verifies cohort boundaries, attribution, ranking, rewards and repository isolation.
