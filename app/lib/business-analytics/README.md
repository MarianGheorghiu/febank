# Business Analytics admin

Route: `/dashboard/admin/analytics`. Three views (Overview, Financial performance, Customers & growth), with at most two charts visible at a time. Four headline metrics persist across views. Product details expand in-place; cash/balance reconciliation, acquisition economics and methodology use disclosure panels. Tables use 360px maximum height, sticky headers, `scrollbar-thin` and mobile cards.

## Reporting contract

`BusinessAnalyticsReport` uses snake_case JSON, EUR integer minor units, UTC date keys and RFC3339 report timestamps. The fixture has 182 complete days across disjoint RETAIL and BUSINESS populations, six products and four mutually exclusive acquisition channels. The snapshot is 9 Oct 2026 12:00 UTC; the last complete day is 8 Oct. Dates are explicit in the UI. Reporting amounts are booked EUR equivalents; no live FX valuation is performed.

This is an independent illustrative warehouse dataset, not an aggregation of the unrelated small local fixtures in Users, Subscriptions, Referrals or Transactions. It does not claim to be a live ledger, statutory P&L, audited financial statement or regulatory capital/liquidity report. The simplified balance sheet has no separate accumulated loss allowance or tax balance.

`BusinessAnalyticsRepository.getReport()` is the backend replacement boundary. Suggested Go endpoint: authenticated administrator-only `GET /v1/admin/business-analytics/report`, accepting inclusive UTC dates and customer segment. Production should return aggregates, current and preceding-period closing snapshots, attribution cohorts, coverage metadata and report generation status from a consistent warehouse/ledger cutoff. It should not send raw customer PII to this UI. Preserve explicit zero rows, uniqueness keys and booked valuation metadata. Current demo refresh clones the fixture; it does not fetch or mutate a real ledger.

The client validates dates and coverage for current/previous periods plus opening balances. Missing categories/dates, duplicate rows, malformed nonnegative minor units and invalid cohort subsets block display; missing rows are never treated as zero. A production API also needs server-side authorization, validation, query limits and durable export/access logging.

## Financial definitions

- Net recognized revenue = gross recognized income − refunds/reversals. Revenue recognition is separate from collection and from settled transaction notional.
- Product contribution = net revenue − directly attributable costs. Direct lending costs include funding interest. Contribution excludes shared overhead and credit provisions.
- Operating result = net revenue − direct costs − payroll − infrastructure − compliance − acquisition spend − credit provision expense. This is before tax; no net-profit claim is made.
- Operating margin and cost/income use net recognized revenue as denominator. Ratios with no denominator render N/A. Numeric losses remain signed in reports.
- Client deposits are liabilities. Opening deposits + external customer inflows − external outflows = closing deposits in this fixture. Internal transfers are excluded. This is customer funding movement, not the bank cash-flow statement; loan disbursement, funding and investment activity also affect bank cash.
- Liquid assets + gross loan book + other assets = client deposits + other liabilities + book equity. Nonperforming loan exposure is a stock, not a period loss. Liquid-assets/deposits and loans/deposits are descriptive management ratios, not LCR or regulatory capital ratios.
- Settled notional sums disjoint product operation cohorts, valued in booked EUR. Subscription recognition is not counted again as payment notional. Outcomes are the report snapshot status for operations initiated in the selected period; completion rate includes pending in the denominator.

## Customer definitions

Registered, verified, funded and paying-subscriber base counts are cumulative closing snapshots. Active customers are distinct customers with qualifying activity in the 30 days ending at that snapshot. Snapshots are never summed over days or added to overlapping populations. Segment populations are disjoint, so segment totals can be summed.

Acquisition cohorts use registration date and a single attributed channel. Verified/funded/active outcomes are evaluated at the report snapshot, not necessarily within the selected registration period. Cohort plots are not a history of daily funding events. The fixture outcomes are deterministic and illustrative. Campaign spend is attributed to the registration cohort; organic has zero attributed spend, not zero fully loaded cost. Spend/funded is not fully loaded CAC. Churn, retention and LTV are intentionally not fabricated from insufficient longitudinal data.

## Filters, comparison and reports

Default 30 complete days; 90 days or custom dates up to 90 days available. Custom dates stay within the latest 90 complete days, leaving coverage for an immediately preceding comparison of equal length and opening snapshots. Every view, chart, detail and export uses the same scope. Trend buckets are daily up to 31 days, weekly thereafter; final partial buckets are included. Stock KPIs compare closing snapshots, period KPIs compare period totals.

CSV and JSON export all views, comparisons and chart buckets. CSV distinguishes minor-unit source totals from EUR chart values; text cells are formula-neutralized while numeric negatives remain numeric. CSV includes report ID, actor, purpose, generated timestamp and cutoff. JSON includes the manifest and complete derived analysis. Exports require a reason and append `ANALYTICS / BUSINESS_REPORT_EXPORT_REQUESTED` to Audit Logs before initiating download. Failure to save that evidence blocks the download. A logged request does not attest that the browser completed a download.

Validation: `npm run test:business-analytics` covers accounting identities, deposit reconciliation, acquisition attribution, snapshots, segment additivity, comparison boundaries, zero denominators, negative results, coverage failure and report exports. TypeScript, ESLint and browser checks cover the UI integration.
