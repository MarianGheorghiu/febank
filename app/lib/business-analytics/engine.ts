import { ACQUISITION_CHANNELS, BUSINESS_PRODUCTS, type BusinessAnalyticsFilters, type BusinessAnalyticsReport, type BusinessDay } from "@/app/lib/types/admin/business-analytics";
const DAY = 86400000;
const dayTime = (date: string) => Date.parse(`${date}T00:00:00Z`);
export const businessMoney = (minor: number, compact = false) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", ...(compact ? { notation: "compact" as const, maximumFractionDigits: 1 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }).format(minor / 100);
export const businessNumber = (value: number) => new Intl.NumberFormat("en-GB").format(value);
export const ratio = (numerator: number, denominator: number) => Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0 ? numerator / denominator * 100 : null;
export function businessChange(current: number, previous: number) {
  return {absolute: current - previous, percent: previous === 0 ? null : (current - previous) / Math.abs(previous) * 100};
}
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
const sum = <T,>(rows: T[], read: (row: T) => number) => rows.reduce((total, row) => { const next = total + read(row); if (!Number.isSafeInteger(next)) throw new Error('Reporting totals exceed safe integer precision. No totals are shown.'); return next; }, 0);
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
  const totalCosts = sum(Object.values(costs), n => n);
  if (!Number.isSafeInteger(netRevenue - totalCosts)) throw new Error('Operating result exceeds safe integer precision.');
  const completed = sum(products, r => r.completed_operations), failed = sum(products, r => r.failed_operations), pending = sum(products, r => r.pending_operations);
  const registered = sum(cohorts, r => r.registered), verified = sum(cohorts, r => r.verified), funded = sum(cohorts, r => r.funded), active = sum(cohorts, r => r.active);
  return {
    netRevenue, grossRevenue: sum(products, r => r.gross_revenue_minor), refunds: sum(products, r => r.refunds_minor), directCosts, costs, totalCosts, operatingResult: netRevenue - totalCosts,
    operatingMargin: ratio(netRevenue - totalCosts, netRevenue), costIncome: ratio(totalCosts, netRevenue), settledVolume: sum(products, r => r.settled_volume_minor), completed, failed, pending, successRate: ratio(completed, completed + failed + pending),
    inflow: sum(days, r => r.external_inflow_minor), outflow: sum(days, r => r.external_outflow_minor), depositAdjustments: sum(days, r => r.deposit_adjustments_minor ?? 0), snapshot, opening,
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
  if (days.some(r => !segments.includes(r.segment) || dayNumbers.some(k => k === 'equity_minor' ? !Number.isSafeInteger(r[k]) : !safe(r[k]))) || products.some(r => !segments.includes(r.segment) || !BUSINESS_PRODUCTS.includes(r.product) || productNumbers.some(k => !safe(r[k]))) || cohorts.some(r => !segments.includes(r.segment) || !ACQUISITION_CHANNELS.includes(r.channel) || [r.registered, r.verified, r.funded, r.active, r.acquisition_spend_minor].some(n => !safe(n)) || r.verified > r.registered || r.funded > r.verified || r.active > r.funded)) throw new Error("Reporting data contains invalid amounts, populations or categories. No totals are shown.");
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
  const byDay = new Map(days.map(d => [`${d.date}:${d.segment}`, d]));
  for (const row of days) {
    if (row.verified_customers > row.registered_customers || row.funded_customers > row.verified_customers || row.active_customers_30d > row.funded_customers || row.paying_subscriptions > row.funded_customers || row.nonperforming_loans_minor > row.loan_book_minor) throw new Error('Customer or credit snapshot subsets do not reconcile.');
    if (sum([row.liquid_assets_minor, row.loan_book_minor, row.other_assets_minor], n => n) !== sum([row.client_deposits_minor, row.other_liabilities_minor, row.equity_minor], n => n)) throw new Error('Balance sheet does not reconcile. Assets must equal liabilities plus equity.');
    const previousDate = new Date(dayTime(row.date) - DAY).toISOString().slice(0, 10);
    const prior = byDay.get(`${previousDate}:${row.segment}`);
    if (row.deposit_adjustments_minor !== undefined && !Number.isSafeInteger(row.deposit_adjustments_minor)) throw new Error('Deposit ledger adjustments are invalid.');
    if (prior && BigInt(prior.client_deposits_minor) + BigInt(row.external_inflow_minor) - BigInt(row.external_outflow_minor) + BigInt(row.deposit_adjustments_minor ?? 0) !== BigInt(row.client_deposits_minor)) throw new Error('Deposit movement does not reconcile to closing customer liabilities.');
    if (row.date >= previousFrom && row.acquisition_minor !== sum(cohorts.filter(c => c.date === row.date && c.segment === row.segment), c => c.acquisition_spend_minor)) throw new Error('Acquisition spend does not reconcile to attributed channel costs.');
  }
  if (products.some(p => p.product === 'SUBSCRIPTIONS' && p.settled_volume_minor !== 0)) throw new Error('Subscription recognition cannot be counted as settled payment notional.');
}
export function assertBusinessReport(value: unknown): asserts value is BusinessAnalyticsReport {
  const r = value as BusinessAnalyticsReport | null;
  const day = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d\d-\d\d$/.test(s) && Number.isFinite(dayTime(s)) && new Date(dayTime(s)).toISOString().slice(0, 10) === s;
  if (!r || Object.keys(r).length !== 8 || r.schema_version !== 1 || r.reporting_currency !== 'EUR' || typeof r.report_id !== 'string' || !r.report_id.trim() || typeof r.as_of !== 'string' || !/^\d{4}-\d\d-\d\dT.*Z$/.test(r.as_of) || !Number.isFinite(Date.parse(r.as_of)) || !day(r.complete_through) || r.complete_through >= r.as_of.slice(0, 10) || !Array.isArray(r.days) || !Array.isArray(r.products) || !Array.isArray(r.cohorts)) throw new Error('Invalid business reporting envelope or completion cutoff.');
  for (const rows of [r.days, r.products, r.cohorts]) for (const row of rows) if (!row || !day(row.date) || row.date > r.complete_through || !['RETAIL', 'BUSINESS'].includes(row.segment) || Object.entries(row).some(([key, n]) => !['date', 'segment', 'product', 'channel'].includes(key) && (typeof n !== 'number' || !Number.isSafeInteger(n) || (!['equity_minor', 'deposit_adjustments_minor'].includes(key) && n < 0)))) throw new Error('Reporting rows contain invalid dates, categories or values.');
  if (r.products.some(p => !BUSINESS_PRODUCTS.includes(p.product)) || r.cohorts.some(c => !ACQUISITION_CHANNELS.includes(c.channel))) throw new Error('Invalid reporting categories.');
  businessAnalytics(r, rangeFilters(r, 90));
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
    const priorFrom = new Date(dayTime(previousFilters.from) + i * step * DAY).toISOString().slice(0, 10);
    const priorTo = new Date(dayTime(priorFrom) + (dayTime(to) - dayTime(from))).toISOString().slice(0, 10);
    const prior = businessPeriod(report, {...filters, from: priorFrom, to: priorTo});
    return { from, to, previous_from: priorFrom, previous_to: priorTo, previous_revenue: prior.netRevenue / 100, previous_result: prior.operatingResult / 100, revenue: period.netRevenue / 100, costs: period.totalCosts / 100, result: period.operatingResult / 100, registered: period.registered, funded: period.funded, active30: period.snapshot.active_customers_30d, inflow: period.inflow / 100, outflow: period.outflow / 100, deposits: period.snapshot.client_deposits_minor / 100, loans: period.snapshot.loan_book_minor / 100, liquid: period.snapshot.liquid_assets_minor / 100, net_funding: (period.inflow - period.outflow) / 100 };
  });
  return { current, previous, previousFilters, trend, dayCount: count };
}
export type BusinessAnalysis = ReturnType<typeof businessAnalytics>;
export function businessDailyRows(report: BusinessAnalyticsReport, filters: BusinessAnalyticsFilters) {
  const {dayCount} = businessAnalytics(report, filters);
  return Array.from({length: dayCount}, (_, i) => {
    const date = new Date(dayTime(filters.from) + i * DAY).toISOString().slice(0, 10);
    const p = businessPeriod(report, {...filters, from: date, to: date});
    return {date, revenue_minor: p.netRevenue, costs_minor: p.totalCosts, result_minor: p.operatingResult, volume_minor: p.settledVolume, completed: p.completed, failed: p.failed, pending: p.pending, registered: p.registered, funded: p.funded, deposits_minor: p.snapshot.client_deposits_minor, deposit_adjustments_minor: p.depositAdjustments};
  });
}
export function earningsBridge(analysis: BusinessAnalysis) {
  const c = analysis.current;
  const steps = [{key: 'gross', label: 'Gross income', delta: c.grossRevenue}, {key: 'refunds', label: 'Reversals', delta: -c.refunds}, ...Object.entries(c.costs).map(([key, value]) => ({key, label: key, delta: -value}))];
  let cumulative = 0;
  const rows = steps.map(step => {const before = cumulative; cumulative += step.delta; return {...step, before_minor: before, after_minor: cumulative, total: step.key === 'gross', range: [Math.min(before, cumulative) / 100, Math.max(before, cumulative) / 100] as [number, number]};});
  return [...rows, {key: 'result', label: 'Operating result', delta: c.operatingResult, before_minor: 0, after_minor: c.operatingResult, total: true, range: [Math.min(0, c.operatingResult) / 100, Math.max(0, c.operatingResult) / 100] as [number, number]}];
}
export function businessReportCsv(analysis: BusinessAnalysis, filters: BusinessAnalyticsFilters, reportId: string, metadata?: { report_as_of: string; generated_at: string; generated_by: string; reason: string; basis?: string }) {
  const cell = (value: unknown) => { let text = String(value ?? ""); if (typeof value === "string" && /^\s*[=+@-]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
  const c = analysis.current;
  const rows: unknown[][] = [["Report", reportId], ["Currency", "EUR"], ["Report snapshot UTC", metadata?.report_as_of ?? ""], ["Generated UTC", metadata?.generated_at ?? ""], ["Generated by", metadata?.generated_by ?? ""], ["Purpose", metadata?.reason ?? ""], ["From UTC", filters.from], ["To UTC", filters.to], ["Segment", filters.segment], ["Comparison from", analysis.previousFilters.from], ["Comparison to", analysis.previousFilters.to], ["Basis", metadata?.basis ?? "Illustrative recognized income; minor units; not an audited statutory report"], [], ["Metric", "Current", "Previous", "Unit"], ...([ ["Gross recognized income", c.grossRevenue, analysis.previous.grossRevenue], ["Refunds and reversals", c.refunds, analysis.previous.refunds], ["Net recognized revenue", c.netRevenue, analysis.previous.netRevenue], ["Operating costs including provisions", c.totalCosts, analysis.previous.totalCosts], ["Operating result before tax", c.operatingResult, analysis.previous.operatingResult], ["Settled notional volume", c.settledVolume, analysis.previous.settledVolume], ["External inflow", c.inflow, analysis.previous.inflow], ["External outflow", c.outflow, analysis.previous.outflow], ["Other client ledger postings", c.depositAdjustments, analysis.previous.depositAdjustments], ["Closing client deposits", c.snapshot.client_deposits_minor, analysis.previous.snapshot.client_deposits_minor], ["Opening client deposits", c.opening.client_deposits_minor, analysis.previous.opening.client_deposits_minor] ] as const).map(r => [...r, "EUR minor"]), ...Object.keys(c.costs).map(key => { const k = key as keyof typeof c.costs; return [`Cost: ${key}`, c.costs[k], analysis.previous.costs[k], "EUR minor"]; }), ...snapshotKeys.map(key => [`Closing snapshot: ${key}`, c.snapshot[key], analysis.previous.snapshot[key], key.endsWith("_minor") ? "EUR minor" : "customers"]), ["Operating margin", c.operatingMargin, analysis.previous.operatingMargin, "%"], ["Cost / income including provisions", c.costIncome, analysis.previous.costIncome, "%"], ["Completion rate", c.successRate, analysis.previous.successRate, "%"], ["Completed operations", c.completed, analysis.previous.completed, "operations"], ["Failed operations", c.failed, analysis.previous.failed, "operations"], ["Pending operations", c.pending, analysis.previous.pending, "operations"], ["Acquisition spend per funded customer", c.acquisitionCost, analysis.previous.acquisitionCost, "EUR minor"], ["Active customers rolling 30d", c.snapshot.active_customers_30d, analysis.previous.snapshot.active_customers_30d, "customers"], ["Registered in cohort", c.registered, analysis.previous.registered, "customers"], ["Funded in cohort", c.funded, analysis.previous.funded, "customers"], [], ["Product", "Net revenue minor", "Direct cost minor", "Contribution minor", "Settled volume minor", "Completed", "Failed", "Pending"], ...c.products.map(p => [p.product, p.revenue, p.directCost, p.contribution, p.volume, p.completed, p.failed, p.pending]), [], ["Channel", "Registered", "Verified", "Funded", "Active", "Acquisition spend minor"], ...c.channels.map(ch => [ch.channel, ch.registered, ch.verified, ch.funded, ch.active, ch.spend]), [], ["Bucket from UTC", "Bucket to UTC", "Revenue EUR", "Costs EUR", "Operating result EUR", "Registrations", "Funded cohort", "Active rolling 30d", "Inflow EUR", "Outflow EUR"], ...analysis.trend.map(t => [t.from, t.to, t.revenue, t.costs, t.result, t.registered, t.funded, t.active30, t.inflow, t.outflow])];
  return rows.map(r => r.map(cell).join(",")).join("\r\n");
}
