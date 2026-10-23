"use client";
import { useEffect, useMemo, useState } from "react";
import { Coins, Download, Landmark, RefreshCw, Wallet } from "lucide-react";
import { usePreferences } from "@/app/context/PreferencesContext";
import { useUser } from "@/app/context/UserContext";
import type { AnalyticsPeriod, AnalyticsRepository, AnalyticsSnapshot, AssetKind } from "@/app/lib/analytics/contracts";
import { createAnalyticsRepository } from "@/app/lib/analytics/repository";
import { analyticsMoney as money } from "@/app/lib/analytics/engine";
import { analyticsReport } from "@/app/lib/analytics/report";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import { CARDS_EVENT } from "@/app/lib/cards/repository";
import PageHeader from "@/app/components/ui/PageHeader";
import MetricCard from "@/app/components/ui/MetricCard";
import CardSurface from "@/app/components/ui/CardSurface";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import { button } from "@/app/components/ui/stocks/StockUI";
import PortfolioCharts from "@/app/components/ui/analytics/PortfolioCharts";
import AnalyticsHoldings from "@/app/components/ui/analytics/AnalyticsHoldings";
import AccountInsights from "@/app/components/ui/analytics/AccountInsights";
import CashflowAnalytics from "@/app/components/ui/analytics/CashflowAnalytics";
import AnalyticsActivity from "@/app/components/ui/analytics/AnalyticsActivity";
import styles from "@/app/components/ui/analytics/AnalyticsWorkspace.module.css";
const tabs = ["Portfolio", "Cash flow & cards", "Activity"] as const;
const periods: { value: AnalyticsPeriod; label: string }[] = [{ value: "30D", label: "30 days" }, { value: "90D", label: "90 days" }, { value: "1Y", label: "1 year" }, { value: "ALL", label: "All available" }];
function AnalyticsWorkspace({ email, name, initialPeriod }: { email: string; name: string; initialPeriod: AnalyticsPeriod }) {
  const configuration = useMemo<{ repository?: AnalyticsRepository; error?: string }>(() => { try { return { repository: createAnalyticsRepository(email, name) }; } catch (cause) { return { error: cause instanceof Error ? cause.message : "Analytics configuration is unavailable." }; } }, [email, name]);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [reload, setReload] = useState(0);
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialPeriod), [tab, setTab] = useState<typeof tabs[number]>("Portfolio"), [category, setCategory] = useState<AssetKind | "all">("all");
  const repository = configuration.repository;
  useEffect(() => {
    if (!repository) return;
    let cancelled = false, revision = 0;
    const controller = new AbortController();
    function load() { const request = ++revision; setBusy(true); repository!.getSnapshot(period, controller.signal).then(next => { if (!cancelled && revision === request) { setSnapshot(next); setError(""); } }).catch(cause => { if (!cancelled && revision === request) setError(cause instanceof Error ? cause.message : "Unable to load account analytics."); }).finally(() => { if (!cancelled && revision === request) setBusy(false); }); }
    load(); window.addEventListener(WALLET_EVENT, load); window.addEventListener(CARDS_EVENT, load); window.addEventListener("storage", load); window.addEventListener("focus", load); const timer = window.setInterval(load, 60000);
    return () => { cancelled = true; controller.abort(); window.clearInterval(timer); window.removeEventListener(WALLET_EVENT, load); window.removeEventListener(CARDS_EVENT, load); window.removeEventListener("storage", load); window.removeEventListener("focus", load); };
  }, [repository, period, reload]);
  const failure = configuration.error ?? error, ready = !!snapshot && snapshot.period === period && !failure;
  function download() {
    if (!snapshot || !ready) return;
    try { const url = URL.createObjectURL(new Blob([analyticsReport(snapshot)], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `account-analytics-${period}-${snapshot.as_of.slice(0, 10)}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); notifyOperation("Analytics exported", "Your account report includes holdings, activity and available balance history.", false, "Analytics"); } catch { notifyOperation("Export failed", "Your report could not be downloaded. Please try again.", true, "Analytics"); }
  }
  function selectCategory(kind: AssetKind) { setCategory(kind); document.getElementById("analytics-holdings")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); }
  return <div className="w-full min-w-0 space-y-4"><h1 className="sr-only">Analytics</h1><PageHeader inlineActions statusText="Analytics"><div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2"><ActionButton autoWidth variant="cyan" aria-label="Export account analytics" title="Export account analytics" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" icon={<Download size={15} />} disabled={!ready || busy} onClick={download}>Export</ActionButton><ActionButton autoWidth variant="blue" aria-label="Refresh analytics" title="Refresh analytics" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" disabled={busy} icon={<RefreshCw size={15} className={busy ? "animate-spin" : ""} />} onClick={() => setReload(value => value + 1)}>Refresh</ActionButton></div></PageHeader>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-white">Your account, in perspective</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">Current balances across your account. Choose a period for activity and spending.</p></div><div role="group" aria-label="Analytics period" className="flex max-w-full flex-wrap gap-1 rounded-xl border border-white/10 bg-[#030918]/60 p-1">{periods.map(p => <button key={p.value} type="button" aria-pressed={period === p.value} onClick={() => setPeriod(p.value)} className={`${styles.option} min-h-10 rounded-lg px-3 text-xs text-slate-200`}>{p.label}</button>)}</div></div>
    {failure ? <CardSurface className="p-5"><p role="alert" className="text-sm text-rose-200">{failure}</p><button className={`${button} mt-3`} onClick={() => setReload(value => value + 1)}>Retry analytics</button></CardSurface> : !ready || !snapshot ? <p role="status" className="p-6 text-sm text-cyan-200">Loading your account analytics…</p> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Total assets" value={money(snapshot.summary.assets_usd)} icon={Wallet} tone="cyan" subtext={`${snapshot.positions.length} holdings · available + reserved`} /><MetricCard title="Available cash" value={money(snapshot.summary.available_cash_usd)} icon={Coins} tone="blue" subtext="All fiat currencies · valued in USD" /><MetricCard title="Investments" value={money(snapshot.summary.investment_usd)} icon={Coins} tone="purple" subtext="Crypto & stocks · available + reserved" /><MetricCard title="Personal principal" value={money(snapshot.summary.debt_usd)} icon={Landmark} tone="blue" subtext="Loans & drawn credit · deducted from net worth" /></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div role="tablist" aria-label="Analytics workspace" className="flex max-w-full flex-wrap gap-1 rounded-xl border border-white/10 bg-[#030918]/60 p-1">{tabs.map((item, index) => <button key={item} id={`analytics-tab-${index}`} role="tab" type="button" tabIndex={tab === item ? 0 : -1} aria-selected={tab === item} aria-controls="analytics-content" onClick={() => setTab(item)} onKeyDown={event => { let next = index; if (event.key === "ArrowRight") next = (index + 1) % tabs.length; else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length; else if (event.key === "Home") next = 0; else if (event.key === "End") next = tabs.length - 1; else return; event.preventDefault(); setTab(tabs[next]); document.getElementById(`analytics-tab-${next}`)?.focus(); }} className={`min-h-11 cursor-pointer rounded-lg px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-cyan-300 ${tab === item ? "bg-cyan-300/15 text-cyan-100" : "text-slate-300 hover:bg-cyan-300/10 hover:text-cyan-100"}`}>{item}</button>)}</div><p className="text-[11px] text-slate-400">{snapshot.mode === "demo" ? "Demo account" : "Connected account"} · Updated {new Date(snapshot.as_of).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC</p></div>
      <div id="analytics-content" role="tabpanel" aria-labelledby={`analytics-tab-${tabs.indexOf(tab)}`} aria-busy={busy} className="space-y-4">{tab === "Portfolio" ? <><PortfolioCharts snapshot={snapshot} onSelect={selectCategory} /><div id="analytics-holdings" className="scroll-mt-4"><AnalyticsHoldings snapshot={snapshot} category={category} onCategory={setCategory} /></div><AccountInsights snapshot={snapshot} /></> : tab === "Cash flow & cards" ? <CashflowAnalytics snapshot={snapshot} /> : <AnalyticsActivity snapshot={snapshot} />}</div>
    </>}
  </div>;
}
export default function AnalyticsPage() { const { user, loading } = useUser(); const { preferences, loaded } = usePreferences(); if (loading || !user || !loaded) return <p role="status" className="p-6 text-sm text-slate-300">Loading your customer session…</p>; if (user.role !== "client") return <p className="p-6 text-sm text-slate-300">Switch to a customer account to view Analytics.</p>; return <AnalyticsWorkspace key={`${user.email}:${preferences.analytics_period}`} email={user.email} name={user.name} initialPeriod={preferences.analytics_period} />; }
