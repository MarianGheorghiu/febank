"use client";
import CardSurface from "@/app/components/ui/CardSurface";
import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { PeriodDetails, TimePeriod } from "@/app/lib/types/dashboard";
import { formatDate, formatMoney, formatPercent } from "@/app/lib/overview/engine";
const periods: TimePeriod[] = ["1W", "1M", "3M", "6M", "1Y"];
const themes = {
  crypto: { color: "#c084fc", text: "text-purple-300", caption: "Bitcoin holdings", unit: "BTC" },
  stocks: { color: "#22d3ee", text: "text-cyan-300", caption: "Equity portfolio", unit: "USD" },
  expenses: { color: "#60a5fa", text: "text-blue-300", caption: "Cumulative spending", unit: "USD" },
};
export default function DashboardChart({ title, datasets, variant }: { title: string; datasets: Record<TimePeriod, PeriodDetails>; variant: keyof typeof themes }) {
  const [period, setPeriod] = useState<TimePeriod>("1M");
  const id = useId().replace(/:/g, "");
  const theme = themes[variant];
  const current = datasets[period];
  const data = current.points.map(point => ({ ...point, value: Number(point.value), time: Date.parse(point.at) }));
  const value = data.at(-1)?.value ?? 0;
  const baseline = Number(current.comparison_value);
  const change = baseline ? (value - baseline) / baseline * 100 : 0;
  const positive = variant === "expenses" ? change <= 0 : change >= 0;
  const formatValue = (amount: number) => variant === "crypto" ? `${amount.toLocaleString("en-US", { maximumFractionDigits: 8 })} BTC` : formatMoney(amount);
  const dateTick = (time: number) => new Intl.DateTimeFormat("en-GB", { month: "short", ...(period === "1W" || period === "1M" ? { day: "numeric" as const } : {}), timeZone: "UTC" }).format(time);
  const Direction = change >= 0 ? TrendingUp : TrendingDown;
  return <CardSurface as="section" tone={variant === "crypto" ? "purple" : variant === "stocks" ? "cyan" : "blue"} aria-label={`${title}, ${period}`} className="overflow-hidden p-4 sm:p-5">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-[10px] font-bold font-mono uppercase tracking-[0.15em] text-zinc-400">{title}</h2>
      <span className={`rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-mono ${theme.text}`}>{theme.unit}</span>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="text-2xl font-bold tracking-tight tabular-nums break-all">{formatValue(value)}</p>
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${positive ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}><Direction size={12} />{formatPercent(change)}</span>
    </div>
    <p className="text-[11px] text-zinc-400 mt-1">{variant === "expenses" ? "Compared with previous period" : "Change over selected period"}</p>
    <div className="grid grid-cols-5 gap-1 rounded-lg bg-black/20 p-1 mt-4" aria-label={`${title} period`}>
      {periods.map(p => <button type="button" key={p} aria-pressed={period === p} onClick={() => setPeriod(p)} className={`min-h-9 rounded-md text-xs font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${p === period ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>{p}</button>)}
    </div>
    <div className="mt-4 h-44 w-full min-w-0">
      {data.length ? <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 300, height: 176 }}>
        <AreaChart data={data} accessibilityLayer margin={{ top: 8, right: 5, left: 0, bottom: 0 }}>
          <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={theme.color} stopOpacity={0.5} /><stop offset="55%" stopColor={theme.color} stopOpacity={0.12} /><stop offset="100%" stopColor={theme.color} stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.055)" strokeDasharray="2 8" />
          <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} tickFormatter={dateTick} tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={35} />
          <YAxis width={44} tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(v)} domain={variant === "expenses" ? [0, "auto"] : ["auto", "auto"]} />
          {variant !== "expenses" && <ReferenceLine y={data[0].value} stroke={theme.color} strokeOpacity={0.4} strokeDasharray="4 4" />}
          <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="rounded-xl border border-white/15 bg-[#070d20]/95 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"><p className="text-[10px] text-zinc-400">{formatDate(payload[0].payload.at)}</p><p className={`text-sm font-bold mt-1 ${theme.text}`}>{formatValue(Number(payload[0].value))}</p></div> : null} cursor={{ stroke: theme.color, strokeOpacity: 0.5, strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="value" stroke={theme.color} strokeWidth={2.5} fill={`url(#${id})`} style={{ filter: `drop-shadow(0 0 5px ${theme.color}40)` }} dot={{ r: 2, fill: theme.color, fillOpacity: 0.6, strokeWidth: 0 }} activeDot={{ r: 6, fill: theme.color, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer> : <p className="text-zinc-400 text-sm">No history available.</p>}
    </div>
    <div className="flex justify-between gap-2 border-t border-white/5 pt-3 mt-2 text-[10px] text-zinc-400"><span>{theme.caption}</span><span>Mock snapshot</span></div>
  </CardSurface>;
}
