"use client";
import { useId, useMemo, useState } from "react";
import { ArrowRightLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import CardSurface from "../CardSurface";
import { ActionButton } from "../dashboard/ActionButton";
import { currencyAmount } from "../currencies/AssetPanel";
import type { CryptoInstrument } from "@/app/lib/crypto/contracts";
import type { CryptoTradeSelection } from "./CryptoActionModal";
const PAGE_SIZE = 4;
const button = "flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-30";
function Percent({ value }: { value: string | null }) { return <span className={`font-mono text-[11px] tabular-nums ${value === null ? "text-slate-500" : Number(value) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{value === null ? "—" : `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(2)}%`}</span>; }
function Sparkline({ asset }: { asset: CryptoInstrument }) {
  const id = useId();
  const values = asset.sparkline.map(Number);
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const points = values.map((value, index) => `${index / Math.max(1, values.length - 1) * 100},${29 - (value - min) / range * 25}`).join(" ");
  const color = Number(asset.change_7d ?? 0) >= 0 ? "#34d399" : "#fb7185";
  return <svg viewBox="0 0 100 34" className="h-9 w-full" aria-label={`${asset.symbol} seven-day price trend`} role="img"><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.22} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs><polygon points={`0,34 ${points} 100,34`} fill={`url(#${id})`} /><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}
export default function CryptoMarketTable({ market, accounts, onAction, busy }: { market: CryptoInstrument[]; accounts: { asset: string; available: string }[]; onAction: (selection: CryptoTradeSelection) => void; busy: boolean }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => { const term = query.trim().toLowerCase(); return market.filter(asset => `${asset.symbol} ${asset.name}`.toLowerCase().includes(term)); }, [market, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const held = new Map(accounts.map(account => [account.asset, Number(account.available)]));
  return <CardSurface as="section" className="@container flex h-full min-h-[400px] flex-col p-4" tone="blue">
    <header className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Crypto market</h2><p className="mt-1 text-[11px] text-slate-500">{market.length} assets · Prices in USD</p></div><label className="relative w-full sm:w-56"><span className="sr-only">Search crypto market</span><Search aria-hidden size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" /><input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search name or symbol" className="min-h-11 w-full rounded-xl border border-white/10 bg-[#060d1b]/60 py-2 pr-3 pl-9 text-base text-slate-200 outline-none focus:border-cyan-300/50 sm:text-sm" /></label></header>
    <div className="mb-1 hidden grid-cols-[minmax(100px,1.4fr)_minmax(80px,1fr)_minmax(64px,.7fr)_minmax(64px,.8fr)_142px] items-center gap-2 px-3 py-1.5 text-[10px] text-slate-500 @min-[560px]:grid"><span>Asset</span><span className="text-right">Price</span><span className="text-right">24h</span><span className="text-center">7 days</span><span className="text-right">Trade</span></div>
    <div className="max-h-[260px] flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 scrollbar-thin @min-[560px]:max-h-none @min-[560px]:overflow-visible @min-[560px]:pr-0">{rows.map(asset => {
      const hasUnits = (held.get(asset.symbol) ?? 0) > 0;
      return <article key={asset.symbol} className="grid min-w-0 gap-3 rounded-xl border border-white/5 bg-[#060d1b]/45 p-3 transition-colors @min-[560px]:py-1.5 hover:border-blue-300/20 @min-[560px]:grid-cols-[minmax(100px,1.4fr)_minmax(80px,1fr)_minmax(64px,.7fr)_minmax(64px,.8fr)_142px] @min-[560px]:items-center @min-[560px]:gap-2">
        <div className="flex min-w-0 items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-400/5 font-mono text-[10px] font-bold text-cyan-300">{asset.symbol.slice(0, 4)}</span><div className="min-w-0"><h3 className="truncate text-xs font-semibold" title={asset.name}>{asset.name}</h3><p className="mt-1 text-[10px] text-slate-500">{asset.symbol}{!asset.can_buy ? asset.can_sell ? " · Sell only" : " · Trading paused" : ""}</p></div></div><div className="shrink-0 text-right @min-[560px]:hidden"><p className="font-mono text-xs font-semibold tabular-nums">${currencyAmount(asset.price_usd, Number(asset.price_usd) < 1 ? 8 : 2)}</p><Percent value={asset.change_24h} /></div></div>
        <p className="hidden text-right font-mono text-xs font-semibold tabular-nums @min-[560px]:block">${currencyAmount(asset.price_usd, Number(asset.price_usd) < 1 ? 8 : 2)}</p><div className="hidden text-right @min-[560px]:block"><Percent value={asset.change_24h} /></div>
        <div className="hidden @min-[560px]:block"><Sparkline asset={asset} /></div>
        <div className="grid grid-cols-3 gap-2 text-[10px] @min-[560px]:hidden"><span className="text-slate-500">1h <Percent value={asset.change_1h} /></span><span className="text-slate-500">7d <Percent value={asset.change_7d} /></span><span className="text-right text-slate-500" title={`Market cap: ${asset.market_cap}`}>Vol. <span className="text-slate-300">{asset.volume_24h}</span></span></div>
        <div className="grid grid-cols-3 gap-1.5"><ActionButton variant="cyan" compact autoWidth disabled={busy || !asset.can_buy} title={asset.buy_restriction ?? `Buy ${asset.symbol}`} aria-label={`Buy ${asset.symbol}`} onClick={() => onAction({ type: "BUY", symbol: asset.symbol })}>Buy</ActionButton><ActionButton variant="rose" compact autoWidth disabled={busy || !asset.can_sell || !hasUnits} title={asset.sell_restriction ?? (hasUnits ? `Sell ${asset.symbol}` : "No available holdings")} aria-label={`Sell ${asset.symbol}`} onClick={() => onAction({ type: "SELL", symbol: asset.symbol })}>Sell</ActionButton><ActionButton variant="purple" compact autoWidth disabled={busy || !asset.can_sell || !hasUnits || !market.some(target => target.symbol !== asset.symbol && target.can_buy)} title="Swap crypto" aria-label={`Swap ${asset.symbol}`} icon={<ArrowRightLeft size={13} />} onClick={() => onAction({ type: "SWAP", symbol: asset.symbol })} /></div>
      </article>;
    })}{!rows.length && <p role="status" className="py-16 text-center text-sm text-slate-500">No matching crypto assets.</p>}</div>
    <nav aria-label="Crypto market pages" className="mt-2 flex items-center justify-between gap-2 border-t border-white/5 pt-2"><p className="text-[10px] text-slate-500">{filtered.length ? `${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length}` : "0 assets"}</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous crypto market page" className={button} disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft size={15} /></button><span className="text-[11px] text-slate-400">{current} / {pages}</span><button type="button" aria-label="Next crypto market page" className={button} disabled={current >= pages} onClick={() => setPage(current + 1)}><ChevronRight size={15} /></button></div></nav>
  </CardSurface>;
}
