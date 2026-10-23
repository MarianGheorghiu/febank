"use client";
import { useState } from "react";
import { Calculator, ArrowRight, Check } from "lucide-react";
import { ActionButton } from "../dashboard/ActionButton";
import CardSelect from "../admin/cards/CardSelect";
import { socialField, socialLabel } from "../friends/SocialDialog";
import type { CreditDraft, CreditScope, CreditSnapshot } from "@/app/lib/loans/contracts";
import { amortize } from "@/app/lib/loans/engine";
import { CreditPanel, creditMoney, creditRate } from "./CreditUI";

export default function CreditCalculator({ snapshot, scope, onApply }: { snapshot: CreditSnapshot; scope: CreditScope; onApply: (draft: CreditDraft) => void }) {
  const products = snapshot.products.filter(product => product.segment === (scope === "personal" ? "personal" : "business"));
  const [productId, setProductId] = useState(products.find(product => product.id.endsWith("PERSONAL"))?.id ?? products[0]?.id ?? "");
  const product = products.find(product => product.id === productId) ?? products[0];
  const [amount, setAmount] = useState(product?.min_amount.replace(/\.00$/, "") ?? ""), [months, setMonths] = useState(product?.max_months ?? 12);
  if (!product) return <CreditPanel title="Loan calculator" icon={Calculator}><p className="text-sm text-slate-300">There are no loans available for this account yet.</p></CreditPanel>;
  const numeric = Number(amount), min = Number(product.min_amount), max = Number(product.max_amount);
  const valid = /^\d+(\.\d{0,2})?$/.test(amount) && numeric >= min && numeric <= max;
  // Keep the illustration stable while the customer clears or edits the amount.
  const illustrated = Math.min(max, Math.max(min, Number.isFinite(numeric) ? numeric : min));
  const estimate = amortize(illustrated.toFixed(2), product.annual_rate_bps, months);
  const draft: CreditDraft = { kind: "term", product_id: product.id, amount: numeric.toFixed(2), months, purpose: "" };
  const amountHelp = amount === "" ? "Enter the amount you would like to borrow." : !valid ? `Choose an amount from ${creditMoney(min)} to ${creditMoney(max)}.` : `From ${creditMoney(min)} to ${creditMoney(max)}.`;
  return <div data-credit-calculator className="scroll-mt-5"><CreditPanel title={scope === "personal" ? "Personal financing" : "Business financing"} icon={Calculator} tone="purple">
    <p className="mb-5 text-sm text-slate-300">Choose a loan, set your amount and see your monthly payment.</p>
    <div role="group" aria-label="Loan product" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{products.map(item => <button key={item.id} aria-pressed={item.id === product.id} onClick={() => { setProductId(item.id); setAmount(item.min_amount.replace(/\.00$/, "")); setMonths(item.max_months); }} className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs capitalize focus-visible:outline-2 focus-visible:outline-cyan-300 ${item.id === product.id ? "border-purple-300/40 bg-purple-300/10 text-purple-100" : "border-white/10 bg-white/[.025] text-slate-300 hover:border-white/25"}`}>{item.id === product.id && <Check size={13} className="shrink-0" />}{item.name}</button>)}</div>
    <div className="grid min-w-0 items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5"><label className={socialLabel}>How much do you need? <span className="sr-only">USD</span><div className="relative"><span aria-hidden="true" className="absolute top-3.5 left-4 text-sm text-slate-400">USD</span><input data-loan-amount type="text" inputMode="decimal" autoComplete="off" aria-invalid={amount !== "" && !valid} aria-describedby="loan-amount-help" className={`${socialField} pl-14 tabular-nums`} value={amount} onChange={event => { const value = event.target.value.replaceAll(",", ""); if (/^\d{0,10}(\.\d{0,2})?$/.test(value)) setAmount(value); }} onBlur={() => { if (valid) setAmount(numeric.toFixed(2)); }} /></div></label>
        <input aria-label="Loan amount slider" type="range" min={min} max={max} step={product.step_amount} value={illustrated} onChange={event => setAmount(event.target.value)} className="min-h-7 w-full cursor-pointer accent-purple-300" />
        <p id="loan-amount-help" role="status" className={`min-h-10 text-xs leading-relaxed ${amount !== "" && !valid ? "text-amber-200" : "text-slate-400"}`}>{amountHelp}</p>
        <label className={socialLabel}>How long would you like to repay?<CardSelect value={months} onChange={event => setMonths(Number(event.target.value))}>{Array.from({ length: product.max_months - product.min_months + 1 }, (_, index) => product.min_months + index).filter(value => value === product.min_months || value === product.max_months || value % 12 === 0).map(value => <option key={value} value={value}>{value % 12 === 0 ? `${value / 12} ${value === 12 ? "year" : "years"}` : `${value} months`}</option>)}</CardSelect></label>
      </div>
      <div className="flex min-w-0 flex-col rounded-2xl border border-purple-300/15 bg-purple-300/5 p-4 sm:p-5"><p className="text-xs text-slate-300">Your estimated monthly payment</p><p aria-live="polite" className="mt-2 min-h-11 break-words text-3xl leading-tight font-semibold tracking-tight tabular-nums text-white sm:text-4xl">{creditMoney(estimate.payment)}</p><p className="mt-2 min-h-9 text-xs text-slate-400">{valid ? `${creditMoney(illustrated)} over ${months} months` : "Preview based on the nearest available loan amount"}</p><dl className="mt-4 space-y-3 border-t border-white/10 pt-4 text-xs"><div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">Annual interest rate</dt><dd className="font-medium tabular-nums">{creditRate(product.annual_rate_bps)}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">Total interest</dt><dd className="font-medium tabular-nums">{creditMoney(estimate.cost)}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">Total to repay</dt><dd className="font-medium tabular-nums">{creditMoney(estimate.total)}</dd></div></dl>
        <ActionButton className="mt-5" variant="purple" fullWidth disabled={!valid} icon={<ArrowRight size={15} />} onClick={() => onApply(draft)}>Continue</ActionButton><p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">Review your details before sending. No commitment at this step.</p>
      </div>
    </div><details className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">How is this calculated?</summary><p className="mt-3 leading-relaxed">This estimate assumes a fixed interest rate and monthly payments. Fees and insurance are excluded. Your lender confirms eligibility, final costs and APR before you accept a loan.</p></details>
  </CreditPanel></div>;
}
