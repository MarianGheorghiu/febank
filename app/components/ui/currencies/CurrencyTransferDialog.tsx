"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import SocialDialog from "../friends/SocialDialog";
import TransferForm from "../transfers/TransferForm";
import { createTransferRepository } from "@/app/lib/transfers/repository";
import type { TransferSnapshot } from "@/app/lib/transfers/contracts";
export default function CurrencyTransferDialog({ customer, onClose, onComplete }: { customer: string; onClose: () => void; onComplete: () => void }) {
  const repository = useMemo(() => createTransferRepository(customer), [customer]);
  const [snapshot, setSnapshot] = useState<TransferSnapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { const controller = new AbortController(); repository.getSnapshot(controller.signal).then(value => { if (!controller.signal.aborted) { setSnapshot(value); setError(""); } }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load accounts."); }); return () => controller.abort(); }, [repository, attempt]);
  return <SocialDialog title="Quick transfer" subtitle="Send from your available wallet balances" icon={ArrowUpRight} busy={busy} onClose={onClose}>{error ? <div role="alert" className="space-y-3 text-sm text-rose-300"><p>{error}</p><button className="min-h-11 cursor-pointer underline" onClick={() => setAttempt(n => n + 1)}>Retry</button></div> : snapshot ? <TransferForm embedded snapshot={snapshot} repository={repository} blocked={false} onBusyChange={setBusy} onUpdate={() => { onComplete(); onClose(); }} /> : <p role="status" className="py-6 text-sm text-slate-400">Loading transfer accounts…</p>}</SocialDialog>;
}
