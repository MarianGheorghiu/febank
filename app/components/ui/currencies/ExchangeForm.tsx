"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, ArrowRightLeft, Loader2 } from "lucide-react";
import CardSurface from "../CardSurface";
import AssetSelect from "./AssetSelect";
import { ActionButton } from "../dashboard/ActionButton";
import { notifyOperation } from "../OperationNotification";
import { currencyAmount } from "./AssetPanel";
import type { CurrencyAsset, CurrencyQuote, CurrencyRepository, CurrencySnapshot } from "@/app/lib/currencies/contracts";

type AssetKind = CurrencyAsset["kind"];
interface ExchangeFormProps {
  snapshot: CurrencySnapshot; repository: CurrencyRepository; onComplete: (snapshot: CurrencySnapshot) => void;
  initialSource?: string; initialTarget?: string; title?: string; embedded?: boolean;
  sourceKinds?: AssetKind[]; targetKinds?: AssetKind[]; lockSource?: boolean; lockTarget?: boolean;
  onBusyChange?: (busy: boolean) => void; action?: "exchange" | "buy" | "sell" | "swap"; notificationScope?: string;
}
export default function ExchangeForm({ snapshot, repository, onComplete, initialSource = "USD", initialTarget = "EUR", title = "Exchange", embedded = false, sourceKinds, targetKinds, lockSource = false, lockTarget = false, onBusyChange, action = "exchange", notificationScope = "Currencies" }: ExchangeFormProps) {
  const [source, setSource] = useState(initialSource);
  const [target, setTarget] = useState(initialTarget);
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ draft: string; quote: CurrencyQuote | null; error: string; loading: boolean } | null>(null);
  const [confirmation, setConfirmation] = useState<CurrencyQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const lock = useRef(false), key = useRef("");
  const account = snapshot.accounts.find(a => a.asset === source);
  const payingAssets = useMemo(() => snapshot.assets.filter(asset => !sourceKinds || sourceKinds.includes(asset.kind)), [snapshot.assets, sourceKinds]);
  const receivingAssets = useMemo(() => snapshot.assets.filter(asset => asset.symbol !== source && (!targetKinds || targetKinds.includes(asset.kind))), [snapshot.assets, source, targetKinds]);
  const canInvert = !lockSource && !lockTarget && (!sourceKinds || sourceKinds.includes(snapshot.assets.find(asset => asset.symbol === target)?.kind ?? "fiat")) && (!targetKinds || targetKinds.includes(snapshot.assets.find(asset => asset.symbol === source)?.kind ?? "fiat"));
  const targetAccount = snapshot.accounts.find(a => a.asset === target);
  const draft = JSON.stringify([source, target, amount, snapshot.as_of]);
  const valid = /^\d+(\.\d*)?$/.test(amount) && Number(amount) > 0 && source !== target;
  const quote = confirmation ?? (result?.draft === draft ? result.quote : null);
  const quoting = !confirmation && valid && (!result || result.draft !== draft || result.loading);

  useEffect(() => {
    if (!valid || confirmation) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setResult({ draft, quote: null, error: "", loading: true });
      repository.quote({ source, target, amount }).then(quote => {
        if (active) setResult({ draft, quote, error: "", loading: false });
      }).catch(cause => {
        if (active) setResult({ draft, quote: null, error: cause instanceof Error ? cause.message : "Conversion unavailable.", loading: false });
      });
    }, 250);
    const refresh = window.setInterval(() => setTick(value => value + 1), 15000);
    return () => { active = false; window.clearTimeout(timer); window.clearInterval(refresh); };
  }, [repository, source, target, amount, draft, valid, confirmation, tick]);

  async function confirm() {
    if (lock.current || !confirmation) return;
    lock.current = true; setBusy(true); onBusyChange?.(true); setError("");
    try {
      const next = await repository.submit(confirmation.id, key.current);
      onComplete(next); setConfirmation(null); setAmount(""); setResult(null);
      notifyOperation(action === "buy" ? "Purchase completed" : action === "sell" ? "Sale completed" : action === "swap" ? "Swap completed" : "Exchange completed", `${currencyAmount(confirmation.debited)} ${confirmation.source} → ${currencyAmount(confirmation.received)} ${confirmation.target}`, false, notificationScope, "cyan");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Exchange could not be confirmed.";
      setError(message); notifyOperation("Exchange not confirmed", message, true, notificationScope);
    } finally { lock.current = false; setBusy(false); onBusyChange?.(false); }
  }
  function edit() { setConfirmation(null); setError(""); setResult(null); }
  return <CardSurface as="section" tone="purple" className={embedded ? "flex flex-1 flex-col !border-0 !bg-none !shadow-none focus-within:z-30" : "flex h-full min-h-[400px] flex-col p-4 focus-within:z-30"}>
    {!embedded && <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ArrowRightLeft size={17} className="text-purple-300" />{title}</h2>}
    <form onSubmit={event => { event.preventDefault(); if (confirmation) { void confirm(); } else if (quote && Date.parse(quote.expires_at) > Date.now()) { key.current = crypto.randomUUID(); setError(""); setConfirmation(quote); } else { setResult(null); setTick(value => value + 1); } }} className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="space-y-3">
      <fieldset disabled={busy || !!confirmation} className="relative min-w-0 space-y-2 disabled:opacity-80">
        <legend className="sr-only">Exchange assets and amount</legend>
        <div className="space-y-2 rounded-2xl border border-white/10 bg-[#060d1b]/60 p-3 pb-5">
          <div className="flex items-center justify-between gap-3"><AssetSelect label="From" value={source} assets={payingAssets} disabled={busy || !!confirmation || lockSource} onChange={symbol => { setSource(symbol); if (target === symbol) setTarget(receivingAssets.find(asset => asset.symbol !== symbol)?.symbol ?? source); setError(""); }} /><label className="min-w-0 flex-1"><span className="sr-only">Amount · {source}</span><input required inputMode="decimal" maxLength={30} placeholder="0" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }} className="w-full min-w-0 bg-transparent text-right font-mono text-2xl font-semibold tabular-nums text-white outline-none placeholder:text-slate-600 sm:text-3xl" /></label></div>
          <p className="text-xs text-slate-400">Balance: {currencyAmount(account?.available ?? "0", account?.kind === "fiat" ? 2 : 8)} {source}</p>
        </div>
        <div className="relative z-10 !my-[-22px] flex h-11 items-center justify-center"><button aria-label="Swap exchange assets" type="button" disabled={!canInvert} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-purple-300/25 bg-[#10192e] text-purple-300 shadow-lg transition-colors hover:bg-[#1b2943] focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed" onClick={() => { setSource(target); setTarget(source); setAmount(quote?.received ?? ""); setError(""); }}><ArrowDownUp size={18} /></button></div>
        <div className="space-y-2 rounded-2xl border border-white/10 bg-[#060d1b]/60 p-3 pt-5">
          <div className="flex items-center justify-between gap-3"><AssetSelect label="To" value={target} assets={receivingAssets} disabled={busy || !!confirmation || lockTarget} onChange={symbol => { setTarget(symbol); setError(""); }} /><div role="status" aria-label="You receive" className={`min-w-0 flex-1 whitespace-nowrap text-right font-mono font-semibold tabular-nums text-purple-300 ${quote && currencyAmount(quote.received).length > 8 ? "text-base" : "text-2xl"}`}>{quoting ? <Loader2 size={22} aria-label="Calculating conversion" className="ml-auto animate-spin" /> : quote ? currencyAmount(quote.received, targetAccount?.kind === "fiat" ? 2 : 8) : "0"}</div></div>
          <p className="text-xs text-slate-400">Balance: {currencyAmount(targetAccount?.available ?? "0", targetAccount?.kind === "fiat" ? 2 : 8)} {target}</p>
        </div>
      </fieldset>
      <div className="min-h-8 text-xs leading-relaxed text-slate-400" aria-live="polite">{quote && <><p className="font-medium text-slate-200">1 {source} ≈ {currencyAmount(String(Number(quote.received) / Number(quote.debited)))} {target}</p><p className="mt-1">Fees included: ${currencyAmount(quote.fee_usd, 2)}{Number(quote.remainder_usd) > 0 ? ` · $${currencyAmount(quote.remainder_usd, 2)} credited to USD` : ""}</p></>}{!valid && <p>Choose your assets and enter an amount.</p>}{result?.draft === draft && result.error && <p role="alert" className="text-rose-300">{result.error}</p>}</div>
      {confirmation && <div role="status" className="rounded-xl border border-purple-300/20 bg-purple-400/5 p-3 text-sm leading-relaxed text-purple-100">Exchange <strong>{currencyAmount(confirmation.debited)} {confirmation.source}</strong> for <strong>{currencyAmount(confirmation.received)} {confirmation.target}</strong>?</div>}
      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
      </div>
      <div className="mt-auto flex shrink-0 gap-2">{confirmation && <ActionButton variant="blue" disabled={busy} onClick={edit}>Cancel</ActionButton>}<ActionButton type="submit" fullWidth variant="purple" disabled={busy || (!confirmation && (!quote || quoting))} icon={busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}>{busy ? "Processing…" : confirmation ? `Confirm ${action}` : action === "buy" ? `Buy ${target}` : action === "sell" ? `Sell ${source}` : action === "swap" ? "Swap crypto" : "Exchange"}</ActionButton></div>
    </form>
  </CardSurface>;
}
