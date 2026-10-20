"use client";
import { useMemo, useRef, useState } from "react";
import { Briefcase, Plus, ArrowUpRight, Wallet } from "lucide-react";
import CardSurface from "../CardSurface";
import SocialDialog, { socialField, socialLabel } from "../friends/SocialDialog";
import { ActionButton } from "../dashboard/ActionButton";
import { notifyOperation } from "../OperationNotification";
import { createOverviewRepository } from "@/app/lib/overview/repository";
import type { StocksSnapshot } from "@/app/lib/stocks/contracts";
import { StockTitle, StockSearch, match, money, quantity, Pager, button } from "./StockUI";
export default function BuyingPowerCard({ snapshot, customer, onComplete, onAnalyze }: { snapshot: StocksSnapshot; customer: string; onComplete: () => void; onAnalyze: (symbol: string) => void }) {
  const [search, setSearch] = useState(""), [page, setPage] = useState(0), [action, setAction] = useState<"deposit" | "withdraw" | null>(null);
  const cash = snapshot.wallet.accounts.find(a => a.asset === "USD"), stocks = snapshot.holdings.reduce((sum, a) => sum + Number(a.value_usd), 0);
  const holdings = [...snapshot.holdings].filter(a => match(search, a.symbol, a.name)).sort((a, b) => Number(b.value_usd) - Number(a.value_usd));
  const current = Math.min(page, Math.max(0, Math.ceil(holdings.length / 4) - 1));
  return <CardSurface tone="cyan" className="flex min-h-[400px] flex-col p-4 sm:p-5"><StockTitle icon={Briefcase}>Portfolio overview</StockTitle>
    <div className="mb-4 grid grid-cols-2 gap-3"><div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.025] p-3"><p className="flex items-center gap-1.5 text-[11px] text-slate-200"><Wallet size={12} />Buying power</p><p className="mt-2 break-words text-lg font-semibold tracking-tight text-white sm:text-xl">{money(cash?.available ?? 0)}</p><p className="mt-1 text-[10px] text-slate-200">USD available</p></div><div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.025] p-3"><p className="text-[11px] text-slate-200">Stocks & cash</p><p className="mt-2 break-words text-lg font-semibold tracking-tight text-cyan-100 sm:text-xl">{money(stocks + Number(cash?.available ?? 0) + Number(cash?.reserved ?? 0))}</p><p className="mt-1 text-[10px] text-slate-200">{snapshot.holdings.length} positions</p></div></div>
    <StockSearch label="Find a position" value={search} onChange={value => { setSearch(value); setPage(0); }} />
    <div className="mt-3 space-y-3">{holdings.slice(current * 4, current * 4 + 4).map((a, index) => <button key={a.symbol} className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-cyan-300" onClick={() => onAnalyze(a.symbol)}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-semibold text-white">{a.symbol}<span className="ml-2 font-normal text-slate-200">{quantity(a.quantity)}</span></span><span className="text-slate-100">{money(a.value_usd)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${index % 2 ? "bg-violet-300/80" : "bg-cyan-200/80"}`} style={{ width: `${Number(a.value_usd) / (stocks || 1) * 100}%` }} /></div></button>)}{!holdings.length && <p className="py-3 text-xs text-slate-200">No matching positions.</p>}</div>
    {holdings.length > 4 && <Pager count={holdings.length} page={current} onChange={setPage} />}
    <div className="mt-auto grid grid-cols-2 gap-3 pt-5"><ActionButton variant="cyan" fullWidth icon={<Plus size={14} />} onClick={() => setAction("deposit")}>Deposit</ActionButton><ActionButton variant="blue" fullWidth icon={<ArrowUpRight size={14} />} onClick={() => setAction("withdraw")}>Withdraw</ActionButton></div>
    {action && <FundingDialog type={action} customer={customer} onClose={() => setAction(null)} onComplete={onComplete} />}
  </CardSurface>;
}
function FundingDialog({ type, customer, onClose, onComplete }: { type: "deposit" | "withdraw"; customer: string; onClose: () => void; onComplete: () => void }) {
  const repository = useMemo(() => createOverviewRepository(customer), [customer]);
  const [amount, setAmount] = useState(""), [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const key = useRef("");
  async function submit() {
    if (busy) return; setBusy(true); setError("");
    try { await repository.submitOperation({ id: key.current, type, amount }); onComplete(); onClose(); notifyOperation(type === "deposit" ? "Deposit completed" : "Withdrawal completed", `${money(amount)} · USD account updated.`, false, "Stocks & Trading"); }
    catch (cause) { const message = cause instanceof Error ? cause.message : "Unable to complete the operation."; setError(message); notifyOperation("Operation failed", message, true, "Stocks & Trading"); } finally { setBusy(false); }
  }
  return <SocialDialog title={type === "deposit" ? "Deposit funds" : "Withdraw funds"} subtitle="USD account" busy={busy} icon={Wallet} onClose={onClose}><div className="space-y-5 text-white">{confirm ? <p className="text-2xl font-semibold">{money(amount)}</p> : <label className={socialLabel}>Amount (USD)<input className={socialField} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></label>}{error && <p role="alert" className="text-sm text-rose-200">{error}</p>}{confirm ? <div className="grid grid-cols-2 gap-3"><button className={button} disabled={busy} onClick={() => setConfirm(false)}>Edit amount</button><ActionButton variant="cyan" fullWidth disabled={busy} onClick={() => void submit()}>{busy ? "Confirming…" : "Confirm"}</ActionButton></div> : <ActionButton variant="cyan" fullWidth disabled={!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0} onClick={() => { key.current = crypto.randomUUID(); setConfirm(true); }}>Continue</ActionButton>}</div></SocialDialog>;
}
