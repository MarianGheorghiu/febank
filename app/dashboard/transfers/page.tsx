"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Wallet, Clock3, ArrowUpRight, RefreshCw } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import CardSurface from "@/app/components/ui/CardSurface";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import MetricCard from "@/app/components/ui/MetricCard";
import TransferForm from "@/app/components/ui/transfers/TransferForm";
import TransferTable from "@/app/components/ui/transfers/TransferTable";
import TransferBottomWidgets from "@/app/components/ui/transfers/TransferBottomWidgets";
import { createTransferRepository } from "@/app/lib/transfers/repository";
import type { TransferSnapshot } from "@/app/lib/transfers/contracts";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import { amountLabel } from "@/app/lib/transfers/engine";

function TransferWorkspace({ clientId }: { clientId: string }) {
  const repository = useMemo(() => createTransferRepository(clientId), [clientId]);
  const [snapshot, setSnapshot] = useState<TransferSnapshot | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);
  const hasSnapshot = snapshot !== null;
  const panelsRef = useRef<HTMLDivElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const form = formPanelRef.current;
    const panels = panelsRef.current;
    if (!form || !panels) return;
    const resize = () => panels.style.setProperty("--transfer-panel-height", `${form.getBoundingClientRect().height}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(form);
    return () => observer.disconnect();
  }, [hasSnapshot]);
  const cancelKeys = useRef(new Map<string, string>());
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setRefreshing(true); setError("");
    try { const next = await repository.getSnapshot(signal); if (!signal?.aborted) setSnapshot(current => current && current.as_of > next.as_of ? current : next); }
    catch (cause) { if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Unable to load transfers."); }
    finally { if (!signal?.aborted) setRefreshing(false); }
  }, [repository]);
  useEffect(() => {
    const controller = new AbortController();
    let revision = 0;
    const load = () => {
      const request = ++revision;
      repository.getSnapshot(controller.signal).then(value => { if (!controller.signal.aborted && request === revision) { setSnapshot(value); setError(""); } }).catch(cause => { if (!controller.signal.aborted && request === revision) setError(cause instanceof Error ? cause.message : "Unable to load transfers."); });
    };
    load();
    window.addEventListener(WALLET_EVENT, load);
    window.addEventListener("focus", load);
    const timer = window.setInterval(load, 30000);
    return () => { controller.abort(); window.removeEventListener(WALLET_EVENT, load); window.removeEventListener("focus", load); window.clearInterval(timer); };
  }, [repository]);
  async function cancel(id: string) {
    if (lock.current) return;
    lock.current = true; setCancelling(true); setError("");
    try {
      const key = cancelKeys.current.get(id) ?? crypto.randomUUID(); cancelKeys.current.set(id, key);
      setSnapshot(await repository.cancel(id, key));
      notifyOperation("Transfer cancelled", "The reserved amount and fee are available again.", false, "Transfers", "cyan", 3000);
    } catch (cause) { notifyOperation("Unable to cancel transfer", cause instanceof Error ? cause.message : "Refresh the transfer status and try again.", true, "Transfers", "cyan", 4000); }
    finally { lock.current = false; setCancelling(false); }
  }
  const counts = snapshot ? { total: snapshot.transfers.length, completed: snapshot.transfers.filter(t => t.status === "completed").length, pending: snapshot.transfers.filter(t => ["pending", "processing"].includes(t.status)).length } : null;
  const usd = snapshot?.accounts.find(a => a.asset === "USD");
  return <div className="w-full min-w-0 space-y-5 text-white">
    <h1 className="sr-only">Transfers</h1>
    <PageHeader wrapActions statusText="Transfers workspace"><div className="ml-auto flex max-w-full flex-nowrap items-center justify-end gap-1.5">{counts && <div className="flex flex-nowrap items-center gap-1.5">{[{ label: "Transfers", value: counts.total, tone: "text-blue-200", surface: "border-blue-400/15 bg-blue-500/5" }, { label: "Completed", value: counts.completed, tone: "text-emerald-200", surface: "border-emerald-400/15 bg-emerald-500/5" }, { label: "In progress", value: counts.pending, tone: "text-amber-200", surface: "border-amber-400/15 bg-amber-500/5" }].map(c => <div key={c.label} className={`flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 ${c.surface}`}><span className="text-[9px] text-slate-400">{c.label}</span><span className={`text-[11px] font-bold tabular-nums ${c.tone}`}>{c.value}</span></div>)}</div>}<button type="button" aria-label="Refresh transfers" title="Refresh transfers" disabled={refreshing || cancelling || submitting} onClick={() => void refresh()} className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-200 transition-colors enabled:hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /></button></div></PageHeader>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200"><p className="min-w-0 break-words">{error}</p><button type="button" disabled={refreshing || cancelling || submitting} className="min-h-11 cursor-pointer rounded-lg border border-rose-300/20 px-3 hover:bg-rose-400/10 disabled:cursor-not-allowed" onClick={() => void refresh()}>Retry loading</button></div>}
    {!snapshot ? !error && <CardSurface className="p-8 text-slate-400" role="status">Loading transfer accounts and activity…</CardSurface> : <>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"><MetricCard title="Available to send · USD" value={usd ? amountLabel(usd.available, "USD") : "No USD account"} icon={Wallet} tone="cyan" iconColor="text-cyan-300" subtext={<p>Select other assets in the transfer form</p>} /><MetricCard title="Reserved for transfers · USD" value={usd ? amountLabel(usd.reserved, "USD") : "No USD account"} icon={ArrowUpRight} tone="purple" iconColor="text-purple-300" subtext={<p>Amount and fees held for pending requests</p>} /><MetricCard title="Transfers in progress" value={counts?.pending ?? 0} icon={Clock3} tone="blue" iconColor="text-blue-300" subtext={<p>Follow delivery and cancellation in your activity</p>} /></div>
      <div ref={panelsRef} className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-12"><div ref={formPanelRef} className="min-w-0 self-start xl:col-span-5 2xl:col-span-4"><TransferForm snapshot={snapshot} repository={repository} blocked={refreshing || cancelling} onBusyChange={setSubmitting} onUpdate={value => { setSnapshot(value); setError(""); }} /></div><div className="min-w-0 xl:col-span-7 2xl:col-span-8"><TransferTable matchFormHeight transfers={snapshot.transfers} onCancel={cancel} busy={cancelling || submitting || refreshing} /></div></div>
      <TransferBottomWidgets snapshot={snapshot} />
    </>}
  </div>;
}
export default function TransfersPage() {
  const { user, loading } = useUser();
  if (loading || !user) return <p role="status" className="p-6 text-slate-400">Loading your transfer workspace…</p>;
  if (user.role !== "client") return <p className="p-6 text-slate-400">Switch to a customer account to access personal transfers.</p>;
  return <TransferWorkspace key={user.email} clientId={user.email} />;
}
