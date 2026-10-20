"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Download, Globe, LockKeyhole, Plus, RefreshCw, ShieldCheck, Snowflake, SlidersHorizontal, Truck, History, Trash2 } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import CardSurface from "@/app/components/ui/CardSurface";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import { button, sellButton, StockTitle } from "@/app/components/ui/stocks/StockUI";
import CardSelect from "@/app/components/ui/admin/cards/CardSelect";
import VaultCardVisual from "@/app/components/ui/cards/VaultCardVisual";
import VaultSecurityDialog from "@/app/components/ui/cards/VaultSecurityDialog";
import VaultAnalytics, { cardMoney } from "@/app/components/ui/cards/VaultAnalytics";
import VaultActivity, { downloadCardActivity } from "@/app/components/ui/cards/VaultActivity";
import VaultActionDialog, { type VaultAction } from "@/app/components/ui/cards/VaultActionDialog";
import { CARDS_EVENT, createCardsRepository } from "@/app/lib/cards/repository";
import { customerControlCeiling } from "@/app/lib/admin/card-issuing";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import type { CustomerCardsSnapshot } from "@/app/lib/cards/contracts";
import { notifyOperation } from "@/app/components/ui/OperationNotification";

function CardsWorkspace({ email, name }: { email: string; name: string }) {
  const repository = useMemo(() => createCardsRepository(email, name), [email, name]);
  const [snapshot, setSnapshot] = useState<CustomerCardsSnapshot | null>(null), [error, setError] = useState("");
  const [selected, setSelected] = useState(""), [busy, setBusy] = useState(false), [action, setAction] = useState<VaultAction | null>(null);
  const revision = useRef(0), channelLock = useRef(false);
  const [securityOpen, setSecurityOpen] = useState(false), [savingChannel, setSavingChannel] = useState(false);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const request = ++revision.current; setBusy(true);
    try { const value = await repository.getSnapshot(signal); if (!signal?.aborted && request === revision.current) { setSnapshot(value); setError(""); } }
    catch (cause) { if (!signal?.aborted && request === revision.current) setError(cause instanceof Error ? cause.message : "Unable to load Cards Vault."); }
    finally { if (!signal?.aborted && request === revision.current) setBusy(false); }
  }, [repository]);
  useEffect(() => {
    const controller = new AbortController(), load = () => { void refresh(controller.signal); };
    const storage = (event: StorageEvent) => { if (event.key === "mbank_admin_card_issuing_v1" || event.key === null) load(); };
    load(); window.addEventListener(CARDS_EVENT, load); window.addEventListener(WALLET_EVENT, load); window.addEventListener("storage", storage); window.addEventListener("focus", load);
    return () => { controller.abort(); window.removeEventListener(CARDS_EVENT, load); window.removeEventListener(WALLET_EVENT, load); window.removeEventListener("storage", storage); window.removeEventListener("focus", load); };
  }, [refresh]);
  const card = snapshot?.cards.find(c => c.id === selected) ?? snapshot?.cards.find(c => c.status !== "TERMINATED") ?? snapshot?.cards[0];
  const activity = snapshot?.activity.filter(tx => tx.card_id === card?.id) ?? [];
  const canOrder = !!snapshot?.customer && snapshot.customer.accountStatus === "ACTIVE" && snapshot.customer.kycStatus === "VERIFIED" && snapshot.cards.filter(c => c.status !== "TERMINATED" && !c.id.startsWith("CRD-DEMO-")).length < snapshot.policy.maxOpenCardsPerCustomer;
  const ceiling = card && snapshot ? customerControlCeiling(snapshot.audit, card, email) : null;
  const permissions = card ? snapshot?.permissions[card.id] ?? [] : [];
  function completed(value: CustomerCardsSnapshot) {
    revision.current++; setSnapshot(value); setError(""); setBusy(false);
    if (action === "ISSUE") { const created = value.cards.find(c => !snapshot?.cards.some(old => old.id === c.id)); if (created) setSelected(created.id); }
    notifyOperation(action === "TERMINATE" ? "Card deleted" : "Card updated", action === "TERMINATE" ? "Your card was permanently removed from Cards Vault." : "Your card changes have been saved.", false, "Cards Vault");
  }
  async function toggleChannel(channel: "online" | "atm" | "contactless" | "international") {
    if (!card || channelLock.current) return;
    channelLock.current = true; setSavingChannel(true);
    try { completed(await repository.execute({ action: "UPDATE_CONTROLS", card_id: card.id, expected_version: card.version, limits: card.limits, channels: { ...card.channels, [channel]: !card.channels[channel] } }, crypto.randomUUID())); }
    catch (cause) { notifyOperation("Control not changed", cause instanceof Error ? cause.message : "Please retry.", true, "Cards Vault"); }
    finally { channelLock.current = false; setSavingChannel(false); }
  }
  const funding = snapshot?.funding_accounts.find(a => a.currency === card?.currency);
  const used = card && card.limits.monthly > 0 ? card.spentThisMonth / card.limits.monthly * 100 : 0;
  return <div className="w-full min-w-0 space-y-4 text-white"><h1 className="sr-only">Cards Vault</h1>
    <PageHeader inlineActions actionsPosition="right" statusText="Cards Vault"><div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2"><button className={`${button} h-11 w-11 px-0`} aria-label="Refresh cards" title="Refresh cards" disabled={busy} onClick={() => void refresh()}><RefreshCw size={15} className={busy ? "animate-spin" : ""} /></button><ActionButton autoWidth variant="blue" className="min-w-11" labelClassName="hidden md:inline" aria-label="Export card activity" title="Export card activity" icon={<Download size={15} />} disabled={!card || !activity.length} onClick={() => { if (card) downloadCardActivity(activity, card.last4); }}>Export</ActionButton><ActionButton autoWidth variant="green" className="min-w-11" labelClassName="hidden md:inline" aria-label="Order a new card" title="Order a new card" icon={<Plus size={15} />} disabled={!canOrder || !!error} onClick={() => setAction("ISSUE")}>New card</ActionButton></div></PageHeader>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-200"><p className="min-w-0 break-words">{error}</p><button className={button} disabled={busy} onClick={() => void refresh()}>Retry</button></div>}
    {!snapshot ? <CardSurface role="status" className="p-8 text-sm text-slate-300">{error ? "Cards Vault is currently unavailable." : "Loading your cards…"}</CardSurface> : <>
      {!snapshot.customer && <CardSurface className="p-6"><h2 className="font-semibold">Your cards are being prepared</h2><p className="mt-2 text-sm text-slate-300">Your cards profile is temporarily unavailable. Refresh to try again.</p></CardSurface>}
      {snapshot.customer && !canOrder && <p className="rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-xs text-amber-100">{snapshot.customer.accountStatus !== "ACTIVE" ? "Your account is restricted. Contact support to restore access." : snapshot.customer.kycStatus !== "VERIFIED" ? "Complete identity verification before ordering or activating cards." : `You have reached the limit of ${snapshot.policy.maxOpenCardsPerCustomer} open cards.`}</p>}
      {card?.id.startsWith("CRD-DEMO-") && <p className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 px-4 py-3 text-xs leading-relaxed text-cyan-100">Demo card · Example payments help you explore your cards, limits and spending insights. No funds have been moved.</p>}
      {card ? <>
        <CardSurface className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center"><label className="min-w-0 lg:w-80 lg:shrink-0"><span className="mb-2 block text-xs text-slate-300">Your cards · {snapshot.cards.filter(c => c.status !== "TERMINATED" && !c.id.startsWith("CRD-DEMO-")).length} open{snapshot.cards.some(c => c.id.startsWith("CRD-DEMO-")) ? " + demo" : ""}</span><CardSelect value={card.id} onChange={e => { setSelected(e.target.value); setAction(null); setSecurityOpen(false); }} aria-label="Select card">{snapshot.cards.map(c => <option key={c.id} value={c.id}>{c.id.startsWith("CRD-DEMO-") ? "Demo card" : c.type === "PHYSICAL" ? "Physical" : "Virtual"} · {c.currency} · •••• {c.last4}{c.status === "TERMINATED" ? " · Closed" : ""}</option>)}</CardSelect></label><div className="flex items-center gap-2 text-xs text-slate-300"><ShieldCheck size={16} className="text-cyan-200" />Limits and security stay in sync with operations</div></CardSurface>
        <div className="grid min-w-0 items-stretch gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <CardSurface as="section" className="p-4 sm:p-5" tone="purple"><StockTitle icon={CreditCard} aside={<span className={`rounded-full border px-2.5 py-1 text-[11px] ${card.status === "ACTIVE" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>{card.status === "TERMINATED" ? "closed" : card.status.toLowerCase()}</span>}>{card.id.startsWith("CRD-DEMO-") ? "Your demo card" : `Your ${card.type.toLowerCase()} card`}</StockTitle>
            <VaultCardVisual key={`${card.id}-${card.version}`} card={card} holder={snapshot.customer?.name ?? ""} repository={repository} />
            <div className="mt-4 flex flex-wrap gap-2">{permissions.includes("FREEZE") && <button className={button} disabled={!!error} onClick={() => setAction("FREEZE")}><Snowflake size={15} />Freeze</button>}{permissions.includes("UNFREEZE") && <button className={button} disabled={!!error} onClick={() => setAction("UNFREEZE")}><Snowflake size={15} />Unfreeze</button>}{permissions.includes("ACTIVATE") && <button className={button} disabled={!!error} onClick={() => setAction("ACTIVATE")}><ShieldCheck size={15} />Activate card</button>}{permissions.includes("UPDATE_CONTROLS") && <button className={button} disabled={!!error} onClick={() => setAction("UPDATE_CONTROLS")}><SlidersHorizontal size={15} />Controls</button>}<button className={button} onClick={() => setSecurityOpen(true)}><History size={15} />Security activity</button>{permissions.includes("TERMINATE") && <button className={sellButton} disabled={!!error || savingChannel} onClick={() => setAction("TERMINATE")}><Trash2 size={15} />Delete card</button>}</div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-400"><LockKeyhole size={14} className="mt-0.5 shrink-0" />{card.status === "TERMINATED" ? "This card is permanently closed. Your payment and security history remain available." : card.status === "BLOCKED" || (card.status === "FROZEN" && !permissions.includes("UNFREEZE")) ? "This card is restricted by operations. Contact support for assistance." : "Card details stay hidden until you reveal them and hide again automatically."}</p>
          </CardSurface>
          <CardSurface as="section" className="p-4 sm:p-5"><StockTitle icon={SlidersHorizontal}>Limits & security</StockTitle><p className="text-xs text-slate-300">Monthly usage · {card.currency}</p><div className="mt-2 flex flex-wrap items-baseline gap-2"><span className="text-3xl font-semibold tracking-tight tabular-nums">{cardMoney(card.spentThisMonth, card.currency)}</span><span className="text-sm text-slate-400">of {cardMoney(card.limits.monthly, card.currency)}</span></div><div role="progressbar" aria-label="Monthly spending limit used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(used))} aria-valuetext={`${used.toFixed(1)}% of monthly limit`} className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${used >= 90 ? "bg-amber-300" : "bg-cyan-300"}`} style={{ width: `${Math.min(100, used)}%` }} /></div><div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-300"><span>{cardMoney(Math.max(0, card.limits.monthly - card.spentThisMonth), card.currency)} remaining</span><span>{used.toFixed(1)}% used</span></div>
            <div className="mt-5 grid grid-cols-2 gap-3">{[["Daily limit", card.limits.daily], ["ATM daily limit", card.limits.atmDaily]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/5 bg-white/[.025] p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-semibold tabular-nums">{cardMoney(value, card.currency)}</p></div>)}</div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{(["online", "contactless", "atm", "international"] as const).map(channel => {
              const restricted = !ceiling?.channels[channel];
              const unsupported = card.type === "VIRTUAL" && (channel === "atm" || channel === "contactless");
              return <button key={channel} type="button" role="switch" aria-label={`${channel === "atm" ? "ATM" : channel} payments`} aria-checked={card.channels[channel]} disabled={restricted || unsupported || savingChannel || !!error || !permissions.includes("UPDATE_CONTROLS")} onClick={() => void toggleChannel(channel)} className="flex min-h-14 min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.025] p-3 text-left text-xs transition-colors hover:border-cyan-300/30 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"><span className="min-w-0"><span className="block capitalize text-slate-200">{channel === "atm" ? "ATM withdrawals" : channel}</span><span className="mt-1 block text-[10px] text-slate-400">{unsupported ? "Physical card required" : restricted ? "Restricted by operations" : card.channels[channel] ? "Enabled" : "Disabled"}</span></span><span aria-hidden="true" className={`flex h-6 w-10 shrink-0 items-center rounded-full p-1 ${card.channels[channel] ? "justify-end bg-cyan-300/25" : "justify-start bg-slate-600/40"}`}><span className={`h-4 w-4 rounded-full ${card.channels[channel] ? "bg-cyan-200" : "bg-slate-400"}`} /></span></button>;
            })}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-300/10 bg-blue-300/5 p-3 text-xs"><span className="text-slate-300">Available in linked {card.currency} account</span><span className="font-semibold tabular-nums">{funding ? cardMoney(funding.available, card.currency) : "No linked account"}</span></div><p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><Globe size={14} />Card currency: {card.currency}. No combined totals across currencies.</p>
          </CardSurface>
        </div>
        {card.type === "PHYSICAL" && !card.id.startsWith("CRD-DEMO-") && <CardSurface className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex min-w-0 items-center gap-3"><Truck size={18} className="shrink-0 text-blue-200" /><div className="min-w-0"><p className="text-sm font-medium">Delivery · {card.delivery.toLowerCase().replaceAll("_", " ")}</p><p className="mt-1 break-words text-xs text-slate-400">{card.deliveryAddress ?? "No delivery address on file"}</p></div></div>{card.trackingReference && <span className="break-all font-mono text-xs text-slate-300">{card.trackingReference}</span>}</CardSurface>}
        <VaultAnalytics key={`analytics-${card.id}`} activity={activity} asOf={snapshot.as_of} currency={card.currency} monthlyLimit={card.limits.monthly} spentThisMonth={card.spentThisMonth} />
        <VaultActivity key={`activity-${card.id}`} activity={activity} last4={card.last4} />
        {securityOpen && <VaultSecurityDialog key={card.id} audit={snapshot.audit} card={card} email={email} onClose={() => setSecurityOpen(false)} />}
      </> : snapshot.customer && <CardSurface className="p-8 text-center"><CreditCard className="mx-auto mb-3 text-cyan-200" /><h2 className="font-semibold">No cards in your vault</h2><p className="mt-2 text-sm text-slate-300">Use New card to order a virtual or physical card.</p></CardSurface>}
      {action && <VaultActionDialog key={`${action}-${card?.id ?? "new"}`} action={action} card={action === "ISSUE" ? undefined : card} snapshot={snapshot} repository={repository} onClose={() => setAction(null)} onComplete={completed} />}
    </>}
  </div>;
}
export default function CardsPage() { const { user, loading } = useUser(); if (loading || !user) return <p role="status" className="p-6 text-slate-300">Loading your cards workspace…</p>; if (user.role !== "client") return <p className="p-6 text-slate-300">Switch to a customer account to access Cards Vault.</p>; return <CardsWorkspace key={user.email} email={user.email} name={user.name} />; }
