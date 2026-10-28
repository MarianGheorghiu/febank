"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ActionButton } from '../../dashboard/ActionButton';
import { ShieldCheck, X } from "lucide-react";
import type { RiskCommand, RiskPolicy } from "@/app/lib/types/admin/risk";
import { RISK_DOMAINS } from "@/app/lib/types/admin/risk";
import { inputClass, RiskSelect as CardSelect } from './RiskUI';
import RiskCustomerPicker from './RiskCustomerPicker';
import type { RiskCustomer } from '@/app/lib/risk/contracts';
import { validatePolicy } from '@/app/lib/risk/engine';
type Draft<T> = T extends unknown ? Omit<T, "reason" | "expectedRevision"> : never;
export interface RiskIntent { title: string; description: string; command: Draft<RiskCommand>; revision: number }
export default function RiskOperationDialog({ intent, customers, onClose, onConfirm }: { intent: RiskIntent; customers: RiskCustomer[]; onClose: () => void; onConfirm: (command: RiskCommand, key: string) => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null); const titleId = useId(); const descriptionId = useId();
  const savingRef=useRef(false),outsideDown=useRef(false),key=useRef(crypto.randomUUID()); const [saving,setSaving]=useState(false);
  const close=()=>{if(!savingRef.current)onClose();};
  const [draft, setDraft] = useState(intent.command); const [reason, setReason] = useState(""); const [review, setReview] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    const element = ref.current; const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null; const overflow = document.body.style.overflow;
    element?.showModal(); element?.querySelector<HTMLInputElement>('[role="combobox"], input, textarea')?.focus(); document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  const editPolicy = (values: Partial<RiskPolicy>) => { if (draft.action === "POLICY") setDraft({ ...draft, policy: { ...draft.policy, ...values } }); };
  return <dialog ref={ref} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={e => { e.preventDefault(); close(); }} onPointerDown={event=>{const box=event.currentTarget.getBoundingClientRect();outsideDown.current=event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom;}} onClick={event=>{const box=event.currentTarget.getBoundingClientRect();if(outsideDown.current&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))close();outsideDown.current=false;}} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-[#080f20] p-0 text-white shadow-2xl backdrop:bg-black/85 backdrop:backdrop-blur-sm">
    <form className="space-y-5 p-5 font-mono sm:p-6" onSubmit={async event => { event.preventDefault(); if(savingRef.current)return; setError("");
        try {
          if(reason.trim().length<10||reason.trim().length>500)throw new Error('Provide an audit reason of 10–500 characters.');
          if(draft.action==='POLICY')validatePolicy(draft.policy);
          if('email' in draft&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))throw new Error('Choose a customer or enter a valid email address.');
          if(draft.action==='CREATE_CASE'&&(!draft.reference.trim()||draft.reference.trim().length<3||!Number.isFinite(draft.amountUsd)||draft.amountUsd<=0||draft.amountUsd>1e9||!Number.isInteger(draft.score)||draft.score<0||draft.score>100))throw new Error('Provide a valid reference, amount and whole-number score from 0 to 100.');
          if(!review){setReview(true);return;}
          savingRef.current=true;setSaving(true);
          await onConfirm({...draft,reason:reason.trim(),expectedRevision:intent.revision} as RiskCommand,key.current);onClose();
        } catch(cause){setError(cause instanceof Error?cause.message:'Operation failed.');}
        finally{savingRef.current=false;setSaving(false);}
      }}>
      <header className="flex items-start justify-between gap-3"><div><p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-cyan-400"><ShieldCheck size={14}/> Audited risk operation</p><h2 id={titleId} className="text-lg font-bold">{review ? "Review & confirm" : intent.title}</h2></div><ActionButton type="button" disabled={saving} onClick={close} variant="blue" autoWidth aria-label="Close dialog" icon={<X size={16}/>}></ActionButton></header>
      <p id={descriptionId} className="text-xs leading-relaxed text-slate-400">{intent.description}</p>
      {review ? <div className="space-y-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs"><p className="font-bold text-cyan-300">{intent.title}</p><dl className="space-y-2 text-[11px] text-slate-300">
        {"caseId" in draft && <div><dt className="text-slate-500">Case</dt><dd>{draft.caseId}</dd></div>}
        {"email" in draft && <div><dt className="text-slate-500">Customer email</dt><dd className="break-all">{draft.email}</dd></div>}
        {draft.action === "RESOLVE" && <div><dt className="text-slate-500">Outcome</dt><dd>{draft.resolution === "CONFIRMED" ? "Confirmed risk finding" : "False positive"}</dd></div>}
        {draft.action === "CREATE_CASE" && <><div><dt className="text-slate-500">Domain / reference</dt><dd className="break-words">{draft.domain} · {draft.reference}</dd></div><div><dt className="text-slate-500">USD equivalent / risk score</dt><dd>{draft.amountUsd.toLocaleString("en-US", { style: "currency", currency: "USD" })} · {draft.score}/100</dd></div></>}
        {draft.action === "POLICY" && <><div><dt className="text-slate-500">Domain / emergency stop</dt><dd>{draft.policy.domain} · {draft.policy.paused ? "Stop active" : "Risk gate open"}</dd></div><div><dt className="text-slate-500">Transaction cap / exposure alert limit (USD)</dt><dd>{draft.policy.maxTransactionUsd.toLocaleString("en-US")} / {draft.policy.exposureLimitUsd.toLocaleString("en-US")}</dd></div><div><dt className="text-slate-500">Review / block score</dt><dd>{draft.policy.reviewScore} / {draft.policy.blockScore}</dd></div></>}
      </dl><p className="break-words border-t border-cyan-500/20 pt-3">Reason: {reason}</p><p className="text-[10px] text-slate-400">Current controls will be checked again before saving.</p></div> : <>
        {draft.action === "POLICY" && <fieldset className="space-y-4"><legend className="mb-3 text-xs font-bold text-cyan-300">{draft.policy.domain} policy</legend><div className="grid gap-3 sm:grid-cols-2">{([["maxTransactionUsd", "Maximum transaction (USD)"], ["exposureLimitUsd", "Exposure alert limit (USD)"], ["reviewScore", "Manual review score"], ["blockScore", "Block score"]] as const).map(([key,label]) => <label key={key} className="space-y-2 text-[11px] text-slate-300"><span className="block">{label}</span><input required type="number" step={key.endsWith("Score") ? "1" : "0.01"} min="1" max={key.endsWith("Score") ? 100 : 1e12} value={Number.isNaN(draft.policy[key]) ? "" : draft.policy[key]} onChange={e => editPolicy({ [key]: e.target.value === "" ? NaN : Number(e.target.value) })} className={inputClass}/></label>)}</div><label className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-300"><input type="checkbox" className="mt-0.5 accent-rose-400" checked={draft.policy.paused} onChange={e => editPolicy({ paused: e.target.checked })}/><span>Emergency stop: block new orders, transfers and withdrawals in this domain. Cancellations remain available.</span></label><p className="text-[10px] leading-relaxed text-slate-400">Exposure limits generate monitoring alerts. Score thresholds apply to the screening sandbox. Stops, account restrictions and transaction caps also guard new shared-wallet transfers and cash withdrawals in demo mode.</p></fieldset>}
        {draft.action === "FREEZE" && <label className="block space-y-2 text-xs text-slate-300"><span>Customer email</span><RiskCustomerPicker customers={customers} value={draft.email} onChange={email=>setDraft({...draft,email})}/></label>}
        {draft.action === "CREATE_CASE" && <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-xs text-slate-300"><span className="block">Asset domain</span><CardSelect aria-label="Incident domain" value={draft.domain} onChange={e => setDraft({ ...draft, domain: e.target.value as typeof draft.domain })}>{RISK_DOMAINS.map(d => <option key={d}>{d}</option>)}</CardSelect></label><label className="space-y-2 text-xs text-slate-300"><span className="block">Customer email</span><RiskCustomerPicker customers={customers} value={draft.email} onChange={email=>setDraft({...draft,email})}/></label><label className="space-y-2 text-xs text-slate-300"><span className="block">Transaction / incident reference</span><input required minLength={3} maxLength={100} className={inputClass} value={draft.reference} onChange={e => setDraft({ ...draft, reference: e.target.value })}/></label><label className="space-y-2 text-xs text-slate-300"><span className="block">Amount (USD equivalent)</span><input required type="number" min="0.01" step="0.01" className={inputClass} value={draft.amountUsd || ""} onChange={e => setDraft({ ...draft, amountUsd: Number(e.target.value) })}/></label><label className="space-y-2 text-xs text-slate-300"><span className="block">Risk score (0–100)</span><input required type="number" min="0" max="100" className={inputClass} value={draft.score} onChange={e => setDraft({ ...draft, score: Number(e.target.value) })}/></label><p className="self-end text-[10px] leading-relaxed text-slate-400">Signals: {draft.signals.join("; ") || "Manual incident"}</p></div>}
        {"caseId" in draft && <p className="rounded-lg border border-cyan-500/20 p-3 text-xs text-cyan-300">Case {draft.caseId}{draft.action === "RESOLVE" ? ` · ${draft.resolution}` : ""}</p>}
        {"email" in draft && draft.action !== "FREEZE" && draft.action !== "CREATE_CASE" && <p className="break-all rounded-lg border border-cyan-500/20 p-3 text-xs text-cyan-300">{draft.email}</p>}
        <label className="block space-y-2 text-xs text-slate-300"><span>Reason / investigation note</span><textarea required minLength={10} maxLength={500} rows={3} className={inputClass} value={reason} onChange={e => setReason(e.target.value)} placeholder="Document evidence, decision and ticket reference…"/><span className="text-[10px] text-slate-500">{reason.trim().length}/500 · Retained in the decision audit</span></label>
      </>}
      {error && <p role="alert" className="rounded-lg border border-rose-500/30 p-3 text-xs text-rose-300">{error}</p>}
      <footer className="flex flex-wrap justify-end gap-3 border-t border-cyan-500/20 pt-4"><ActionButton type="button" variant="blue" autoWidth disabled={saving} onClick={()=>{if(review){setReview(false);key.current=crypto.randomUUID();}else close();}}>{review ? "Back to edit" : "Cancel"}</ActionButton><ActionButton variant="cyan" autoWidth disabled={saving} type="submit">{saving ? "Saving…" : review ? "Confirm operation" : "Review operation"}</ActionButton></footer>
    </form>
  </dialog>;
}
