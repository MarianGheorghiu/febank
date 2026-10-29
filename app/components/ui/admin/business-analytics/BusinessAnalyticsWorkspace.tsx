"use client";
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, Banknote, Download, Gift, RefreshCw, ShieldAlert, TrendingUp, Users, Wallet, X } from 'lucide-react';
import { useUser } from '@/app/context/UserContext';
import type { BusinessAnalyticsFilters } from '@/app/lib/types/admin/business-analytics';
import type { BusinessActor, BusinessSnapshot } from '@/app/lib/business-analytics/contracts';
import { useBusinessSource } from '@/app/lib/business-analytics/use-business-source';
import { businessAnalytics, businessMoney, businessNumber, rangeFilters } from '@/app/lib/business-analytics/engine';
import { businessContentHash, prepareBusinessReport } from '@/app/lib/business-analytics/report';
import PageHeader from '../../PageHeader';
import CardSurface from '../../CardSurface';
import MetricCard from '../../MetricCard';
import { ActionButton } from '../../dashboard/ActionButton';
import { notifyOperation } from '../../OperationNotification';
import { AuditPanel, AuditSelect, auditDate, auditFieldClass, auditInputClass } from '../audit/presentation';
import { analyticsButton, percent, reportDate } from './presentation';
import { Change, NumberGrid } from './BusinessMetrics';
import { BalanceSheet, CustomerDetails, FundingSummary } from './BusinessDetails';
import AnalyticsCharts from './AnalyticsCharts';
import ProductPerformance from './ProductPerformance';
import BusinessDailyTable from './BusinessDailyTable';
import BusinessOperations from './BusinessOperations';
import BusinessSources from './BusinessSources';
import BusinessSummary from './BusinessSummary';
import BusinessExportDialog from './BusinessExportDialog';

