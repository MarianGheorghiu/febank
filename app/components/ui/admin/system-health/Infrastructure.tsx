'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { HealthResource, SystemHealthReport } from '@/app/lib/types/admin/system-health';
import { resourceStatus } from '@/app/lib/system-health/engine';
import { AuditPanel, AuditSelect, auditBadge, auditDate, auditFieldClass } from '../audit/presentation';
import { HealthSearch, healthMatches, healthScrollClass, Status } from './presentation';

const categories = {DATASTORE: 'Data & storage', COMPUTE: 'Compute', RECOVERY: 'Backup & recovery', SECURITY: 'Security & delivery'};
export default function Infrastructure({report}: {report: SystemHealthReport}) {
  const maintenance = report.maintenance;
  const [query, setQuery] = useState(''), [category, setCategory] = useState('ALL'), [group, setGroup] = useState('NONE');
  const resources = report.resources.filter(r => (category === 'ALL' || category === r.category) && healthMatches(query, r.id, r.name, r.detail, r.status, categories[r.category], ...r.metrics.map(m => m.name)));
  const groups = group === 'NONE' ? [['All resources', resources] as const] : Object.entries(categories).map(([key, label]) => [label, resources.filter(r => r.category === key)] as const).filter(([, items]) => items.length);
  return <>
    <AuditPanel title="Infrastructure & resilience" subtitle="Fleet capacity, replication, recovery evidence and certificate health.">
      <div className="grid items-end gap-3 border-b border-white/10 p-4 @min-[700px]:grid-cols-[minmax(0,1fr)_180px_180px]">
        <HealthSearch label="Search infrastructure" placeholder="Resource, metric or status…" value={query} onChange={setQuery}/>
        <label className={auditFieldClass}>Category<AuditSelect aria-label="Infrastructure category" value={category} onChange={e => setCategory(e.target.value)}><option value="ALL">All categories</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</AuditSelect></label>
        <label className={auditFieldClass}>Group by<AuditSelect aria-label="Group infrastructure by" value={group} onChange={e => setGroup(e.target.value)}><option value="NONE">All resources</option><option value="CATEGORY">Category</option></AuditSelect></label>
      </div>
      <p role="status" className="px-4 py-3 text-[11px] text-slate-300">{resources.length} / {report.resources.length} resources · trends cover the captured 24-hour window</p>
      <div role="region" aria-label="Infrastructure results" tabIndex={0} className={`${healthScrollClass} h-[min(38rem,70dvh)]`}>
        {groups.map(([label, items]) => <details key={label} open className="group/infra"><summary className={`${group === 'NONE' ? 'hidden' : ''} sticky top-0 z-10 cursor-pointer border-y border-white/10 bg-[#0b172b] px-4 py-3 text-xs font-semibold`}>{label} <span className="ml-2 text-cyan-200">{items.length}</span></summary><div className="grid items-stretch gap-3 p-4 @min-[700px]:grid-cols-2">{items.map(r => <ResourceCard key={r.id} resource={r} asOf={report.as_of}/>)}</div></details>)}
        {!resources.length && <p role="status" className="p-8 text-center text-xs text-slate-300">No infrastructure matches these filters.</p>}
      </div>
    </AuditPanel>
    <AuditPanel title="Maintenance & handover" action={<CalendarClock size={18} className="text-cyan-300"/>}><div className="space-y-3 p-5 text-xs leading-relaxed text-slate-300">{maintenance ? <><p className={auditBadge('INFO')}>{Date.parse(maintenance.ends_at) <= Date.parse(report.as_of) ? 'COMPLETED AT CAPTURE' : Date.parse(maintenance.starts_at) <= Date.parse(report.as_of) ? 'IN PROGRESS AT CAPTURE' : 'SCHEDULED'}</p><h3 className="text-sm font-semibold text-white">{maintenance.title}</h3><p>{auditDate(maintenance.starts_at, 'UTC')} → {auditDate(maintenance.ends_at, 'UTC')} UTC</p><p>{maintenance.impact}</p></> : <p>No maintenance window reported.</p>}<Link href="/dashboard/admin/audit-logs" className="inline-flex items-center gap-2 pt-2 text-cyan-200">Open Audit Logs <ArrowRight size={13}/></Link></div></AuditPanel>
  </>;
}
function ResourceCard({resource: r, asOf}: {resource: HealthResource; asOf: string}) {
  return <article className="flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{r.name}</h3><Status value={resourceStatus(r, asOf)}/></div>
    <dl className="mb-3 mt-3 grid grid-cols-2 gap-3">{r.metrics.map(m => <div key={m.name}><dt className="text-[11px] text-slate-300">{m.name}</dt><dd className="mt-1 text-base font-semibold text-cyan-200">{m.value ?? 'N/A'} <span className="text-xs">{m.unit}</span></dd><p className="mt-1 text-[11px] text-slate-400">Target {m.direction === 'MAX' ? '≤' : '≥'} {m.threshold} {m.unit}</p></div>)}</dl>
    {r.trend && <div className="mb-3 border-t border-white/10 pt-3"><p className="text-[11px] text-slate-300">{r.trend.name} · last 24h</p><div role="img" aria-label={`${r.trend.name} trend across ${r.trend.samples.length} samples, in ${r.trend.unit}`} className="mt-2 h-20 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width: 300, height: 80}}><AreaChart data={r.trend.samples} margin={{top: 5, right: 0, bottom: 0, left: 0}} accessibilityLayer><XAxis dataKey="timestamp" hide/><Tooltip contentStyle={{background: '#0b172b', border: '1px solid #334155', borderRadius: 8, fontSize: 11}} labelFormatter={label => `${auditDate(String(label), 'UTC')} UTC`} formatter={value => [`${value} ${r.trend!.unit}`, r.trend!.name]}/><Area type="linear" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false}/></AreaChart></ResponsiveContainer></div><div className="flex justify-between text-[10px] text-slate-400"><span>{r.trend.samples[0]?.timestamp.slice(11, 16)} UTC</span><span>{r.trend.samples.at(-1)?.timestamp.slice(11, 16)} UTC</span></div></div>}
    <details className="mt-auto border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-300"><summary className="cursor-pointer text-cyan-200">Probe & recovery evidence</summary><p className="mt-3">{r.detail}</p><p className="mt-2">Checked {auditDate(r.checked_at, 'UTC')} UTC</p></details>
  </article>;
}
