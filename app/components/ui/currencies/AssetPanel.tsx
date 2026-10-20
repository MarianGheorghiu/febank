"use client";
import { useId, useState } from "react";
import { Coins, Search, TrendingUp, Wallet } from "lucide-react";
import CardSurface from "../CardSurface";
import type { TransferAccount } from "@/app/lib/transfers/contracts";
import { decimal, units, usdValue } from "@/app/lib/transfers/engine";
export const currencyAmount = (value: string, maximumFractionDigits = 8) => Number(value).toLocaleString("en-US", { maximumFractionDigits, minimumFractionDigits: maximumFractionDigits === 2 ? 2 : 0 });
export default function AssetPanel({ accounts, kind, className = "" }: { accounts: TransferAccount[]; kind: TransferAccount["kind"]; className?: string }) {
  const [search, setSearch] = useState("");
  const id = useId();
  const config = { fiat: { title: "Currency accounts", icon: Wallet, tone: "blue" as const, color: "text-blue-300" }, crypto: { title: "Crypto assets", icon: Coins, tone: "cyan" as const, color: "text-cyan-300" }, stock: { title: "Stock holdings", icon: TrendingUp, tone: "amber" as const, color: "text-amber-300" } }[kind];
  const Icon = config.icon;
  const rows = accounts.filter(a => `${a.name} ${a.asset}`.toLowerCase().includes(search.trim().toLowerCase()));
  const total = decimal(accounts.reduce((sum, a) => sum + usdValue(units(a.available, a.decimals), a.decimals, a.usd_price, "nearest"), BigInt(0)), 2);
  return <CardSurface as="section" tone={config.tone} className={`flex h-full flex-col p-4 sm:p-5 ${className}`} aria-labelledby={id}>
    <header className="mb-4 flex items-start justify-between gap-3"><div className="min-w-0"><h2 id={id} className="flex items-center gap-2 text-sm font-semibold"><Icon size={17} className={config.color} />{config.title}</h2><p className="mt-1.5 text-xs text-slate-400">{accounts.length} {kind === "fiat" ? "accounts" : "assets"} · Available value</p></div><span className={`shrink-0 font-mono text-sm font-semibold ${config.color}`}>${currencyAmount(total, 2)}</span></header>
    <label className="relative mb-3 block"><span className="sr-only">Search {config.title.toLowerCase()}</span><Search aria-hidden size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or symbol" className="min-h-11 w-full rounded-xl border border-white/10 bg-[#060d1b]/60 pr-3 pl-10 text-base text-slate-200 outline-none focus:border-cyan-300/50 sm:text-sm" /></label>
    <div className="max-h-72 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
      {rows.map(a => <div key={a.id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/5 bg-[#060d1b]/45 p-3"><div className="flex min-w-0 items-center gap-2.5"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] font-mono text-[10px] font-bold ${config.color}`}>{a.asset.slice(0, 4)}</span><div className="min-w-0"><p className="truncate text-sm font-medium" title={a.name}>{a.name}</p><p className="mt-1 text-[11px] text-slate-500">{a.asset}{kind === "stock" ? " · shares" : ""}</p></div></div><div className="shrink-0 text-right"><p title={`${a.available} ${a.asset}`} className="whitespace-nowrap font-mono text-xs font-semibold tabular-nums">{currencyAmount(a.available, kind === "fiat" ? 2 : 8)}</p>{Number(a.reserved) > 0 && <p className="mt-1 text-[10px] text-amber-300">{currencyAmount(a.reserved)} reserved</p>}</div></div>)}
      {!rows.length && <p role="status" className="py-10 text-center text-sm text-slate-500">{search ? "No matching assets." : "No assets yet."}</p>}
    </div>
  </CardSurface>;
}
