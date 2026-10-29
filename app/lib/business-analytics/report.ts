import type { BusinessAnalyticsFilters } from '../types/admin/business-analytics';
import type { BusinessSnapshot } from './contracts';
import { businessAnalytics, businessDailyRows, businessReportCsv } from './engine';

export function prepareBusinessReport(snapshot: BusinessSnapshot, filters: BusinessAnalyticsFilters, format: 'CSV' | 'JSON', actor: string, reason: string, generatedAt: string) {
  const analysis = businessAnalytics(snapshot.report, filters);
  const manifest = {schema_version: 1, snapshot_id: snapshot.snapshot_id, report_id: snapshot.report.report_id, generated_at: generatedAt, generated_by: actor, reason, reporting_currency: 'EUR', financial_basis: snapshot.financial_basis, report_as_of: snapshot.report.as_of, complete_through: snapshot.report.complete_through, filters, comparison: analysis.previousFilters, operations_as_of: snapshot.operations.as_of, operations_window: {from: snapshot.operations.window_from, to: snapshot.operations.window_to}, consistency: snapshot.consistency, basis: `${snapshot.financial_basis}; financial totals in EUR minor units, chart values in EUR. Operational positions retain exact asset units and have a separate scope and cutoff.`};
  const daily = businessDailyRows(snapshot.report, filters);
  if (format === 'JSON') return JSON.stringify({manifest, financial: analysis, daily, operations: snapshot.operations}, null, 2);
  const cell = (value: unknown) => {let text = String(value ?? ''); if (typeof value === 'string' && /^\s*[=+@-]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`;};
  const rows: unknown[][] = [[], ['Analytics snapshot', snapshot.snapshot_id], ['Financial basis', snapshot.financial_basis], ['Operational cutoff UTC', snapshot.operations.as_of], ['Operational window from UTC', snapshot.operations.window_from], ['Operational window to UTC', snapshot.operations.window_to], ['Consistency', snapshot.consistency], [], ['Source', 'Availability', 'Observed UTC', 'Revision', 'Scope', 'Error']];
  for (const [key, source] of Object.entries(snapshot.operations.sources)) {
    rows.push([key, source.status, source.as_of, source.revision, source.scope, source.error]);
    if (!source.data) continue;
    rows.push(['Source metric', 'Value', 'Unit']);
    for (const [metric, value] of Object.entries(source.data)) if (typeof value === 'number') rows.push([`${key}.${metric}`, value, metric.endsWith('_minor') ? 'EUR minor' : metric === 'version' ? 'version' : 'count']);
  }
  const wallets = snapshot.operations.sources.wallets.data;
  rows.push([], ['Observed asset', 'Kind', 'Decimals', 'Available exact units', 'Reserved exact units']);
  for (const p of wallets?.positions ?? []) rows.push([p.asset, p.kind, p.decimals, p.available, p.reserved]);
  rows.push([], ['Settled asset', 'Decimals', 'Incoming exact units', 'Outgoing exact units', 'Completed transfers']);
  for (const p of wallets?.settlements ?? []) rows.push([p.asset, p.decimals, p.incoming, p.outgoing, p.completed]);
  rows.push([], ['Subscription plan', 'Current open subscriptions']);
  for (const p of snapshot.operations.sources.subscriptions.data?.plans ?? []) rows.push([p.plan, p.count]);
  rows.push([], ['Product comparison', 'Previous net revenue EUR minor', 'Previous contribution EUR minor']);
  for (const p of analysis.previous.products) rows.push([p.product, p.revenue, p.contribution]);
  rows.push([], ['Channel comparison', 'Previous registrations', 'Previous funded', 'Previous spend EUR minor']);
  for (const c of analysis.previous.channels) rows.push([c.channel, c.registered, c.funded, c.spend]);
  rows.push([], ['Trend bucket', 'Compared bucket from UTC', 'Compared bucket to UTC', 'Previous revenue EUR', 'Previous result EUR', 'Closing deposits EUR', 'Closing loans EUR', 'Closing liquid assets EUR']);
  for (const row of analysis.trend) rows.push([row.from, row.previous_from, row.previous_to, row.previous_revenue, row.previous_result, row.deposits, row.loans, row.liquid]);
  rows.push([], ['UTC day', 'Net revenue EUR minor', 'Costs EUR minor', 'Operating result EUR minor', 'Settled volume EUR minor', 'Completed', 'Failed', 'Pending', 'Registered cohort', 'Funded cohort', 'Closing deposits EUR minor', 'Other client ledger postings EUR minor']);
  for (const d of daily) rows.push([d.date, d.revenue_minor, d.costs_minor, d.result_minor, d.volume_minor, d.completed, d.failed, d.pending, d.registered, d.funded, d.deposits_minor, d.deposit_adjustments_minor]);
  return businessReportCsv(analysis, filters, snapshot.report.report_id, manifest) + '\r\n' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
export async function businessContentHash(content: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
