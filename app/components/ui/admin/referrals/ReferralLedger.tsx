'use client';
import { useState } from 'react';
import { ArrowUpRight, CirclePause, Send, UnlockKeyhole } from 'lucide-react';
import type { ReferralRecord, ReferralReport } from '@/app/lib/types/admin/referrals';
import type { ReferralState } from '@/app/lib/referrals/contracts';
import { rewardActions } from '@/app/lib/referrals/operations';
import { referralMoney, searchReferralRecords } from '@/app/lib/referrals/engine';
import { ActionButton } from '../../dashboard/ActionButton';
import { SocialPagination, SocialSearch } from '../../friends/SocialListControls';
import { AuditPanel, EmptyAudit } from '../audit/presentation';
import { referralActionLabels, referralBadge, referralDate, referralStatusLabels } from './presentation';
import type { ReferralIntent } from './ReferralOperationDialog';

export default function ReferralLedger({records, report, terms, blocked, eligible, rewardsOnly, onAction, query, onQueryChange}: {
  records: ReferralRecord[]; report: ReferralReport; terms: ReferralState['terms']; blocked: boolean; eligible: string[]; rewardsOnly: boolean;
  onAction: (intent: ReferralIntent) => void; query: string; onQueryChange: (value: string) => void;
}) {
  const [page, setPage] = useState(1);
  const referrers = new Map(report.referrers.map(r => [r.id, r]));
  const rows = searchReferralRecords(records, report, query);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / 10))), visible = rows.slice((current - 1) * 10, current * 10);
  const actions = (r: ReferralRecord, mobile = false) => <div className={`flex flex-wrap gap-2 ${mobile ? 'pt-2' : 'min-w-40'}`}>{rewardActions(r).map(action => <ActionButton key={action} variant={action === 'HOLD_REWARD' ? 'amber' : 'cyan'} autoWidth size={mobile ? 'medium' : 'small'} disabled={blocked || (action === 'REQUEST_PAYOUT' && !eligible.includes(r.referrer_id))} title={action === 'REQUEST_PAYOUT' && !eligible.includes(r.referrer_id) ? 'Referrer must be eligible for the campaign' : undefined} icon={action === 'HOLD_REWARD' ? <CirclePause size={13}/> : action === 'RELEASE_REWARD' ? <UnlockKeyhole size={13}/> : <Send size={13}/>} onClick={() => onAction({action, record: r})}>{referralActionLabels[action]}</ActionButton>)}{!rewardActions(r).length && <span className="text-[10px] text-slate-500">{r.reward_status === 'QUEUED' ? 'Awaiting payment processing' : r.reward_status === 'PAID' ? 'Settled historical reward' : r.status === 'REJECTED' ? 'Attribution rejected' : 'Awaiting qualification'}</span>}</div>;
  const reward = (r: ReferralRecord) => <div className="space-y-2"><p className="whitespace-nowrap font-semibold text-slate-100">{r.reward_status === 'NONE' ? 'Not earned' : referralMoney(r.reward_minor)}</p>{r.reward_status !== 'NONE' ? <span className={referralBadge(r.reward_status)}>{r.reward_status}</span> : <p className="text-[10px] text-slate-500">{r.status === 'REJECTED' ? 'No reward due' : `${referralMoney(terms[r.id].reward_minor)} if qualified`}</p>}</div>;
  return <AuditPanel title={rewardsOnly ? 'Reward review & payout queue' : 'Referral registry'} subtitle={rewardsOnly ? 'Hold or release unpaid rewards and submit payout requests. Queued amounts are not counted as paid.' : 'Attribution, registration and qualification in the selected cohort. Campaign terms are preserved per invitation.'}>
    <div className="border-b border-white/10 p-4 [&>div]:max-w-none"><SocialSearch label={rewardsOnly ? 'Search reward records' : 'Search referral records'} placeholder="Customer, referrer, referral ID or reason…" value={query} onChange={value => {onQueryChange(value); setPage(1);}}/></div>
    <div tabIndex={0} role="region" aria-label="Scrollable referral registry" className="scrollbar-thin hidden max-h-[32rem] overflow-auto overscroll-contain md:block">
      <table className="w-full min-w-[1000px] text-left text-[11px]"><caption className="sr-only">Filtered referral records and reward operations.</caption><thead className="sticky top-0 z-20 bg-[#0a1427] text-[9px] uppercase text-cyan-300"><tr>{['Referred customer', 'Referrer', 'Timeline', 'Qualification', 'Reward', 'Operations'].map(label => <th key={label} scope="col" className={`px-3 py-3 ${label === 'Operations' ? 'sticky right-0 bg-[#0a1427]' : ''}`}>{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/5">{visible.map(r => <tr key={r.id} className="hover:bg-white/[0.02]">
          <td className="px-3 py-3"><p className="font-semibold">{r.invitee_name}</p><p className="mt-1 text-[10px] text-slate-400">{r.invitee_email}</p><p className="mt-1 text-[9px] text-slate-500">{r.id} · {r.invitee_id ?? 'Not registered'}</p></td>
          <td className="px-3 py-3"><p>{referrers.get(r.referrer_id)?.name}</p><p className="mt-1 text-[9px] text-cyan-300">{referrers.get(r.referrer_id)?.referral_code}</p></td>
          <td className="whitespace-nowrap px-3 py-3 text-[10px] text-slate-400"><p>Invited {referralDate(r.invited_at)}</p><p className="mt-1">Joined {referralDate(r.registered_at)}</p><p className="mt-1">Qualified {referralDate(r.qualified_at)}</p></td>
          <td className="max-w-52 px-3 py-3"><span className={referralBadge(r.status)}>{referralStatusLabels[r.status]}</span><p className="mt-2 text-[10px] leading-relaxed text-slate-400">{r.rejection_reason ?? (r.status === 'QUALIFIED' ? 'Campaign criteria met' : `Qualification window: ${terms[r.id].qualification_days} days`)}</p></td>
          <td className="px-3 py-3">{reward(r)}</td><td className="sticky right-0 border-l border-white/5 bg-[#0a1427] px-3 py-3">{actions(r)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="scrollbar-thin max-h-[36rem] divide-y divide-white/5 overflow-y-auto md:hidden">{visible.map(r => <article key={r.id} className="space-y-3 p-4 text-xs"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words font-semibold">{r.invitee_name}</h3><span className={referralBadge(r.status)}>{referralStatusLabels[r.status]}</span></div><p className="break-all text-[10px] text-slate-400">{r.invitee_email} · {r.id}</p><p className="flex items-center gap-2 text-[10px] text-cyan-200"><ArrowUpRight size={13} className="shrink-0"/>{referrers.get(r.referrer_id)?.name}</p><dl className="grid grid-cols-2 gap-3 text-[10px]"><div><dt className="text-slate-500">Invited</dt><dd className="mt-1">{referralDate(r.invited_at)}</dd></div><div><dt className="text-slate-500">Registered</dt><dd className="mt-1">{referralDate(r.registered_at)}</dd></div></dl>{r.rejection_reason && <p className="text-[10px] text-rose-200">{r.rejection_reason}</p>}<div className="border-t border-white/5 pt-3">{reward(r)}</div>{actions(r, true)}</article>)}</div>
    {!rows.length && <EmptyAudit text="No records match. Adjust your search or portfolio filters."/>}
    <SocialPagination label={rewardsOnly ? 'Reward records' : 'Referral records'} total={rows.length} page={current} pageSize={10} onPageChange={setPage}/>
  </AuditPanel>;
}
