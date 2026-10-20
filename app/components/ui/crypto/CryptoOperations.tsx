"use client";
import { useState } from "react";
import CardSurface from "../CardSurface";
import ExchangeForm from "../currencies/ExchangeForm";
import { cryptoTradeConfig, type CryptoAction } from "@/app/lib/crypto/presentation";
import type { CurrencyRepository, CurrencySnapshot } from "@/app/lib/currencies/contracts";
export default function CryptoOperations({ wallet, repository, onComplete, onBusyChange }: { wallet: CurrencySnapshot; repository: CurrencyRepository; onComplete: (snapshot: CurrencySnapshot) => void; onBusyChange: (busy: boolean) => void }) {
  const [action, setAction] = useState<CryptoAction>("BUY");
  const [busy, setBusy] = useState(false);
  const config = cryptoTradeConfig(action, wallet);
  return <CardSurface as="section" tone="purple" className="flex h-full min-h-[400px] flex-col p-4 focus-within:z-30">
    <h2 className="text-sm font-semibold">Trade crypto</h2>
    <div role="group" aria-label="Crypto operation" className="my-2 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-[#060d1b]/70 p-0.5">{(["BUY", "SELL", "SWAP"] as const).map(value => <button key={value} type="button" aria-pressed={action === value} disabled={busy} onClick={() => setAction(value)} className={`min-h-11 cursor-pointer rounded-lg text-xs font-semibold capitalize transition-colors focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 ${action === value ? "bg-purple-400/15 text-purple-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{value.toLowerCase()}</button>)}</div>
    <ExchangeForm key={action} embedded snapshot={wallet} repository={repository} {...config} action={action.toLowerCase() as "buy" | "sell" | "swap"} notificationScope="Crypto Terminal" onComplete={onComplete} onBusyChange={value => { setBusy(value); onBusyChange(value); }} />
  </CardSurface>;
}
