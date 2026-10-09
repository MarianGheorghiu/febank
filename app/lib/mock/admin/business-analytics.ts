import { ACQUISITION_CHANNELS, BUSINESS_PRODUCTS, BUSINESS_SEGMENTS, type BusinessAnalyticsReport, type BusinessDay } from "@/app/lib/types/admin/business-analytics";

export const BUSINESS_ANALYTICS_AS_OF = "2026-10-09T12:00:00.000Z";
const completeThrough = "2026-10-08";
const report: BusinessAnalyticsReport = { schema_version: 1, report_id: "BA-DEMO-20261009", as_of: BUSINESS_ANALYTICS_AS_OF, complete_through: completeThrough, reporting_currency: "EUR", days: [], products: [], cohorts: [] };
const end = Date.parse(`${completeThrough}T00:00:00Z`);
for (const [segmentIndex, segment] of BUSINESS_SEGMENTS.entries()) {
  let registered = segmentIndex ? 2400 : 18400;
  let verified = segmentIndex ? 2100 : 15900;
  let funded = segmentIndex ? 1650 : 12100;
  let deposits = segmentIndex ? 780000000 : 1260000000;
  for (let day = 0; day < 182; day++) {
    const date = new Date(end - (181 - day) * 86400000).toISOString().slice(0, 10);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const activity = weekday === 0 || weekday === 6 ? 0.72 : 1;
    const growth = 1 + day / 550;
    let cohortRegistered = 0, cohortVerified = 0, cohortFunded = 0, spend = 0;
    for (const [channelIndex, channel] of ACQUISITION_CHANNELS.entries()) {
      const count = Math.round((segmentIndex ? 3 : 13) * growth * activity + ((day * 7 + channelIndex * 5) % 9));
      const cohort = { date, segment, channel, registered: count, verified: Math.floor(count * (0.78 + channelIndex * 0.035)), funded: Math.floor(count * (0.48 + channelIndex * 0.045)), active: Math.floor(count * (0.35 + channelIndex * 0.04)), acquisition_spend_minor: channel === "ORGANIC" ? 0 : count * (channel === "PAID" ? 2650 : channel === "PARTNER" ? 1750 : 2500) };
      report.cohorts.push(cohort); cohortRegistered += cohort.registered; cohortVerified += cohort.verified; cohortFunded += cohort.funded; spend += cohort.acquisition_spend_minor;
    }
    registered += cohortRegistered; verified += cohortVerified; funded += cohortFunded;
    const externalIn = Math.round((segmentIndex ? 24000000 : 18500000) * growth * activity + (day % 7) * 110000);
    const externalOut = Math.round(externalIn * (0.78 + (day % 11) / 100));
    deposits += externalIn - externalOut;
    const liquid = Math.round(deposits * (segmentIndex ? 0.38 : 0.43));
    const loans = Math.round(deposits * (segmentIndex ? 0.82 : 0.74));
    const otherAssets = Math.round(deposits * 0.055);
    const equity = Math.round(deposits * 0.16);
    const snapshot: BusinessDay = { date, segment,
      payroll_minor: segmentIndex ? 78000 : 155000, infrastructure_minor: Math.round((segmentIndex ? 28000 : 72000) * growth), compliance_minor: segmentIndex ? 37000 : 51000, acquisition_minor: spend, credit_provision_minor: Math.round(loans * (0.000035 + day % 7 * 0.000002)),
      external_inflow_minor: externalIn, external_outflow_minor: externalOut,
      registered_customers: registered, verified_customers: verified, funded_customers: funded, active_customers_30d: Math.round(funded * (0.61 + (day % 17) / 1000)), paying_subscriptions: Math.round(funded * (segmentIndex ? 0.38 : 0.24)),
      client_deposits_minor: deposits, liquid_assets_minor: liquid, loan_book_minor: loans, nonperforming_loans_minor: Math.round(loans * (segmentIndex ? 0.021 : 0.016)), other_assets_minor: otherAssets, equity_minor: equity, other_liabilities_minor: liquid + loans + otherAssets - deposits - equity };
    report.days.push(snapshot);
    for (const [productIndex, product] of BUSINESS_PRODUCTS.entries()) {
      const baseRevenue = [255000, 195000, 320000, 225000, 390000, 175000][productIndex];
      const gross = Math.round(baseRevenue * (segmentIndex ? 0.67 : 1) * growth * activity + (day * 199 + productIndex * 1207) % 9500);
      const direct = Math.round(gross * [0.29, 0.37, 0.18, 0.31, 0.4, 0.09][productIndex]);
      const operations = Math.round([1600, 2400, 650, 420, 90, 250][productIndex] * growth * activity * (segmentIndex ? 0.23 : 1));
      // Disjoint operation cohorts, status at the report snapshot. Subscription billing has no settled payment notional here.
      const failureFactor = date >= "2026-09-18" && date <= "2026-09-21" && product === "CARDS" ? 0.065 : 0.012 + productIndex * 0.002;
      report.products.push({ date, segment, product, gross_revenue_minor: gross, refunds_minor: Math.round(gross * (product === "CARDS" ? 0.027 : 0.008)), direct_cost_minor: direct,
        settled_volume_minor: product === "SUBSCRIPTIONS" ? 0 : operations * [12500, 5500, 42000, 64000, 180000][productIndex], completed_operations: operations, failed_operations: Math.round(operations * failureFactor), pending_operations: Math.round(operations * 0.006) });
    }
  }
}
export const MOCK_BUSINESS_ANALYTICS = report;
