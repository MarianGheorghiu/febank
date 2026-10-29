'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import type { ReferralAction, ReferralCommand, ReferralSnapshot } from '@/app/lib/referrals/contracts';
import type { ReferralRecord } from '@/app/lib/types/admin/referrals';
import { referralMoney } from '@/app/lib/referrals/engine';
import CustomerPicker from '../../CustomerPicker';
import { ActionButton } from '../../dashboard/ActionButton';
import { auditFieldClass, auditInputClass, auditTextareaClass } from '../audit/presentation';
import { referralActionLabels } from './presentation';

export interface ReferralIntent {action: Exclude<ReferralAction, 'EXPORT'>; record?: ReferralRecord}
const descriptions = {
  INVITE: 'Record an invitation and lock its campaign terms. This records attribution only; no email is sent and no reward is earned until registration, verification and campaign activity are confirmed.',
  HOLD_REWARD: 'Place this unpaid reward on hold for review. Held rewards cannot be submitted for payout. Earned amounts and referral attribution remain in the registry.',
  RELEASE_REWARD: 'Return this held reward to pending review. A separate payout request is still required; this action does not move money.',
  REQUEST_PAYOUT: 'Submit this earned reward to the payout queue. The reward is marked queued, not paid. Settlement requires the backend payment worker and a reconciled payment result.',
};
export default function ReferralOperationDialog({intent, snapshot, onClose, onConfirm}: {intent: ReferralIntent; snapshot: ReferralSnapshot; onClose: () => void; onConfirm: (command: ReferralCommand) => Promise<void>}) {
  const dialog = useRef<HTMLDialogElement>(null), id = useId(), lock = useRef(false);
  const [revision] = useState(snapshot.state.revision), [referrer, setReferrer] = useState(''), [name, setName] = useState(''), [email, setEmail] = useState(''), [reason, setReason] = useState('');
  const [policy] = useState(snapshot.policy);
  const [review, setReview] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const retry = useRef<{payload: string; id: string} | null>(null);
  const eligible = snapshot.state.report.referrers.filter(r => snapshot.eligible_referrer_ids.includes(r.id));
  useEffect(() => {
    const element = dialog.current, focus = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; element?.showModal();
    return () => {element?.close(); document.body.style.overflow = overflow; focus?.focus();};
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (lock.current) return; setError('');
    if (reason.trim().length < 10 || reason.trim().length > 500) {setError('Enter an audit reason of 10–500 characters.'); return;}
    if (intent.action === 'INVITE' && !eligible.some(r => r.id === referrer)) {setError('Choose an eligible referrer.'); return;}
    if (!review) {setReview(true); return;}
    const command = {action: intent.action, expected_revision: revision, expected_config_revision: policy.config_revision, referral_id: intent.record?.id, referrer_id: referrer, invitee_name: name, invitee_email: email, reason: reason.trim()};
    const payload = JSON.stringify(command); if (retry.current?.payload !== payload) retry.current = {payload, id: crypto.randomUUID()};
    lock.current = true; setBusy(true);
    try {await onConfirm({...command, request_id: retry.current.id}); onClose();}
    catch (cause) {setError(cause instanceof Error ? cause.message : 'The referral operation failed.');}
    finally {lock.current = false; setBusy(false);}
  }
  return <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={e => {e.preventDefault(); if (!lock.current) onClose();}} onClick={e => {if (lock.current || e.target !== e.currentTarget) return; const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();}} className="scrollbar-thin m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-b from-[#101d35] to-[#080f20] p-5 font-mono text-white backdrop:bg-black/80 sm:p-6">
    <form onSubmit={submit} className="space-y-5">
      <header className="flex items-start justify-between gap-3"><h2 id={`${id}-title`} className="text-lg font-semibold">{review ? 'Review & confirm' : referralActionLabels[intent.action]}</h2><ActionButton autoWidth variant="blue" disabled={busy} aria-label="Close referral operation" icon={<X size={14}/>} onClick={onClose}/></header>
      <p id={`${id}-description`} className="text-xs leading-relaxed text-slate-400">{descriptions[intent.action]}</p>
      {intent.record && <div className="space-y-2 rounded-xl border border-white/10 p-4 text-xs"><p className="break-words font-semibold">{intent.record.invitee_name} · {intent.record.id}</p><p className="text-cyan-200">{referralMoney(intent.record.reward_minor)} · {intent.record.reward_status}</p></div>}
      {!review ? <fieldset disabled={busy} className="space-y-4">
        {intent.action === 'INVITE' && <><CustomerPicker label="Eligible referrer" listLabel="Eligible referrers" customers={eligible} value={referrer} onChange={setReferrer} emptyMessage="No eligible referrers match. Check account verification and the campaign rollout in Flags & Config."/><div className="grid gap-3 sm:grid-cols-2"><label className={auditFieldClass}>Invited customer name<input required minLength={2} maxLength={100} autoComplete="off" className={auditInputClass} value={name} onChange={e => setName(e.target.value)}/></label><label className={auditFieldClass}>Invited customer email<input required type="email" maxLength={254} autoComplete="off" className={auditInputClass} value={email} onChange={e => setEmail(e.target.value)}/></label></div><p className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-[11px] leading-relaxed text-cyan-100">New invitation terms: {referralMoney(policy.reward_minor)} if qualified within {policy.qualification_days} days · configuration v{policy.config_revision}</p></>}
        <label className={auditFieldClass}>Operational reason<textarea required minLength={10} maxLength={500} rows={3} className={auditTextareaClass} placeholder="Case reference and reason for this operation…" value={reason} onChange={e => setReason(e.target.value)}/></label>
      </fieldset> : <div className="space-y-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs leading-relaxed">
        <p className="font-semibold text-cyan-200">{referralActionLabels[intent.action]}</p>{intent.action === 'INVITE' && <><p>Referrer: {eligible.find(r => r.id === referrer)?.name}</p><p className="break-all">Invited: {name} · {email}</p><p>{referralMoney(policy.reward_minor)} upon qualification · {policy.qualification_days} days</p></>}<p className="break-words text-slate-300">Reason: {reason}</p><p className="text-[10px] text-slate-400">Registry revision {revision} · operation and audit evidence are saved together.</p>
      </div>}
      {error && <p role="alert" className="rounded-xl border border-rose-400/20 p-3 text-xs text-rose-200">{error}</p>}
      <footer className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4"><ActionButton autoWidth variant="blue" disabled={busy} icon={review ? <ArrowLeft size={14}/> : undefined} onClick={review ? () => setReview(false) : onClose}>{review ? 'Edit request' : 'Cancel'}</ActionButton><ActionButton autoWidth type="submit" variant={intent.action === 'HOLD_REWARD' ? 'rose' : 'cyan'} icon={review ? <Check size={14}/> : undefined} disabled={busy || (intent.action === 'INVITE' && !referrer)}>{busy ? 'Saving…' : review ? 'Confirm operation' : 'Review operation'}</ActionButton></footer>
    </form>
  </dialog>;
}
