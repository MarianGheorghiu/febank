"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import SocialDialog from "../friends/SocialDialog";
import { button } from "../stocks/StockUI";
import { cardPage } from "@/app/lib/cards/pagination";
import type { CardAuditEntry, IssuedCard } from "@/app/lib/types/admin/card-issuing";
export default function VaultSecurityDialog({ audit, card, email, onClose }: { audit: CardAuditEntry[]; card: IssuedCard; email: string; onClose: () => void }) {
  const [page, setPage] = useState(0), viewport = useRef<HTMLDivElement>(null);
  const entries = audit.filter(entry => entry.cardId === card.id), pagination = cardPage(entries, page);
  function navigate(next: number) { setPage(next); viewport.current?.scrollTo({ top: 0 }); }
  return <SocialDialog title="Security activity" subtitle={`${card.network} •••• ${card.last4} · ${entries.length} events`} icon={ShieldCheck} busy={false} onClose={onClose}>
    <div ref={viewport} tabIndex={0} role="region" aria-label="Security events" className="max-h-[55dvh] space-y-3 overflow-y-auto overscroll-contain rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">{pagination.rows.map(entry => <div key={entry.id} className="rounded-xl border border-white/10 bg-white/[.025] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium capitalize">{entry.action.toLowerCase().replaceAll("_", " ")}</p><span className="text-xs text-cyan-200">{entry.actor === "demo-setup" ? "Demo setup" : entry.actor.toLowerCase() === email.toLowerCase() ? "You" : "Operations"}</span></div><p className="mt-2 text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString("en-GB", { timeZone: "Europe/Bucharest" })}</p><p className="mt-2 break-words text-xs leading-relaxed text-slate-300">{entry.reason}</p></div>)}{!entries.length && <p className="p-5 text-center text-sm text-slate-300">No security changes recorded for this card.</p>}</div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-slate-300"><span aria-live="polite">Page {pagination.page + 1} of {pagination.pages} · Version {card.version}</span><div className="flex gap-2"><button className={button} aria-label="Previous security events" disabled={!pagination.hasPrevious} onClick={() => navigate(pagination.page - 1)}><ChevronLeft size={15} /></button><button className={button} aria-label="Next security events" disabled={!pagination.hasNext} onClick={() => navigate(pagination.page + 1)}><ChevronRight size={15} /></button></div></div>
  </SocialDialog>;
}
