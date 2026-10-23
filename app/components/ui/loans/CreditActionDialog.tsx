"use client";
import { useRef, useState } from "react";
import { Coins } from "lucide-react";
import type { CreditCommand, CreditRepository, CreditSnapshot } from "@/app/lib/loans/contracts";
import { estimateCredit } from "@/app/lib/loans/engine";
import SocialDialog, { socialField, socialLabel } from "../friends/SocialDialog";
import CardSelect from "../admin/cards/CardSelect";
import { ActionButton } from "../dashboard/ActionButton";
import { button } from "../stocks/StockUI";
import { CreditInfo, CreditStat, creditMoney, creditRate } from "./CreditUI";

export default function CreditActionDialog({ initialCommand, snapshot, repository, onClose, onComplete }: { initialCommand: CreditCommand; snapshot: CreditSnapshot; repository: CreditRepository; onClose: () => void; onComplete: (next: CreditSnapshot) => void }) {
  const [command, setCommand] = useState(initialCommand), [busy, setBusy] = useState(false), [error, setError] = useState(""), [consent, setConsent] = useState(false);
  const lock = useRef(false), pending = useRef<{ fingerprint: string; key: string } | null>(null);
  const application = command.action === "apply" ? command.draft : null;
  const title = application ? `${application.kind === "term" ? "Loan" : application.kind === "lombard" ? "Secured credit" : application.kind === "revenue" ? "Revenue financing" : application.kind === "factoring" ? "Invoice financing" : application.kind === "pause" ? "Payment pause" : "External debt"} request` : command.action === "draw" ? "Draw approved funds" : command.action.startsWith("repay") ? "Make a repayment" : command.action === "cancel" ? "Cancel application" : command.action === "matching" ? "Capital matching preferences" : "Buffer shield settings";
  const business = snapshot.businesses.find(item => command.scope === `business:${item.id}`);
  const cash = command.scope === "personal" ? snapshot.personal_cash : business?.cash ?? "0.00";
  const purposeReady = !application || !("purpose" in application) || (application.purpose.trim().length >= 5 && application.purpose.trim().length <= 500);
  let estimate, validation = "";
  if (application) {
    try { estimate = estimateCredit(snapshot, snapshot.collateral, command.scope, "purpose" in application ? { ...application, purpose: purposeReady ? application.purpose : "Loan estimate" } : application, snapshot.as_of); } catch (cause) { validation = cause instanceof Error ? cause.message : "Check your application."; }
  }
  const facility = "facility_id" in command ? snapshot.facilities.find(item => item.id === command.facility_id) : null;
  const loan = "loan_id" in command ? snapshot.loans.find(item => item.id === command.loan_id) : null;
  const max = command.action === "draw" && facility ? Number(facility.limit) - Number(facility.drawn) : command.action === "repay_facility" && facility ? Math.min(Number(cash), Number(facility.drawn)) : command.action === "repay_loan" && loan ? Math.min(Number(cash), Number(loan.principal)) : undefined;
  const changeAmount = (amount: string) => setCommand(previous => previous.action === "draw" || previous.action === "repay_loan" || previous.action === "repay_facility" ? { ...previous, amount } : previous.action === "apply" && previous.draft.kind === "refinance" ? { ...previous, draft: { ...previous.draft, amount } } : previous);
  async function submit() {
    if (lock.current || !consent || validation || !purposeReady) return;
    lock.current = true; setBusy(true); setError("");
    const fingerprint = JSON.stringify(command);
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, key: crypto.randomUUID() };
    try { onComplete(await repository.execute(command, pending.current.key)); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to complete the credit operation."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <SocialDialog title={title} subtitle={`${command.scope === "personal" ? "Personal account" : business?.name ?? "Business"} · ${snapshot.mode === "demo" ? "Demo workspace" : "Credit service"}`} icon={Coins} busy={busy} onClose={onClose}><form className="space-y-5" onSubmit={event => { event.preventDefault(); void submit(); }}><fieldset disabled={busy} className="space-y-5">
    {!application && <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-sm leading-relaxed text-slate-200">Available {command.scope === "personal" ? "personal" : "business"} cash: <strong>{creditMoney(cash)}</strong>{facility && <p className="mt-2 text-xs text-slate-300">{facility.name} · annual interest {creditRate(facility.annual_rate_bps)} · outstanding {creditMoney(facility.drawn)}</p>}{loan && <p className="mt-2 text-xs text-slate-300">{loan.name} · principal remaining {creditMoney(loan.principal)}</p>}</div>}
    {(command.action === "draw" || command.action === "repay_loan" || command.action === "repay_facility") && <label className={socialLabel}>Amount (USD)<input required type="number" inputMode="decimal" className={socialField} min="0.01" max={max} step="0.01" value={command.amount} onChange={event => changeAmount(event.target.value)} /><span className="text-xs text-slate-400">Maximum {creditMoney(max ?? 0)}</span></label>}
    {application?.kind === "refinance" && <div className="grid gap-3 sm:grid-cols-2"><label className={socialLabel}>External debt amount<input required type="number" min="0.01" step="0.01" className={socialField} value={application.amount} onChange={event => changeAmount(event.target.value)} /></label><label className={socialLabel}>Debt currency<CardSelect value={application.currency} onChange={event => setCommand(previous => previous.action === "apply" && previous.draft.kind === "refinance" ? { ...previous, draft: { ...previous.draft, currency: event.target.value as typeof application.currency } } : previous)}>{["USD", "EUR", "GBP", "JPY"].map(currency => <option key={currency}>{currency}</option>)}</CardSelect></label></div>}
    {application && "purpose" in application && <label className={socialLabel}>{application.kind === "refinance" ? "Current lender, debt details and refinancing goal" : "What is the loan for?"}<textarea required minLength={5} maxLength={500} rows={3} className={socialField} value={application.purpose} onChange={event => setCommand(previous => previous.action === "apply" && "purpose" in previous.draft ? { ...previous, draft: { ...previous.draft, purpose: event.target.value } } : previous)} /></label>}
    {application?.kind === "term" && <p className="text-sm text-slate-300">Product: <span className="capitalize">{snapshot.products.find(product => product.id === application.product_id)?.name}</span> · {application.months} monthly payments</p>}
    {application?.kind === "lombard" && <p className="text-sm text-slate-300">Selected collateral: {snapshot.collateral.filter(asset => application.asset_ids.includes(asset.id)).map(asset => asset.symbol).join(", ")} · {application.months} months</p>}
    {application?.kind === "revenue" && <p className="text-sm text-slate-300">Revenue sources: {snapshot.sources.filter(source => application.source_ids.includes(source.id)).map(source => source.name).join(", ")}</p>}
    {application?.kind === "factoring" && <p className="text-sm text-slate-300">Invoices: {snapshot.invoices.filter(invoice => application.invoice_ids.includes(invoice.id)).map(invoice => invoice.reference).join(", ")}</p>}
    {application?.kind === "pause" && <p className="text-sm text-slate-300">Agreement: {snapshot.loans.find(item => item.id === application.loan_id)?.name}</p>}
    {estimate && <><div className="grid grid-cols-2 gap-3"><CreditStat label={application?.kind === "factoring" ? "Net advance requested" : "Amount requested"} value={creditMoney(estimate.amount, estimate.currency)} /><CreditStat label="Estimated cost" value={estimate.cost !== null ? creditMoney(estimate.cost, estimate.currency) : "Subject to review"} />{estimate.annual_rate_bps !== null && <CreditStat label="Annual interest rate" value={creditRate(estimate.annual_rate_bps)} />}{estimate.payment && <CreditStat label="Monthly payment" value={creditMoney(estimate.payment, estimate.currency)} />}{estimate.total && <CreditStat label="Total to repay" value={creditMoney(estimate.total, estimate.currency)} />}</div><CreditInfo title="Costs & conditions">{estimate.explanation}</CreditInfo></>}
    {command.action === "draw" && <p className="text-sm leading-relaxed text-slate-300">This increases your outstanding credit and credits funds to the {command.scope === "personal" ? "shared personal USD wallet" : "selected business USD account"}.</p>}
    {command.action.startsWith("repay") && <p className="text-sm leading-relaxed text-slate-300">This debits the selected account and reduces outstanding principal. This is an extra principal repayment; accrued interest, fees and scheduled installments are handled separately. The future payment illustration will be recalculated.</p>}
    {command.action === "cancel" && <p className="text-sm text-slate-300">Cancel this pending request. Any invoices held for this request become available again.</p>}
    {command.action === "buffer_toggle" && <p className="text-sm text-slate-300">{command.enabled ? "Enable" : "Disable"} manual access to your approved buffer facility. Automatic overdraft coverage is not configured by this control.</p>}
    {command.action === "matching" && <p className="text-sm leading-relaxed text-slate-300">{command.enabled ? `Enable matching using ${command.anonymous ? "an anonymous" : "an identifiable"} business profile.` : "Disable capital matching."} {snapshot.mode === "demo" ? "Demo suggestions use local fixtures. No data is sent to investors." : "Your preference is saved to the credit service. Investor introductions require a separate request."}</p>}
    {snapshot.mode === "demo" && <p className="text-xs leading-relaxed text-amber-200">Demo mode · saved for this browser session. No real money is moved.</p>}
    {validation && <p role="status" className="text-xs text-amber-200">{validation}</p>}
    <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-200"><input required type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-cyan-300" /><span>{application ? "I have reviewed the details and understand that this request requires lender approval." : "I have reviewed the account, amount and effect of this action."}</span></label>
  </fieldset>{error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/5 p-3 text-sm text-rose-200">{error}</p>}<div className="flex flex-wrap justify-end gap-3"><button type="button" className={button} disabled={busy} onClick={onClose}>Close</button><ActionButton type="submit" variant="cyan" disabled={busy || !consent || !!validation || !purposeReady}>{busy ? "Saving…" : application ? "Send request" : "Confirm"}</ActionButton></div></form></SocialDialog>;
}
