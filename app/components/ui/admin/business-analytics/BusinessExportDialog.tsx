"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { AuditSelect, auditFieldClass, auditTextareaClass } from "../audit/presentation";
import { analyticsButton, analyticsPrimaryButton } from "./presentation";
export default function BusinessExportDialog({ scope, onClose, onExport }: { scope: string; onClose: () => void; onExport: (format: "CSV" | "JSON", reason: string) => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null); const titleId = useId();
  const [format, setFormat] = useState<"CSV" | "JSON">("CSV"); const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { const element = ref.current; const focus = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; element?.showModal(); document.body.style.overflow = "hidden"; return () => { element?.close(); document.body.style.overflow = overflow; focus?.focus(); }; }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} className="scrollbar-thin m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-xl border border-cyan-500/40 bg-[#030d22] p-5 font-mono text-white backdrop:bg-black/85"><form className="space-y-5" onSubmit={async e => { e.preventDefault(); if (busy) return; setError(""); if (reason.trim().length < 10 || reason.trim().length > 500) { setError("Enter a report purpose of 10–500 characters."); return; } setBusy(true); try { await onExport(format, reason.trim()); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Report export failed."); } finally { setBusy(false); } }}>
    <div className="flex items-start justify-between gap-3"><h2 id={titleId} className="text-base font-bold">Export business report</h2><button type="button" className={analyticsButton} disabled={busy} aria-label="Close report export" onClick={onClose}><X size={14}/></button></div>
    <p className="text-xs leading-relaxed text-slate-400">{scope}. Includes financial totals, the previous-period comparison, product contribution, channel outcomes and chart data across all three views.</p>
    <label className={auditFieldClass}>Format<AuditSelect value={format} disabled={busy} onChange={e => setFormat(e.target.value as "CSV" | "JSON")}><option value="CSV">CSV · spreadsheet report</option><option value="JSON">JSON · structured report & manifest</option></AuditSelect></label>
    <label className={auditFieldClass}>Report purpose / reference<textarea className={auditTextareaClass} rows={3} required minLength={10} maxLength={500} disabled={busy} value={reason} onChange={e => setReason(e.target.value)} placeholder="Management review, reporting period or case reference…"/></label>
    <p className="rounded-lg border border-amber-500/25 p-3 text-[10px] leading-relaxed text-amber-300">This is an illustrative management report. Export requests are recorded in Audit Logs before download; the report contains aggregate data.</p>
    {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
    <button className={`${analyticsPrimaryButton} w-full`} disabled={busy}><Download size={13}/>{busy ? "Preparing…" : "Prepare & download"}</button>
  </form></dialog>;
}
