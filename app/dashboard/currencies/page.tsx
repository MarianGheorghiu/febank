"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import CardSurface from "@/app/components/ui/CardSurface";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import AccountManagement from "@/app/components/ui/currencies/AccountManagement";
import StockManagement from "@/app/components/ui/currencies/StockManagement";
import AssetPanel from "@/app/components/ui/currencies/AssetPanel";
import ExchangeForm from "@/app/components/ui/currencies/ExchangeForm";
import EvolutionChart from "@/app/components/ui/currencies/EvolutionChart";
import CurrencyTransferDialog from "@/app/components/ui/currencies/CurrencyTransferDialog";
import { createCurrencyRepository } from "@/app/lib/currencies/repository";
import type { CurrencySnapshot } from "@/app/lib/currencies/contracts";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
function CurrenciesWorkspace({ customer }: { customer: string }) {
  const repository = useMemo(() => createCurrencyRepository(customer), [customer]);
  const [snapshot, setSnapshot] = useState<CurrencySnapshot | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const revision = useRef(0);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const request = ++revision.current; setRefreshing(true);
    try { const next = await repository.getSnapshot(signal); if (!signal?.aborted && request === revision.current) { setSnapshot(next); setError(""); } }
    catch (cause) { if (!signal?.aborted && request === revision.current) setError(cause instanceof Error ? cause.message : "Unable to load your currencies."); }
    finally { if (!signal?.aborted && request === revision.current) setRefreshing(false); }
  }, [repository]);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => { void refresh(controller.signal); }; load();
    window.addEventListener(WALLET_EVENT, load); window.addEventListener("focus", load);
    const timer = window.setInterval(load, 30000);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener(WALLET_EVENT, load); window.removeEventListener("focus", load); };
  }, [refresh]);
  return <div data-currencies-workspace className="w-full min-w-0 space-y-4 text-white">
    <h1 className="sr-only">Currencies</h1>
    <PageHeader inlineActions actionsPosition="right" statusText="Currencies">
      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2"><button type="button" aria-label="Refresh currencies" title="Refresh currencies" disabled={refreshing} onClick={() => void refresh()} className="inline-flex cursor-pointer disabled:cursor-not-allowed h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-blue-400/5 text-slate-400 transition-colors hover:border-blue-300/30 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-40"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></button><ActionButton autoWidth variant="purple" aria-label="Quick transfer" title="Quick transfer" className="min-w-11" labelClassName="hidden md:inline" icon={<ArrowUpRight size={15} />} disabled={!snapshot} onClick={() => setTransfer(true)}>Quick transfer</ActionButton></div>
    </PageHeader>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200"><p className="min-w-0 break-words">{error}</p><button type="button" disabled={refreshing} className="min-h-11 cursor-pointer underline" onClick={() => void refresh()}>Retry</button></div>}
    {!snapshot ? <CardSurface role="status" className="p-8 text-sm text-slate-400">{error ? "Currencies are currently unavailable." : "Loading your wallet…"}</CardSurface> : <>
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"><AccountManagement accounts={snapshot.accounts.filter(a => a.kind === "fiat")} /><AssetPanel kind="crypto" accounts={snapshot.accounts.filter(a => a.kind === "crypto" && (Number(a.available) > 0 || Number(a.reserved) > 0))} /><div className="min-w-0 lg:col-span-2 xl:col-span-1"><StockManagement accounts={snapshot.accounts.filter(a => a.kind === "stock" && (Number(a.available) > 0 || Number(a.reserved) > 0))} /></div></div>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3"><ExchangeForm snapshot={snapshot} repository={repository} onComplete={next => { revision.current++; setSnapshot(next); setRefreshing(false); setError(""); }} /><div className="min-w-0 xl:col-span-2"><EvolutionChart snapshot={snapshot} /></div></div>
    </>}
    {transfer && <CurrencyTransferDialog customer={customer} onClose={() => setTransfer(false)} onComplete={() => void refresh()} />}
  </div>;
}
export default function CurrenciesPage() {
  const { user, loading } = useUser();
  if (loading || !user) return <p role="status" className="p-6 text-slate-400">Loading your currencies…</p>;
  if (user.role !== "client") return <p className="p-6 text-slate-400">Switch to a customer account to access Currencies.</p>;
  return <CurrenciesWorkspace key={user.email} customer={user.email} />;
}
