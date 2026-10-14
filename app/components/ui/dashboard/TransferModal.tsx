"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Landmark, Loader2, Phone, Wallet, X } from "lucide-react";
import type { OverviewOperation } from "@/app/lib/types/dashboard";
import { useUser } from "@/app/context/UserContext";
import { createOverviewRepository } from "@/app/lib/overview/repository";
import { ActionButton } from "./ActionButton";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import { formatMoney } from "@/app/lib/overview/engine";
function OperationDialog({ onClose, type, balance, onSubmit }: {
  onClose: () => void; type: OverviewOperation["type"]; balance: string;
  onSubmit: (operation: OverviewOperation) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const operationId = useRef<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"iban" | "phone">("iban");
  const [name, setName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    element?.querySelector<HTMLInputElement>("input")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, []);
  const config = {
    deposit: { title: "Deposit Core", subtitle: "INSTANT FUNDING", Icon: ArrowUpRight, notificationTone: "cyan" as const, button: "cyan" as const },
    withdraw: { title: "Withdraw Secure", subtitle: "SECURE WITHDRAWAL", Icon: ArrowDownLeft, notificationTone: "rose" as const, button: "red" as const },
    transfer: { title: "Fast Transfer", subtitle: "LEDGER P2P // SECURE", Icon: ArrowLeftRight, notificationTone: "purple" as const, button: "purple" as const },
  }[type];
  const inputClass = "w-full min-w-0 rounded-xl border border-white/10 bg-[#060d1b] px-4 py-3 text-base sm:text-sm font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-colors duration-200 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/5 disabled:opacity-50";
  const labelClass = "block space-y-2 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest";
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (processing) return;
    setError(""); setProcessing(true);
    try {
      operationId.current ??= crypto.randomUUID();
      await onSubmit({ id: operationId.current, type, amount, ...(type === "transfer" ? { recipient_name: name, recipient_kind: method, recipient } : {}) });
      // Close the native dialog before showing the shared notification above the page.
      onClose();
      const formattedAmount = formatMoney(amount);
      const notification = {
        deposit: { title: "Money added", description: `${formattedAmount} added to your USD account.`, scope: "Account funding" },
        withdraw: { title: "Withdrawal completed", description: `${formattedAmount} withdrawn from your USD account.`, scope: "Cash withdrawal" },
        transfer: { title: "Transfer completed", description: `${formattedAmount} sent to ${name.trim()} via ${method === "iban" ? "bank IBAN" : "phone number"}.`, scope: "Money transfer" },
      }[type];
      notifyOperation(notification.title, `${notification.description} Mock balance and activity updated.`, false, notification.scope, config.notificationTone);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Operation failed. Please retry."); operationId.current = null; }
    finally { setProcessing(false); }
  }
  return <dialog ref={dialog} aria-labelledby="operation-title" onCancel={event => { event.preventDefault(); if (!processing) onClose(); }} className="fixed inset-0 isolate m-auto w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[24px] border border-blue-300/15 bg-gradient-to-b from-[#101e3b] to-[#080f20] p-5 sm:p-8 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop:bg-[#020617]/75 backdrop:backdrop-blur-lg">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"><div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-blue-400/8 blur-3xl" /></div>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-blue-300/10 bg-blue-400/5 p-3 text-blue-300"><config.Icon size={19} /></div>
        <div><h2 id="operation-title" className="text-sm font-black font-mono tracking-wider uppercase">{config.title}</h2><p className="mt-1 text-[9px] font-mono tracking-wider text-slate-500">{config.subtitle}</p></div>
      </div>
      <button type="button" aria-label="Close dialog" disabled={processing} onClick={onClose} className="p-3 rounded-xl border border-transparent text-slate-400 hover:text-white hover:border-white/10 hover:bg-white/5 transition-all"><X size={18} /></button>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-300/10 bg-[#0a1428] p-4 mt-6">
      <span className="flex items-center gap-2 text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase"><Wallet size={16} className="text-cyan-300/60" />Available balance</span>
      <strong className="text-sm font-mono tabular-nums text-slate-200">{formatMoney(balance)}</strong>
    </div>
    <form onSubmit={submit} className="space-y-5 mt-6">
      {type === "transfer" && <>
        <label className={labelClass}>Recipient name<input autoFocus required maxLength={100} disabled={processing} value={name} onChange={e => setName(e.target.value)} className={inputClass} /></label>
        <div>
          <p id="transfer-method-label" className="mb-2 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Transfer method</p>
          <div role="group" aria-labelledby="transfer-method-label" className="relative isolate grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#060d1b] p-1">
            <div aria-hidden="true" className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-lg border border-cyan-300/15 bg-blue-400/10 transition-transform duration-300 motion-reduce:transition-none ${method === "phone" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"}`} />
            {(["iban", "phone"] as const).map(kind => <button key={kind} type="button" aria-pressed={method === kind} disabled={processing} onClick={() => { setMethod(kind); setRecipient(""); setError(""); }} className={`relative flex min-h-11 items-center justify-center gap-2 rounded-lg text-[10px] font-mono font-bold tracking-wide transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400/50 disabled:opacity-50 ${method === kind ? "text-white" : "text-slate-400 hover:text-slate-200"}`}>
              {kind === "iban" ? <Landmark size={14} /> : <Phone size={14} />}{kind === "iban" ? "BANK IBAN" : "PHONE NUMBER"}
            </button>)}
          </div>
        </div>
        <label className={labelClass}>{method === "iban" ? "Recipient IBAN" : "International phone number"}<input type={method === "phone" ? "tel" : "text"} required maxLength={42} placeholder={method === "phone" ? "+40712345678" : "RO49AAAA1B31007593840000"} disabled={processing} value={recipient} onChange={e => setRecipient(e.target.value)} className={inputClass} /></label>
      </>}
      <label className={labelClass}>Amount (USD)<input autoFocus={type !== "transfer"} inputMode="decimal" required placeholder="0.00" disabled={processing} value={amount} onChange={e => setAmount(e.target.value)} className={inputClass} /></label>
      {type !== "transfer" && <div className="grid grid-cols-4 gap-2">{[50,100,500,1000].map(value => <ActionButton key={value} variant="blue" fullWidth compact disabled={processing} onClick={() => setAmount(String(value))}>{value}</ActionButton>)}</div>}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-300/10 to-transparent" />
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <ActionButton type="submit" variant={config.button} fullWidth disabled={processing || !amount.trim()} icon={processing ? <Loader2 size={16} className="animate-spin" /> : <config.Icon size={16} />} className="min-h-13 tracking-widest">{processing ? "Processing…" : `Confirm ${type}`}</ActionButton>
      <p className="text-center text-[9px] font-mono text-slate-500 tracking-wide">DEMO OPERATION · NO REAL FUNDS MOVED</p>
    </form>
  </dialog>;
}


/** Shared adapter also supports the existing transfers and currencies callers. */
export default function TransferModal({ isOpen = true, type, onClose, balance, onSubmit }: {
  isOpen?: boolean; type: OverviewOperation["type"] | null; onClose: () => void;
  balance?: string; onSubmit?: (operation: OverviewOperation) => Promise<void>;
}) {
  const { user } = useUser();
  const repository = useMemo(() => createOverviewRepository(user?.email ?? "demo"), [user?.email]);
  const [available, setAvailable] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (isOpen && !onSubmit) repository.getSnapshot().then(snapshot => { if (!cancelled) setAvailable(snapshot.summary.liquidity); });
    return () => { cancelled = true; };
  }, [isOpen, onSubmit, repository]);
  if (!isOpen || !type || (balance === undefined && available === null)) return null;
  return <OperationDialog key={type} type={type} onClose={onClose} balance={balance ?? available!} onSubmit={onSubmit ?? (async operation => { const next = await repository.submitOperation(operation); setAvailable(next.summary.liquidity); })} />;
}
