"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Coins, Download, Gift, Plane, RefreshCw } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import type { MerchantOffer, OffersRepository, OffersSnapshot } from "@/app/lib/offers/contracts";
import { createOffersRepository } from "@/app/lib/offers/repository";
import { offerIsLive, offerMoney, pointsLabel, totalCashback } from "@/app/lib/offers/engine";
import { offersReport } from "@/app/lib/offers/report";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import { CARDS_EVENT } from "@/app/lib/cards/repository";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import PageHeader from "@/app/components/ui/PageHeader";
import CardSurface from "@/app/components/ui/CardSurface";
import MetricCard from "@/app/components/ui/MetricCard";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import { button } from "@/app/components/ui/stocks/StockUI";
import OfferDiscovery from "@/app/components/ui/offers/OfferDiscovery";
import RewardChart from "@/app/components/ui/offers/RewardChart";
import { MembershipSummary, RedemptionPanel, ResearchPanel, TravelBenefits } from "@/app/components/ui/offers/MemberBenefits";
import { BenefitRequests, RewardsActivity } from "@/app/components/ui/offers/RewardsActivity";
import RewardsActionDialog, { type OfferDialog } from "@/app/components/ui/offers/RewardsActionDialog";

function OffersWorkspace({ email, name }: { email: string; name: string }) {
  const configuration = useMemo<{ repository?: OffersRepository; error?: string }>(() => { try { return { repository: createOffersRepository(email, name) }; } catch (cause) { return { error: cause instanceof Error ? cause.message : "Offers service configuration is unavailable." }; } }, [email, name]);
  const repository = configuration.repository;
  const [snapshot, setSnapshot] = useState<OffersSnapshot | null>(null), [error, setError] = useState(""), [refreshing, setRefreshing] = useState(false), [reload, setReload] = useState(0), [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"Offers" | "Travel & experiences" | "Rewards & activity">("Offers"), [dialog, setDialog] = useState<OfferDialog | null>(null);
  const saveLock = useRef(false), saveRetry = useRef<{ fingerprint: string; key: string } | null>(null);
  useEffect(() => {
    if (!repository) return;
    let cancelled = false, revision = 0;
    const controller = new AbortController();
    const load = () => { const request = ++revision; setRefreshing(true); repository.getSnapshot(controller.signal).then(value => { if (!cancelled && request === revision) { setSnapshot(value); setError(""); } }).catch(cause => { if (!cancelled && request === revision) setError(cause instanceof Error ? cause.message : "Unable to load your offers."); }).finally(() => { if (!cancelled && request === revision) setRefreshing(false); }); };
    load(); window.addEventListener(WALLET_EVENT, load); window.addEventListener(CARDS_EVENT, load); window.addEventListener("focus", load); window.addEventListener("storage", load);
    const timer = window.setInterval(load, 60000);
    return () => { cancelled = true; controller.abort(); window.clearInterval(timer); window.removeEventListener(WALLET_EVENT, load); window.removeEventListener(CARDS_EVENT, load); window.removeEventListener("focus", load); window.removeEventListener("storage", load); };
  }, [repository, reload]);
  const failure = configuration.error ?? error;
  if (failure) return <CardSurface className="p-6"><p role="alert" className="text-sm text-rose-200">{failure}</p><button className={`${button} mt-4`} onClick={() => setReload(value => value + 1)}>Retry loading offers</button></CardSurface>;
  if (!snapshot || !repository) return <p role="status" className="p-6 text-sm text-cyan-200">Loading your membership, offers and rewards…</p>;
  const activated = snapshot.activations.filter(activation => snapshot.catalog.offers.some(offer => offer.id === activation.offer_id && offerIsLive(offer, snapshot.as_of))).length;
  async function save(offer: MerchantOffer) {
    if (!repository || !snapshot || saveLock.current) return;
    const command = { action: "save" as const, expected_version: snapshot.version, catalog_version: snapshot.catalog.version, offer_id: offer.id, saved: !snapshot.saved_offer_ids.includes(offer.id) };
    const fingerprint = JSON.stringify(command); if (saveRetry.current?.fingerprint !== fingerprint) saveRetry.current = { fingerprint, key: crypto.randomUUID() };
    saveLock.current = true; setBusy(true);
    try { setSnapshot(await repository.execute(command, saveRetry.current.key)); saveRetry.current = null; notifyOperation(command.saved ? "Offer saved" : "Offer removed", command.saved ? `${offer.merchant} is in your saved offers. Activate it before making a qualifying purchase.` : `${offer.merchant} was removed from your saved offers.`, false, "Premium Offers"); }
    catch (cause) { notifyOperation("Offer not saved", cause instanceof Error ? cause.message : "Unable to save this offer.", true, "Premium Offers"); }
    finally { saveLock.current = false; setBusy(false); }
  }
  function exportReport() {
    if (!snapshot) return;
    try { const url = URL.createObjectURL(new Blob([offersReport(snapshot)], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `premium-rewards-${snapshot.as_of.slice(0,10)}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); notifyOperation("Report exported", "Your rewards report was downloaded.", false, "Premium Offers"); } catch { notifyOperation("Export failed", "The report could not be downloaded. Try again.", true, "Premium Offers"); }
  }
  return <div className="w-full min-w-0 space-y-4"><h1 className="sr-only">Premium Offers</h1><PageHeader inlineActions statusText="Premium Offers"><div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2"><ActionButton autoWidth variant="cyan" aria-label="Redeem points" title="Redeem points" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" icon={<Gift size={15} />} disabled={!snapshot.membership.active || snapshot.available_points < snapshot.catalog.policy.cash_min_points} onClick={() => setDialog({ kind: "cash" })}>Redeem</ActionButton><ActionButton autoWidth variant="blue" aria-label="Export rewards report" title="Export rewards report" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" icon={<Download size={15} />} onClick={exportReport}>Export</ActionButton><ActionButton autoWidth variant="blue" aria-label="Refresh offers" title="Refresh offers" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" disabled={refreshing} icon={<RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />} onClick={() => setReload(value => value + 1)}>Refresh</ActionButton></div></PageHeader>
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Available points" value={pointsLabel(snapshot.available_points)} icon={Coins} tone="cyan" subtext={snapshot.expiring_points ? `${pointsLabel(snapshot.expiring_points)} expire within 30 days` : "Ready to redeem · no points expiring soon"} /><MetricCard title="Cashback received" value={offerMoney(totalCashback(snapshot))} icon={Gift} tone="blue" subtext="Posted merchant rewards · USD" /><MetricCard title="Activated offers" value={activated} icon={Check} tone="purple" subtext="Use your enrolled card before expiry" /><MetricCard title="Lounge visits left" value={snapshot.lounge_remaining} icon={Plane} tone="cyan" subtext={`${snapshot.catalog.policy.lounge_year} membership allowance`} /></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div role="tablist" aria-label="Premium offers workspace" className="flex max-w-full flex-wrap gap-1 rounded-xl border border-white/10 bg-[#030918]/60 p-1">{(["Offers", "Travel & experiences", "Rewards & activity"] as const).map((item, index) => <button key={item} id={`offers-tab-${index}`} role="tab" tabIndex={tab === item ? 0 : -1} onKeyDown={event => { const tabs = ["Offers", "Travel & experiences", "Rewards & activity"] as const; let next = index; if (event.key === "ArrowRight") next = (index + 1) % tabs.length; else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length; else if (event.key === "Home") next = 0; else if (event.key === "End") next = tabs.length - 1; else return; event.preventDefault(); setTab(tabs[next]); document.getElementById(`offers-tab-${next}`)?.focus(); }} aria-selected={tab === item} aria-controls="offers-content" type="button" onClick={() => setTab(item)} className={`min-h-11 cursor-pointer rounded-lg px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-cyan-300 ${tab === item ? "bg-cyan-300/15 text-cyan-100" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>{item}</button>)}</div><p className="text-[11px] text-slate-400">{snapshot.mode === "demo" ? "Demo benefits · illustrative partners" : "Connected member benefits"} · {snapshot.as_of.slice(0,10)}</p></div>
    <div id="offers-content" role="tabpanel" aria-labelledby={`offers-tab-${tab === "Offers" ? 0 : tab === "Travel & experiences" ? 1 : 2}`} className="space-y-4">{tab === "Offers" ? <><OfferDiscovery snapshot={snapshot} busy={busy} onView={offer => setDialog({ kind: "offer", id: offer.id })} onSave={offer => void save(offer)} /><div className="grid min-w-0 items-stretch gap-4 lg:grid-cols-2"><MembershipSummary snapshot={snapshot} /><RedemptionPanel snapshot={snapshot} onAction={setDialog} /></div></> : tab === "Travel & experiences" ? <TravelBenefits snapshot={snapshot} onAction={setDialog} onActivity={() => setTab("Rewards & activity")} /> : <><div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2"><RewardChart snapshot={snapshot} /><RedemptionPanel snapshot={snapshot} onAction={setDialog} /></div><div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2"><RewardsActivity snapshot={snapshot} /><BenefitRequests snapshot={snapshot} onAction={setDialog} /></div><ResearchPanel snapshot={snapshot} onAction={setDialog} /></>}</div>
    {dialog && <RewardsActionDialog key={JSON.stringify(dialog)} dialog={dialog} snapshot={snapshot} repository={repository} onClose={() => setDialog(null)} onComplete={next => { setSnapshot(previous => previous && previous.version > next.version ? previous : next); }} />}
  </div>;
}
export default function PremiumOffersPage() { const { user, loading } = useUser(); if (loading || !user) return <p role="status" className="p-6 text-sm text-slate-300">Loading your customer session…</p>; if (user.role !== "client") return <p className="p-6 text-sm text-slate-300">Switch to a customer account to view Premium Offers.</p>; return <OffersWorkspace key={user.email} email={user.email} name={user.name} />; }
