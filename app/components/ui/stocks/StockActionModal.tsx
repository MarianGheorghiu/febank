"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import SocialDialog, { socialField, socialLabel } from "../friends/SocialDialog";
import AssetSelect from "../currencies/AssetSelect";
import { ActionButton } from "../dashboard/ActionButton";
import { notifyOperation } from "../OperationNotification";
import { Segments, money, quantity, button, buyButton, sellButton } from "./StockUI";
import type { StockOrderDraft, StockQuote, StocksRepository, StocksSnapshot } from "@/app/lib/stocks/contracts";
export interface StockTradeSelection { type: "BUY" | "SELL"; symbol: string }
export default function StockActionModal({ selection, snapshot, repository, onClose, onComplete }: { selection: StockTradeSelection; snapshot: StocksSnapshot; repository: StocksRepository; onClose: () => void; onComplete: (value: StocksSnapshot) => void }) {
  const [symbol, setSymbol] = useState(selection.symbol), [side, setSide] = useState(selection.type);
  const [type, setType] = useState<StockOrderDraft["type"]>("MARKET"), [shares, setShares] = useState("");
  const [target, setTarget] = useState(""), [currency, setCurrency] = useState("USD");
  const [quote, setQuote] = useState<StockQuote | null>(null), [confirmedQuote, setConfirmedQuote] = useState<StockQuote | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [quoting, setQuoting] = useState(false), [tick, setTick] = useState(0);
  const requestKey = useRef("");
  const draft = useMemo<StockOrderDraft>(() => ({ symbol, side, type, quantity: shares, currency, target_price_usd: type === "MARKET" ? null : target }), [symbol, side, type, shares, currency, target]);
  const item = snapshot.market.find(a => a.symbol === symbol), account = snapshot.wallet.accounts.find(a => a.asset === (side === "BUY" ? currency : symbol));
  const restriction = side === "BUY" ? item?.buy_restriction : item?.sell_restriction;
  useEffect(() => {
    if (confirmedQuote) return;
    let active = true;
    const load = async () => {
      if (active) { setQuote(null); setError(""); }
      if (!shares || Number(shares) <= 0 || (type !== "MARKET" && (!target || Number(target) <= 0))) { if (active) setQuoting(false); return; }
      setQuoting(true);
      try { const next = await repository.quote(draft); if (active) { setQuote(next); setError(""); } }
      catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Unable to get an order quote."); }
      finally { if (active) setQuoting(false); }
    };
    const debounce = window.setTimeout(() => void load(), 250), timer = window.setInterval(() => void load(), 15000);
    return () => { active = false; window.clearTimeout(debounce); window.clearInterval(timer); };
  }, [repository, draft, confirmedQuote, shares, target, type, tick, snapshot.as_of]);
  async function submit() {
    if (!confirmedQuote || busy) return;
    if (Date.parse(confirmedQuote.expires_at) <= Date.now()) { setError("The quote expired. Refresh it to continue."); return; }
    setBusy(true); setError("");
    try { const next = await repository.submit(confirmedQuote.id, requestKey.current); const pending = next.orders.find(o => o.id === requestKey.current)?.status === "PENDING" || confirmedQuote.status === "PENDING";
      onComplete(next); notifyOperation(pending ? "Order placed" : `${side === "BUY" ? "Purchase" : "Sale"} completed`, `${quantity(confirmedQuote.draft.quantity)} ${confirmedQuote.draft.symbol} · ${money(confirmedQuote.total_usd)}${pending ? " · Your order is awaiting execution." : ""}`, false, "Stocks & Trading"); onClose();
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Order could not be submitted."; setError(message); notifyOperation("Order not completed", message, true, "Stocks & Trading"); }
    finally { setBusy(false); }
  }
  const shown = confirmedQuote ?? quote;
  return <SocialDialog title={`${side === "BUY" ? "Buy" : "Sell"} stocks`} subtitle="Choose your shares and confirm the order" icon={ArrowUpRight} busy={busy} onClose={onClose}>
    <div className="space-y-5 text-white">
      {!confirmedQuote ? <>
        <div className="flex flex-wrap items-center justify-between gap-3"><div role="group" aria-label="Order side" className="flex gap-2"><button type="button" aria-pressed={side === "BUY"} className={`${buyButton} ${side === "BUY" ? "ring-1 ring-emerald-300/35" : "opacity-60"}`} onClick={() => setSide("BUY")}>Buy</button><button type="button" aria-pressed={side === "SELL"} className={`${sellButton} ${side === "SELL" ? "ring-1 ring-red-300/35" : "opacity-60"}`} onClick={() => setSide("SELL")}>Sell</button></div><Segments label="Order type" value={type} values={["MARKET", "LIMIT", "STOP"] as const} onChange={setType} /></div>
        <div className="grid min-w-0 grid-cols-[96px_minmax(0,1fr)_96px] items-end gap-2 sm:gap-3"><div className="space-y-2"><p className="text-xs text-slate-200">Stock</p><AssetSelect label="Stock" value={symbol} assets={snapshot.wallet.assets.filter(a => a.kind === "stock")} disabled={busy} onChange={setSymbol} /></div>{type !== "MARKET" ? <label className={`${socialLabel} text-center`}>{type === "LIMIT" ? "Limit" : "Stop"} price · USD<input className={`${socialField} !px-2 text-center`} inputMode="decimal" placeholder="0.00" value={target} onChange={e => setTarget(e.target.value)} /></label> : <div className="space-y-2 text-center"><p className="text-xs text-slate-200">Price · USD</p><p className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-sm font-semibold">{money(item?.price_usd ?? 0)}</p></div>}<div className="space-y-2 text-right"><p className="text-xs text-slate-200">Currency</p><AssetSelect label="Settlement currency" align="right" value={currency} assets={snapshot.wallet.assets.filter(a => a.kind === "fiat")} disabled={busy} onChange={setCurrency} /></div></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200"><span>{item?.name}</span><span>{money(item?.price_usd ?? 0)} / share</span></div><label className={socialLabel}>Shares<input className={`${socialField} !text-2xl`} inputMode="decimal" placeholder={item?.fractional ? "0.00" : "0"} value={shares} onChange={e => setShares(e.target.value)} /></label><p className="mt-2 text-xs text-slate-200">Available: {quantity(account?.available ?? 0)} {side === "BUY" ? currency : symbol}{Number(account?.reserved) > 0 ? ` · ${quantity(account!.reserved)} reserved` : ""}</p></div>
        {type !== "MARKET" && <p className="text-xs leading-relaxed text-slate-200">{side === "BUY" ? "Funds" : "Shares"} are reserved until your {type.toLowerCase()} order executes or you cancel it. {type === "STOP" ? "The final execution price can differ from the stop price." : "The order executes only when your limit is met."}</p>}
      </> : <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4"><p className="text-sm text-slate-200">{confirmedQuote.draft.type} · {confirmedQuote.draft.side}</p><p className="mt-2 text-2xl font-semibold">{quantity(confirmedQuote.draft.quantity)} {confirmedQuote.draft.symbol}</p><p className="mt-2 text-xs text-slate-200">Quote held for up to 5 minutes, subject to account and market availability.</p></div>}
      {shown && <dl className="space-y-3 rounded-2xl border border-white/10 p-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-200">{shown.status === "PENDING" ? "Target price" : "Execution price"}</dt><dd>{money(shown.execution_price_usd, 4)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-200">Fee</dt><dd>{money(shown.fee_usd)}</dd></div><div className="flex justify-between gap-4 border-t border-white/10 pt-3"><dt className="text-slate-200">{side === "BUY" ? shown.status === "PENDING" ? "Reserve" : "You pay" : "You receive"}</dt><dd className="font-semibold text-cyan-100">{quantity(shown.settlement_amount)} {shown.draft.currency}</dd></div></dl>}
      {(error || restriction) && <p role="alert" className="text-sm leading-relaxed text-rose-200">{error || restriction}</p>}
      {confirmedQuote ? <div className="grid grid-cols-2 gap-3"><button className={button} disabled={busy} onClick={() => { setConfirmedQuote(null); setQuote(null); setTick(n => n + 1); }}><ArrowLeft size={15} />Refresh quote</button><ActionButton variant={side === "BUY" ? "green" : "red"} fullWidth disabled={busy} icon={<Check size={16} />} onClick={() => void submit()}>{busy ? "Confirming…" : "Confirm order"}</ActionButton></div> : <ActionButton variant={side === "BUY" ? "green" : "red"} fullWidth disabled={!quote || quoting || !!restriction} onClick={() => { if (quote) { requestKey.current = crypto.randomUUID(); setConfirmedQuote(quote); } }}>{quoting ? "Updating quote…" : `${side === "BUY" ? "Buy" : "Sell"} ${symbol}`}</ActionButton>}
    </div>
  </SocialDialog>;
}
