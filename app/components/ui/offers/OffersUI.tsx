"use client";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import CardSurface, { type CardTone } from "../CardSurface";
import { StockTitle } from "../stocks/StockUI";
import styles from "./OffersWorkspace.module.css";
export const offerOption = styles.option;
export const offerListItem = styles.listItem;
export const offerChart = styles.chart;
export function OfferPanel({ title, icon, tone = "blue", aside, children, className = "" }: { title: string; icon: LucideIcon; tone?: CardTone; aside?: ReactNode; children: ReactNode; className?: string }) {
  return <CardSurface as="section" tone={tone} className={`flex min-w-0 flex-col p-4 sm:p-5 ${className}`}><StockTitle icon={icon} aside={aside}>{title}</StockTitle><div className="flex min-w-0 flex-1 flex-col">{children}</div></CardSurface>;
}
export function OfferStat({ label, children }: { label: string; children: ReactNode }) { return <div className="min-w-0 rounded-xl border border-white/5 bg-white/[.025] p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-semibold tabular-nums">{children}</p></div>; }
export function OfferBadge({ children, active = false }: { children: ReactNode; active?: boolean }) { return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${active ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[.035] text-slate-300"}`}>{children}</span>; }
export const offerNote = "mt-3 text-xs leading-relaxed text-slate-400";
export const shortDate = (at: string) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const experienceDate = (at: string, timezone: string) => new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: timezone });
