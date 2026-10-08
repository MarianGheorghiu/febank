"use client";

import CardSelect from "./CardSelect";
import { useState } from "react";
import { History } from "lucide-react";
import type { CardAuditEntry, CardCustomer } from "@/app/lib/types/admin/card-issuing";
import { formatCardDate, inputClass, panelClass } from "./presentation";

export default function CardAuditTrail({ entries, customers, selectedId }: { entries: CardAuditEntry[]; customers: CardCustomer[]; selectedId: string | null }) {
  const [scope, setScope] = useState("ALL");
  const [query, setQuery] = useState("");
  const filtered = entries.filter(entry => (scope === "ALL" || entry.cardId === selectedId || entry.after?.replacedByCardId === selectedId) && [entry.cardId, entry.actor, entry.reason, entry.action, customers.find(customer => customer.id === entry.userId)?.name].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className={panelClass} aria-labelledby="card-audit-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 p-4"><div><h2 id="card-audit-title" className="flex items-center gap-2 text-sm font-bold text-cyan-300"><History size={16} /> Administrator audit trail</h2><p className="mt-1 text-[10px] text-slate-400">Operator, target, reason and before / after record · Bucharest time</p></div><span className="text-[10px] text-slate-400">{filtered.length} events</span></div>
      <div className="grid gap-3 border-b border-cyan-500/15 p-4 sm:grid-cols-2"><label className="space-y-1.5 text-[10px] text-slate-400"><span className="block">Audit scope</span><CardSelect value={scope} onChange={event => setScope(event.target.value)}><option value="ALL">All card operations</option><option value="SELECTED" disabled={!selectedId}>Selected card & replacement</option></CardSelect></label><label className="space-y-1.5 text-[10px] text-slate-400"><span className="block">Search audit trail</span><input className={inputClass} value={query} onChange={event => setQuery(event.target.value)} placeholder="Operator, customer, action or reason…" /></label></div>
      <div className="max-h-[450px] overflow-y-auto scrollbar-thin divide-y divide-cyan-500/10">{filtered.map(entry => <details key={entry.id} className="group p-4 open:bg-cyan-500/[0.04]"><summary className="cursor-pointer text-xs marker:text-cyan-400"><span className="ml-1 font-bold text-cyan-300">{entry.action.replaceAll("_", " ")}</span><span className="ml-2 text-[10px] text-slate-400">{formatCardDate(entry.timestamp)}</span><span className="mt-2 block break-all text-[10px] text-slate-300">{entry.actor} → {customers.find(customer => customer.id === entry.userId)?.name ?? "Card registry"}</span><span className="mt-1 block break-all text-[10px] text-slate-500">{entry.cardId ?? "Registry export"}</span><span className="mt-2 block break-words text-[11px] leading-relaxed text-slate-300">{entry.reason}</span></summary><div className="mt-4 grid gap-3 lg:grid-cols-2">{(["before", "after"] as const).map(key => <div key={key}><h3 className="mb-2 text-[10px] font-bold uppercase text-slate-400">{key}</h3><pre className="max-h-56 overflow-auto scrollbar-thin rounded-lg border border-cyan-500/15 bg-[#010510] p-3 text-[10px] leading-relaxed text-cyan-200">{entry[key] ? JSON.stringify(entry[key], null, 2) : "No card snapshot recorded"}</pre></div>)}</div></details>)}{!filtered.length && <p className="p-8 text-center text-xs text-slate-400">No audit events match this scope and search.</p>}</div>
    </section>
  );
}
