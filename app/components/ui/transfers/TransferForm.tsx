"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import CardSurface from "../CardSurface";
import { notifyOperation } from "../OperationNotification";
import TransferSelect from "./TransferSelect";
import type { TransferDraft, TransferQuote, TransferRepository, TransferSnapshot, TransferKind } from "@/app/lib/transfers/contracts";
import { amountLabel, units, estimateFee } from "@/app/lib/transfers/engine";

const field = "w-full min-w-0 rounded-xl border border-white/10 bg-[#050b19] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60";
const button = "min-h-11 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed";
export default function TransferForm({ snapshot, repository, onUpdate, blocked = false, onBusyChange, embedded = false }: { snapshot: TransferSnapshot; repository: TransferRepository; onUpdate: (value: TransferSnapshot) => void; blocked?: boolean; onBusyChange?: (busy: boolean) => void; embedded?: boolean }) {
  const [kind, setKind] = useState<TransferKind>("fiat");
  const accounts = snapshot.accounts.filter(a => a.kind === kind);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const account = snapshot.accounts.find(a => a.id === accountId);
  const routes = snapshot.routes.filter(r => r.asset === account?.asset && r.enabled);
  const [routeId, setRouteId] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("recipient") ? "phone-USD" : routes[0]?.id ?? "");
  const route = routes.length === 1 ? routes[0] : routes.find(r => r.id === routeId);
  const [name, setName] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("name")?.slice(0, 120) ?? "");
  const [destination, setDestination] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("recipient")?.slice(0, 120) ?? "");
  const [amount, setAmount] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("amount")?.slice(0, 40) ?? "");
  const [reference, setReference] = useState("");
  const [quote, setQuote] = useState<TransferQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const requestKey = useRef("");
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  let validAmount = false;
  try { validAmount = !!account && units(amount, account.decimals) > BigInt(0); } catch { /* Incomplete amounts keep review disabled. */ }
  let feeEstimate: ReturnType<typeof estimateFee> | null = null;
  if (validAmount && account && route) {
    try { feeEstimate = estimateFee(snapshot, account, route, amount); } catch { /* An unavailable fee policy prevents submission. */ }
  }
  const canReview = !!account && !!route && !!name.trim() && !!destination.trim() && validAmount && !!feeEstimate;
  async function review() {
    if (lock.current || blocked || !canReview || !route) return;
    lock.current = true; setBusy(true); onBusyChange?.(true);
    try {
      const draft: TransferDraft = { source_account_id: accountId, route_id: route.id, amount, recipient_name: name, destination, reference };
      const next = await repository.quote(draft);
      requestKey.current = crypto.randomUUID(); setSubmissionAttempted(false); setQuote(next);
    } catch (cause) { notifyOperation("Unable to review transfer", cause instanceof Error ? cause.message : "Unable to estimate transfer.", true, "Transfers", "cyan", 4000); }
    finally { lock.current = false; setBusy(false); onBusyChange?.(false); }
  }
  async function confirm() {
    if (!quote || lock.current || blocked) return;
    lock.current = true; setSubmissionAttempted(true); setBusy(true); onBusyChange?.(true);
    try {
      onUpdate(await repository.submit(quote.id, requestKey.current));
      setQuote(null); setAmount(""); setName(""); setDestination(""); setReference("");
      notifyOperation("Transfer submitted", "Track its status in your transfer history.", false, "Transfers", "cyan", 3000);
    } catch (cause) { notifyOperation("Transfer could not be submitted", `${cause instanceof Error ? cause.message : "Unable to submit transfer."} Retry confirmation with the same request; check history before starting a new transfer.`, true, "Transfers", "cyan", 4000); }
    finally { lock.current = false; setBusy(false); onBusyChange?.(false); }
  }
  function selectAccount(id: string) {
    setAccountId(id); setDestination(""); setAmount("");
    const selected = snapshot.accounts.find(a => a.id === id);
    setRouteId(snapshot.routes.find(r => r.enabled && r.asset === selected?.asset)?.id ?? "");
  }
  return <CardSurface as="section" tone="blue" className={embedded ? "@container !border-0 !bg-none !shadow-none" : "@container p-4 sm:p-6"} aria-label={embedded ? "Transfer details" : undefined} aria-labelledby={embedded ? undefined : "transfer-form-title"}>
    {!embedded && <div className="mb-5 flex min-h-12 items-start justify-between gap-3"><div><p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-blue-300">Move your assets</p><h2 id="transfer-form-title" className="text-xl font-bold">New transfer</h2></div><span className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-2.5 text-blue-300"><ArrowUpRight size={20} /></span></div>}
    <form noValidate onSubmit={e => { e.preventDefault(); void (quote ? confirm() : review()); }} className="space-y-5">
      <fieldset disabled={busy || blocked || !!quote} className="min-w-0 space-y-4 disabled:opacity-70">
        <legend className="sr-only">Transfer details</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/20 p-1" aria-label="Asset category">
          {(["fiat", "crypto", "stock"] as const).map(value => <button type="button" key={value} aria-pressed={kind === value} onClick={() => { setKind(value); selectAccount(snapshot.accounts.find(a => a.kind === value)?.id ?? ""); }} className={`min-h-11 cursor-pointer rounded-lg text-xs font-semibold capitalize disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-cyan-300 ${kind === value ? "bg-blue-500/20 text-blue-200" : "text-blue-200/70 enabled:hover:bg-blue-500/15 enabled:hover:text-blue-100"}`}>{value === "stock" ? "Stocks" : value}</button>)}
        </div>
        <div className="grid grid-cols-1 gap-4 @min-[320px]:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2 text-xs text-slate-300"><span className="px-3">From account</span><TransferSelect className={field} value={accountId} onChange={e => selectAccount(e.target.value)}>{accounts.map(a => <option key={a.id} value={a.id}>{a.asset} · {a.name}</option>)}</TransferSelect><span className="block px-3 text-slate-400 break-words">Available: {account ? amountLabel(account.available, account.asset) : "No account available"}</span></label>
          <label className="flex min-w-0 flex-col gap-2 text-xs text-slate-300"><span className="px-3">Recipient name</span><input className={field} required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="Person or business" autoComplete="off" /></label>
        </div>
        <div className="grid grid-cols-1 gap-4 @min-[320px]:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2 text-xs text-slate-300"><span className="px-3">Amount · {account?.asset}</span><input className={field} required inputMode={account?.decimals === 0 ? "numeric" : "decimal"} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" maxLength={40} /></label>
          {routes.length > 1 ? <label className="flex min-w-0 flex-col gap-2 text-xs text-slate-300"><span className="px-3">Transfer route</span><TransferSelect className={field} required value={routeId} onChange={e => { setRouteId(e.target.value); setDestination(""); }}>{routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</TransferSelect></label> : <div className="flex min-w-0 flex-col gap-2 text-xs text-slate-300" role="group" aria-label="Transfer route"><span className="px-3">Transfer route</span><div className={`${field} break-words text-blue-200`}>{route?.name ?? "Unavailable"}</div></div>}
        </div>
        <label className="flex min-w-0 flex-col gap-2 text-xs text-slate-300"><span className="px-3">{route?.destination_kind === "iban" ? "Recipient IBAN" : route?.destination_kind === "phone" ? "International phone number" : route?.destination_kind === "wallet" ? `Wallet address · ${route.network}` : "Custody account ID"}</span><input className={field} required type={route?.destination_kind === "phone" ? "tel" : "text"} value={destination} onChange={e => setDestination(e.target.value)} maxLength={128} autoComplete="off" spellCheck={false} placeholder={route?.destination_kind === "iban" ? "DE89 3704 0044 0532 0130 00" : route?.destination_kind === "phone" ? "+40712345678" : route?.destination_kind === "custody" ? "DTC-9902" : "Full address on the selected network"} /></label>
        <div className="grid grid-cols-1 gap-4 @min-[320px]:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2 text-xs text-slate-300"><span className="px-3">Reference <span className="text-slate-500">(optional)</span></span><input className={field} maxLength={140} value={reference} onChange={e => setReference(e.target.value)} placeholder="What is this transfer for?" /></label>
          {route && account && <div className="flex min-w-0 flex-col gap-2 text-xs text-slate-300"><span className="px-3">Estimated fee</span><div aria-live="polite" aria-label="Estimated transfer fee" className={`${field} break-words text-blue-200`}>{feeEstimate ? amountLabel(feeEstimate.amount, feeEstimate.asset) : <span className="text-slate-500">Enter amount to estimate</span>}</div><span className="px-3 text-[10px] text-slate-400">{feeEstimate && feeEstimate.account_id !== account.id ? `Fee from ${feeEstimate.asset} account · ` : ""}{route.eta}</span></div>}
        </div>
      </fieldset>
      {quote && <div className="space-y-3 rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-4" role="region" aria-label="Review transfer" tabIndex={-1} ref={node => node?.focus()}>
        <h3 className="flex items-center gap-2 font-semibold text-cyan-200"><ShieldCheck size={16} /> Review your transfer</h3>
        <dl className="space-y-2 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">Recipient</dt><dd className="break-all">{quote.draft.recipient_name}</dd></div><div><dt className="text-slate-400">Destination</dt><dd className="break-all font-mono text-xs">{quote.draft.destination}</dd></div>{quote.draft.reference && <div><dt className="text-slate-400">Reference</dt><dd className="break-words">{quote.draft.reference}</dd></div>}<div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">Amount</dt><dd>{amountLabel(quote.draft.amount, quote.asset)}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">Fee</dt><dd>{amountLabel(quote.fee, quote.fee_asset ?? quote.asset)}</dd></div><div className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-2 font-bold"><dt>Total reserved</dt><dd className="break-all">{amountLabel(quote.total, quote.asset)}{quote.fee_account_id && quote.fee_account_id !== quote.draft.source_account_id ? ` + ${amountLabel(quote.fee, quote.fee_asset ?? quote.asset)}` : ""}</dd></div></dl>
        <p className="text-xs text-slate-400">{quote.eta}. Quote expires at {new Date(quote.expires_at).toLocaleTimeString("en-GB")}. {snapshot.mode === "demo" ? "Funds are reserved on confirmation." : "Final settlement depends on processing and compliance checks."}</p>
      </div>}
      <div className="flex flex-wrap gap-2">{quote && <button type="button" disabled={busy || blocked} className={`${button} border-emerald-400/30 bg-emerald-500/15 text-emerald-200 enabled:hover:bg-emerald-500/25`} onClick={() => { setQuote(null); }}>{submissionAttempted ? "New review" : "Edit details"}</button>}<button type="submit" disabled={busy || blocked || !account || !route || (!quote && !canReview)} className={`${button} flex-1 border-blue-400/30 bg-blue-600 text-white enabled:hover:bg-blue-500`}>{busy ? "Please wait…" : quote ? "Confirm transfer" : "Review transfer"}</button></div>
    </form>
  </CardSurface>;
}
