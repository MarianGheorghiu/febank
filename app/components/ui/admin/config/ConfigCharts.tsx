'use client';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CONFIG_FLAGS, CONFIG_SETTINGS } from '@/app/lib/flags-config/catalog';
import { configChanges } from '@/app/lib/flags-config/engine';
import type { ConfigPayload, EnvironmentConfig } from '@/app/lib/types/admin/flags-config';
import { AuditPanel } from '../audit/presentation';
import { modules } from './presentation';
const tooltip = {background: '#0b172b', border: '1px solid #334155', borderRadius: 10, fontSize: 11, color: '#f1f5f9'};
export default function ConfigCharts({payload, current, asOf}: {payload: ConfigPayload; current: EnvironmentConfig; asOf: string}) {
  const domains = Object.entries(modules).map(([key, module]) => {
    const flags = CONFIG_FLAGS.filter(f => f.module === key), rules = flags.map(f => payload.flags[f.key]);
    return {name: module.name, full: rules.filter(r => r.enabled && r.rollout_pct === 100 && r.audience === 'all').length, targeted: rules.filter(r => r.enabled && r.rollout_pct > 0 && (r.rollout_pct < 100 || r.audience !== 'all')).length, off: rules.filter(r => !r.enabled || r.rollout_pct === 0).length};
  });
  const activity = useMemo(() => {
    const end = Date.parse(`${asOf.slice(0, 10)}T00:00:00Z`);
    return Array.from({length: 14}, (_, index) => {
      const date = new Date(end - (13 - index) * 86400000).toISOString().slice(0, 10), releases = current.releases.filter(r => r.timestamp.startsWith(date));
      const changes = releases.flatMap(r => configChanges(r.before, r.after));
      return {date, label: new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'}).format(new Date(`${date}T00:00:00Z`)), standard: changes.filter(c => !c.critical).length, critical: changes.filter(c => c.critical).length, releases: releases.length};
    });
  }, [current, asOf]);
  return <div className="grid items-stretch gap-4 @min-[1100px]:grid-cols-2">
    <AuditPanel className="flex h-[32rem] min-h-0 flex-col [&>header]:shrink-0" title="Feature availability by domain" subtitle="Configured flag counts before customer evaluation. Targeted includes audience restrictions and partial rollouts.">
      <div className="min-h-0 min-w-0 flex-1 px-2 py-4"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width: 400, height: 350}}><BarChart layout="vertical" data={domains} margin={{top: 0, right: 20, bottom: 0, left: 0}} barSize={13} accessibilityLayer><CartesianGrid stroke="#1e293b" horizontal={false}/><XAxis type="number" allowDecimals={false} tick={{fill: '#94a3b8', fontSize: 10}}/><YAxis type="category" dataKey="name" width={140} tick={{fill: '#cbd5e1', fontSize: 10}} tickLine={false} axisLine={false}/><Tooltip contentStyle={tooltip} cursor={{fill: '#ffffff06'}}/><Bar name="Full audience" dataKey="full" stackId="flags" fill="#22d3ee" isAnimationActive={false}/><Bar name="Targeted rollout" dataKey="targeted" stackId="flags" fill="#a78bfa" isAnimationActive={false}/><Bar name="Disabled / 0%" dataKey="off" stackId="flags" fill="#475569" radius={[0, 4, 4, 0]} isAnimationActive={false}/></BarChart></ResponsiveContainer></div>
      <div className="flex shrink-0 flex-wrap gap-4 border-t border-white/10 p-4 text-[11px]"><span className="text-cyan-200">● Full audience</span><span className="text-purple-200">● Targeted rollout</span><span className="text-slate-300">● Disabled / 0%</span></div>
    </AuditPanel>
    <AuditPanel className="flex h-[32rem] min-h-0 flex-col [&>header]:shrink-0" title="Release activity · 14 days" subtitle="Published key changes per UTC day in the selected environment. Draft edits are excluded.">
      <div className="min-h-0 min-w-0 flex-1 p-3"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width: 400, height: 350}}><BarChart data={activity} margin={{top: 20, right: 10, left: -20, bottom: 0}} accessibilityLayer><CartesianGrid stroke="#1e293b" vertical={false}/><XAxis dataKey="label" minTickGap={30} tick={{fill: '#94a3b8', fontSize: 10}}/><YAxis allowDecimals={false} tick={{fill: '#94a3b8', fontSize: 10}}/><Tooltip contentStyle={tooltip} labelFormatter={(_, items) => items[0]?.payload?.date ? `${items[0].payload.date} UTC · ${items[0].payload.releases} releases` : ''} cursor={{fill: '#ffffff06'}}/><Bar name="Standard changes" dataKey="standard" stackId="changes" fill="#60a5fa" maxBarSize={28} isAnimationActive={false}/><Bar name="Critical changes" dataKey="critical" stackId="changes" fill="#fbbf24" maxBarSize={28} radius={[4, 4, 0, 0]} isAnimationActive={false}/></BarChart></ResponsiveContainer></div>
      <div className="flex shrink-0 flex-wrap justify-between gap-3 border-t border-white/10 p-4 text-[11px] text-slate-300"><span><span className="text-blue-200">● Standard</span> · <span className="text-amber-200">● Critical</span></span><span>{activity.reduce((n, d) => n + d.releases, 0)} releases · {CONFIG_SETTINGS.filter(s => s.critical).length} protected setting definitions</span></div>
    </AuditPanel>
  </div>;
}
