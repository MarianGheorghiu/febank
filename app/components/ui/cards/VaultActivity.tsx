"use client";
import { useRef, useState } from "react";
import { ReceiptText, Download, ChevronLeft, ChevronRight } from "lucide-react";
import CardSurface from "../CardSurface";
import CardSelect from "../admin/cards/CardSelect";
import { button, Empty, StockSearch, StockTitle } from "../stocks/StockUI";
import { cardMoney } from "./VaultAnalytics";
import { cardPage } from "@/app/lib/cards/pagination";
import type { CardActivity } from "@/app/lib/cards/contracts";
export function downloadCardActivity(activity: CardActivity[], last4: string) {
  const cell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
  const csv = [["ID", "Merchant", "Category", "Amount", "Currency", "Status", "Date"], ...activity.map(tx => [tx.id, tx.merchant, tx.category, tx.amount, tx.currency, tx.status, tx.occurred_at])].map(row => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `card-${last4}-activity.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function VaultActivity({ activity, last4 }: { activity: CardActivity[]; last4: string }) {
  const [search, setSearch] = useState(""), [status, setStatus] = useState("ALL"), [page, setPage] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  function navigate(next: number) { setPage(next); viewport.current?.scrollTo({ top: 0 }); }
  const filtered = activity.filter(tx => `${tx.merchant} ${tx.category} ${tx.id}`.toLowerCase().includes(search.toLowerCase()) && (status === "ALL" || tx.status === status)).sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));
  const pagination = cardPage(filtered, page), safePage = pagination.page;
  return <CardSurface as="section" className="p-4 sm:p-5"><StockTitle icon={ReceiptText} aside={<button className={button} disabled={!filtered.length} onClick={() => downloadCardActivity(filtered, last4)}><Download size={14} />Export results</button>}>Card activity</StockTitle><div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]"><StockSearch label="Search payments" value={search} onChange={value => { setSearch(value); navigate(0); }} /><CardSelect aria-label="Payment status" value={status} onChange={e => { setStatus(e.target.value); navigate(0); }}><option value="ALL">All statuses</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option><option value="REVERSED">Reversed</option></CardSelect></div>
    <div ref={viewport} tabIndex={0} role="region" aria-label="Card payment list" className="h-80 space-y-2 overflow-y-auto overscroll-contain rounded-xl pr-1 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:h-96">{pagination.rows.map(tx => <div key={tx.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[.025] p-3"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="shrink-0 rounded-xl bg-cyan-300/5 p-2.5 text-cyan-200"><ReceiptText size={17} /></span><div className="min-w-0"><h3 className="break-words text-sm font-medium">{tx.merchant}</h3><p className="mt-1 text-xs text-slate-400">{tx.category} · {new Date(tx.occurred_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</p></div></div><div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums">{tx.status === "REVERSED" ? "+" : "−"}{cardMoney(tx.amount, tx.currency)}</p><p className={`mt-1 text-[11px] ${tx.status === "PENDING" ? "text-amber-200" : "text-slate-400"}`}>{tx.status.toLowerCase()}</p></div></div>)}{!filtered.length && <Empty>{activity.length ? "No payments match your filters." : "No card payments yet. Your activity will appear here."}</Empty>}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-300"><span>{filtered.length ? `${pagination.start + 1}–${pagination.end} of ${filtered.length} payments` : "0 payments"}</span><div className="flex items-center gap-2"><button className={button} aria-label="Previous payments" disabled={!pagination.hasPrevious} onClick={() => navigate(safePage - 1)}><ChevronLeft size={15} /></button><span aria-live="polite">{safePage + 1} / {pagination.pages}</span><button className={button} aria-label="Next payments" disabled={!pagination.hasNext} onClick={() => navigate(safePage + 1)}><ChevronRight size={15} /></button></div></div>
  </CardSurface>;
}
