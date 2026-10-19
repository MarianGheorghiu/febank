"use client";
import { Gauge, Route, Clock3 } from "lucide-react";
import CardSurface from "../CardSurface";
import type { TransferSnapshot } from "@/app/lib/transfers/contracts";
import { amountLabel, decimal, units } from "@/app/lib/transfers/engine";
import { TransferStatus } from "./TransferTable";
export default function TransferBottomWidgets({ snapshot }: { snapshot: TransferSnapshot }) {
  const limit = units(snapshot.limits.daily_limit, 2);
  const used = units(snapshot.limits.used, 2);
  const remaining = decimal(limit > used ? limit - used : BigInt(0), 2);
  const percent = limit > BigInt(0) ? Math.min(100, Number(used) / Number(limit) * 100) : 0;
  const percentLabel = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(percent);
  const recent = [...snapshot.transfers].sort((a,b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 3);
  const title = "mb-3 flex items-center gap-2 text-sm font-semibold";
  return <div className="grid min-w-0 auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
    <CardSurface as="section" tone="cyan" className="h-full p-4"><h2 className={title}><Gauge size={17} className="text-cyan-300" /> Daily transfer allowance</h2><p className="break-all text-xl font-bold">{amountLabel(remaining, "USD")}</p><p className="mt-1 text-xs text-slate-400">Available today · fees included</p><div role="progressbar" aria-label="Daily transfer allowance used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${percentLabel}% of the daily limit used`} title={`${percentLabel}% used`} className="my-3 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${percent}%`, minWidth: used > BigInt(0) && limit > BigInt(0) ? "4px" : "0" }} /></div><p className="text-xs text-slate-400">{amountLabel(snapshot.limits.used, "USD")} used of {amountLabel(snapshot.limits.daily_limit, "USD")}</p><p className="mt-3 text-[10px] text-slate-500">Resets {new Date(snapshot.limits.resets_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</p></CardSurface>
    <CardSurface as="section" tone="blue" className="h-full p-4"><h2 className={title}><Route size={17} className="text-blue-300" /> Available routes</h2><div className="space-y-2">{(["fiat", "crypto", "stock"] as const).map(kind => {
      const assets = snapshot.accounts.filter(a => a.kind === kind).map(a => a.asset);
      const routes = snapshot.routes.filter(r => r.enabled && assets.includes(r.asset));
      return <div key={kind} className="flex min-h-8 items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0"><h3 className="text-xs font-medium">{kind === "stock" ? "Stock custody" : kind === "fiat" ? "Bank & phone" : "Crypto networks"}</h3><span className="shrink-0 rounded-full bg-blue-400/10 px-2 py-1 text-[10px] text-blue-200">{routes.length} routes</span></div>;
    })}</div><p className="mt-3 text-[10px] text-slate-500">Fees and delivery estimates at review.</p></CardSurface>
    <CardSurface as="section" tone="purple" className="h-full p-4"><h2 className={title}><Clock3 size={17} className="text-purple-300" /> Latest updates</h2><div className="space-y-2">{recent.map(t => <div key={t.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="break-words text-xs font-medium">{t.recipient_name}</p><p className="mt-1 break-all text-[11px] text-slate-400">{t.direction === "incoming" ? "+" : "−"}{amountLabel(t.amount, t.asset)}</p></div><TransferStatus status={t.status} /></div>)}{!recent.length && <p className="text-sm text-slate-400">Your transfer updates will appear here.</p>}</div></CardSurface>
  </div>;
}
