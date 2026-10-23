"use client";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import CardSurface, { type CardTone } from "../CardSurface";
import { StockTitle } from "../stocks/StockUI";
import styles from "./CreditWorkspace.module.css";

/** The large panel spans two content-sized rows; smaller panels keep independent heights. */
export function CreditDeck({ children }: { children: ReactNode }) {
  return <div className={styles.deck}>{children}</div>;
}

export const creditOption = styles.option;
export const creditMoney = (value: string | number, currency = "USD") => new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-GB", { style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(value));
export const creditRate = (bps: number) => `${(bps / 100).toFixed(2)}%`;
export function CreditPanel({ title, icon, children, tone = "blue", aside, className = "" }: { title: string; icon: LucideIcon; children: ReactNode; tone?: CardTone; aside?: ReactNode; className?: string }) {
  return <CardSurface as="section" tone={tone} className={`flex min-w-0 flex-col p-4 sm:p-5 ${className}`}><StockTitle icon={icon} aside={aside}>{title}</StockTitle><div className="flex min-w-0 flex-1 flex-col">{children}</div></CardSurface>;
}
export function CreditStat({ label, value }: { label: string; value: ReactNode }) { return <div className="min-w-0 rounded-xl border border-white/5 bg-white/[.025] p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-semibold tabular-nums text-slate-100">{value}</p></div>; }
export function CreditProgress({ label, value }: { label: string; value: number }) { const bounded = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0; return <div className="mt-4"><div className="mb-2 flex justify-between gap-2 text-xs text-slate-300"><span>{label}</span><span>{bounded.toFixed(1)}%</span></div><div role="progressbar" aria-label={label} aria-valuenow={Math.round(bounded)} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${bounded >= 90 ? "bg-amber-300" : "bg-cyan-300"}`} style={{ width: `${bounded}%` }} /></div></div>; }
export const creditNote = "mt-4 text-xs leading-relaxed text-slate-400";

export function CreditInfo({ children, title = "How it works" }: { children: ReactNode; title?: string }) {
  return <details className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">{title}</summary><p className="mt-2 leading-relaxed">{children}</p></details>;
}
