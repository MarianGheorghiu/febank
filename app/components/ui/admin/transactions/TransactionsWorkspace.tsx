"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";
import type { RiskActor } from "@/app/lib/types/admin/risk";
import type { GlobalTransaction, TransactionFilters, TransactionSnapshot } from "@/app/lib/transactions/contracts";
import { createTransactionRepository } from "@/app/lib/transactions/repository";
import { defaultTransactionFilters, filterTransactions, matchesTransactionQuery, summarizeTransactions } from "@/app/lib/transactions/engine";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import { RISK_EVENT } from "@/app/lib/risk/store";
import { useSessionMetadata } from "@/app/lib/session/use-session-metadata";
import CardSurface from "../../CardSurface";
import PageHeader from "../../PageHeader";
import { ActionButton } from "../../dashboard/ActionButton";
import TransactionWidgets from "./TransactionWidgets";
import TransactionCharts from "./TransactionCharts";
import TransactionsTable from "./TransactionsTable";
import TransactionActionModal from "./TransactionActionModal";
import { money, StatusBadge, txDate, txInput } from "./presentation";
export default function TransactionsWorkspace({ actor }: { actor: RiskActor }) {
  const repository = useMemo(() => createTransactionRepository(actor), [actor.email, actor.role]); // eslint-disable-line react-hooks/exhaustive-deps
  const session = useSessionMetadata(actor.email);
  const [snapshot, setSnapshot] = useState<TransactionSnapshot | null>(null), [busy, setBusy] = useState(true), [error, setError] = useState("");
  const [notice, setNotice] = useState(""), [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({ ...defaultTransactionFilters });
  const [selected, setSelected] = useState<GlobalTransaction | null>(null);
  const [attentionQuery, setAttentionQuery] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const generation = useRef(0);
  const load = useCallback(async () => {
    const id = ++generation.current; setBusy(true);
    try { const value = await repository.getSnapshot(); if (id === generation.current) { setSnapshot(value); setError(""); } }
    catch (cause) { if (id === generation.current) setError(cause instanceof Error ? cause.message : "Unable to load transaction operations."); }
    finally { if (id === generation.current) setBusy(false); }
  }, [repository]);
  useEffect(() => {
    const refresh = () => { void load(); };
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(WALLET_EVENT, refresh); window.addEventListener(RISK_EVENT, refresh); window.addEventListener("storage", refresh); window.addEventListener("focus", refresh);
    // This ref tracks asynchronous request generations, not a DOM element.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { window.clearTimeout(timer); generation.current++; window.removeEventListener(WALLET_EVENT, refresh); window.removeEventListener(RISK_EVENT, refresh); window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, [load]);
  const rows = useMemo(() => snapshot ? filterTransactions(snapshot.transactions, filters, snapshot.as_of) : [], [snapshot, filters]);
  const exportRows = async (ids: string[]) => {
    if (error || !ids.length) throw new Error("Refresh the registry before exporting.");
    const blob = await repository.exportTransactions(ids, crypto.randomUUID());
    const url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`${ids.length} transaction records exported. Data access was recorded in Audit Logs.`);
  };
  const latest = selected && snapshot?.transactions.find(row => row.id === selected.id);
  const stale = !!selected && (!latest || latest.version !== selected.version || latest.status !== selected.status || !!error);
  const audit = snapshot?.transactions.flatMap(row => row.history.map(event => ({ row, event }))).sort((a, b) => b.event.occurred_at.localeCompare(a.event.occurred_at)) ?? [];
  const attention = snapshot?.transactions.filter(row => ["HELD", "PROCESSING", "PENDING"].includes(row.status)).sort((a, b) => (a.status === "HELD" ? 0 : 1) - (b.status === "HELD" ? 0 : 1) || a.created_at.localeCompare(b.created_at)) ?? [];
  const matchingAttention = attention.filter(row => matchesTransactionQuery(row, attentionQuery));
  const matchingAudit = audit.filter(({row,event}) => matchesTransactionQuery(row, auditQuery, [event]));
  return <div className="min-w-0 space-y-4 animate-fade-in">
    <h1 className="sr-only">Global transaction operations</h1>
    <PageHeader actionsPosition="right" sessionId={session.id} lastLogin={session.lastLogin}>
      <ActionButton variant="cyan" icon={<RefreshCw size={15}/>} disabled={busy} onClick={() => { setNotice(""); void load(); }}>{busy ? "Refreshing…" : "Refresh"}</ActionButton>
      <ActionButton variant="purple" icon={<Download size={15}/>} disabled={busy || exporting || !!error || !rows.length} onClick={async () => { setExporting(true); setNotice(""); try { await exportRows(rows.map(row => row.id)); } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Export failed."); } finally { setExporting(false); } }}>{exporting ? "Exporting…" : "Export filtered"}</ActionButton>
    </PageHeader>
    {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-4 text-sm text-rose-200">{error} {snapshot && "The previous snapshot is displayed. Decisions and exports are disabled until refresh succeeds."}</p>}
    {notice && <p role="status" className="rounded-xl border border-cyan-400/20 p-3 text-xs text-cyan-200">{notice}</p>}
    {!snapshot ? <CardSurface className="p-6"><p role="status" className="text-sm text-slate-400">{busy ? "Loading global transactions…" : "The registry is unavailable. Use Refresh to retry."}</p></CardSurface> : <>
      <TransactionWidgets summary={summarizeTransactions(snapshot.transactions, snapshot.as_of)} customers={snapshot.customer_count}/>
      <div className="flex flex-wrap justify-between gap-2 text-[10px] text-slate-500"><span>{snapshot.mode === "demo" ? "DEMO · Shared customer journals + dedicated sample customers" : "GLOBAL · Authoritative transaction service"}</span><span>Transfers · trading · cash · credit · rewards</span></div>
      <TransactionCharts rows={snapshot.transactions} asOf={snapshot.as_of}/>
      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <CardSurface as="section" tone="blue" className="p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-xs font-semibold text-slate-200">Operations requiring attention</h2><span className="text-[10px] text-slate-500">{matchingAttention.length} / {attention.length} queued</span></div><label className="mb-3 block"><span className="sr-only">Search attention operations</span><input type="search" className={txInput.replaceAll("cyan", "blue")} value={attentionQuery} onChange={event => setAttentionQuery(event.target.value)} placeholder="Search operation, customer, amount…"/></label><div className="h-56 overflow-y-auto overscroll-contain pr-2" role="region" aria-label="Scrollable transaction attention queue" tabIndex={0}>{matchingAttention.map(row => <button key={row.id} type="button" disabled={busy || !!error} onClick={() => setSelected(row)} className="block w-full cursor-pointer space-y-1 border-b border-white/5 py-3 text-left focus-visible:outline-2 focus-visible:outline-blue-300 disabled:opacity-50"><div className="flex flex-wrap items-center justify-between gap-2"><p className="break-all font-mono text-[11px] text-slate-200">{row.source_id}</p><StatusBadge status={row.status}/></div><p className="break-all text-[10px] text-slate-500">{row.customer_id}</p><p className="text-[10px] text-slate-400">{row.domain} · {money(row.value_usd)} · created {txDate(row.created_at)}</p></button>)}{!matchingAttention.length && <p className="py-12 text-center text-xs text-slate-500">{attentionQuery ? "No operations match this search." : "No pending, held or processing operations."}</p>}</div></CardSurface>
        <CardSurface as="section" tone="purple" className="p-4 sm:p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xs font-semibold text-slate-200">Transaction decision log</h2><span className="text-[10px] text-slate-500">{matchingAudit.length} / {audit.length}</span><Link href="/dashboard/admin/audit-logs" className="text-[10px] text-cyan-300 underline underline-offset-4">Full Audit Logs</Link></div><label className="mb-3 block"><span className="sr-only">Search transaction decision log</span><input type="search" className={txInput} value={auditQuery} onChange={event => setAuditQuery(event.target.value)} placeholder="Search actor, reference, decision or reason…"/></label><div className="h-56 overflow-y-auto overscroll-contain pr-2" role="region" aria-label="Scrollable transaction decision log" tabIndex={0}>{matchingAudit.map(({row,event}) => <article key={`${row.id}:${event.id}`} className="space-y-1 border-b border-white/5 py-3"><div className="flex flex-wrap justify-between gap-2"><p className="text-[10px] font-semibold text-purple-200">{event.action} · {row.domain}</p><time dateTime={event.occurred_at} className="text-[10px] text-slate-500">{txDate(event.occurred_at)}</time></div><p className="break-all text-[10px] text-slate-500">{event.actor} → {row.source_id}</p><p className="break-words text-xs leading-relaxed text-slate-300">{event.reason}</p></article>)}{!matchingAudit.length && <p className="py-12 text-center text-xs text-slate-500">{auditQuery ? "No decisions match this search." : "No administrator decisions recorded."}</p>}</div></CardSurface>
      </div>
      <TransactionsTable rows={rows} filters={filters} onFilters={setFilters} onOpen={setSelected} busy={busy || !!error}/>
      {selected && <TransactionActionModal key={selected.id} row={selected} stale={stale} onClose={() => setSelected(null)} onExecute={async (command, key) => { if (stale) throw new Error("Refresh and reopen the latest transaction."); await repository.execute(selected.customer_id, command, key); setNotice(`${selected.source_id}: ${command.action.toLowerCase()} recorded. Customer balances, reservations and transaction history have been updated.`); await load(); }} onExport={() => exportRows([selected.id])}/>}
    </>}
  </div>;
}
