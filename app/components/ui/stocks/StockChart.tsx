"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StockCandle } from "@/app/lib/stocks/contracts";
import { money, useReducedStockMotion } from "./StockUI";
const tick = (value: number) => Math.abs(value) >= 1000000 ? `$${(value / 1000000).toFixed(1)}m` : Math.abs(value) >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value.toFixed(value < 10 ? 2 : 0)}`;
export default function StockChart({ points, candles = false, label, compact = false }: { points: StockCandle[]; candles?: boolean; label: string; compact?: boolean }) {
  const reducedMotion = useReducedStockMotion();
  const id = useId().replace(/:/g, ""), [hover, setHover] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null), [canvasWidth, setCanvasWidth] = useState(700);
  useEffect(() => { const observer = new ResizeObserver(entries => { const width = entries[0]?.contentRect.width; if (width > 0) setCanvasWidth(Math.max(240, width)); }); if (root.current) observer.observe(root.current); return () => observer.disconnect(); }, []);
  if (!points.length) return <p className="flex min-h-60 items-center justify-center text-sm text-slate-200">No chart data available.</p>;
  const selected = points[hover ?? points.length - 1] ?? points[points.length - 1];
  const data = points.map(p => ({ ...p, value: Number(p.close) }));
  const low = Math.min(...points.map(p => Number(p.low))), high = Math.max(...points.map(p => Number(p.high)));
  const pad = Math.max((high - low) * 0.15, high * .005, .01), min = Math.max(0, low - pad), max = high + pad;
  const chartHeight = compact ? 125 : 180, top = 16, left = 12, right = canvasWidth - 65, width = right - left, step = width / points.length;
  const y = (value: string | number) => top + (max - Number(value)) / (max - min) * chartHeight;
  return <div ref={root} className="min-w-0">
    {candles ? <>
      {!compact && <div className="mb-2 flex min-h-8 flex-wrap justify-end gap-x-3 gap-y-1 text-[10px] text-slate-200" aria-live="off"><span>{selected.label}</span>{([['O',selected.open],['H',selected.high],['L',selected.low],['C',selected.close]] as const).map(([key, value]) => <span key={key}>{key} <span className="font-semibold text-white">{money(value, 2)}</span></span>)}</div>}
      <svg viewBox={`0 0 ${canvasWidth} ${compact ? 180 : 240}`} role="img" aria-label={`${label}, candlestick chart. Last close ${money(points.at(-1)!.close)}.`} className={compact ? "h-[180px] w-full" : "h-60 w-full"} onPointerLeave={() => setHover(null)}>
        <defs><linearGradient id={`bg-${id}`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#22d3ee" stopOpacity=".07" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></linearGradient></defs><rect x={left} y={top} width={width} height={chartHeight} fill={`url(#bg-${id})`} />
        {[0,.25,.5,.75,1].map(f => <g key={f}><line x1={left} x2={right} y1={top + f * chartHeight} y2={top + f * chartHeight} stroke="#ffffff" strokeOpacity=".09" strokeDasharray="3 5" /><text x={right + 9} y={top + f * chartHeight + 4} fill="#e2e8f0" fontSize="10">{tick(max - f * (max - min))}</text></g>)}
        {points.map((p, index) => { const x = left + step * (index + .5), color = Number(p.close) >= Number(p.open) ? "#6ee7b7" : "#fda4af"; return <g key={`${p.label}-${index}`} onPointerEnter={() => setHover(index)}><rect x={x - step / 2} y={top} width={step} height={chartHeight} fill={hover === index ? "#ffffff08" : "transparent"} /><line x1={x} x2={x} y1={y(p.high)} y2={y(p.low)} stroke={color} strokeWidth="1.5" /><rect x={x - Math.min(step * .28, 17)} y={Math.min(y(p.open), y(p.close))} width={Math.min(step * .56, 34)} height={Math.max(2, Math.abs(y(p.open) - y(p.close)))} rx="2" fill={color} fillOpacity={Number(p.close) >= Number(p.open) ? .85 : .65} stroke={color} /><title>{`${p.label}: Open ${money(p.open)}, High ${money(p.high)}, Low ${money(p.low)}, Close ${money(p.close)}`}</title>{(index === 0 || index === points.length - 1 || index % Math.max(1, Math.ceil(points.length / 5)) === 0) && <text x={x} y={compact ? 165 : 222} textAnchor="middle" fill="#e2e8f0" fontSize="10">{p.label}</text>}</g>; })}
      </svg>
    </> : <div className="min-w-0" style={{ height: compact ? 180 : 270 }} role="img" aria-label={`${label}. Last value ${money(points.at(-1)!.close)}.`}><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 270 }}><AreaChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
      <defs><linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={.35} /><stop offset="65%" stopColor="#3b82f6" stopOpacity={.08} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient><filter id={`glow-${id}`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <CartesianGrid vertical={false} stroke="#ffffff12" strokeDasharray="3 5" /><XAxis dataKey="label" tick={{ fill: "#e2e8f0", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={28} dy={8} /><YAxis domain={[min, max]} tickFormatter={tick} width={62} tick={{ fill: "#e2e8f0", fontSize: 10 }} axisLine={false} tickLine={false} tickCount={5} />
      <Tooltip content={({ active, payload, label: pointLabel }) => active && payload?.length ? <div className="rounded-xl border border-cyan-300/25 bg-[#071225]/95 px-4 py-3 text-xs shadow-xl"><p className="text-slate-200">{pointLabel}</p><p className="mt-1 font-semibold text-white">{money(Number(payload[0].value))}</p></div> : null} cursor={{ stroke: "#67e8f9", strokeOpacity: .3, strokeDasharray: "4 4" }} />
      <Area type="monotoneX" dataKey="value" stroke="#67e8f9" strokeWidth={2.5} fill={`url(#area-${id})`} isAnimationActive={!reducedMotion} animationDuration={800} animationEasing="ease-out" activeDot={{ r: 5, stroke: "#083344", strokeWidth: 3, fill: "#a5f3fc" }} dot={(props) => { const { cx, cy, index } = props; return index === data.length - 1 ? <g key={index}><circle cx={cx} cy={cy} r={9} fill="#22d3ee" fillOpacity={.15} /><circle cx={cx} cy={cy} r={4} fill="#a5f3fc" stroke="#0e7490" strokeWidth={2} /></g> : <g key={index} />; }} />
    </AreaChart></ResponsiveContainer></div>}
  </div>;
}
