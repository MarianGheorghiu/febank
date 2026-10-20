"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, RefreshCw } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import CardSurface from "@/app/components/ui/CardSurface";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import BuyingPowerCard from "@/app/components/ui/stocks/BuyingPowerCard";
import StockAnalytics from "@/app/components/ui/stocks/StockAnalytics";
import MarketExplorerTable from "@/app/components/ui/stocks/MarketExplorerTable";
import StockHoldingsTable from "@/app/components/ui/stocks/StockHoldingsTable";
import RecurringBuys from "@/app/components/ui/stocks/RecurringBuys";
import DividendTracker from "@/app/components/ui/stocks/DividendTracker";
import StockAnalyticsHub from "@/app/components/ui/stocks/StockAnalyticsHub";
import StockActionModal, { type StockTradeSelection } from "@/app/components/ui/stocks/StockActionModal";
import { createStocksRepository, STOCKS_EVENT } from "@/app/lib/stocks/repository";
import { downloadStocksReport } from "@/app/lib/stocks/report";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import type { StocksSnapshot } from "@/app/lib/stocks/contracts";
function StocksWorkspace({ customer }: { customer: string }) {
  const repository = useMemo(() => createStocksRepository(customer), [customer]);
  const [snapshot, setSnapshot] = useState<StocksSnapshot | null>(null), [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false), [exporting, setExporting] = useState(false), [selection, setSelection] = useState<StockTradeSelection | null>(null), [selected, setSelected] = useState("NVDA");
  const revision = useRef(0);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const request = ++revision.current; setRefreshing(true);
    try { const value = await repository.getSnapshot(signal); if (!signal?.aborted && request === revision.current) { setSnapshot(value); setError(""); } }
    catch (cause) { if (!signal?.aborted && request === revision.current) setError(cause instanceof Error ? cause.message : "Unable to load your stock portfolio."); }
    finally { if (!signal?.aborted && request === revision.current) setRefreshing(false); }
  }, [repository]);
  useEffect(() => {
    const controller = new AbortController(); const load = () => { void refresh(controller.signal); }; load();
    window.addEventListener(WALLET_EVENT, load); window.addEventListener(STOCKS_EVENT, load); window.addEventListener("focus", load);
    const timer = window.setInterval(load, 30000);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener(WALLET_EVENT, load); window.removeEventListener(STOCKS_EVENT, load); window.removeEventListener("focus", load); };
  }, [refresh]);
  function completed(value: StocksSnapshot) { revision.current++; setSnapshot(value); setError(""); setRefreshing(false); }
  function analyze(symbol: string) { setSelected(symbol); document.getElementById("stock-research")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); }
  async function exportReport() {
    if (exporting) return; setExporting(true);
    try { downloadStocksReport(await repository.getSnapshot()); notifyOperation("Report exported", "Your positions, orders, investment plans and dividends have been downloaded.", false, "Stocks & Trading"); }
    catch (cause) { notifyOperation("Export failed", cause instanceof Error ? cause.message : "The report could not be downloaded.", true, "Stocks & Trading"); } finally { setExporting(false); }
  }
  const defaultBuy = snapshot?.market.find(a => a.can_buy && a.symbol === selected) ?? snapshot?.market.find(a => a.can_buy);
  const symbol = snapshot?.market.some(a => a.symbol === selected) ? selected : snapshot?.market[0]?.symbol ?? "";
  return <div data-stocks-workspace className="w-full min-w-0 space-y-4 text-white">
    <h1 className="sr-only">Stocks & Trading</h1><PageHeader inlineActions actionsPosition="right" statusText="Stocks & Trading"><div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2"><button type="button" aria-label="Refresh stocks" title="Refresh stocks" disabled={refreshing} onClick={() => void refresh()} className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-blue-400/5 text-slate-200 transition-colors hover:border-blue-300/30 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></button><ActionButton autoWidth variant="blue" className="min-w-11" aria-label="Export stocks report" title="Export stocks report" labelClassName="hidden md:inline" icon={<Download size={15} />} disabled={!snapshot || exporting} onClick={() => void exportReport()}>Export</ActionButton><ActionButton autoWidth variant="green" className="min-w-11" aria-label="Buy stocks" title="Buy stocks" labelClassName="hidden md:inline" icon={<Plus size={15} />} disabled={!defaultBuy} onClick={() => { if (defaultBuy) setSelection({ type: "BUY", symbol: defaultBuy.symbol }); }}>Buy stocks</ActionButton></div></PageHeader>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-200"><p className="min-w-0 break-words">{error}</p><button disabled={refreshing} className="min-h-11 cursor-pointer underline disabled:cursor-not-allowed" onClick={() => void refresh()}>Retry</button></div>}
    {!snapshot ? <CardSurface role="status" className="p-8 text-sm text-slate-200">{error ? "Your stock portfolio is currently unavailable." : "Loading your stock portfolio…"}</CardSurface> : <>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(300px,1fr)_minmax(0,2fr)]"><BuyingPowerCard snapshot={snapshot} customer={customer} onComplete={() => void refresh()} onAnalyze={analyze} /><StockAnalytics snapshot={snapshot} /></div>
      <MarketExplorerTable snapshot={snapshot} onAction={setSelection} onAnalyze={analyze} />
      <StockHoldingsTable snapshot={snapshot} repository={repository} onComplete={completed} onAction={setSelection} onAnalyze={analyze} />
      <div className="grid min-w-0 auto-rows-fr grid-cols-1 items-stretch gap-4 lg:grid-cols-2"><RecurringBuys snapshot={snapshot} repository={repository} onComplete={completed} /><DividendTracker dividends={snapshot.dividends} /></div>
      <StockAnalyticsHub snapshot={snapshot} symbol={symbol} onSelect={setSelected} onAction={setSelection} />
      {selection && <StockActionModal key={`${selection.type}-${selection.symbol}`} selection={selection} snapshot={snapshot} repository={repository} onComplete={completed} onClose={() => setSelection(null)} />}
    </>}
  </div>;
}
export default function StocksPage() { const { user, loading } = useUser(); if (loading || !user) return <p role="status" className="p-6 text-slate-200">Loading your trading workspace…</p>; if (user.role !== "client") return <p className="p-6 text-slate-200">Switch to a customer account to access Stocks & Trading.</p>; return <StocksWorkspace key={user.email} customer={user.email} />; }
