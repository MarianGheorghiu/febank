"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { buttonClass, primaryButtonClass } from "../cards/presentation";
import { AuditSelect, auditTextareaClass, auditFieldClass } from "./presentation";
export default function AuditExportDialog({count,onClose,onExport}: {count:number;onClose:()=>void;onExport:(format:"CSV"|"JSON",reason:string)=>Promise<void>}) {
  const ref=useRef<HTMLDialogElement>(null);const titleId=useId();const [format,setFormat]=useState<"CSV"|"JSON">("JSON");const [reason,setReason]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{const element=ref.current;const focus=document.activeElement instanceof HTMLElement?document.activeElement:null;const overflow=document.body.style.overflow;element?.showModal();document.body.style.overflow="hidden";return()=>{element?.close();document.body.style.overflow=overflow;focus?.focus();};},[]);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();if(!busy)onClose();}} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-xl border border-cyan-500/50 bg-[#040e23] p-0 text-white shadow-2xl backdrop:bg-black/85 backdrop:backdrop-blur-sm"><form className="space-y-5 p-5 font-mono" onSubmit={async e=>{e.preventDefault();if(busy)return;setError("");if(reason.trim().length<10){setError("Provide an export reason of 10–500 characters.");return;}setBusy(true);try{await onExport(format,reason.trim());onClose();}catch(cause){setError(cause instanceof Error?cause.message:"Export could not be prepared.");}finally{setBusy(false);}}}>
    <header className="flex items-start justify-between gap-3"><h2 id={titleId} className="text-base font-bold">Export audit evidence</h2><button type="button" className={buttonClass} onClick={onClose} disabled={busy} aria-label="Close export dialog"><X size={16}/></button></header>
    <p className="text-xs leading-relaxed text-slate-400">Export all <strong className="text-cyan-300">{count}</strong> matching events, across every result page. The report includes redacted payloads and investigation notes.</p>
    <label className={auditFieldClass}><span>Report format</span><AuditSelect disabled={busy} value={format} onChange={e=>setFormat(e.target.value as "CSV"|"JSON")}><option value="JSON">JSON · records, notes and filter manifest</option><option value="CSV">CSV · spreadsheet-compatible event registry</option></AuditSelect></label>
    <label className={auditFieldClass}><span>Export reason / case reference</span><textarea required minLength={10} maxLength={500} rows={3} disabled={busy} className={auditTextareaClass} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Document the purpose and investigation reference…"/></label>
    <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-[10px] leading-relaxed text-amber-300">The request is recorded before download. SHA-256 verifies the exported file bytes; it does not certify source authenticity or regulatory retention. Browser download completion cannot be verified.</p>
    {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
    <button type="submit" className={`${primaryButtonClass} min-h-11 w-full`} disabled={busy}><Download size={14}/>{busy?"Preparing evidence…":"Prepare & download report"}</button>
  </form></dialog>;
}
