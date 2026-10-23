"use client";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { AssetKind } from "@/app/lib/analytics/contracts";
import CardSurface, { type CardTone } from "../CardSurface";
import { StockTitle } from "../stocks/StockUI";
export const names: Record<AssetKind, string> = { fiat: "Cash & currencies", crypto: "Crypto", stock: "Stocks" };
export const colors: Record<AssetKind, string> = { fiat: "#22d3ee", crypto: "#60a5fa", stock: "#c084fc" };
export const note = "mt-3 text-xs leading-relaxed text-slate-400";
export const tooltipStyle = { backgroundColor: "#070d20", border: "1px solid rgba(103,232,249,.25)", borderRadius: 12, color: "#e2e8f0", fontSize: 12, boxShadow: "0 12px 32px rgba(0,0,0,.35)" };
export const labelStyle = { color: "#94a3b8", marginBottom: 6 };
export const itemStyle = { color: "#a5f3fc" };
export const barCursor = { fill: "rgba(34,211,238,.09)", stroke: "rgba(103,232,249,.22)", strokeWidth: 1, radius: 6 };
export const lineCursor = { stroke: "#60a5fa", strokeWidth: 1, strokeDasharray: "4 4" };
export const shortDate = (at: string) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export const monthDate = (at: string) => new Date(at).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
export const chartMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
export function AnalyticsPanel({ title, icon, tone = "blue", aside, children, className = "" }: { title: string; icon: LucideIcon; tone?: CardTone; aside?: ReactNode; children: ReactNode; className?: string }) {
  return <CardSurface as="section" tone={tone} className={`flex min-w-0 flex-col p-4 sm:p-5 ${className}`}><StockTitle icon={icon} aside={aside}>{title}</StockTitle>{children}</CardSurface>;
}
export function AnalyticsStat({ label, children }: { label: string; children: ReactNode }) { return <div className="min-w-0 rounded-xl border border-white/5 bg-white/[.025] p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-semibold tabular-nums">{children}</p></div>; }
