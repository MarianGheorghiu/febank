'use client';
import { useId, useState } from 'react';
import { CheckCheck, ChevronDown } from 'lucide-react';
import { incidentGroups, type IncidentGrouping } from '@/app/lib/system-health/engine';
import type { HealthIncident, SystemHealthReport } from '@/app/lib/types/admin/system-health';
import { ActionButton } from '../../dashboard/ActionButton';
import { AuditSelect, auditBadge, auditFieldClass } from '../audit/presentation';
import { HealthSearch, healthScrollClass } from './presentation';
import { domainLabels } from './ServiceRegistry';

const labels: Record<string, string> = {INVESTIGATING: 'Investigating', MONITORING: 'Monitoring', CRITICAL: 'Critical', WARNING: 'Warning', ...domainLabels};
export default function IncidentList({report, blocked, onOpen, compact = false}: {report: SystemHealthReport; blocked: boolean; onOpen: (incident: HealthIncident) => void; compact?: boolean}) {
  const [query, setQuery] = useState(''), [state, setState] = useState('ALL'), [severity, setSeverity] = useState('ALL');
  const [group, setGroup] = useState<IncidentGrouping>('STATE'), [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const id = useId();
  const groups = incidentGroups(report, {query, state, severity, group: compact ? 'SEVERITY' : group}), count = groups.reduce((n, g) => n + g.incidents.length, 0);
  const allCollapsed = groups.length > 0 && groups.every(g => collapsed.has(g.key));
  const reset = () => {setQuery(''); setState('ALL'); setSeverity('ALL'); setCollapsed(new Set());};
  const card = (i: HealthIncident) => <article key={i.id} className={`flex flex-col gap-3 p-4 ${compact ? 'border-b border-white/10 last:border-0' : 'rounded-xl border border-white/10 bg-white/[0.02]'}`}>
    <div className="flex flex-wrap items-center gap-2"><span className={auditBadge(i.severity)}>{i.severity}</span><span className="text-[11px] text-slate-300">{i.id} · {labels[i.state]}</span></div>
    <h3 className="text-sm font-semibold leading-relaxed">{i.title}</h3>
    <p className="text-xs text-cyan-200">{report.services.find(s => s.id === i.service_id)?.owner ?? 'Unassigned'}</p>
    <p className="text-xs leading-relaxed text-slate-300">{i.impact}</p>
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">{i.acknowledgement ? <span className="flex items-center gap-1.5 text-[11px] text-teal-200"><CheckCheck size={13}/>Review recorded</span> : <span className="text-[11px] text-amber-200">Awaiting review</span>}<ActionButton variant="blue" size="small" autoWidth disabled={blocked} onClick={() => onOpen(i)}>View incident</ActionButton></div>
  </article>;
  if (compact) return <>
    <div className="shrink-0 space-y-2 border-b border-white/10 p-4">
      <HealthSearch label="Search priority incidents" placeholder="Incident, service, impact or team…" value={query} onChange={setQuery}/>
      <p role="status" className="text-[11px] text-slate-300">{count} / {report.incidents.length} incidents · highest priority first</p>
    </div>
    <div role="region" aria-label="Priority incidents" tabIndex={0} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:outline-cyan-300">
      {groups.flatMap(g => g.incidents).map(card)}
      {!count && <p role="status" className="p-8 text-center text-xs text-slate-300">{report.incidents.length ? 'No incidents match your search.' : 'No active incidents reported.'}</p>}
    </div>
  </>;
  return <>
    <div className="space-y-3 border-b border-white/10 p-4">
      <HealthSearch label="Search incidents" placeholder="Incident, service, impact or accountable team…" value={query} onChange={setQuery}/>
      <div className="grid gap-3 @min-[500px]:grid-cols-3">
        <label className={auditFieldClass}>Incident state<AuditSelect aria-label="Incident state" value={state} onChange={e => setState(e.target.value)}><option value="ALL">All states</option><option value="INVESTIGATING">Investigating</option><option value="MONITORING">Monitoring</option></AuditSelect></label>
        <label className={auditFieldClass}>Severity<AuditSelect aria-label="Incident severity" value={severity} onChange={e => setSeverity(e.target.value)}><option value="ALL">All severities</option><option value="CRITICAL">Critical</option><option value="WARNING">Warning</option></AuditSelect></label>
        <label className={auditFieldClass}>Group by<AuditSelect aria-label="Group incidents by" value={group} onChange={e => {setGroup(e.target.value as IncidentGrouping); setCollapsed(new Set());}}><option value="STATE">State</option><option value="SEVERITY">Severity</option><option value="DOMAIN">Domain</option><option value="OWNER">Accountable team</option></AuditSelect></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-[11px] text-slate-300">{count} / {report.incidents.length} incidents · {groups.length} groups</p><div className="flex gap-2"><ActionButton variant="blue" size="small" autoWidth onClick={reset}>Reset filters</ActionButton><ActionButton variant="blue" size="small" autoWidth disabled={!groups.length} onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(groups.map(g => g.key)))}>{allCollapsed ? 'Expand all' : 'Collapse all'}</ActionButton></div></div>
    </div>
    <div role="region" aria-label="Incident results" tabIndex={0} className={`${healthScrollClass} h-[min(38rem,70dvh)]`}>
      {groups.map((g, index) => <section key={g.key} aria-label={labels[g.key] ?? g.key}>
        <button type="button" aria-expanded={!collapsed.has(g.key)} aria-controls={`${id}-${index}`} className="sticky top-0 z-10 flex min-h-12 w-full items-center justify-between gap-3 border-b border-white/10 bg-[#0b172b] px-4 py-3 text-left text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-cyan-300" onClick={() => setCollapsed(current => {const next = new Set(current); if (next.has(g.key)) next.delete(g.key); else next.add(g.key); return next;})}><span>{labels[g.key] ?? g.key} <span className="ml-2 rounded-md bg-white/10 px-2 py-1 text-cyan-200">{g.incidents.length}</span></span><ChevronDown size={14} className={collapsed.has(g.key) ? '-rotate-90' : ''}/></button>
        {!collapsed.has(g.key) && <div id={`${id}-${index}`} className="grid gap-3 p-4 @min-[850px]:grid-cols-2">{g.incidents.map(card)}</div>}
      </section>)}
      {!count && <p role="status" className="p-8 text-center text-xs text-slate-300">{report.incidents.length ? 'No incidents match these filters.' : 'No active incidents reported.'}</p>}
    </div>
  </>;
}
