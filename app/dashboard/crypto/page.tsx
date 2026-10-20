"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, RefreshCw } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import CardSurface from "@/app/components/ui/CardSurface";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import CryptoManagement from "@/app/components/ui/currencies/CryptoManagement";
import CryptoPLAnalysis from "@/app/components/ui/crypto/CryptoPLAnalysis";
import CryptoOperations from "@/app/components/ui/crypto/CryptoOperations";
import CryptoMarketTable from "@/app/components/ui/crypto/CryptoMarketTable";
import CryptoActionModal, { type CryptoTradeSelection } from "@/app/components/ui/crypto/CryptoActionModal";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import { createCryptoRepository } from "@/app/lib/crypto/repository";
import { downloadCryptoOrders } from "@/app/lib/crypto/report";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import type { CryptoSnapshot } from "@/app/lib/crypto/contracts";
import type { CurrencySnapshot } from "@/app/lib/currencies/contracts";

function CryptoWorkspace({ customer }: { customer: string }) {
  const repository = useMemo(() => createCryptoRepository(customer), [customer]);
  const [snapshot, setSnapshot] = useState<CryptoSnapshot | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pending, setPending] = useState(false);
  const [selection, setSelection] = useState<CryptoTradeSelection | null>(null);
  const revision = useRef(0);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const request = ++revision.current; setRefreshing(true);
    try { const next = await repository.getSnapshot(signal); if (!signal?.aborted && request === revision.current) { setSnapshot(next); setError(""); } }
    catch (cause) { if (!signal?.aborted && request === revision.current) setError(cause instanceof Error ? cause.message : "Unable to load your crypto portfolio."); }
    finally { if (!signal?.aborted && request === revision.current) setRefreshing(false); }
  }, [repository]);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => { void refresh(controller.signal); }; load();
    window.addEventListener(WALLET_EVENT, load); window.addEventListener("focus", load);
    const timer = window.setInterval(load, 30000);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener(WALLET_EVENT, load); window.removeEventListener("focus", load); };
  }, [refresh]);
  function settled(wallet: CurrencySnapshot) {
    revision.current++; setRefreshing(false); setError("");
    setSnapshot(current => current ? { ...current, wallet } : current);
    void refresh();
  }
  async function exportReport() {
    if (exporting || pending) return;
    setExporting(true);
    try { const current = await repository.getSnapshot(); downloadCryptoOrders(current.orders); notifyOperation("Crypto activity exported", "Your crypto transactions have been downloaded as CSV.", false, "Crypto Terminal", "cyan"); }
    catch (cause) { notifyOperation("Export failed", cause instanceof Error ? cause.message : "The report could not be downloaded.", true, "Crypto Terminal"); }
    finally { setExporting(false); }
  }
  const buyAsset = snapshot?.market.find(asset => asset.can_buy && asset.symbol === "BTC") ?? snapshot?.market.find(asset => asset.can_buy);
  return <div data-crypto-workspace className="w-full min-w-0 space-y-4 text-white">
    <h1 className="sr-only">Crypto Terminal</h1>
    <PageHeader inlineActions actionsPosition="right" statusText="Crypto Terminal">
      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
        <button type="button" aria-label="Refresh crypto terminal" title="Refresh crypto terminal" disabled={refreshing || pending} onClick={() => void refresh()} className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-blue-400/5 text-slate-400 transition-colors hover:border-blue-300/30 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></button>
        <ActionButton autoWidth variant="blue" aria-label="Download crypto report" title="Download crypto report" className="min-w-11" labelClassName="hidden md:inline" icon={<Download size={15} />} disabled={!snapshot || exporting || pending} onClick={() => void exportReport()}>Export</ActionButton>
        <ActionButton autoWidth variant="cyan" aria-label="Buy crypto" title="Buy crypto" className="min-w-11" labelClassName="hidden md:inline" icon={<Plus size={15} />} disabled={!buyAsset || pending} onClick={() => { if (buyAsset) setSelection({ type: "BUY", symbol: buyAsset.symbol }); }}>Buy crypto</ActionButton>
      </div>
    </PageHeader>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200"><p className="min-w-0 break-words">{error}</p><button type="button" disabled={refreshing || pending} className="min-h-11 cursor-pointer underline disabled:cursor-not-allowed" onClick={() => void refresh()}>Retry</button></div>}
    {!snapshot ? <CardSurface role="status" className="p-8 text-sm text-slate-400">{error ? "Your crypto portfolio is currently unavailable." : "Loading your crypto portfolio…"}</CardSurface> : <>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3"><CryptoManagement accounts={snapshot.wallet.accounts} /><div className="min-w-0 xl:col-span-2"><CryptoPLAnalysis wallet={snapshot.wallet} /></div></div>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3"><CryptoOperations wallet={snapshot.wallet} repository={repository.exchange} onComplete={settled} onBusyChange={setPending} /><div className="min-w-0 xl:col-span-2"><CryptoMarketTable market={snapshot.market} accounts={snapshot.wallet.accounts} busy={pending} onAction={setSelection} /></div></div>
      {selection && <CryptoActionModal key={`${selection.type}-${selection.symbol}`} selection={selection} wallet={snapshot.wallet} repository={repository.exchange} onComplete={settled} onClose={() => setSelection(null)} />}
    </>}
  </div>;
}
export default function CryptoPage() {
  const { user, loading } = useUser();
  if (loading || !user) return <p role="status" className="p-6 text-slate-400">Loading your crypto terminal…</p>;
  if (user.role !== "client") return <p className="p-6 text-slate-400">Switch to a customer account to access Crypto Terminal.</p>;
  return <CryptoWorkspace key={user.email} customer={user.email} />;
}
