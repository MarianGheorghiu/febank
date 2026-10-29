'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Clock, Download, RefreshCw, Server, ShieldAlert } from 'lucide-react';
import { useUser } from '@/app/context/UserContext';
import PageHeader from '@/app/components/ui/PageHeader';
import MetricCard from '@/app/components/ui/MetricCard';
import CardSurface from '@/app/components/ui/CardSurface';
import { ActionButton } from '../../dashboard/ActionButton';
import { controlStatus, domainHealth, healthSummary } from '@/app/lib/system-health/engine';
import { useHealthSource } from '@/app/lib/system-health/use-health-source';
import type { AuditActor } from '@/app/lib/types/admin/audit';
import type { HealthDomain, HealthIncident, SystemHealthReport } from '@/app/lib/types/admin/system-health';
import { AuditPanel, AuditSelect, auditBadge, auditDate, auditFieldClass } from '../audit/presentation';
import LatencyChart from './LatencyChart';
import ServiceRegistry, { domainLabels } from './ServiceRegistry';
import HealthActions from './HealthActions';
import IncidentList from './IncidentList';
import Infrastructure from './Infrastructure';
import { percent, Status, statusTone, HealthSearch, healthMatches, healthScrollClass, healthOverviewPanelClass } from './presentation';

type View = 'OVERVIEW' | 'SERVICES' | 'CONTROLS' | 'INCIDENTS' | 'INFRASTRUCTURE';
const views: [View, string][] = [['OVERVIEW', 'Overview'], ['SERVICES', 'Services'], ['CONTROLS', 'Operational controls'], ['INCIDENTS', 'Incidents'], ['INFRASTRUCTURE', 'Infrastructure']];
export default function SystemHealthWorkspace() {
  const {user, loading} = useUser();
  if (loading || !user) return null;
  if (user.role !== 'admin') return <div className="rounded-xl border border-rose-500/30 p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-rose-300"/><h1>Administrator access required</h1><Link className="mt-4 inline-block text-cyan-200" href="/dashboard">Return to dashboard</Link></div>;
  return <Workspace key={user.email} actor={user}/>;
}
function Workspace({actor}: {actor: AuditActor}) {
  const source = useHealthSource(actor), {report} = source;
  const [view, setView] = useState<View>('OVERVIEW'), [domain, setDomain] = useState<HealthDomain | 'ALL'>('ALL');
  const [action, setAction] = useState<{report: SystemHealthReport; incident?: HealthIncident} | null>(null);
  const summary = report ? healthSummary(report) : null;
  const blocked = source.loading || !!source.error || source.stale;
  const openIncident = (incident: HealthIncident) => {if (report) setAction({report: structuredClone(report), incident: structuredClone(incident)});};
  return <div className="@container w-full min-w-0 space-y-5 font-mono text-white [overflow-wrap:anywhere] [&_header_p]:text-slate-300 [&_button]:cursor-pointer [&_button]:disabled:cursor-not-allowed [&_summary]:focus-visible:outline-2 [&_summary]:focus-visible:outline-cyan-300">
    <h1 className="sr-only">System Health</h1>
    <PageHeader statusText="System Health" wrapActions><ActionButton variant="blue" autoWidth disabled={source.loading} icon={<RefreshCw size={14} className={source.loading ? 'animate-spin' : ''}/>} onClick={() => void source.refresh()}>Refresh</ActionButton><ActionButton variant="cyan" autoWidth disabled={!report || blocked} icon={<Download size={14}/>} onClick={() => report && setAction({report: structuredClone(report)})}>Export diagnostics</ActionButton></PageHeader>
    {source.error && <div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/5 p-4 text-xs leading-relaxed text-rose-200">{source.error} {report ? 'The last successful snapshot remains visible. Actions are blocked until refresh succeeds.' : 'No monitoring snapshot is available.'}</div>}
    {!report && <div role="status" className="rounded-2xl border border-white/10 p-12 text-center text-sm text-slate-300">{source.loading ? 'Loading global monitoring telemetry…' : 'Use Refresh to retry the monitoring connection.'}</div>}
    {report && summary && <>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-300"><span>Global coverage · <strong className="text-white">{report.region}</strong> · {report.environment.toLowerCase()}</span><span>Captured {auditDate(report.as_of, 'UTC')} UTC · {report.mode === 'demo' ? 'Mock telemetry' : 'Live monitoring'}</span></div>
      {source.stale && <p role="alert" className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-xs text-amber-200">Monitoring snapshot is outside the freshness window. Current health is unknown; the readings below are historical. Reviews and exports are blocked.</p>}
      <section aria-label="Overall system status" className={`rounded-2xl border p-5 ${statusTone[source.stale || source.error ? 'UNKNOWN' : summary.status]}`}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><Activity size={22} className="mt-1 shrink-0"/><div><h2 className="text-base font-semibold">{source.stale || source.error ? 'Current health unavailable' : summary.status === 'DEGRADED' ? 'Some services need attention' : summary.status === 'OPERATIONAL' ? 'All services operational' : summary.status === 'OUTAGE' ? 'Service interruption detected' : 'Telemetry coverage incomplete'}</h2><p className="mt-2 text-xs leading-relaxed text-slate-200">{summary.healthy} of {summary.total} services operational at capture · {report.incidents.length} open incidents · {report.controls.filter(c => controlStatus(c, report.as_of) === 'DEGRADED').length} control breaches</p></div></div><ActionButton variant="amber" autoWidth icon={<ArrowRight size={14}/>} onClick={() => setView('INCIDENTS')}>Review incidents</ActionButton></div>
      </section>
      <div className="grid auto-rows-fr grid-cols-1 gap-3 @min-[420px]:grid-cols-2 @min-[1050px]:grid-cols-4">
        <MetricCard readable compact tone="cyan" title="Availability · 24h" value={percent(summary.availability)} icon={Server} subtext={`Target ${report.availability_target_pct}% · ${summary.budgetRemainingPct === null ? 'Unavailable' : `${summary.budgetRemainingPct.toFixed(1)}%`} probe budget left`}/>
        <MetricCard readable compact tone="blue" title="API latency · p95" value={report.api_p95_ms === null ? 'Unavailable' : `${report.api_p95_ms} ms`} icon={Clock} subtext="Platform histogram · last hour"/>
        <MetricCard readable compact tone="purple" title="Server errors · 24h" value={percent(summary.errorRate)} icon={Activity} subtext={`${summary.errors.toLocaleString('en-GB')} HTTP 5xx / ${summary.requests.toLocaleString('en-GB')} requests`}/>
        <MetricCard readable compact tone="amber" title="Processing backlog" value={summary.queued} icon={ShieldAlert} subtext={`${summary.breachedQueues} queue${summary.breachedQueues === 1 ? '' : 's'} above age target · global`}/>
      </div>
      <nav aria-label="System health views" className="scrollbar-thin flex min-w-0 gap-2 overflow-x-auto pb-1">{views.map(([key, label]) => <ActionButton key={key} variant={view === key ? 'cyan' : 'blue'} autoWidth aria-pressed={view === key} aria-controls="health-view-panel" className="shrink-0" labelClassName="whitespace-nowrap" onClick={() => setView(key)}>{label}{key === 'INCIDENTS' && <span className="ml-2 rounded bg-white/10 px-1.5">{report.incidents.length}</span>}</ActionButton>)}</nav>
      <div id="health-view-panel" className="min-w-0 space-y-5">
        {view === 'OVERVIEW' && <>
          <div className="grid auto-rows-fr gap-3 @min-[400px]:grid-cols-2 @min-[1100px]:grid-cols-4">{(Object.keys(domainLabels) as HealthDomain[]).map(key => {const state = domainHealth(report, key); return <CardSurface key={key} tone={key === 'CRYPTO' ? 'purple' : 'blue'} className="flex h-full flex-col p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">{domainLabels[key]}</h2><Status value={state.status}/></div><p className="mt-2 text-lg font-semibold">{state.healthy} / {state.services.length}<span className="ml-2 text-[11px] font-normal text-slate-300">operational</span></p><p className="mb-2 mt-1 text-[11px] text-slate-300">{state.incidents} incidents · {state.queued} queued</p><ActionButton variant="blue" size="small" autoWidth className="mt-auto self-start" icon={<ArrowRight size={12}/>} onClick={() => {setDomain(key); setView('SERVICES');}}>Inspect domain</ActionButton></CardSurface>;})}</div>
          <div className="grid items-start gap-5 @min-[1100px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"><LatencyChart asOf={report.as_of} data={report.samples} threshold={report.latency_target_ms}/><AuditPanel className={healthOverviewPanelClass} title="Needs attention" subtitle="Open incidents ordered by severity and start time." action={<Status value={summary.status}/>}><IncidentList report={report} blocked={blocked} onOpen={openIncident} compact/></AuditPanel></div>
          <AuditPanel title="Monitoring coverage" subtitle="One global operational snapshot, independent of customer accounts and table filters."><div className="grid gap-4 p-5 text-xs leading-relaxed text-slate-300 @min-[700px]:grid-cols-3"><div><h3 className="mb-2 font-semibold text-white">Availability & error budget</h3><p>Successful synthetic probes / total probes over the same 24-hour window. Budget reflects the configured availability target.</p></div><div><h3 className="mb-2 font-semibold text-white">Latency & server errors</h3><p>Request-weighted HTTP 5xx rate. Platform and domain p95 values use separate histograms.</p></div><div><h3 className="mb-2 font-semibold text-white">Freshness & source</h3><p>Probe freshness limit: 2 minutes at capture. {report.mode === 'demo' ? 'The mock observation time stays fixed when refreshed.' : 'Snapshots refresh every 30 seconds. Missing and stale probes remain unknown.'}</p></div></div></AuditPanel>
        </>}
        {view === 'SERVICES' && <ServiceRegistry report={report} domain={domain} setDomain={setDomain}/>}
        {view === 'CONTROLS' && <Controls report={report} domain={domain} setDomain={setDomain}/>}
        {view === 'INCIDENTS' && <AuditPanel title="Incident desk" subtitle="Customer impact, accountable team and recorded reviews. Acknowledgement keeps the incident open." action={<span className={auditBadge(report.incidents.length ? 'WARNING' : 'SUCCESS')}>{report.incidents.length} OPEN</span>}><IncidentList report={report} blocked={blocked} onOpen={openIncident}/></AuditPanel>}
        {view === 'INFRASTRUCTURE' && <Infrastructure report={report}/>}
      </div>
      <footer className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-300"><span>{report.mode === 'demo' ? 'Illustrative monitoring data · shared browser audit records' : 'Global operational monitoring · server audit records'}</span><span>{report.snapshot_id} · UTC</span></footer>
    </>}
    {action && <HealthActions report={action.report} incident={action.incident} repository={source.repository} blocked={blocked} onClose={() => setAction(null)} onSaved={source.refresh}/>}
  </div>;
}
function Controls({report, domain, setDomain}: {report: SystemHealthReport; domain: HealthDomain | 'ALL'; setDomain: (domain: HealthDomain | 'ALL') => void}) {
  const [query, setQuery] = useState('');
  const controls = report.controls.filter(c => (domain === 'ALL' || c.domain === domain) && healthMatches(query, c.id, c.name, c.detail, domainLabels[c.domain], controlStatus(c, report.as_of))).sort((a,b) => Number(controlStatus(b, report.as_of) !== 'OPERATIONAL') - Number(controlStatus(a, report.as_of) !== 'OPERATIONAL'));
  return <AuditPanel title="Financial & platform controls" subtitle="Observed values against inclusive operational targets. Checks are evaluated at capture time." ><div className="grid items-end gap-3 border-b border-white/10 p-4 @min-[600px]:grid-cols-[minmax(0,1fr)_200px]"><HealthSearch label="Search controls" placeholder="Control, service, domain or status…" value={query} onChange={setQuery}/><label className={auditFieldClass}>Control domain<AuditSelect aria-label="Control domain" value={domain} onChange={e => setDomain(e.target.value as HealthDomain | 'ALL')}><option value="ALL">All domains</option>{Object.entries(domainLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</AuditSelect></label></div><p className="px-4 pt-3 text-[11px] text-slate-300">{controls.length} / {report.controls.length} controls · {controls.filter(c => controlStatus(c, report.as_of) === 'DEGRADED').length} breaches in view</p><div role="region" aria-label="Control results" tabIndex={0} className={`${healthScrollClass} h-[min(38rem,70dvh)]`}><div className="grid auto-rows-fr gap-3 p-4 @min-[650px]:grid-cols-2 @min-[1100px]:grid-cols-3">{controls.map(c => {const status = controlStatus(c, report.as_of); return <details key={c.id} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4"><summary className="flex min-h-52 cursor-pointer list-none flex-col [&::-webkit-details-marker]:hidden"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] text-slate-300">{domainLabels[c.domain]}</span><Status value={status}/></div><h3 className="mt-4 min-h-10 text-xs font-semibold leading-relaxed">{c.name}</h3><p className={`mt-3 text-2xl font-semibold ${status === 'DEGRADED' ? 'text-amber-200' : 'text-white'}`}>{c.value ?? 'N/A'} <span className="text-xs font-normal text-slate-300">{c.unit}</span></p><p className="mt-2 text-xs text-slate-300">Target {c.direction === 'MAX' ? '≤' : '≥'} {c.threshold} {c.unit}</p><span className="mt-auto block pt-4 text-[11px] text-cyan-200">Check details +</span></summary><p className="mt-auto border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-300">{c.detail}</p></details>;})}</div>{!controls.length && <p role="status" className="p-8 text-center text-xs text-slate-300">No controls match this search and domain.</p>}</div></AuditPanel>;
}
