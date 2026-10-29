"use client";
import { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, Gift, Plus, RefreshCw, ShieldAlert, UserPlus, Users, X } from 'lucide-react';
import { useUser } from '@/app/context/UserContext';
import { useReferrals } from '@/app/lib/referrals/use-referrals';
import type { ReferralCommand } from '@/app/lib/referrals/contracts';
import { REFERRAL_STATUSES, type ReferralFilters } from '@/app/lib/types/admin/referrals';
import { filterReferrals, referralLeaderboard, referralMoney, searchReferralRecords } from '@/app/lib/referrals/engine';
import PageHeader from '../../PageHeader';
import CardSurface from '../../CardSurface';
import MetricCard from '../../MetricCard';
import { ActionButton } from '../../dashboard/ActionButton';
import { SocialPagination, SocialSearch } from '../../friends/SocialListControls';
import { notifyOperation } from '../../OperationNotification';
import { AuditPanel, AuditSelect, EmptyAudit, auditBadge, auditDate, auditFieldClass } from '../audit/presentation';
import { buttonClass } from '../risk/RiskUI';
import ReferralCharts from './ReferralCharts';
import ReferralLedger from './ReferralLedger';
import ReferrerLeaderboard from './ReferrerLeaderboard';
import ReferralInsights from './ReferralInsights';
import ReferralOperationDialog, { type ReferralIntent } from './ReferralOperationDialog';
import { referralActionLabels, referralStatusLabels } from './presentation';

