"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Eye, EyeOff, Wifi } from "lucide-react";
import { button } from "../stocks/StockUI";
import type { IssuedCard } from "@/app/lib/types/admin/card-issuing";
import type { CardDetails, CardsRepository } from "@/app/lib/cards/contracts";

export default function VaultCardVisual({ card, holder, repository }: { card: IssuedCard; holder: string; repository: CardsRepository }) {
  const [details, setDetails] = useState<CardDetails | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [copied, setCopied] = useState("");
  const request = useRef<AbortController | null>(null);
  const demo = card.id.startsWith("CRD-DEMO-");
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!details) return;
    const hide = () => { setDetails(null); setCopied(""); };
    const visibility = () => { if (document.hidden) hide(); };
    const timeout = window.setTimeout(hide, Math.max(0, Math.min(60000, Date.parse(details.expires_at) - Date.now())));
    document.addEventListener("visibilitychange", visibility);
    return () => { window.clearTimeout(timeout); document.removeEventListener("visibilitychange", visibility); };
  }, [details]);
  async function reveal() {
    if (details) { setDetails(null); setCopied(""); return; }
    if (busy) return;
    const controller = new AbortController(); request.current = controller; setBusy(true); setError("");
    try { const value = await repository.revealDetails(card.id, controller.signal); if (!controller.signal.aborted) { if (!value.pan.replaceAll(" ", "").endsWith(card.last4)) throw new Error("Card details do not match the selected card."); setDetails(value); } }
    catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to reveal card details."); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  async function copy(field: "number" | "details") {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(field === "number" ? details.pan.replaceAll(" ", "") : `${details.holder_name}\n${details.pan}\nExpiry: ${details.expiry}\nCVV: ${details.cvv}`);
      setCopied(field); setError("");
    } catch { setError("Clipboard access is unavailable. You can select and copy the revealed details."); }
  }
  return <>
    <div className={`relative mx-auto flex aspect-[1.586] w-full max-w-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br p-4 shadow-2xl sm:p-6 ${card.type === "PHYSICAL" ? "from-[#203b5d] via-[#102740] to-[#0b1729]" : "from-[#423369] via-[#282342] to-[#14172d]"}`}>
      <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full border-[30px] border-white/[.035]" />
      <div className="relative flex items-start justify-between gap-3"><span className="text-lg font-semibold tracking-tight">matrix<span className="text-cyan-200">bank</span></span><div className="flex items-center gap-2">{demo && <span className="rounded border border-white/20 px-1.5 py-0.5 text-[9px] tracking-wider">DEMO</span>}<Wifi size={21} className="rotate-90 text-white/60" /></div></div>
      <div className="relative min-w-0"><p aria-label={details ? "Card number revealed" : "Masked card number"} className="select-text whitespace-nowrap font-mono text-[clamp(12px,3.8vw,21px)] tracking-[.04em]">{details?.pan ?? `•••• •••• •••• ${card.last4}`}</p><div className="mt-3 flex items-end justify-between gap-2"><div className="min-w-0"><p className="truncate text-[10px] uppercase tracking-wider text-slate-200 sm:text-xs">{details?.holder_name ?? holder}</p><p className="mt-1 select-text text-[10px] text-slate-300">EXP {card.expiry} · CVV {details?.cvv ?? "•••"} · {card.currency}</p></div><span className="text-[10px] font-bold italic sm:text-xs">{card.network}</span></div></div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2"><button className={button} disabled={busy || !["ACTIVE", "FROZEN"].includes(card.status)} onClick={() => void reveal()}>{details ? <EyeOff size={15} /> : <Eye size={15} />}{busy ? "Revealing…" : details ? "Hide details" : "Reveal details"}</button><button className={button} disabled={!details} onClick={() => void copy("number")}>{copied === "number" ? <Check size={15} /> : <Copy size={15} />}Copy number</button><button className={button} disabled={!details} onClick={() => void copy("details")}>{copied === "details" ? <Check size={15} /> : <Copy size={15} />}Copy details</button></div>
    <p className="mt-2 text-[11px] text-slate-400" role="status">{copied ? "Copied to clipboard." : details ? "Details hide automatically after 60 seconds or when you leave this tab." : demo ? "Reveal and copy sample card data to explore how it works." : "Reveal details to view and copy your card number and security code."}</p>
    {error && <p role="alert" className="mt-2 text-xs text-rose-200">{error}</p>}
  </>;
}
