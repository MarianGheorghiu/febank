"use client";
import { useId, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CardSurface from "../CardSurface";
import { currencyAmount } from "./AssetPanel";
import type { CurrencySnapshot } from "@/app/lib/currencies/contracts";

const themes = {
  fiat: { label: "Currencies", color: "#60a5fa", light: "#a5e5ff", end: "#6366f1" },
  crypto: { label: "Crypto", color: "#22d3ee", light: "#b1fff2", end: "#3b82f6" },
  stock: { label: "Stocks", color: "#fbbf24", light: "#fff1b8", end: "#f97316" },
};
export default function EvolutionChart({ snapshot, assetClass, title = "Balance evolution" }: { snapshot: CurrencySnapshot; assetClass?: keyof typeof themes; title?: string }) {
  const [selectedKind, setKind] = useState<keyof typeof themes>("fiat");
  const kind = assetClass ?? selectedKind;
  const [period, setPeriod] = useState<"1W" | "1M" | "ALL">("1M");
  const gradient = useId();
  const theme = themes[kind];
  const points = useMemo(() => {
    const lastTime = Date.parse(snapshot.history.at(-1)?.at ?? snapshot.as_of);
    const cutoff = period === "ALL" ? -Infinity : lastTime - (period === "1W" ? 7 : 30) * 86400000;
    return snapshot.history.filter(point => point.at === null || Date.parse(point.at) >= cutoff).map(point => ({
      date: point.at ? new Date(point.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Opening",
      fullDate: point.at ? new Date(point.at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Opening balance",
      value: Number(point[kind]),
    }));
  }, [snapshot, kind, period]);
  const opening = points[0]?.value ?? 0;
  const current = points.at(-1)?.value ?? 0;
  const change = current - opening;
  const percent = opening ? change / opening * 100 : 0;
  const Rising = change >= 0 ? ArrowUpRight : ArrowDownRight;
  return <CardSurface as="section" className="flex h-full min-h-[400px] min-w-0 flex-col p-4">
    <header className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-[11px] text-slate-500">Portfolio value · USD</p></div><div className="text-right"><p className="font-mono text-xl font-semibold tracking-tight tabular-nums text-white">${currencyAmount(String(current), 2)}</p><p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] font-medium tabular-nums ${change >= 0 ? "text-emerald-300" : "text-rose-300"}`}><Rising aria-hidden size={13} />{change >= 0 ? "+" : "−"}${currencyAmount(String(Math.abs(change)), 2)} <span className="opacity-70">({Math.abs(percent).toFixed(2)}%)</span></p></div></header>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      {!assetClass && <div role="group" aria-label="Balance asset class" className="flex max-w-full gap-0.5 rounded-xl border border-white/10 bg-[#060d1b]/70 p-0.5">{(Object.keys(themes) as (keyof typeof themes)[]).map(key => <button key={key} type="button" aria-pressed={kind === key} onClick={() => setKind(key)} className={`min-h-10 cursor-pointer rounded-lg px-2.5 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-cyan-300 ${kind === key ? "bg-white/[0.08] text-white shadow-sm" : "text-slate-500 hover:text-white"}`}>{themes[key].label}</button>)}</div>}
      <div role="group" aria-label="Chart period" className="ml-auto grid shrink-0 grid-cols-3 gap-1 rounded-xl border border-white/10 bg-[#050b18]/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">{(["1W", "1M", "ALL"] as const).map(value => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} className={`flex min-h-9 min-w-11 cursor-pointer items-center justify-center rounded-lg border px-2.5 font-mono text-[10px] font-bold tracking-wide transition-[background-color,border-color,color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${period === value ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "border-transparent text-slate-500 hover:border-white/5 hover:bg-white/5 hover:text-slate-200"}`} style={period === value ? { color: theme.light, backgroundColor: `${theme.color}18`, borderColor: `${theme.color}38` } : undefined}>{value}</button>)}</div>
    </div>
    <div className="relative mt-2 h-44 min-h-44 min-w-0 flex-1 overflow-hidden rounded-xl" role="img" aria-label={`${theme.label} balance history. Current value ${current} USD.`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ background: `radial-gradient(ellipse at 75% 85%, ${theme.color}0c, transparent 70%)` }} />
      {points.length < 2 ? <div className="flex h-full min-h-44 items-center justify-center px-6 text-center text-xs text-slate-500">Your balance history will appear after your first wallet operation.</div> : <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={points} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={`${gradient}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={theme.color} stopOpacity={0.4} /><stop offset="55%" stopColor={theme.end} stopOpacity={0.12} /><stop offset="100%" stopColor={theme.end} stopOpacity={0.01} /></linearGradient>
            <linearGradient id={`${gradient}-line`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={theme.end} /><stop offset="55%" stopColor={theme.color} /><stop offset="100%" stopColor={theme.light} /></linearGradient>
            <filter id={`${gradient}-glow`} x="-25%" y="-50%" width="150%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,.065)" vertical={false} strokeDasharray="2 6" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} minTickGap={45} axisLine={false} tickLine={false} tickMargin={10} />
          <YAxis domain={[(min: number) => min - Math.max((current - opening) * 0.15, min * 0.01), (max: number) => max + max * 0.012]} width={55} tickCount={4} tick={{ fill: "#64748b", fontSize: 9 }} tickFormatter={value => Math.abs(Number(value)) >= 1000 ? `${(Number(value) / 1000).toFixed(1)}k` : Number(value).toFixed(0)} axisLine={false} tickLine={false} />
          <ReferenceLine y={opening} stroke={theme.color} strokeOpacity={0.16} strokeDasharray="3 5" />
          <Tooltip position={{ x: 48, y: 4 }} cursor={{ stroke: theme.color, strokeOpacity: 0.35, strokeDasharray: "3 5" }} content={({ active, payload }) => {
            const point = payload?.[0]?.payload as (typeof points)[number] | undefined;
            if (!active || !point) return null;
            return <div className="rounded-xl border border-white/10 bg-[#0a1427]/95 px-3 py-2 shadow-xl backdrop-blur-xl"><p className="text-[9px] text-slate-400">{point.fullDate}</p><p className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold text-white"><span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.color }} />${currencyAmount(String(point.value), 2)}</p></div>;
          }} />
          <Area type="monotoneX" dataKey="value" stroke={theme.color} strokeWidth={5} strokeOpacity={0.28} filter={`url(#${gradient}-glow)`} fill="none" tooltipType="none" dot={false} activeDot={false} isAnimationActive={false} />
          <Area type="monotoneX" dataKey="value" stroke={`url(#${gradient}-line)`} strokeWidth={2.5} fill={`url(#${gradient}-fill)`} activeDot={{ r: 5, fill: theme.light, stroke: theme.color, strokeWidth: 5, strokeOpacity: 0.25 }} dot={props => {
            if (props.index !== points.length - 1) return <g key={props.key} />;
            return <g key={props.key} pointerEvents="none"><circle cx={props.cx} cy={props.cy} r={11} fill={theme.color} fillOpacity={0.08} /><circle cx={props.cx} cy={props.cy} r={7} fill={theme.color} fillOpacity={0.16} /><circle cx={props.cx} cy={props.cy} r={3.5} fill={theme.light} stroke={theme.color} strokeWidth={1.5} /></g>;
          }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>}
    </div>
  </CardSurface>;
}
