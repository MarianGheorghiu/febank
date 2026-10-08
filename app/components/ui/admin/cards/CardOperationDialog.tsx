"use client";

import CardSelect from "./CardSelect";
import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, CreditCard, Loader2, ShieldCheck, X } from "lucide-react";
import { MOCK_ISSUING_POLICY } from "@/app/lib/mock/admin/card-issuing";
import { customerIsEligible, validateCardLimits } from "@/app/lib/admin/card-issuing";
import type { CardAction, CardChannels, CardCommand, CardCurrency, CardCustomer, CardLimits, CardNetwork, IssuedCard, IssuedCardType } from "@/app/lib/types/admin/card-issuing";
import { actionDescriptions, buttonClass, primaryButtonClass, dangerButtonClass, cardActionLabels, formatCardMoney, inputClass } from "./presentation";

export type CardDialogIntent = { action: "ISSUE" } | { action: CardAction; card: IssuedCard };
interface Props { intent: CardDialogIntent; customers: CardCustomer[]; operator: string; onClose: () => void; onConfirm: (command: CardCommand) => Promise<void> }
const channelLabels: Record<keyof CardChannels, string> = { online: "Online payments", atm: "ATM cash withdrawals", contactless: "Contactless payments", international: "International payments" };

export default function CardOperationDialog({ intent, customers, operator, onClose, onConfirm }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const card = "card" in intent ? intent.card : null;
  const [customerId, setCustomerId] = useState(card?.userId ?? customers.find(customerIsEligible)?.id ?? "");
  const [type, setType] = useState<IssuedCardType>(card?.type ?? "VIRTUAL");
  const [network, setNetwork] = useState<CardNetwork>(card?.network ?? "VISA");
  const [currency, setCurrency] = useState<CardCurrency>(card?.currency ?? "EUR");
  const [limits, setLimits] = useState<CardLimits>(card ? { ...card.limits } : { ...MOCK_ISSUING_POLICY.defaultLimits, atmDaily: 0 });
  const [channels, setChannels] = useState<CardChannels>(card ? { ...card.channels } : { online: true, atm: false, contactless: false, international: true });
  const [tracking, setTracking] = useState("");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const customer = customers.find(customer => customer.id === customerId);
  const destructive = ["BLOCK", "TERMINATE", "REPLACE"].includes(intent.action);
  const title = intent.action === "ISSUE" ? "Issue a customer card" : cardActionLabels[intent.action];
  const editsLimits = intent.action === "ISSUE" || intent.action === "UPDATE_CONTROLS";

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);

  const buildCommand = (): CardCommand => {
    if (reason.trim().length < 10 || reason.trim().length > 500) throw new Error("An operational reason of 10–500 characters is required for the audit trail.");
    if (intent.action === "ISSUE") {
      if (!customer || !customerIsEligible(customer)) throw new Error("Select an active customer with verified KYC.");
      if (type === "PHYSICAL" && !customer.deliveryAddress) throw new Error("This customer has no verified delivery address.");
      validateCardLimits(limits, type, MOCK_ISSUING_POLICY);
      return { action: "ISSUE", userId: customerId, type, network, currency, limits, reason };
    }
    if (intent.action === "UPDATE_CONTROLS") validateCardLimits(limits, type, MOCK_ISSUING_POLICY, intent.card);
    if (intent.action === "DISPATCH" && !/^[a-zA-Z0-9][a-zA-Z0-9 ./_-]{5,79}$/.test(tracking.trim())) throw new Error("Enter the carrier's tracking reference (6–80 characters).");
    return { action: intent.action, cardId: intent.card.id, expectedVersion: intent.card.version, reason, limits, channels, trackingReference: tracking };
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    try {
      const command = buildCommand();
      if (!reviewing) { setReviewing(true); return; }
      if (destructive && confirmation.trim() !== card?.last4) throw new Error("Enter the card's last four digits to confirm this permanent operation.");
      setBusy(true);
      await onConfirm(command);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The operation failed. Review the card and try again."); }
    finally { setBusy(false); }
  };

  return (
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto scrollbar-thin rounded-xl border border-cyan-500/50 bg-gradient-to-br from-[#020617] to-[#04163a] p-0 text-white shadow-[0_0_60px_rgba(6,182,212,0.2)] backdrop:bg-black/85 backdrop:backdrop-blur-sm">
      <form onSubmit={submit} className="space-y-5 p-5 sm:p-6 font-mono">
        <div className="flex items-start justify-between gap-4 border-b border-cyan-500/20 pb-4"><div><p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400"><ShieldCheck size={13} /> Administrator operation</p><h2 id={titleId} className="text-lg font-black text-white">{reviewing ? "Review & confirm" : title}</h2></div><button type="button" className={buttonClass} disabled={busy} onClick={onClose} aria-label="Close dialog"><X size={15} /></button></div>
        <p id={descriptionId} className="text-xs leading-relaxed text-slate-300">{intent.action === "ISSUE" ? "Create a pending card for an eligible customer. Physical cards enter the fulfilment queue; virtual cards still require explicit activation." : actionDescriptions[intent.action]}</p>
        {card && <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-3 text-xs"><p className="font-bold text-white">{customer?.name ?? card.userId} · •••• {card.last4}</p><p className="mt-1 break-all text-[10px] text-slate-400">{card.id} · {card.status} · {card.type} · {card.currency}</p></div>}
        {!reviewing && <>
          {intent.action === "ISSUE" && <div className="space-y-4">
            <label className="block space-y-1.5 text-[11px] text-slate-300"><span>Customer account</span><CardSelect required value={customerId} onChange={event => setCustomerId(event.target.value)}><option value="" disabled>Select a customer</option>{customers.map(customer => <option key={customer.id} value={customer.id} disabled={!customerIsEligible(customer)}>{customer.name} · {customer.id}{!customerIsEligible(customer) ? ` — ${customer.accountStatus === "BLOCKED" ? "account blocked" : "KYC in review"}` : ""}</option>)}</CardSelect></label>
            {customer && <p className="break-all text-[10px] text-slate-400">{customer.email} · KYC {customer.kycStatus} · Account {customer.accountStatus}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="space-y-1.5 text-[11px] text-slate-300"><span className="block">Card type</span><CardSelect value={type} onChange={event => { const value = event.target.value as IssuedCardType; setType(value); setLimits(current => ({ ...current, atmDaily: value === "VIRTUAL" ? 0 : Math.min(current.daily, MOCK_ISSUING_POLICY.defaultLimits.atmDaily) })); }}><option value="VIRTUAL">Virtual</option><option value="PHYSICAL">Physical</option></CardSelect></label>
              <label className="space-y-1.5 text-[11px] text-slate-300"><span className="block">Network</span><CardSelect value={network} onChange={event => setNetwork(event.target.value as CardNetwork)}>{MOCK_ISSUING_POLICY.networks.map(value => <option key={value}>{value}</option>)}</CardSelect></label>
              <label className="space-y-1.5 text-[11px] text-slate-300"><span className="block">Currency</span><CardSelect value={currency} onChange={event => setCurrency(event.target.value as CardCurrency)}>{MOCK_ISSUING_POLICY.currencies.map(value => <option key={value}>{value}</option>)}</CardSelect></label>
            </div>
          </div>}
          {type === "PHYSICAL" && ["ISSUE", "REPLACE", "DISPATCH"].includes(intent.action) && <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-3 text-[11px] text-slate-300"><p className="mb-1 font-bold text-blue-300">Verified delivery address</p>{customer?.deliveryAddress ?? "No verified delivery address on file."}</div>}
          {editsLimits && <fieldset className="space-y-3"><legend className="mb-3 text-xs font-bold text-cyan-300">Spending limits ({currency})</legend><div className="grid gap-3 sm:grid-cols-3">{([["daily", "Daily purchases"], ["monthly", "Monthly purchases"], ["atmDaily", "Daily ATM"]] as const).map(([key, label]) => <label key={key} className="space-y-1.5 text-[10px] text-slate-300"><span className="block">{label}</span><input type="number" required min={key === "atmDaily" ? 0 : 0.01} max={MOCK_ISSUING_POLICY.maxMonthlyLimit} step="0.01" disabled={key === "atmDaily" && type === "VIRTUAL"} className={inputClass} value={Number.isNaN(limits[key]) ? "" : limits[key]} onChange={event => setLimits(current => ({ ...current, [key]: event.target.value === "" ? NaN : Number(event.target.value) }))} /></label>)}</div><p className="text-[10px] leading-relaxed text-slate-400">ATM ≤ daily ≤ monthly. Maximum monthly limit: {formatCardMoney(MOCK_ISSUING_POLICY.maxMonthlyLimit, currency)}.{card ? ` Recorded spend: ${formatCardMoney(card.spentToday, currency)} today / ${formatCardMoney(card.spentThisMonth, currency)} this month.` : ""}</p></fieldset>}
          {intent.action === "UPDATE_CONTROLS" && <fieldset><legend className="mb-3 text-xs font-bold text-cyan-300">Payment channels</legend><div className="grid gap-3 sm:grid-cols-2">{(Object.keys(channelLabels) as (keyof CardChannels)[]).map(key => <label key={key} className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" className="accent-cyan-400" checked={channels[key]} disabled={type === "VIRTUAL" && (key === "atm" || key === "contactless")} onChange={event => setChannels(current => ({ ...current, [key]: event.target.checked }))} />{channelLabels[key]}</label>)}</div></fieldset>}
          {intent.action === "DISPATCH" && <label className="block space-y-1.5 text-[11px] text-slate-300"><span>Carrier tracking reference</span><input required minLength={6} maxLength={80} className={inputClass} value={tracking} onChange={event => setTracking(event.target.value)} placeholder="e.g. MB-RO-720099" /></label>}
          <label className="block space-y-1.5 text-[11px] text-slate-300"><span>Operational reason / ticket reference</span><textarea required minLength={10} maxLength={500} rows={3} className={inputClass} value={reason} onChange={event => setReason(event.target.value)} placeholder="Explain why you are performing this action for the customer…" /><span className="block text-[10px] text-slate-500">{reason.trim().length}/500 characters · Saved in the administrator audit trail</span></label>
        </>}
        {reviewing && <div className="space-y-4">
          <div className="space-y-2 rounded-lg border border-cyan-500/30 bg-[#03091e] p-4 text-xs"><p className="flex items-center gap-2 font-bold text-cyan-300"><CreditCard size={15} /> {title}</p><p>Customer: <strong>{customer?.name}</strong> ({customerId})</p><p>Card: {type} · {network} · {currency}{card ? ` · •••• ${card.last4}` : " · New pending card"}</p>{editsLimits && <p>Limits: {formatCardMoney(limits.daily, currency)} / day · {formatCardMoney(limits.monthly, currency)} / month · ATM {formatCardMoney(limits.atmDaily, currency)}</p>}{intent.action === "UPDATE_CONTROLS" && <p>Enabled channels: {(Object.keys(channelLabels) as (keyof CardChannels)[]).filter(key => channels[key]).map(key => channelLabels[key]).join(", ") || "None"}</p>}{intent.action === "DISPATCH" && <p>Carrier reference: {tracking.trim()}</p>}{type === "PHYSICAL" && ["ISSUE", "REPLACE", "DISPATCH"].includes(intent.action) && <p>Delivery: {customer?.deliveryAddress}</p>}<p className="break-words border-t border-cyan-500/20 pt-2 text-slate-300">Reason: {reason.trim()}</p><p className="break-all text-[10px] text-slate-400">Performed by {operator}</p></div>
          {destructive && <div className="space-y-3 rounded-lg border border-rose-500/40 bg-rose-950/30 p-4"><p className="flex items-center gap-2 text-xs font-bold text-rose-300"><AlertTriangle size={16} /> Permanent card operation</p><p className="text-[11px] leading-relaxed text-rose-200">{actionDescriptions[intent.action as CardAction]}</p><label className="block space-y-2 text-[11px] text-white"><span>Type <strong>{card?.last4}</strong> to confirm the target card</span><input required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off" className={inputClass} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label></div>}
        </div>}
        {error && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs leading-relaxed text-rose-300">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-cyan-500/20 pt-4"><button type="button" className={buttonClass} disabled={busy} onClick={reviewing ? () => { setReviewing(false); setError(null); setConfirmation(""); } : onClose}>{reviewing ? <><ArrowLeft size={13} /> Back</> : "Cancel"}</button><button type="submit" disabled={busy || (reviewing && destructive && confirmation.trim() !== card?.last4)} className={reviewing && destructive ? dangerButtonClass : primaryButtonClass}>{busy ? <><Loader2 size={14} className="animate-spin" /> Saving operation…</> : reviewing ? <><Check size={14} /> {title}</> : "Review operation"}</button></div>
      </form>
    </dialog>
  );
}
