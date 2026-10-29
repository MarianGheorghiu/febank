import { Crown, Layers3, ShieldCheck } from 'lucide-react';
import type { Subscription, SubscriptionPlan } from '@/app/lib/types/admin/subscriptions';
import { AuditPanel } from '../audit/presentation';

const states = [
  {key: 'ACTIVE', label: 'Active', color: 'bg-gradient-to-r from-cyan-500 to-cyan-200', dot: 'bg-cyan-300'},
  {key: 'PAST_DUE', label: 'Past due', color: 'bg-gradient-to-r from-amber-500 to-amber-200', dot: 'bg-amber-300'},
  {key: 'SUSPENDED', label: 'Suspended', color: 'bg-gradient-to-r from-violet-500 to-violet-200', dot: 'bg-violet-300'},
] as const;

export default function PlanDistribution({subscriptions, plans}: {subscriptions: Subscription[]; plans: SubscriptionPlan[]}) {
  const open = subscriptions.filter(s => s.status !== 'CANCELED');
  const rows = plans.map(plan => ({...plan, count: open.filter(s => s.plan_id === plan.id).length, segments: states.map(status => ({...status, count: open.filter(s => s.plan_id === plan.id && s.status === status.key).length}))}));
  const largest = Math.max(1, ...rows.map(r => r.count));
  const leading = [...rows].sort((a, b) => b.count - a.count)[0];
  const tied = rows.filter(r => r.count === leading?.count).length > 1;
  return <AuditPanel title="Open subscriptions by plan" subtitle="Plan adoption and benefit status across your selected portfolio. Canceled contracts are excluded.">
    <div className="p-4 sm:p-5">
      <div className="mb-6 grid grid-cols-2 gap-3 border-b border-white/10 pb-5">
        <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Open subscriptions</p><p className="mt-2 text-3xl font-semibold tracking-tight text-white">{open.length}<span className="ml-2 text-[10px] font-normal text-slate-500">across {plans.length} plans</span></p></div>
        <div className="border-l border-white/10 pl-4"><p className="text-[10px] uppercase tracking-wider text-slate-400">Largest share</p><p className="mt-2 text-lg font-semibold text-cyan-200">{open.length ? `${Math.round((leading?.count ?? 0) / open.length * 100)}%` : '—'}</p><p className="mt-1 text-[10px] text-slate-400">{open.length ? tied ? 'Shared across leading plans' : leading.name : 'No subscriptions in scope'}</p></div>
      </div>
      <div className="space-y-6" role="img" aria-label={`Plan distribution: ${rows.map(r => `${r.name}: ${r.count} open, ${r.segments.map(s => `${s.count} ${s.label.toLowerCase()}`).join(', ')}`).join('; ')}`}>
        {rows.map((row, index) => {const Icon = index === 0 ? Layers3 : index === 1 ? ShieldCheck : Crown; return <div key={row.id}>
          <div className="mb-2.5 flex items-center justify-between gap-3"><span className="flex items-center gap-2.5 text-xs font-semibold text-slate-100"><span className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-cyan-200"><Icon size={14}/></span>{row.name}</span><span className="flex items-baseline gap-2"><strong className="text-sm text-white">{row.count}</strong><span className="text-[10px] text-slate-400">{open.length ? Math.round(row.count / open.length * 100) : 0}%</span></span></div>
          <div className="h-5 rounded-lg border border-white/5 bg-white/[0.025] p-0.5"><div className="flex h-full gap-0.5 overflow-hidden rounded-md" style={{width: `${row.count / largest * 100}%`}}>{row.segments.filter(s => s.count > 0).map(s => <span key={s.key} title={`${row.name} · ${s.label}: ${s.count}`} className={`h-full min-w-0 ${s.color}`} style={{flex: s.count}}/>)}</div></div>
          <p className="mt-2 text-[9px] text-slate-500">{row.segments.map(s => `${s.count} ${s.label.toLowerCase()}`).join(' · ')}</p>
        </div>;})}
      </div>
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4">{states.map(s => <span key={s.key} className="flex items-center gap-2 text-[10px] text-slate-400"><span className={`h-2 w-2 rounded-sm ${s.dot}`}/>{s.label}</span>)}</div>
    </div>
  </AuditPanel>;
}
