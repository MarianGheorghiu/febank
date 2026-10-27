"use client";
import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import type { ControlSnapshot, Domain, DomainSummary } from "@/app/lib/admin-control/contracts";
import { controlMoney as money, controlDate as date } from "@/app/lib/admin-control/presentation";
import { units } from "@/app/lib/transfers/engine";
import CardSurface from "../CardSurface";
import { ActionButton } from "../dashboard/ActionButton";
import { inputClass } from "./cards/presentation";
const domainNames = { FIAT: "Fiat & payments", CRYPTO: "Crypto assets", STOCK: "Stocks & trading" };
const tones = { FIAT: "cyan", CRYPTO: "purple", STOCK: "blue" } as const;

export function ControlDomainCard({ item, disabled, onManage }: { item: DomainSummary; disabled: boolean; onManage: () => void }) {
  const exposure = units(item.available_usd, 2) + units(item.reserved_usd, 2);
  const limit = units(item.policy.exposure_limit_usd, 2);
  const percent = limit > BigInt(0) ? Number(exposure * BigInt(10000) / limit) / 100 : 0;
  return <CardSurface tone={tones[item.domain]} as="section" className="space-y-4 p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-white">{domainNames[item.domain]}</h3><span className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${item.policy.paused || item.routing_status === "HALTED" ? "border-rose-400/30 text-rose-300" : "border-cyan-400/20 text-cyan-200"}`}>{item.policy.paused ? "RISK STOP" : item.routing_status === "ACTIVE" ? "RISK GATE OPEN" : item.routing_status.replaceAll("_", " ")}</span></div>
    <p className="break-words font-mono text-2xl font-bold text-white">{money(item.available_usd)}</p><p className="text-xs text-slate-400">Available holdings · {money(item.reserved_usd)} reserved</p>
    <dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-500">Pending operations</dt><dd className="mt-1 text-slate-200">{item.pending_count}</dd></div><div><dt className="text-slate-500">Open cases</dt><dd className="mt-1 text-slate-200">{item.open_cases}</dd></div><div><dt className="text-slate-500">24h volume</dt><dd className="mt-1 break-words text-slate-200">{money(item.volume_24h_usd)}</dd></div><div><dt className="text-slate-500">Transaction cap</dt><dd className="mt-1 break-words text-slate-200">{money(item.policy.max_transaction_usd)}</dd></div></dl>
    <div><div className="mb-2 flex flex-wrap justify-between gap-1 text-[11px] text-slate-400"><span>Holdings / exposure alert</span><span className={percent >= 100 ? "text-amber-300" : ""}>{percent.toFixed(1)}%</span></div><div role="meter" aria-label={`${item.domain} holdings against exposure alert`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(percent, 100)} aria-valuetext={`${percent.toFixed(1)} percent of ${money(item.policy.exposure_limit_usd)}`} className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${percent >= 100 ? "bg-amber-400" : "bg-cyan-400/70"}`} style={{ width: `${Math.min(percent, 100)}%` }}/></div></div>
    <ActionButton fullWidth variant={item.policy.paused ? "rose" : tones[item.domain]} icon={<SlidersHorizontal size={14}/>} disabled={disabled} onClick={onManage}>Manage {item.domain} controls</ActionButton>
  </CardSurface>;
}

export function ControlQueues({ snapshot, domain }: { snapshot: ControlSnapshot; domain: Domain | "ALL" }) {
  const [search, setSearch] = useState(""); const [page, setPage] = useState(0);
  const cases = snapshot.cases.filter(item => (domain === "ALL" || item.domain === domain) && `${item.id} ${item.subject} ${item.severity} ${item.status}`.toLowerCase().includes(search.toLowerCase().trim()));
  const activity = snapshot.activity.filter(item => domain === "ALL" || item.domain === domain);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(activity.length / 6) - 1));
  return <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2">
    <CardSurface as="section" tone="amber" className="p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-white">Priority risk queue</h3><Link href="/dashboard/admin/fraud-control" className="text-xs text-cyan-300 underline underline-offset-4">Open Risk Control</Link></div>
      <label className="mb-4 block"><span className="sr-only">Search risk cases</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search case, customer or status…" className={inputClass}/></label>
      <p className="mb-2 text-xs text-slate-500">{cases.length} matching cases · severity, then deadline</p><div tabIndex={0} role="region" aria-label="Scrollable risk cases" className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-white/5 pr-2">{cases.slice(0, 8).map(item => <Link key={item.id} href="/dashboard/admin/fraud-control" className="flex min-w-0 flex-col gap-2 py-3 focus-visible:outline-2 focus-visible:outline-cyan-300 sm:flex-row sm:justify-between"><div className="min-w-0"><p className="break-words text-sm font-semibold text-slate-200">{item.subject}</p><p className="mt-1 break-words text-[11px] text-slate-500">{item.id} · {item.domain} · {item.status.replaceAll("_", " ")}</p><p className={`mt-1 text-[11px] ${item.due_at < snapshot.as_of ? "text-amber-300" : "text-slate-500"}`}>{item.due_at < snapshot.as_of ? "Overdue" : "Due"} {date(item.due_at)}</p></div><div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1"><span className={`text-[10px] font-bold ${item.severity === "CRITICAL" ? "text-rose-300" : "text-amber-200"}`}>{item.severity}</span><span className="font-mono text-xs text-slate-300">{money(item.amount_usd)}</span></div></Link>)}</div>
      {!cases.length && <p className="py-8 text-center text-sm text-slate-400">No cases match these filters.</p>}{cases.length > 8 && <p className="mt-3 text-xs text-slate-400">Showing the first 8 cases. Open Risk Control for the full queue.</p>}
    </CardSurface>
    <CardSurface as="section" tone="purple" className="p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-white">Operational audit</h3><span className="text-xs text-slate-500">Risk & market controls</span></div><div tabIndex={0} role="region" aria-label="Scrollable audit entries" className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-white/5 pr-2">{activity.slice(currentPage * 6, currentPage * 6 + 6).map(item => <article key={item.id} className="space-y-1 py-3"><div className="flex flex-wrap justify-between gap-2"><p className="break-all text-xs font-bold text-purple-200">{item.action.replaceAll("_", " ")} · {item.domain}</p><time dateTime={item.occurred_at} className="text-[10px] text-slate-500">{date(item.occurred_at)}</time></div><p className="break-all text-xs text-slate-400">{item.actor} → {item.target}</p><p className="break-words text-xs leading-relaxed text-slate-300">{item.reason}</p></article>)}</div>
      {!activity.length && <p className="py-8 text-center text-sm text-slate-400">No operational audit entries in this scope.</p>}{activity.length > 6 && <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><ActionButton autoWidth size="medium" variant="blue" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</ActionButton><span className="text-xs text-slate-400">{currentPage + 1} / {Math.ceil(activity.length / 6)}</span><ActionButton autoWidth size="medium" variant="blue" disabled={(currentPage + 1) * 6 >= activity.length} onClick={() => setPage(currentPage + 1)}>Next</ActionButton></div>}
    </CardSurface>
  </div>;
}
