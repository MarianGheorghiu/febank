'use client';
import { useEffect, useState } from 'react';
import { Check, Copy, RefreshCw, Users } from 'lucide-react';
import type { CustomerReferralSummary } from '@/app/lib/referrals/contracts';
import { getCustomerReferralSummary } from '@/app/lib/referrals/repository';
import { referralMoney } from '@/app/lib/referrals/engine';
import CardSurface from '../CardSurface';
import { ActionButton } from '../dashboard/ActionButton';

export default function CustomerReferrals({email}: {email: string}) {
  const [summary, setSummary] = useState<CustomerReferralSummary | null>(null), [error, setError] = useState(''), [reload, setReload] = useState(0), [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true, generation = 0;
    const controller = new AbortController();
    const load = async () => {const current = ++generation; try {const next = await getCustomerReferralSummary(email, controller.signal); if (active && current === generation) {setSummary(next); setError('');}} catch (cause) {if (active && current === generation) setError(cause instanceof Error ? cause.message : 'Referral rewards unavailable.');}};
    void load();
    const events = ['mbank:referrals-updated', 'mbank:risk-updated', 'mbank:users-updated', 'mbank:config-updated', 'mbank:subscriptions-updated', 'storage', 'focus'];
    events.forEach(e => window.addEventListener(e, load));
    return () => {active = false; controller.abort(); events.forEach(e => window.removeEventListener(e, load));};
  }, [email, reload]);
  return <CardSurface tone="purple" className="p-5"><header className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Users size={18} className="text-purple-200"/><h2 className="text-sm font-semibold">Your referral rewards</h2></div><ActionButton variant="blue" autoWidth aria-label="Refresh referral rewards" icon={<RefreshCw size={14}/>} onClick={() => setReload(r => r + 1)}>Refresh</ActionButton></header>
    {error ? <p role="alert" className="mt-4 text-xs text-rose-200">{error}</p> : !summary ? <p role="status" className="mt-4 text-xs text-slate-400">Loading your referral rewards…</p> : <>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><div><p className="text-[11px] text-slate-400">Your referral code</p><div className="mt-2 flex flex-wrap items-center gap-3"><code className="break-all text-lg font-semibold text-cyan-200">{summary.referral_code ?? 'No code assigned'}</code>{summary.referral_code && <ActionButton variant="cyan" autoWidth size="medium" icon={copied ? <Check size={13}/> : <Copy size={13}/>} onClick={async () => {try {await navigator.clipboard.writeText(summary.referral_code!); setCopied(true);} catch {setError('Could not copy the code. You can select and copy it manually.');}}}>{copied ? 'Copied' : 'Copy code'}</ActionButton>}</div><p className="mt-3 text-[11px] leading-relaxed text-slate-400">{summary.program_available ? 'Your code is eligible for the current referral campaign.' : 'New invitations are currently unavailable for this account. Existing rewards remain visible.'}</p><p className="mt-3 text-[10px] leading-relaxed text-slate-500">Referral cash rewards are separate from loyalty points. Queued rewards are awaiting payment processing and are not wallet funds.{summary.mode === 'demo' ? ' Paid amounts are illustrative campaign history.' : ''}</p></div><div className="grid grid-cols-3 gap-3">{[['Invited', summary.invited], ['Registered', summary.registered], ['Qualified', summary.qualified]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-3 text-xl font-semibold">{value}</p></div>)}</div></div>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 lg:grid-cols-4">{[['Pending review', summary.pending_minor], ['On hold', summary.held_minor], ['Queued', summary.queued_minor], ['Reported paid', summary.paid_minor]].map(([label, amount]) => <div key={label}><dt className="text-[10px] text-slate-400">{label}</dt><dd className="mt-2 text-sm font-semibold">{referralMoney(Number(amount))}</dd></div>)}</dl>
    </>}
  </CardSurface>;
}
