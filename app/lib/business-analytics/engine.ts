import { ACQUISITION_CHANNELS, BUSINESS_PRODUCTS, type BusinessAnalyticsFilters, type BusinessAnalyticsReport, type BusinessDay } from "@/app/lib/types/admin/business-analytics";
const DAY = 86400000;
const dayTime = (date: string) => Date.parse(`${date}T00:00:00Z`);
export const businessMoney = (minor: number, compact = false) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", ...(compact ? { notation: "compact" as const, maximumFractionDigits: 1 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }).format(minor / 100);
export const businessNumber = (value: number) => new Intl.NumberFormat("en-GB").format(value);
export const ratio = (numerator: number, denominator: number) => denominator > 0 ? numerator / denominator * 100 : null;
export function rangeFilters(report: BusinessAnalyticsReport, days: number, segment: BusinessAnalyticsFilters["segment"] = "ALL"): BusinessAnalyticsFilters {
  return { from: new Date(dayTime(report.complete_through) - (days - 1) * DAY).toISOString().slice(0, 10), to: report.complete_through, segment };
}
export function validateBusinessFilters(report: BusinessAnalyticsReport, filters: BusinessAnalyticsFilters): string | null {
  const from = dayTime(filters.from), to = dayTime(filters.to);
  if (!["ALL", "RETAIL", "BUSINESS"].includes(filters.segment) || !/^\d{4}-\d{2}-\d{2}$/.test(filters.from) || !/^\d{4}-\d{2}-\d{2}$/.test(filters.to) || !Number.isFinite(from) || !Number.isFinite(to) || new Date(from).toISOString().slice(0, 10) !== filters.from || new Date(to).toISOString().slice(0, 10) !== filters.to) return "Choose valid UTC calendar dates and a customer segment.";
  if (to < from) return "The end date must be on or after the start date.";
  if ((to - from) / DAY + 1 > 90) return "Select up to 90 days for a readable report and equal-length comparison.";
  const earliest = rangeFilters(report, 90).from;
  if (filters.from < earliest || filters.to > report.complete_through) return `Choose dates between ${earliest} and ${report.complete_through}; incomplete days are excluded.`;
  return null;
}
const sum = <T,>(rows: T[], read: (row: T) => number) => rows.reduce((total, row) => total + read(row), 0);
const snapshotKeys = ["registered_customers", "verified_customers", "funded_customers", "active_customers_30d", "paying_subscriptions", "client_deposits_minor", "liquid_assets_minor", "loan_book_minor", "nonperforming_loans_minor", "other_assets_minor", "other_liabilities_minor", "equity_minor"] as const;
export function businessPeriod(report: BusinessAnalyticsReport, filters: BusinessAnalyticsFilters) {
  const matches = (r: { date: string; segment: string }) => r.date >= filters.from && r.date <= filters.to && (filters.segment === "ALL" || r.segment === filters.segment);
  const products = report.products.filter(matches), days = report.days.filter(matches), cohorts = report.cohorts.filter(matches);
  const snapshotAt = (date: string) => {
    const rows = report.days.filter(r => r.date === date && (filters.segment === "ALL" || r.segment === filters.segment));
    return Object.fromEntries(snapshotKeys.map(key => [key, sum(rows, r => r[key])])) as Pick<BusinessDay, typeof snapshotKeys[number]>;
  };
  const snapshot = snapshotAt(filters.to);
  const opening = snapshotAt(new Date(dayTime(filters.from) - DAY).toISOString().slice(0, 10));
  const netRevenue = sum(products, r => r.gross_revenue_minor - r.refunds_minor);
  const directCosts = sum(products, r => r.direct_cost_minor);
  const costs = { direct: directCosts, payroll: sum(days, r => r.payroll_minor), infrastructure: sum(days, r => r.infrastructure_minor), compliance: sum(days, r => r.compliance_minor), acquisition: sum(days, r => r.acquisition_minor), provisions: sum(days, r => r.credit_provision_minor) };
  const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
  const completed = sum(products, r => r.completed_operations), failed = sum(products, r => r.failed_operations), pending = sum(products, r => r.pending_operations);
  const registered = sum(cohorts, r => r.registered), verified = sum(cohorts, r => r.verified), funded = sum(cohorts, r => r.funded), active = sum(cohorts, r => r.active);
  return {
    netRevenue, grossRevenue: sum(products, r => r.gross_revenue_minor), refunds: sum(products, r => r.refunds_minor), directCosts, costs, totalCosts, operatingResult: netRevenue - totalCosts,
    operatingMargin: ratio(netRevenue - totalCosts, netRevenue), costIncome: ratio(totalCosts, netRevenue), settledVolume: sum(products, r => r.settled_volume_minor), completed, failed, pending, successRate: ratio(completed, completed + failed + pending),
    inflow: sum(days, r => r.external_inflow_minor), outflow: sum(days, r => r.external_outflow_minor), snapshot, opening,
    registered, verified, funded, active, fundedRate: ratio(funded, registered), acquisitionCost: funded ? costs.acquisition / funded : null,
    products: BUSINESS_PRODUCTS.map(product => { const rows = products.filter(r => r.product === product); const revenue = sum(rows, r => r.gross_revenue_minor - r.refunds_minor); const cost = sum(rows, r => r.direct_cost_minor); return { product, revenue, refunds: sum(rows, r => r.refunds_minor), directCost: cost, contribution: revenue - cost, margin: ratio(revenue - cost, revenue), volume: sum(rows, r => r.settled_volume_minor), completed: sum(rows, r => r.completed_operations), failed: sum(rows, r => r.failed_operations), pending: sum(rows, r => r.pending_operations) }; }).sort((a, b) => b.contribution - a.contribution),
    channels: ACQUISITION_CHANNELS.map(channel => { const rows = cohorts.filter(r => r.channel === channel); const joined = sum(rows, r => r.registered), funded = sum(rows, r => r.funded), spend = sum(rows, r => r.acquisition_spend_minor); return { channel, registered: joined, verified: sum(rows, r => r.verified), funded, active: sum(rows, r => r.active), spend, conversion: ratio(funded, joined), costPerFunded: funded ? spend / funded : null }; }),
  };
}
// A complete report includes explicit zero rows, not missing categories or dates.
function assertBusinessCoverage(report: BusinessAnalyticsReport, filters: BusinessAnalyticsFilters, previousFrom: string) {
  if (report.schema_version !== 1 || report.reporting_currency !== "EUR") throw new Error("Unsupported reporting schema or currency.");
  const segments = filters.segment === "ALL" ? ["RETAIL", "BUSINESS"] : [filters.segment];
  const openingDate = new Date(dayTime(previousFrom) - DAY).toISOString().slice(0, 10);
  const applies = (r: { date: string; segment: string }) => r.date >= openingDate && r.date <= filters.to && (filters.segment === "ALL" || r.segment === filters.segment);
  const days = report.days.filter(applies);
  const products = report.products.filter(r => applies(r) && r.date >= previousFrom);
  const cohorts = report.cohorts.filter(r => applies(r) && r.date >= previousFrom);
  const safe = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  const dayNumbers = [...snapshotKeys, "payroll_minor", "infrastructure_minor", "compliance_minor", "acquisition_minor", "credit_provision_minor", "external_inflow_minor", "external_outflow_minor"] as const;
  const productNumbers = ["gross_revenue_minor", "refunds_minor", "direct_cost_minor", "settled_volume_minor", "completed_operations", "failed_operations", "pending_operations"] as const;
  if (days.some(r => !segments.includes(r.segment) || dayNumbers.some(k => !safe(r[k]))) || products.some(r => !segments.includes(r.segment) || !BUSINESS_PRODUCTS.includes(r.product) || productNumbers.some(k => !safe(r[k]))) || cohorts.some(r => !segments.includes(r.segment) || !ACQUISITION_CHANNELS.includes(r.channel) || [r.registered, r.verified, r.funded, r.active, r.acquisition_spend_minor].some(n => !safe(n)) || r.verified > r.registered || r.funded > r.verified || r.active > r.funded)) throw new Error("Reporting data contains invalid amounts, populations or categories. No totals are shown.");
  const daySet = new Set(days.map(r => `${r.date}:${r.segment}`));
  const productSet = new Set(products.map(r => `${r.date}:${r.segment}:${r.product}`));
  const cohortSet = new Set(cohorts.map(r => `${r.date}:${r.segment}:${r.channel}`));
  if (daySet.size !== days.length || productSet.size !== products.length || cohortSet.size !== cohorts.length) throw new Error("Duplicate reporting rows detected. No totals are shown.");
  for (let time = dayTime(openingDate); time <= dayTime(filters.to); time += DAY) {
    const date = new Date(time).toISOString().slice(0, 10);
    for (const segment of segments) {
      if (!daySet.has(`${date}:${segment}`) || (date >= previousFrom && (BUSINESS_PRODUCTS.some(p => !productSet.has(`${date}:${segment}:${p}`)) || ACQUISITION_CHANNELS.some(c => !cohortSet.has(`${date}:${segment}:${c}`))))) throw new Error("Reporting coverage is incomplete for this scope or comparison. Refresh the report; missing rows are not treated as zero.");
    }
  }
}
export function businessAnalytics(report: BusinessAnalyticsReport, filters: BusinessAnalyticsFilters) {
  const error = validateBusinessFilters(report, filters);
  if (error) throw new Error(error);
  const count = (dayTime(filters.to) - dayTime(filters.from)) / DAY + 1;
  const previousTo = dayTime(filters.from) - DAY;
  const previousFilters = { ...filters, from: new Date(previousTo - (count - 1) * DAY).toISOString().slice(0, 10), to: new Date(previousTo).toISOString().slice(0, 10) };
  assertBusinessCoverage(report, filters, previousFilters.from);
  const current = businessPeriod(report, filters), previous = businessPeriod(report, previousFilters);
  const step = count > 31 ? 7 : 1;
  const trend = Array.from({ length: Math.ceil(count / step) }, (_, i) => {
    const from = new Date(dayTime(filters.from) + i * step * DAY).toISOString().slice(0, 10);
    const to = new Date(Math.min(dayTime(filters.to), dayTime(from) + (step - 1) * DAY)).toISOString().slice(0, 10);
    const period = businessPeriod(report, { ...filters, from, to });
    return { from, to, revenue: period.netRevenue / 100, costs: period.totalCosts / 100, result: period.operatingResult / 100, registered: period.registered, funded: period.funded, active30: period.snapshot.active_customers_30d, inflow: period.inflow / 100, outflow: period.outflow / 100 };
  });
  return { current, previous, previousFilters, trend, dayCount: count };
}
export type BusinessAnalysis = ReturnType<typeof businessAnalytics>;
export function businessReportCsv(analysis: BusinessAnalysis, filters: BusinessAnalyticsFilters, reportId: string, metadata?: { report_as_of: string; generated_at: string; generated_by: string; reason: string }) {
  const cell = (value: unknown) => { let text = String(value ?? ""); if (typeof value === "string" && /^\s*[=+@-]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
  const c = analysis.current;
  const rows: unknown[][] = [["Report", reportId], ["Currency", "EUR"], ["Report snapshot UTC", metadata?.report_as_of ?? ""], ["Generated UTC", metadata?.generated_at ?? ""], ["Generated by", metadata?.generated_by ?? ""], ["Purpose", metadata?.reason ?? ""], ["From UTC", filters.from], ["To UTC", filters.to], ["Segment", filters.segment], ["Comparison from", analysis.previousFilters.from], ["Comparison to", analysis.previousFilters.to], ["Basis", "Illustrative recognized income; minor units; not an audited statutory report"], [], ["Metric", "Current", "Previous", "Unit"], ...([ ["Gross recognized income", c.grossRevenue, analysis.previous.grossRevenue], ["Refunds and reversals", c.refunds, analysis.previous.refunds], ["Net recognized revenue", c.netRevenue, analysis.previous.netRevenue], ["Operating costs including provisions", c.totalCosts, analysis.previous.totalCosts], ["Operating result before tax", c.operatingResult, analysis.previous.operatingResult], ["Settled notional volume", c.settledVolume, analysis.previous.settledVolume], ["External inflow", c.inflow, analysis.previous.inflow], ["External outflow", c.outflow, analysis.previous.outflow], ["Closing client deposits", c.snapshot.client_deposits_minor, analysis.previous.snapshot.client_deposits_minor], ["Opening client deposits", c.opening.client_deposits_minor, analysis.previous.opening.client_deposits_minor] ] as const).map(r => [...r, "EUR minor"]), ...Object.keys(c.costs).map(key => { const k = key as keyof typeof c.costs; return [`Cost: ${key}`, c.costs[k], analysis.previous.costs[k], "EUR minor"]; }), ...snapshotKeys.map(key => [`Closing snapshot: ${key}`, c.snapshot[key], analysis.previous.snapshot[key], key.endsWith("_minor") ? "EUR minor" : "customers"]), ["Operating margin", c.operatingMargin, analysis.previous.operatingMargin, "%"], ["Cost / income including provisions", c.costIncome, analysis.previous.costIncome, "%"], ["Completion rate", c.successRate, analysis.previous.successRate, "%"], ["Completed operations", c.completed, analysis.previous.completed, "operations"], ["Failed operations", c.failed, analysis.previous.failed, "operations"], ["Pending operations", c.pending, analysis.previous.pending, "operations"], ["Acquisition spend per funded customer", c.acquisitionCost, analysis.previous.acquisitionCost, "EUR minor"], ["Active customers rolling 30d", c.snapshot.active_customers_30d, analysis.previous.snapshot.active_customers_30d, "customers"], ["Registered in cohort", c.registered, analysis.previous.registered, "customers"], ["Funded in cohort", c.funded, analysis.previous.funded, "customers"], [], ["Product", "Net revenue minor", "Direct cost minor", "Contribution minor", "Settled volume minor", "Completed", "Failed", "Pending"], ...c.products.map(p => [p.product, p.revenue, p.directCost, p.contribution, p.volume, p.completed, p.failed, p.pending]), [], ["Channel", "Registered", "Verified", "Funded", "Active", "Acquisition spend minor"], ...c.channels.map(ch => [ch.channel, ch.registered, ch.verified, ch.funded, ch.active, ch.spend]), [], ["Bucket from UTC", "Bucket to UTC", "Revenue EUR", "Costs EUR", "Operating result EUR", "Registrations", "Funded cohort", "Active rolling 30d", "Inflow EUR", "Outflow EUR"], ...analysis.trend.map(t => [t.from, t.to, t.revenue, t.costs, t.result, t.registered, t.funded, t.active30, t.inflow, t.outflow])];
  return rows.map(r => r.map(cell).join(",")).join("\r\n");
}
