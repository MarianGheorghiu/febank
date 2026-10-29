"use client";
import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import type { BillingCycle, PlanId, Subscription, SubscriptionAction, SubscriptionCommand, SubscriptionState, SubscriptionCustomer, SubscriptionPlan } from "@/app/lib/types/admin/subscriptions";
import { money } from "@/app/lib/subscriptions/engine";
import { AuditSelect, auditFieldClass, auditTextareaClass } from "../audit/presentation";
import { ActionButton } from "../../dashboard/ActionButton";
import CustomerPicker from "../../CustomerPicker";
export const actionLabels: Record<SubscriptionAction, string> = { ASSIGN: "Assign subscription", CHANGE_PLAN: "Schedule plan change", SUSPEND: "Suspend benefits", RESUME: "Resume benefits", CANCEL_AT_RENEWAL: "Cancel at renewal", KEEP_ACTIVE: "Withdraw cancellation", RETRY_PAYMENT: "Request payment retry" };
export interface SubscriptionIntent { action: SubscriptionAction; subscription?: Subscription; invoice_id?: string }
const descriptions: Record<SubscriptionAction, string> = {
  ASSIGN: "Assign a plan to an eligible customer. Demo assignment records an entitlement only; billing and payment collection are not executed in this demo. First renewal is anchored to UTC day 1.",
  CHANGE_PLAN: "The new plan and price apply at the next renewal. Current entitlements and issued invoices remain under the existing plan. No prorated debit is made.",
  SUSPEND: "Suspend subscription benefits immediately. This does not freeze the bank account, forgive debt or stop the billing obligation.",
  RESUME: "Restore benefits. An overdue invoice keeps the subscription past due; this operation does not collect money.",
  CANCEL_AT_RENEWAL: "Record cancellation at the end of the current billing period and clear any pending plan change. Existing debt is retained. The demo does not execute future renewals.",
  KEEP_ACTIVE: "Remove the scheduled cancellation and retain the current plan for renewal.",
  RETRY_PAYMENT: "Queue one demo retry request for this unpaid invoice. No debit is executed and the invoice remains unpaid until a payment result is received from payment processing.",
};
export default function SubscriptionOperationDialog({ intent, state, customers, plans, onClose, onConfirm }: { intent: SubscriptionIntent; state: SubscriptionState; customers: SubscriptionCustomer[]; plans: SubscriptionPlan[]; onClose: () => void; onConfirm: (command: SubscriptionCommand) => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null); const titleId = useId();
  const [requestId] = useState(() => crypto.randomUUID());
  const [customer, setCustomer] = useState("");
  const [plan, setPlan] = useState<PlanId>(intent.subscription?.plan_id ?? "PREMIUM");
  const [cycle, setCycle] = useState<BillingCycle>(intent.subscription?.cycle ?? "MONTHLY");
  const [reason, setReason] = useState(""); const [review, setReview] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current; const focus = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; element?.showModal();
    return () => { element?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  const selectedPlan = plans.find(p => p.id === plan)!;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return; setError("");
    if (reason.trim().length < 10 || reason.trim().length > 500) { setError("Enter an operational reason of 10–500 characters."); return; }
    if (intent.action === "ASSIGN" && !customers.some(c => c.id === customer && c.eligible && !state.subscriptions.some(s => s.customer_id === c.id && s.status !== "CANCELED"))) { setError("Select an eligible customer without an open subscription."); return; }
    if (intent.action === "CHANGE_PLAN" && plan === intent.subscription?.plan_id && cycle === intent.subscription?.cycle) { setError("Select a different plan or billing cycle."); return; }
    if (!review) { setReview(true); return; }
    setBusy(true);
    try {
      await onConfirm({ request_id: requestId, action: intent.action, subscription_id: intent.subscription?.id, expected_version: intent.subscription?.version, customer_id: customer, plan_id: plan, cycle, invoice_id: intent.invoice_id, reason }); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Operation failed."); } finally { setBusy(false); }
  };
  return <dialog ref={dialog} aria-labelledby={titleId} onClick={event => { if (busy || event.target !== event.currentTarget) return; const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); }} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto scrollbar-thin rounded-2xl border border-white/10 bg-gradient-to-b from-[#101d35] to-[#080f20] p-5 sm:p-6 font-mono text-white backdrop:bg-black/80">
    <form onSubmit={submit} className="space-y-5"><div className="flex items-start justify-between gap-3"><h2 id={titleId} className="text-lg font-bold">{review ? "Review & confirm" : actionLabels[intent.action]}</h2><ActionButton variant="blue" autoWidth type="button" disabled={busy} aria-label="Close operation" icon={<X size={14}/>} onClick={onClose}></ActionButton></div>
      <p className="text-xs leading-relaxed text-slate-400">{descriptions[intent.action]}</p>
      {intent.action === "ASSIGN" && !customers.some(c => c.eligible && !state.subscriptions.some(s => s.customer_id === c.id && s.status !== "CANCELED")) && <p role="status" className="text-xs text-amber-200">No eligible customers available. Verify a customer in User Management before assigning a plan.</p>}
      {intent.subscription && <p className="break-all rounded-lg border border-cyan-500/20 p-3 text-xs text-cyan-200">{intent.subscription.id} · {intent.subscription.plan_id} · {intent.subscription.status}<br/><span className="text-slate-400">Renewal: {intent.subscription.period_end.slice(0, 10)} UTC</span></p>}
      {!review && <>
        {intent.action === "ASSIGN" && <CustomerPicker label="Eligible customer" customers={customers.filter(c => c.eligible && !state.subscriptions.some(s => s.customer_id === c.id && s.status !== "CANCELED"))} value={customer} onChange={setCustomer} emptyMessage="No eligible customers match. Search by name, email or customer ID. Customers must be active, verified and without an open subscription."/>}
        {["ASSIGN", "CHANGE_PLAN"].includes(intent.action) && <div className="grid gap-3 sm:grid-cols-2"><label className={auditFieldClass}>Plan<AuditSelect aria-label="Subscription plan" value={plan} onChange={e => setPlan(e.target.value as PlanId)}>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</AuditSelect></label><label className={auditFieldClass}>Billing cycle<AuditSelect aria-label="Billing cycle" value={cycle} onChange={e => setCycle(e.target.value as BillingCycle)}><option value="MONTHLY">Monthly</option><option value="ANNUAL">Annual</option></AuditSelect></label></div>}
        <label className={auditFieldClass}>Operational reason<textarea required minLength={10} maxLength={500} rows={3} className={auditTextareaClass} value={reason} onChange={e => setReason(e.target.value)} placeholder="Case reference and reason for this change…"/></label>
      </>}
      {review && <div className="space-y-3 rounded-lg border border-amber-500/30 p-4 text-xs"><p className="text-amber-300">{actionLabels[intent.action]}</p>{intent.action === "ASSIGN" && <p className="break-words">Customer: {customers.find(c => c.id === customer)?.name} · {customers.find(c => c.id === customer)?.email}</p>}{["ASSIGN", "CHANGE_PLAN"].includes(intent.action) && <p>{plan} · {cycle} · {money(cycle === "ANNUAL" ? selectedPlan.annual_minor : selectedPlan.monthly_minor)} / period</p>}<p className="break-words text-slate-300">Reason: {reason}</p><p className="text-slate-500">The operation and its before/after evidence are saved together.</p></div>}
      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2"><ActionButton variant="blue" autoWidth type="button" disabled={busy} onClick={() => review ? setReview(false) : onClose()}>{review ? "Back" : "Cancel"}</ActionButton><ActionButton autoWidth type="submit" disabled={busy || (intent.action === "ASSIGN" && !customer)} variant={intent.action === "SUSPEND" || intent.action === "CANCEL_AT_RENEWAL" ? "rose" : "cyan"}>{busy ? "Saving…" : review ? "Confirm operation" : "Review operation"}</ActionButton></div>
    </form>
  </dialog>;
}