const views = [['OVERVIEW', 'Executive overview'], ['FINANCIALS', 'Financial performance'], ['PRODUCTS', 'Products'], ['CUSTOMERS', 'Customers & growth'], ['FUNDING', 'Funding & balance'], ['OPERATIONS', 'Global operations'], ['QUALITY', 'Data quality']];
interface ExportContext {snapshot: BusinessSnapshot; filters: BusinessAnalyticsFilters; opened_at: string}
export default function BusinessAnalyticsWorkspace() {
  const {user, loading} = useUser();
  if (loading || !user) return null;
  if (user.role !== 'admin') return <CardSurface className="p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-rose-300"/><h1>Administrator access required</h1><Link href="/dashboard" className={`${analyticsButton} mt-4`}>Return to dashboard</Link></CardSurface>;
  return <Workspace actor={user}/>;
}
function Workspace({actor}: {actor: BusinessActor}) {
  const source = useBusinessSource(actor);
  if (!source.snapshot) return <div className="space-y-5"><PageHeader statusText="Business Analytics"/><CardSurface className="p-6"><p role={source.warning ? 'alert' : 'status'} className="text-sm text-slate-200">{source.warning ?? 'Preparing the financial report and shared source coverage…'}</p><ActionButton variant="blue" autoWidth className="mt-4" disabled={source.loading} onClick={() => void source.refresh()}>Retry reporting sources</ActionButton></CardSurface></div>;
  return <ReportingWorkspace actor={actor} source={source}/>;
}
function ReportingWorkspace({actor, source}: {actor: BusinessActor; source: ReturnType<typeof useBusinessSource>}) {
  const snapshot = source.snapshot!, report = snapshot.report;
  const [view, setView] = useState('OVERVIEW'), [preset, setPreset] = useState('30D'), [segment, setSegment] = useState<BusinessAnalyticsFilters['segment']>('ALL');
  const [from, setFrom] = useState(() => rangeFilters(report, 30).from), [to, setTo] = useState(report.complete_through);
  const [exportContext, setExportContext] = useState<ExportContext | null>(null);
  const exportRetry = useRef<{fingerprint: string; request_id: string} | null>(null);
  const filters = useMemo<BusinessAnalyticsFilters>(() => preset === 'CUSTOM' ? {from, to, segment} : rangeFilters(report, preset === '90D' ? 90 : 30, segment), [report, preset, from, to, segment]);
  const computed = useMemo(() => {try {return {analysis: businessAnalytics(report, filters), error: null};} catch (cause) {return {analysis: null, error: cause instanceof Error ? cause.message : 'Financial calculations failed.'};}}, [report, filters]);
  const {analysis} = computed, c = analysis?.current, earliest = rangeFilters(report, 90).from;
  const ready = Object.values(snapshot.operations.sources).filter(s => s.status === 'READY').length;
  const currentView = view === 'OPERATIONS' || view === 'QUALITY';
  const operations = snapshot.operations.sources;
  const reset = () => {setPreset('30D'); setSegment('ALL'); setFrom(rangeFilters(report, 30).from); setTo(report.complete_through);};
  async function exportReport(format: 'CSV' | 'JSON', reason: string) {
    if (!exportContext) throw new Error('Open a report snapshot before exporting.');
    const context = exportContext;
    const content = prepareBusinessReport(context.snapshot, context.filters, format, actor.email, reason, context.opened_at);
    const hash = await businessContentHash(content), fingerprint = `${context.snapshot.snapshot_id}:${format}:${reason}:${hash}`;
    if (exportRetry.current?.fingerprint !== fingerprint) exportRetry.current = {fingerprint, request_id: crypto.randomUUID()};
    await source.repository.recordExport({request_id: exportRetry.current.request_id, snapshot_id: context.snapshot.snapshot_id, report_id: context.snapshot.report.report_id, filters: context.filters, format, reason, content_sha256: hash});
    const url = URL.createObjectURL(new Blob([content], {type: format === 'CSV' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8'}));
    try {const anchor = document.createElement('a'); anchor.href = url; anchor.download = `mbank-business-${context.filters.from}-${context.filters.to}-${context.filters.segment.toLowerCase()}.${format.toLowerCase()}`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); notifyOperation('Business report prepared', `The reviewed ${format} snapshot was exported with audit evidence and its SHA-256 checksum.`, false, 'Business Analytics');}
    finally {window.setTimeout(() => URL.revokeObjectURL(url), 1000);}
  }
  return <div className="w-full min-w-0 space-y-5 font-mono text-white [&_header_p]:text-slate-300 [&_input]:placeholder:text-slate-300">
    <h1 className="sr-only">Business Analytics</h1>
    <PageHeader statusText="Business Analytics" wrapActions><ActionButton variant="blue" autoWidth disabled={source.loading} icon={<RefreshCw size={14} className={source.loading ? 'animate-spin' : ''}/>} onClick={() => void source.refresh()}>Refresh</ActionButton><ActionButton variant="cyan" autoWidth disabled={!analysis || !!source.warning || source.loading} icon={<Download size={14}/>} onClick={() => {exportRetry.current = null; setExportContext({snapshot: structuredClone(snapshot), filters: {...filters}, opened_at: new Date().toISOString()});}}>Export report</ActionButton></PageHeader>
    {source.warning && <p role="alert" className="rounded-xl border border-rose-400/25 p-4 text-xs leading-relaxed text-rose-200">{source.warning} The last successful snapshot remains visible; exports are blocked.</p>}
    <div className="flex flex-wrap justify-between gap-x-5 gap-y-2 text-xs text-slate-200"><span>Financial close: <strong className="text-white">{reportDate(report.complete_through)}</strong></span><span>Operational capture: {auditDate(snapshot.operations.as_of)}</span><span className={ready === 7 ? 'text-teal-200' : 'text-amber-200'}>{ready}/7 sources available</span></div>
    <nav aria-label="Business analytics views" className="scrollbar-thin flex min-w-0 gap-2 overflow-x-auto pb-1">{views.map(([key, label]) => <ActionButton key={key} variant={view === key ? 'cyan' : 'blue'} autoWidth className="shrink-0" labelClassName="whitespace-nowrap" aria-pressed={view === key} aria-controls="business-view-panel" onClick={() => setView(key)}>{label}</ActionButton>)}</nav>
    {!currentView && <AuditPanel title="Reporting scope" subtitle={`UTC · complete through ${reportDate(report.complete_through)} · equal-length comparison.`} action={<ActionButton autoWidth variant="blue" icon={<X size={13}/>} onClick={reset}>Reset scope</ActionButton>}>
      <div className={`grid items-end gap-3 p-4 sm:grid-cols-2 ${preset === 'CUSTOM' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}><label className={auditFieldClass}>Reporting period<AuditSelect aria-label="Business reporting period" value={preset} onChange={e => {if (e.target.value === 'CUSTOM') {setFrom(filters.from); setTo(filters.to);} setPreset(e.target.value);}}><option value="30D">Last 30 complete days</option><option value="90D">Last 90 complete days</option><option value="CUSTOM">Custom UTC dates</option></AuditSelect></label><label className={auditFieldClass}>Customer segment<AuditSelect aria-label="Business customer segment" value={segment} onChange={e => setSegment(e.target.value as BusinessAnalyticsFilters['segment'])}><option value="ALL">All reporting customers</option><option value="RETAIL">Retail banking</option><option value="BUSINESS">Business banking</option></AuditSelect></label>{preset === 'CUSTOM' ? <><label className={auditFieldClass}>From · UTC inclusive<input type="date" min={earliest} max={report.complete_through} value={from} onChange={e => setFrom(e.target.value)} className={`${auditInputClass} [color-scheme:dark]`}/></label><label className={auditFieldClass}>To · UTC inclusive<input type="date" min={earliest} max={report.complete_through} value={to} onChange={e => setTo(e.target.value)} className={`${auditInputClass} [color-scheme:dark]`}/></label></> : <div className="space-y-2 text-xs leading-relaxed text-slate-200"><p><strong className="text-white">Selected:</strong> {reportDate(filters.from)} → {reportDate(filters.to)}</p>{analysis && <p><strong className="text-white">Previous:</strong> {reportDate(analysis.previousFilters.from)} → {reportDate(analysis.previousFilters.to)}</p>}</div>}</div>
      {computed.error && <p role="alert" className="px-4 pb-4 text-xs text-rose-200">{computed.error}</p>}
    </AuditPanel>}
    {!currentView && analysis && c && <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard readable compact tone="cyan" title="Net recognized revenue" value={businessMoney(c.netRevenue, true)} icon={TrendingUp} subtext={<Change current={c.netRevenue} previous={analysis.previous.netRevenue} money/>}/><MetricCard readable compact tone="purple" title="Operating result" value={businessMoney(c.operatingResult, true)} icon={Activity} iconColor={c.operatingResult >= 0 ? 'text-purple-300' : 'text-rose-300'} subtext={<><Change current={c.operatingResult} previous={analysis.previous.operatingResult} money/><p className="mt-2 text-slate-200">Before tax · {percent(c.operatingMargin)} margin</p></>}/><MetricCard readable compact tone="blue" title="30-day active customers" value={businessNumber(c.snapshot.active_customers_30d)} icon={Users} subtext={<><Change current={c.snapshot.active_customers_30d} previous={analysis.previous.snapshot.active_customers_30d} snapshot/><p className="mt-2 text-slate-200">Qualifying activity · closing snapshot</p></>}/><MetricCard readable compact tone="amber" title="Client deposits" value={businessMoney(c.snapshot.client_deposits_minor, true)} icon={Banknote} subtext={<><Change current={c.snapshot.client_deposits_minor} previous={analysis.previous.snapshot.client_deposits_minor} money snapshot/><p className="mt-2 text-slate-200">Customer liabilities</p></>}/></div>}
    <div id="business-view-panel" className="min-w-0 space-y-5">
      {view === 'OVERVIEW' && analysis && c && <><div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]"><AnalyticsCharts kind="FINANCIAL" analysis={analysis}/><BusinessSummary analysis={analysis} snapshot={snapshot} onFinancials={() => setView('FINANCIALS')} onOperations={() => setView('OPERATIONS')}/></div><AuditPanel title="Booked business activity" subtitle="Reporting-period operations with outcomes measured at the warehouse cutoff. Notional is activity, separate from income."><NumberGrid values={[["Settled notional", businessMoney(c.settledVolume, true)], ['Completion rate', percent(c.successRate), `${businessNumber(c.completed)} completed operations`], ['Failed / pending', `${businessNumber(c.failed)} / ${businessNumber(c.pending)}`], ['New funded customers', businessNumber(c.funded), `${percent(c.fundedRate)} of registrations in this cohort`]]}/></AuditPanel><div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]"><AnalyticsCharts kind="PRODUCTS" analysis={analysis}/><FundingSummary analysis={analysis} onMore={() => setView('FUNDING')}/></div><ProductPerformance analysis={analysis}/></>}
      {view === 'FINANCIALS' && analysis && <><AnalyticsCharts kind="BRIDGE" analysis={analysis}/><div className="grid items-stretch gap-4 xl:grid-cols-2"><AnalyticsCharts kind="FINANCIAL" analysis={analysis}/><AnalyticsCharts kind="COSTS" analysis={analysis}/></div><BusinessDailyTable key={`${filters.from}:${filters.to}:${filters.segment}`} report={report} filters={filters}/></>}
      {view === 'PRODUCTS' && analysis && <><div className="grid items-stretch gap-4 xl:grid-cols-2"><AnalyticsCharts kind="PRODUCTS" analysis={analysis}/><AnalyticsCharts kind="COSTS" analysis={analysis}/></div><ProductPerformance analysis={analysis}/></>}
      {view === 'CUSTOMERS' && analysis && <><div className="grid items-stretch gap-4 xl:grid-cols-2"><AnalyticsCharts kind="CUSTOMERS" analysis={analysis}/><AnalyticsCharts kind="CHANNELS" analysis={analysis}/></div><CustomerDetails analysis={analysis} closing={filters.to} asOf={report.as_of}/></>}
      {view === 'FUNDING' && analysis && <><AnalyticsCharts kind="FUNDING" analysis={analysis}/><BalanceSheet analysis={analysis} closing={filters.to}/><FundingSummary analysis={analysis} onMore={() => setView('FINANCIALS')}/></>}
      {view === 'OPERATIONS' && <><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard readable compact tone="blue" title="Managed customers" value={operations.users.data?.clients ?? 'Unavailable'} icon={Users} subtext="Current managed CLIENT registry"/><MetricCard readable compact tone="cyan" title="Contracted MRR" value={operations.subscriptions.data ? businessMoney(operations.subscriptions.data.contracted_mrr_minor) : 'Unavailable'} icon={TrendingUp} subtext="Current EUR contract estimate · not recognized income"/><MetricCard readable compact tone="purple" title="Queued referral rewards" value={operations.referrals.data ? businessMoney(operations.referrals.data.queued_minor) : 'Unavailable'} icon={Gift} subtext="Awaiting payment processing · unpaid EUR"/><MetricCard readable compact tone="amber" title="Observed wallets" value={operations.wallets.data?.observed_wallets ?? 'Unavailable'} icon={Wallet} subtext="Saved journals visible in this session"/></div><BusinessOperations snapshot={snapshot}/></>}
      {view === 'QUALITY' && <BusinessSources snapshot={snapshot} analysis={analysis}/>}
    </div>
    <footer className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-300"><span>{snapshot.financial_basis === 'ILLUSTRATIVE_WAREHOUSE' ? 'Illustrative financial warehouse · shared operational registries' : 'Booked management reporting'} · not a statutory or regulatory report</span><span>EUR financial reporting · asset units preserved in operations</span></footer>
    {exportContext && <BusinessExportDialog key={exportContext.snapshot.snapshot_id} scope={`${exportContext.filters.from} → ${exportContext.filters.to} UTC · ${exportContext.filters.segment} · financial close ${exportContext.snapshot.report.complete_through} · operational capture ${auditDate(exportContext.snapshot.operations.as_of)}`} onClose={() => setExportContext(null)} onExport={exportReport}/>}
  </div>;
}
