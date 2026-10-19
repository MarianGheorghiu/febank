"use client";
import { useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Search, X } from "lucide-react";
import CardSurface from "../CardSurface";
import TransferSelect from "./TransferSelect";
import type { CustomerTransfer, TransferState } from "@/app/lib/transfers/contracts";
import { amountLabel } from "@/app/lib/transfers/engine";

const statusColors: Record<TransferState, string> = { completed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", pending: "border-amber-400/20 bg-amber-400/10 text-amber-300", processing: "border-blue-400/20 bg-blue-400/10 text-blue-300", rejected: "border-rose-400/20 bg-rose-400/10 text-rose-300", cancelled: "border-slate-400/20 bg-slate-400/10 text-slate-300" };
export function TransferStatus({ status }: { status: TransferState }) { return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${statusColors[status]}`}>{status}</span>; }
export default function TransferTable({ transfers, onCancel, busy = false, matchFormHeight = false }: { transfers: CustomerTransfer[]; onCancel?: (id: string) => Promise<void>; busy?: boolean; matchFormHeight?: boolean }) {
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const entriesRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  function clearSearch() {
    setSearch(""); setPage(0);
    entriesRef.current?.scrollTo({ top: 0 });
    searchRef.current?.focus();
  }
  const rows = transfers.filter(t => (filter === "all" || t.kind === filter) && (status === "all" || t.status === status) && [t.id, t.recipient_name, t.asset, t.destination, t.reference].join(" ").toLowerCase().includes(search.trim().toLowerCase())).sort((a,b) => b.created_at.localeCompare(a.created_at));
  const pages = Math.max(1, Math.ceil(rows.length / 6));
  const currentPage = Math.min(page, pages - 1);
  return <CardSurface as="section" tone="purple" className={`flex min-h-0 flex-col p-4 sm:p-6 ${matchFormHeight ? "h-[var(--transfer-panel-height,48rem)]" : "h-[48rem]"}`} aria-labelledby="transfer-history-title">
    <div className="mb-5 flex min-h-12 shrink-0 flex-wrap items-start justify-between gap-3"><div><p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-purple-300">Your transfer activity</p><h2 id="transfer-history-title" className="text-xl font-bold">Transfer history</h2></div><span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">{rows.length} results</span></div>
    <div className="mb-5 grid min-w-0 shrink-0 grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
      <div className="relative col-span-2 min-w-0 sm:col-span-1">
        <label className="block"><span className="sr-only">Search transfers</span><Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-3.5 text-slate-500" /><input ref={searchRef} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} onKeyDown={e => { if (e.key === "Escape" && search) { e.preventDefault(); clearSearch(); } }} placeholder="Name, asset or reference" className="min-h-11 cursor-text w-full min-w-0 rounded-xl border border-white/10 bg-[#050b19] pr-11 pl-9 text-sm outline-none focus:border-purple-400" /></label>
        {search && <button type="button" onClick={clearSearch} aria-label="Clear search" title="Clear search" className="absolute right-1 top-1 grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-purple-300 transition-colors hover:bg-purple-500/15 hover:text-purple-100 focus-visible:outline-2 focus-visible:outline-purple-300"><X size={15} aria-hidden="true" /></button>}
      </div>
      <label className="min-w-0"><span className="sr-only">Filter asset category</span><TransferSelect value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }} className="min-h-11 cursor-pointer disabled:cursor-not-allowed w-full rounded-xl border border-white/10 bg-[#050b19] pl-3 text-xs outline-none focus:border-purple-400">{["all", "fiat", "crypto", "stock"].map(f => <option key={f} value={f}>{f === "all" ? "All assets" : f === "stock" ? "Stocks" : f.toUpperCase()}</option>)}</TransferSelect></label>
      <label className="min-w-0"><span className="sr-only">Filter transfer status</span><TransferSelect value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} className="min-h-11 cursor-pointer disabled:cursor-not-allowed w-full rounded-xl border border-white/10 bg-[#050b19] pl-3 text-xs outline-none focus:border-purple-400">{["all", "pending", "processing", "completed", "rejected", "cancelled"].map(s => <option key={s} value={s}>{s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}</option>)}</TransferSelect></label>
    </div>
    <div ref={entriesRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 scrollbar-thin" aria-live="polite" role="region" aria-label="Transfer history entries" tabIndex={0}>
      {!rows.length && <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">No transfers match these filters.</p>}
      {rows.slice(currentPage * 6, currentPage * 6 + 6).map(t => <article key={t.id} className="min-w-0 rounded-xl border border-white/10 bg-[#050b19]/60 p-3 sm:p-4">
        <div className="flex items-start gap-3"><span className={`shrink-0 rounded-xl border border-white/5 p-2 ${t.direction === "incoming" ? "bg-emerald-500/10 text-emerald-300" : "bg-blue-500/10 text-blue-300"}`}>{t.direction === "incoming" ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="min-w-0 break-words text-sm font-semibold">{t.recipient_name}</h3><TransferStatus status={t.status} /></div><p className="mt-1 break-all font-mono text-xs font-bold text-slate-200">{t.direction === "outgoing" ? "−" : "+"}{amountLabel(t.amount, t.asset)}</p><p className="mt-1 text-[11px] text-slate-500">{new Date(t.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p></div></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2"><span className="min-w-0 break-all font-mono text-[10px] text-slate-500">{t.id}</span><div className="flex flex-wrap gap-2"><button type="button" aria-expanded={expanded === t.id} aria-controls={`details-${t.id}`} className="min-h-11 cursor-pointer disabled:cursor-not-allowed rounded-lg px-3 text-xs text-purple-300 hover:bg-purple-400/10 focus-visible:outline-2 focus-visible:outline-purple-300" onClick={() => setExpanded(expanded === t.id ? null : t.id)}>{expanded === t.id ? "Hide details" : "View details"}</button>{onCancel && t.can_cancel && t.direction === "outgoing" && t.status === "pending" && <button type="button" disabled={busy} onClick={() => setCancelId(cancelId === t.id ? null : t.id)} className="min-h-11 cursor-pointer disabled:cursor-not-allowed rounded-lg px-3 text-xs text-amber-300 hover:bg-amber-400/10 disabled:opacity-50">Cancel request</button>}</div></div>
        {expanded === t.id && <dl id={`details-${t.id}`} className="mt-2 space-y-2 rounded-lg bg-black/20 p-3 text-xs"><div><dt className="text-slate-500">Destination</dt><dd className="break-all font-mono">{t.destination}</dd></div><div><dt className="text-slate-500">Reference</dt><dd className="break-words">{t.reference || "No reference"}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-500">Fee</dt><dd>{amountLabel(t.fee, t.fee_asset ?? t.asset)}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-500">Route</dt><dd>{t.route_id}</dd></div></dl>}
        {cancelId === t.id && onCancel && t.can_cancel && <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3"><p className="text-xs text-amber-200">Cancel this request and release the reserved amount and fee?</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={async () => { await onCancel(t.id); setCancelId(null); }} className="min-h-11 cursor-pointer disabled:cursor-not-allowed rounded-lg bg-amber-400/10 px-3 text-xs text-amber-200 disabled:opacity-50">{busy ? "Cancelling…" : "Confirm cancellation"}</button><button type="button" disabled={busy} onClick={() => setCancelId(null)} className="min-h-11 cursor-pointer disabled:cursor-not-allowed rounded-lg px-3 text-xs text-emerald-200 enabled:hover:bg-emerald-400/10">Keep transfer</button></div></div>}
      </article>)}
    </div>
    <div className="mt-5 flex shrink-0 items-center justify-between gap-2 text-xs text-slate-400"><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="min-h-11 cursor-pointer disabled:cursor-not-allowed rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 text-blue-200 enabled:hover:bg-blue-500/20 disabled:opacity-30">Previous</button><span>Page {currentPage + 1} of {pages}</span><button type="button" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)} className="min-h-11 cursor-pointer disabled:cursor-not-allowed rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 text-blue-200 enabled:hover:bg-blue-500/20 disabled:opacity-30">Next</button></div>
  </CardSurface>;
}