const defaults: ReferralFilters = {query: '', status: 'ALL', range: '90D'};
export default function ReferralsWorkspace() {
  const {user, loading} = useUser();
  if (loading || !user) return null;
  if (user.role !== 'admin') return <CardSurface className="p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-rose-300"/><h1>Administrator access required</h1><Link href="/dashboard" className={`${buttonClass} mt-4`}>Return to dashboard</Link></CardSurface>;
  return <Workspace actor={user}/>;
}
function Workspace({actor}: {actor: {email: string; role: 'admin' | 'client'}}) {
  const source = useReferrals(actor);
  if (!source.snapshot) return <div className="space-y-5"><PageHeader statusText="Referrals"/><CardSurface className="p-6"><p role={source.warning ? 'alert' : 'status'} className="text-sm text-slate-300">{source.warning ?? 'Loading the referral registry…'}</p><ActionButton className="mt-4" autoWidth variant="blue" disabled={source.loading} onClick={() => void source.refresh()}>Retry loading</ActionButton></CardSurface></div>;
  return <Portfolio source={source}/>;
}
function Portfolio({source}: {source: ReturnType<typeof useReferrals>}) {
  const snapshot = source.snapshot!, {state, policy} = snapshot, report = state.report;
  const [filters, setFilters] = useState<ReferralFilters>(defaults), [tab, setTab] = useState('overview');
  const [selectedReferrer, setSelectedReferrer] = useState('ALL'), [rewardStatus, setRewardStatus] = useState('ALL');
  const [ledgerQuery, setLedgerQuery] = useState(''), [auditQuery, setAuditQuery] = useState(''), [auditPage, setAuditPage] = useState(1);
  const [intent, setIntent] = useState<ReferralIntent | null>(null), [exporting, setExporting] = useState(false);
  const exportLock = useRef(false);
  const blocked = !!source.warning || source.loading;
  const records = filterReferrals(report, filters), leaders = referralLeaderboard(report, records);
  const registered = records.filter(r => !!r.registered_at).length, qualified = records.filter(r => r.status === 'QUALIFIED').length;
  const total = (status: string) => records.filter(r => r.reward_status === status).reduce((n, r) => n + r.reward_minor, 0);
  const registry = records.filter(r => selectedReferrer === 'ALL' || r.referrer_id === selectedReferrer);
  const rewardRecords = registry.filter(r => r.reward_status !== 'NONE' && (rewardStatus === 'ALL' || r.reward_status === rewardStatus));
  const exportRecords = searchReferralRecords(tab === 'rewards' ? rewardRecords : registry, report, ledgerQuery);
  const history = state.audit.filter(e => `${e.action} ${e.actor} ${e.reason} ${e.target}`.toLowerCase().includes(auditQuery.trim().toLowerCase()));
  const currentAudit = Math.min(auditPage, Math.max(1, Math.ceil(history.length / 8)));
  const update = <K extends keyof ReferralFilters>(key: K, value: ReferralFilters[K]) => setFilters(previous => ({...previous, [key]: value}));
  const reset = () => {setFilters(defaults); setSelectedReferrer('ALL'); setRewardStatus('ALL'); setLedgerQuery('');};
  async function confirm(command: ReferralCommand) {
    try {await source.execute(command); notifyOperation(referralActionLabels[command.action], command.action === 'REQUEST_PAYOUT' ? 'Payout request recorded. The reward remains queued until payment processing confirms settlement.' : 'The shared referral registry and audit evidence have been updated.', false, 'Referrals');}
    catch (cause) {notifyOperation('Referral operation failed', cause instanceof Error ? cause.message : 'Unable to save the operation.', true, 'Referrals'); throw cause;}
  }
  async function exportReport() {
    if (blocked || exportLock.current) return; exportLock.current = true; setExporting(true);
    const leaderboard = tab === 'leaders';
    const rows = leaderboard ? [['Referrer', 'User ID', 'Code', 'Invited', 'Registered', 'Qualified', 'Paid EUR minor', 'Pending EUR minor', 'Held EUR minor', 'Queued EUR minor'], ...leaders.map(r => [r.referrer.name, r.referrer.user_id, r.referrer.referral_code, r.invited, r.registered, r.qualified, r.paid_minor, r.pending_minor, r.held_minor, r.queued_minor])] : [['Referral', 'Referrer', 'Invitee', 'Invitee email', 'Status', 'Invited UTC', 'Registered UTC', 'Reward EUR minor', 'Reward status'], ...exportRecords.map(r => [r.id, r.referrer_id, r.invitee_name, r.invitee_email, r.status, r.invited_at, r.registered_at, r.reward_minor, r.reward_status])];
    try {
      await source.execute({request_id: crypto.randomUUID(), action: 'EXPORT', expected_revision: state.revision, reason: 'Export filtered referral records for campaign operations review.', kind: leaderboard ? 'leaderboard' : 'referrals', record_ids: leaderboard ? leaders.map(r => r.referrer.id) : exportRecords.map(r => r.id)});
      const cell = (v: unknown) => {let s = String(v ?? ''); if (/^\s*[=+@-]/.test(s)) s = `'${s}`; return `"${s.replaceAll('"', '""')}"`;};
      const url = URL.createObjectURL(new Blob([rows.map(row => row.map(cell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'}));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `referrals-${leaderboard ? 'leaderboard' : 'registry'}.csv`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notifyOperation('Report exported', `${rows.length - 1} records exported with audit evidence.`, false, 'Referrals');
    } catch (cause) {notifyOperation('Export failed', cause instanceof Error ? cause.message : 'Unable to prepare the report.', true, 'Referrals');}
    finally {exportLock.current = false; setExporting(false);}
  }
  return <div className="w-full min-w-0 space-y-5 font-mono text-white">
    <h1 className="sr-only">Referrals</h1>
    <PageHeader statusText="Referrals" wrapActions><ActionButton autoWidth variant="blue" disabled={source.loading} icon={<RefreshCw size={14} className={source.loading ? 'animate-spin' : ''}/>} onClick={() => void source.refresh()}>Refresh</ActionButton><ActionButton autoWidth variant="blue" disabled={blocked || exporting || !(tab === 'leaders' ? leaders.length : exportRecords.length)} icon={<Download size={14}/>} onClick={() => void exportReport()}>{exporting ? 'Preparing…' : tab === 'leaders' ? 'Export leaderboard' : 'Export referrals'}</ActionButton><ActionButton autoWidth variant="cyan" disabled={blocked || !policy.program_enabled || !snapshot.eligible_referrer_ids.length} icon={<Plus size={14}/>} onClick={() => setIntent({action: 'INVITE'})}>Record invitation</ActionButton></PageHeader>
    {source.warning && <p role="alert" className="rounded-xl border border-rose-400/20 p-4 text-xs text-rose-200">{source.warning}</p>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard compact tone="blue" title="Invitations" value={records.length} icon={UserPlus} subtext={`${leaders.length} referrers in this cohort`}/><MetricCard compact tone="cyan" title="Registered customers" value={registered} icon={Users} subtext={`${records.length ? (registered / records.length * 100).toFixed(1) : '0.0'}% of scoped invitations`}/><MetricCard compact tone="purple" title="Qualified referrals" value={qualified} icon={CheckCircle2} subtext={`${records.length ? (qualified / records.length * 100).toFixed(1) : '0.0'}% qualified · campaign criteria met`}/><MetricCard compact tone="amber" title="Rewards paid" value={referralMoney(total('PAID'))} icon={Gift} subtext={`${referralMoney(total('PENDING'))} pending · ${referralMoney(total('QUEUED'))} queued`}/></div>
    <AuditPanel title="Referral scope" subtitle="Portfolio filters apply to metrics, charts and leaderboard. Referrer and reward filters below refine ledger rows and exports." action={<ActionButton autoWidth variant="blue" icon={<X size={13}/>} onClick={reset}>Reset filters</ActionButton>}>
      <div className="grid items-end gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4"><div className="space-y-2 sm:col-span-2 [&>div]:max-w-none"><label className={auditFieldClass}>Search referral portfolio</label><SocialSearch label="Search referral portfolio" placeholder="Name, email, customer ID or referral code…" value={filters.query} onChange={value => update('query', value)}/></div><label className={auditFieldClass}>Invitation period<AuditSelect aria-label="Invitation period" value={filters.range} onChange={e => update('range', e.target.value as ReferralFilters['range'])}><option value="30D">Last 30 days</option><option value="90D">Last 90 days</option><option value="ALL">All available history</option></AuditSelect></label><label className={auditFieldClass}>Referral status<AuditSelect aria-label="Referral status" value={filters.status} onChange={e => update('status', e.target.value)}><option value="ALL">All statuses</option>{REFERRAL_STATUSES.map(s => <option key={s} value={s}>{referralStatusLabels[s]}</option>)}</AuditSelect></label></div>
    </AuditPanel>
    <nav aria-label="Referral workspace views" className="scrollbar-thin flex min-w-0 gap-2 overflow-x-auto pb-1">{[['overview', 'Overview'], ['leaders', 'Referrer leaderboard'], ['registry', 'Referral registry'], ['rewards', 'Rewards & review'], ['analytics', 'Analytics'], ['audit', 'Operations audit']].map(([key, label]) => <ActionButton key={key} variant={tab === key ? 'cyan' : 'blue'} autoWidth className="shrink-0" labelClassName="whitespace-nowrap" aria-pressed={tab === key} onClick={() => {setTab(key); setLedgerQuery('');}}>{label}</ActionButton>)}</nav>
    {tab === 'overview' && <ReferralInsights records={records} leaders={leaders} snapshot={snapshot} onReview={() => {setTab('rewards'); setRewardStatus('HELD'); setLedgerQuery('');}} onInspect={id => {setSelectedReferrer(id); setLedgerQuery(''); setTab('registry');}}/>}
    {tab === 'leaders' && <ReferrerLeaderboard key={JSON.stringify(filters)} rows={leaders} onInspect={id => {setSelectedReferrer(id); setLedgerQuery(''); setTab('registry');}}/>}
    {(tab === 'registry' || tab === 'rewards') && <><div className="grid items-end gap-3 sm:grid-cols-2"><label className={auditFieldClass}>Referrer<AuditSelect searchable aria-label="Filter referrer" value={selectedReferrer} onChange={e => {setSelectedReferrer(e.target.value); setLedgerQuery('');}}><option value="ALL">All referrers</option>{report.referrers.map(r => <option key={r.id} value={r.id}>{r.name} · {r.referral_code}</option>)}</AuditSelect></label>{tab === 'rewards' && <label className={auditFieldClass}>Reward state<AuditSelect aria-label="Reward state" value={rewardStatus} onChange={e => setRewardStatus(e.target.value)}><option value="ALL">All earned rewards</option>{['PENDING', 'HELD', 'QUEUED', 'PAID'].map(s => <option key={s} value={s}>{s}</option>)}</AuditSelect></label>}</div><ReferralLedger key={`${tab}:${selectedReferrer}:${rewardStatus}:${JSON.stringify(filters)}`} records={tab === 'rewards' ? rewardRecords : registry} report={report} terms={state.terms} blocked={blocked} eligible={snapshot.eligible_referrer_ids} rewardsOnly={tab === 'rewards'} query={ledgerQuery} onQueryChange={setLedgerQuery} onAction={setIntent}/></>}
    {tab === 'analytics' && <ReferralCharts report={report} records={records} leaderboard={leaders} range={filters.range}/>}
    {tab === 'audit' && <AuditPanel title="Referral operations audit" subtitle="Complete operational history across the registry. Portfolio cohort filters do not hide audit evidence."><div className="border-b border-white/10 p-4 [&>div]:max-w-none"><SocialSearch label="Search referral audit" placeholder="Action, operator, referral ID or reason…" value={auditQuery} onChange={value => {setAuditQuery(value); setAuditPage(1);}}/></div><div className="scrollbar-thin max-h-[32rem] divide-y divide-white/5 overflow-y-auto">{history.slice((currentAudit - 1) * 8, currentAudit * 8).map(e => <article key={e.id} className="space-y-2 p-4 text-xs"><div className="flex flex-wrap justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-cyan-200">{e.action.replaceAll('_', ' ')}</h2><span className={auditBadge(e.origin)}>{e.origin === "DEMO" ? "DEMO" : e.origin === "SERVER" ? "SERVER" : "RECORDED"}</span>{e.evidenceKind === "SNAPSHOT" && <span className={auditBadge("SNAPSHOT")}>SNAPSHOT</span>}</div><span className="text-[10px] text-slate-400">{auditDate(e.timestamp)}</span></div><p className="break-all text-[10px] text-slate-400">{e.actor} · {e.target}</p><p className="break-words leading-relaxed text-slate-300">{e.reason}</p><details className="text-[10px] text-slate-400"><summary className="cursor-pointer text-cyan-300">Before / after evidence</summary><pre className="scrollbar-thin mt-2 max-h-64 overflow-auto rounded-lg bg-black/20 p-3">{JSON.stringify({before: e.before, after: e.after}, null, 2)}</pre></details></article>)}</div>{!history.length && <EmptyAudit text="No referral operations match this search."/>}<SocialPagination label="Referral audit" total={history.length} page={currentAudit} pageSize={8} onPageChange={setAuditPage}/></AuditPanel>}
    <footer className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-3 text-[9px] leading-relaxed text-slate-500"><span>{snapshot.mode === 'demo' ? 'Shared demo registry · no emails sent or live payouts' : 'Connected referral service'} · {policy.program_enabled ? 'Campaign accepting invitations' : 'Campaign paused'}</span><span>Revision {state.revision} · {auditDate(snapshot.as_of)}</span></footer>
    {intent && <ReferralOperationDialog key={`${intent.action}:${intent.record?.id ?? 'new'}`} intent={intent} snapshot={snapshot} onClose={() => setIntent(null)} onConfirm={confirm}/>}
  </div>;
}
