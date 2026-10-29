'use client';
import { ArrowUpRight, CalendarClock, Check, Crown, Layers3, ShieldCheck, Wallet } from 'lucide-react';
import type { Subscription, SubscriptionCustomer, SubscriptionInvoice, SubscriptionPlan } from '@/app/lib/types/admin/subscriptions';
import { money } from '@/app/lib/subscriptions/engine';
import CardSurface from '../../CardSurface';
import { ActionButton } from '../../dashboard/ActionButton';
import { AuditPanel, EmptyAudit, auditBadge, auditDate } from '../audit/presentation';

export default function SubscriptionOverview({ subscriptions, invoices, customers, plans, asOf, onInspect, onRecovery }: {
  subscriptions: Subscription[]; invoices: SubscriptionInvoice[]; customers: SubscriptionCustomer[]; plans: SubscriptionPlan[]; asOf: string;
  onInspect: (id: string) => void; onRecovery: () => void;
}) {
  const open = subscriptions.filter(s => s.status !== 'CANCELED');
  const renewals = [...open].sort((a, b) => a.period_end.localeCompare(b.period_end)).slice(0, 5);
  const overdue = invoices.filter(i => i.status !== 'PAID' && i.due_at < asOf);
  const pending = open.filter(s => s.pending_change || s.cancel_at_period_end);
  const names = new Map(customers.map(c => [c.id, c.name]));
  return <>
    <div className="grid items-stretch gap-4 lg:grid-cols-3">{plans.map((plan, index) => {
      const members = open.filter(s => s.plan_id === plan.id);
      const active = members.filter(s => s.status === 'ACTIVE').length;
      const share = open.length ? Math.round(members.length / open.length * 100) : 0;
      const Icon = index === 0 ? Layers3 : index === 1 ? ShieldCheck : Crown;
      return <CardSurface key={plan.id} tone={index === 0 ? 'blue' : index === 1 ? 'cyan' : 'purple'} className="flex flex-col p-5">
        <div className="flex items-center justify-between gap-3"><span className="rounded-xl border border-white/10 bg-black/20 p-2.5 text-cyan-200"><Icon size={18}/></span><span className={auditBadge('SNAPSHOT')}>{share}% of portfolio</span></div>
        <h2 className="mt-4 text-base font-semibold">{plan.name}</h2><p className="mt-1 text-[11px] leading-relaxed text-slate-400">{plan.description}</p>
        <div className="my-5 flex items-baseline gap-2"><strong className="text-3xl tracking-tight">{members.length}</strong><span className="text-[11px] text-slate-400">open subscriptions</span></div>
        <div role="meter" aria-label={`${plan.name} portfolio share`} aria-valuenow={share} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-300/70" style={{width: `${share}%`}}/></div>
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-[10px]"><span className="text-emerald-200">{active} active</span><span className="text-slate-400">{money(plan.monthly_minor)} / month</span></div>
      </CardSurface>;
    })}</div>
    <div className="grid items-start gap-4 xl:grid-cols-[1.3fr_1fr]">
      <AuditPanel title="Upcoming renewals" subtitle="Earliest open contract dates in the selected portfolio. Overdue dates remain visible until billing processes the renewal.">
        <div className="divide-y divide-white/5">{renewals.map(s => <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex min-w-0 flex-1 items-start gap-3"><CalendarClock size={16} className="mt-1 shrink-0 text-cyan-300"/><div className="min-w-0"><p className="break-words text-xs font-semibold">{names.get(s.customer_id) ?? s.customer_id}</p><p className="mt-1 text-[10px] text-slate-400">{s.plan_id} · {s.cycle.toLowerCase()} · {money(s.price_minor)}</p><p className="mt-1 text-[10px] text-slate-400">{auditDate(s.period_end).split(',')[0]}{s.cancel_at_period_end ? ' · Cancellation scheduled' : s.pending_change ? ` · Changing to ${s.pending_change.plan_id}` : ''}</p></div></div><ActionButton variant="blue" autoWidth aria-label={`Inspect ${names.get(s.customer_id) ?? s.id}`} onClick={() => onInspect(s.id)} icon={<ArrowUpRight size={14}/>}>Inspect</ActionButton></div>)}</div>
        {!renewals.length && <EmptyAudit text="No upcoming renewals in this scope."/>}
      </AuditPanel>
      <div className="space-y-4">
        <CardSurface tone="amber" className="p-5"><div className="flex items-center gap-3"><Wallet size={18} className="text-amber-200"/><h2 className="text-sm font-semibold">Payment recovery</h2></div><p className="mt-4 text-2xl font-bold">{money(overdue.reduce((sum, i) => sum + i.amount_minor, 0))}</p><p className="mt-2 text-[11px] leading-relaxed text-slate-400">{overdue.length} overdue invoices · {overdue.filter(i => !!i.retry_requested_at).length} retry requests recorded</p><ActionButton variant="amber" className="mt-5" fullWidth disabled={!overdue.length} onClick={onRecovery}>Review overdue invoices</ActionButton></CardSurface>
        <AuditPanel title="Scheduled changes" subtitle={`${pending.length} contracts with a plan change or cancellation at renewal.`}><div className="space-y-3 p-4">{pending.slice(0, 4).map(s => <button key={s.id} onClick={() => onInspect(s.id)} className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-xs hover:border-cyan-400/40 focus-visible:outline-2 focus-visible:outline-cyan-300"><span className="min-w-0"><span className="block break-words">{names.get(s.customer_id) ?? s.customer_id}</span><span className="mt-1 block text-[10px] text-slate-400">{s.cancel_at_period_end ? 'Cancellation at renewal' : `Next plan: ${s.pending_change?.plan_id}`}</span></span><ArrowUpRight size={14} className="shrink-0 text-cyan-300"/></button>)}{!pending.length && <p className="flex items-center gap-2 text-[11px] text-slate-400"><Check size={14} className="text-emerald-300"/>No scheduled changes in this scope.</p>}</div></AuditPanel>
      </div>
    </div>
  </>;
}
