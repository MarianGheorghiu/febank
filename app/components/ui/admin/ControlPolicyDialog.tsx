"use client";
import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import type { ControlPolicy, PolicyRequest } from "@/app/lib/admin-control/contracts";
import { validatePolicy } from "@/app/lib/risk/engine";
import { ActionButton } from "../dashboard/ActionButton";
import { inputClass } from "./cards/presentation";

export default function ControlPolicyDialog({ policy, revision, onClose, onSave }: {
  policy: ControlPolicy; revision: number; onClose: () => void;
  onSave: (request: PolicyRequest, key: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId(); const descriptionId = useId();
  const [draft, setDraft] = useState({ ...policy });
  const [reason, setReason] = useState(""); const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const key = useRef<string | null>(null); const saving = useRef(false);
  const pointerStartedOutside = useRef(false);
  useEffect(() => {
    const dialog = ref.current;
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  return <dialog ref={ref}
    onPointerDown={event => {
      const bounds = event.currentTarget.getBoundingClientRect();
      pointerStartedOutside.current = event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
    }}
    onClick={event => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const outside = event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
      if (pointerStartedOutside.current && outside && !saving.current) onClose();
      pointerStartedOutside.current = false;
    }} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); if (!saving.current) onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto scrollbar-thin rounded-2xl border border-white/15 bg-[#080f20] p-0 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm">
    <form className="space-y-5 p-5 sm:p-6" onSubmit={async event => {
      event.preventDefault(); if (saving.current) return; setError("");
      try {
        if (!/^\d+(\.\d{1,2})?$/.test(draft.max_transaction_usd) || !/^\d+(\.\d{1,2})?$/.test(draft.exposure_limit_usd)) throw new Error("Use positive amounts with up to two decimal places.");
        validatePolicy({ domain: draft.domain, paused: draft.paused, maxTransactionUsd: Number(draft.max_transaction_usd), exposureLimitUsd: Number(draft.exposure_limit_usd), reviewScore: draft.review_score, blockScore: draft.block_score });
        if (reason.trim().length < 10 || reason.trim().length > 500) throw new Error("Provide an audit reason of 10–500 characters.");
        if (!review) { setReview(true); return; }
        saving.current = true; setBusy(true); key.current ??= crypto.randomUUID();
        await onSave({ expected_revision: revision, reason: reason.trim(), policy: { ...draft, max_transaction_usd: Number(draft.max_transaction_usd).toFixed(2), exposure_limit_usd: Number(draft.exposure_limit_usd).toFixed(2) } }, key.current);
        onClose();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save policy."); }
      finally { saving.current = false; setBusy(false); }
    }}>
      <header className="flex items-start justify-between gap-3"><div><p className="mb-2 text-xs text-cyan-300">Audited operation</p><h2 id={titleId} className="text-xl font-bold">{review ? "Review policy change" : `${policy.domain} controls`}</h2></div><ActionButton variant="cyan" autoWidth aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={16}/></ActionButton></header>
      <p id={descriptionId} className="text-sm leading-relaxed text-slate-400">Changes apply to new transfers, withdrawals and trading in this domain. Existing balances and cancellations remain available. Exposure and score thresholds are monitoring and screening controls.</p>
      {review ? <div className="space-y-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm"><p className="font-semibold text-cyan-200">{draft.domain}: {draft.paused ? "Emergency stop active" : "Risk gate open"}</p><dl className="grid grid-cols-2 gap-3 text-xs"><dt>Transaction limit</dt><dd>${draft.max_transaction_usd}</dd><dt>Exposure alert</dt><dd>${draft.exposure_limit_usd}</dd><dt>Review / block score</dt><dd>{draft.review_score} / {draft.block_score}</dd></dl><p className="break-words border-t border-white/10 pt-3">{reason}</p><p className="text-xs text-slate-400">Revision {revision}. A concurrent change requires a fresh review.</p></div> : <fieldset disabled={busy} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">{([['max_transaction_usd', 'Transaction limit (USD)'], ['exposure_limit_usd', 'Exposure alert (USD)']] as const).map(([field, label]) => <label key={field} className="block space-y-2 text-xs text-slate-300"><span>{label}</span><input required inputMode="decimal" className={inputClass} value={draft[field]} onChange={event => { key.current = null; setDraft({ ...draft, [field]: event.target.value }); }}/></label>)}{([['review_score', 'Review score'], ['block_score', 'Block score']] as const).map(([field, label]) => <label key={field} className="block space-y-2 text-xs text-slate-300"><span>{label}</span><input required type="number" min="1" max="100" step="1" className={inputClass} value={Number.isNaN(draft[field]) ? "" : draft[field]} onChange={event => { key.current = null; setDraft({ ...draft, [field]: event.target.valueAsNumber }); }}/></label>)}</div>
        <label className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200"><input type="checkbox" checked={draft.paused} onChange={event => { key.current = null; setDraft({ ...draft, paused: event.target.checked }); }} className="mt-1 accent-rose-400"/><span>Emergency stop for this domain</span></label>
        <label className="block space-y-2 text-xs text-slate-300"><span>Audit reason / ticket reference</span><textarea required minLength={10} maxLength={500} rows={3} className={inputClass} value={reason} onChange={event => { key.current = null; setReason(event.target.value); }} /></label>
      </fieldset>}
      {error && <p role="alert" className="rounded-xl border border-rose-400/30 p-3 text-sm text-rose-200">{error}</p>}
      <footer className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4"><ActionButton variant="blue" disabled={busy} onClick={() => review ? setReview(false) : onClose()}>{review ? "Back" : "Cancel"}</ActionButton><ActionButton type="submit" variant={draft.paused ? "rose" : "cyan"} disabled={busy}>{busy ? "Saving…" : review ? "Confirm changes" : "Review changes"}</ActionButton></footer>
    </form>
  </dialog>;
}
