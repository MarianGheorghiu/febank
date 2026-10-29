'use client';
import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleX, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CONFIG_FLAGS } from '@/app/lib/flags-config/catalog';
import { evaluateFlag, rolloutBucket, simulateFlagCohorts } from '@/app/lib/flags-config/engine';
import { CONFIG_SIMULATION_PROFILES } from '@/app/lib/mock/admin/config-simulator';
import type { ConfigPayload, FlagRule } from '@/app/lib/types/admin/flags-config';
import { ActionButton } from '../../dashboard/ActionButton';
import { AuditPanel, AuditSelect, auditFieldClass } from '../audit/presentation';
import { Badge } from './presentation';

const audiences = {all: 'Retail', premium: 'Premium', business: 'Business', internal: 'Internal'};
const audienceNames = {all: 'All customers', premium: 'Premium members', business: 'Business customers', internal: 'Internal team'};
function explain(result: ReturnType<typeof evaluateFlag>, rule: FlagRule) {
  if (result.enabled) return 'This example customer can use the feature.';
  if (result.reason.includes('Maintenance')) return 'Platform maintenance currently pauses this feature for everyone.';
  if (result.reason.includes('master')) return 'The entire application module is paused.';
  if (!rule.enabled) return 'The feature switch is off.';
  if (result.reason.includes('Restricted')) return `Only ${audienceNames[rule.audience].toLowerCase()} are eligible.`;
  if (result.reason.includes('parent')) return 'A required parent feature is unavailable for this customer.';
  return `This customer is outside the current ${rule.rollout_pct}% rollout. Try another example or increase the draft rollout.`;
}
export default function ConfigSimulator({published, payload, dirty}: {published: ConfigPayload; payload: ConfigPayload; dirty: boolean}) {
  const [flag, setFlag] = useState('new_onboarding'), [profileId, setProfileId] = useState(CONFIG_SIMULATION_PROFILES[0].id), [size, setSize] = useState('1000');
  const profile = CONFIG_SIMULATION_PROFILES.find(p => p.id === profileId)!, definition = CONFIG_FLAGS.find(f => f.key === flag)!;
  const before = evaluateFlag(published, flag, profile.id, profile.audience), after = evaluateFlag(payload, flag, profile.id, profile.audience);
  const cohorts = useMemo(() => simulateFlagCohorts(published, payload, flag, Number(size)).map(row => ({...row, name: audiences[row.audience]})), [published, payload, flag, size]);
  const currentCohort = cohorts.find(c => c.audience === profile.audience)!;
  return <div className="space-y-5">
    <AuditPanel title="Try a feature before publishing" subtitle="Choose a feature and a fictional customer. See who would get access under the published rules and your draft."><div className="grid gap-4 p-5 @min-[650px]:grid-cols-2"><label className={auditFieldClass}>Feature to test<AuditSelect aria-label="Simulated feature" searchable value={flag} onChange={e => setFlag(e.target.value)}>{CONFIG_FLAGS.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}</AuditSelect></label><label className={auditFieldClass}>Example customer<AuditSelect aria-label="Example customer" searchable value={profileId} onChange={e => setProfileId(e.target.value)}>{CONFIG_SIMULATION_PROFILES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</AuditSelect></label><p className="text-xs leading-relaxed text-slate-300 @min-[650px]:col-span-2">{definition.description} All customers here are fictional. Simulation does not publish configuration, change eligibility records or execute operations.</p></div></AuditPanel>
    <div className="grid gap-4 @min-[1100px]:grid-cols-2">
      <AuditPanel className="flex h-[32rem] min-h-0 flex-col [&>header]:shrink-0" title="Who would get access?" subtitle="A separate fictional cohort is evaluated for each audience. Bars show the share that passes every rule." action={<label className={`${auditFieldClass} w-40`}>Examples per audience<AuditSelect aria-label="Simulation cohort size" value={size} onChange={e => setSize(e.target.value)}><option value="100">100 examples</option><option value="1000">1,000 examples</option><option value="5000">5,000 examples</option></AuditSelect></label>}>
        <div className="min-h-0 min-w-0 flex-1 p-3"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width: 400, height: 280}}><BarChart layout="vertical" data={cohorts} margin={{top: 5, right: 20, left: 0, bottom: 0}} barGap={3} accessibilityLayer><CartesianGrid stroke="#1e293b" horizontal={false}/><XAxis type="number" domain={[0, 100]} tickFormatter={n => `${n}%`} tick={{fill: '#94a3b8', fontSize: 10}}/><YAxis type="category" dataKey="name" width={65} tick={{fill: '#cbd5e1', fontSize: 11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background: '#0b172b', border: '1px solid #334155', borderRadius: 10, fontSize: 11}} formatter={value => `${Number(value).toFixed(1)}% with access`} cursor={{fill: '#ffffff06'}}/><Bar dataKey="before_pct" name="Published" fill="#60a5fa" maxBarSize={17} radius={[0, 4, 4, 0]} isAnimationActive={false}/><Bar dataKey="after_pct" name={dirty ? 'Draft preview' : 'Current preview'} fill="#22d3ee" maxBarSize={17} radius={[0, 4, 4, 0]} isAnimationActive={false}/></BarChart></ResponsiveContainer></div>
        <div className="shrink-0 space-y-3 border-t border-white/10 p-4 text-[11px] text-slate-300"><div className="flex flex-wrap gap-4"><span className="text-blue-200">● Published</span><span className="text-cyan-200">● {dirty ? 'Draft preview' : 'Current preview'}</span></div><p>{currentCohort.after_count.toLocaleString('en-GB')} of {Number(size).toLocaleString('en-GB')} fictional {audiences[profile.audience].toLowerCase()} customers would get access. This is simulated coverage, not a count of real customers.</p></div>
      </AuditPanel>
      <AuditPanel className="flex h-[32rem] min-h-0 flex-col [&>header]:shrink-0" title={`${profile.name.split(' · ')[0]}'s access`} subtitle={`${audiences[profile.audience]} example customer · ${definition.name}`} action={<Users size={18} className="text-cyan-200"/>}>
        <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto p-5"><div className="grid gap-3 @min-[600px]:grid-cols-2">{[['Published', before, published.flags[flag]], [dirty ? 'Draft preview' : 'Current preview', after, payload.flags[flag]]].map(([label, result, rule]) => {const r = result as typeof before, Icon = r.enabled ? CheckCircle2 : CircleX; return <article key={label as string} className={`rounded-xl border p-4 ${r.enabled ? 'border-teal-400/25 bg-teal-400/5' : 'border-amber-400/25 bg-amber-400/5'}`}><p className="text-[11px] text-slate-300">{label as string}</p><div className="mt-3 flex items-center gap-2"><Icon size={18} className={r.enabled ? 'text-teal-200' : 'text-amber-200'}/><h3 className="text-sm font-semibold">{r.enabled ? 'Has access' : 'No access'}</h3></div><p className="mt-3 text-xs leading-relaxed text-slate-300">{explain(r, rule as FlagRule)}</p></article>;})}</div>
          <div className="rounded-xl border border-white/10 p-4"><h3 className="text-xs font-semibold">Rules being tested</h3><dl className="mt-3 space-y-3 text-xs text-slate-300"><div className="flex flex-wrap justify-between gap-2"><dt>Feature switch</dt><dd><Badge tone={payload.flags[flag].enabled ? 'green' : 'amber'}>{payload.flags[flag].enabled ? 'On' : 'Off'}</Badge></dd></div><div className="flex flex-wrap justify-between gap-2"><dt>Eligible audience</dt><dd className="text-white">{audienceNames[payload.flags[flag].audience]}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt>Rollout target</dt><dd className="text-white">{payload.flags[flag].rollout_pct}% of eligible customers</dd></div><div className="flex flex-wrap justify-between gap-2"><dt>Platform maintenance</dt><dd className="text-white">{payload.settings['platform.maintenance'] ? 'Active — access paused' : 'Off'}</dd></div>{definition.depends_on && <div><dt>Required feature</dt><dd className="mt-1 text-white">{CONFIG_FLAGS.find(f => f.key === definition.depends_on)?.name}</dd></div>}</dl></div>
          <ActionButton variant="blue" autoWidth size="small" icon={<ArrowRight size={13}/>} onClick={() => setProfileId(CONFIG_SIMULATION_PROFILES[(CONFIG_SIMULATION_PROFILES.findIndex(p => p.id === profile.id) + 1) % CONFIG_SIMULATION_PROFILES.length].id)}>Try next example</ActionButton>
          <details className="border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-400"><summary className="cursor-pointer text-cyan-200">Technical evaluation details</summary><p className="mt-3">Stable subject: {profile.id}. Bucket {rolloutBucket(flag, profile.id)} / 9,999; target below {payload.flags[flag].rollout_pct * 100}. Cohorts use FNV-1a and stay consistent between published and draft rules. Live services derive audience from authenticated customer records.</p></details>
        </div>
      </AuditPanel>
    </div>
  </div>;
}
