import { decimal, units, usdValue } from "../transfers/engine";
import type { TransferAccount } from "../transfers/contracts";
import type { CreditCommand, CreditDraft, CreditEstimate, CreditLoan, CreditScope, CreditSnapshot, CreditState } from "./contracts";

const zero = BigInt(0), bps = BigInt(10000);
export const isPendingCredit = (status: string) => status === "submitted" || status === "under_review";
export const sumMoney = (values: string[]) => decimal(values.reduce((sum, value) => sum + units(value, 2), zero), 2);
export function outstanding(state: CreditState, scope: CreditScope): string {
  return sumMoney([...state.loans.filter(loan => loan.scope === scope).map(loan => loan.principal), ...state.facilities.filter(facility => facility.scope === scope).map(facility => facility.drawn)]);
}
export function assertScope(state: CreditState, scope: CreditScope) {
  if (scope !== "personal" && !state.businesses.some(business => scope === `business:${business.id}` && business.verified)) throw new Error("You do not have access to this verified business.");
}
export function positive(value: string) {
  const amount = units(value, 2);
  if (amount <= zero || amount > BigInt("100000000000")) throw new Error("Enter an amount above zero and below USD 1 billion.");
  return amount;
}
function roundedRatio(value: bigint, numerator: number, denominator: number) {
  return (value * BigInt(numerator) + BigInt(Math.floor(denominator / 2))) / BigInt(denominator);
}
/** Fixed-rate, monthly reducing-balance illustration. All posted amounts use integer cents. */
export function amortize(amount: string, annualRateBps: number, months: number) {
  positive(amount);
  if (!Number.isInteger(months) || months < 1 || months > 600 || !Number.isInteger(annualRateBps) || annualRateBps < 0 || annualRateBps > 10000) throw new Error("Invalid repayment terms.");
  let balance = units(amount, 2);
  const rate = annualRateBps / 120000;
  const fixed = BigInt(Math.ceil(rate ? Number(balance) * rate / (1 - Math.pow(1 + rate, -months)) : Number(balance) / months));
  const rows: { month: number; principal: string; interest: string; payment: string; balance: string }[] = [];
  for (let month = 1; month <= months && balance > zero; month++) {
    const interest = roundedRatio(balance, annualRateBps, 120000);
    const payment = month === months || fixed > balance + interest ? balance + interest : fixed;
    const principal = payment - interest;
    balance -= principal;
    rows.push({ month, principal: decimal(principal, 2), interest: decimal(interest, 2), payment: decimal(payment, 2), balance: decimal(balance, 2) });
  }
  const total = sumMoney(rows.map(row => row.payment));
  return { rows, payment: rows[0].payment, total, cost: decimal(units(total, 2) - units(amount, 2), 2) };
}
export function dueDate(first: string, offset: number) {
  const date = new Date(`${first}T12:00:00Z`), day = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + offset);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
}
export function loanSchedule(loan: CreditLoan) {
  if (units(loan.principal, 2) === zero) return [];
  return amortize(loan.principal, loan.annual_rate_bps, loan.remaining_months).rows.map((row, index) => ({ ...row, due: dueDate(loan.next_due, index) }));
}
export function collateral(accounts: TransferAccount[]) {
  return accounts.filter(account => ["stock", "crypto"].includes(account.kind) && units(account.available, account.decimals) > zero).map(account => {
    const value = usdValue(units(account.available, account.decimals), account.decimals, account.usd_price, "nearest");
    const ltv = account.kind === "stock" ? 6500 : ["BTC", "ETH"].includes(account.asset) ? 4000 : 0;
    return { id: account.id, symbol: account.asset, name: account.name, value: decimal(value, 2), max_ltv_bps: ltv, capacity: decimal(value * BigInt(ltv) / bps, 2) };
  });
}
function uniqueIds(ids: string[]) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 100 || new Set(ids).size !== ids.length) throw new Error("Select one or more distinct eligible items.");
}
function purpose(value: string) {
  if (typeof value !== "string" || value.trim().length < 5 || value.trim().length > 500) throw new Error("Describe the purpose in 5–500 characters.");
}
export function estimateCredit(state: CreditState, assets: CreditSnapshot["collateral"], scope: CreditScope, draft: CreditDraft, at: string): CreditEstimate {
  assertScope(state, scope);
  if (draft.kind === "term") {
    purpose(draft.purpose);
    const product = state.products.find(item => item.id === draft.product_id && item.segment === (scope === "personal" ? "personal" : "business"));
    if (!product) throw new Error("Product is unavailable for this account.");
    const amount = positive(draft.amount);
    if (amount < units(product.min_amount, 2) || amount > units(product.max_amount, 2)) throw new Error("Choose an amount within the loan limits.");
    if (!Number.isInteger(draft.months) || draft.months < product.min_months || draft.months > product.max_months) throw new Error("Term is outside product limits.");
    const calculation = amortize(draft.amount, product.annual_rate_bps, draft.months);
    return { amount: decimal(amount, 2), currency: "USD", annual_rate_bps: product.annual_rate_bps, months: draft.months, payment: calculation.payment, total: calculation.total, cost: calculation.cost, explanation: "Fixed-rate monthly illustration. Fees, insurance and underwriting are excluded; this is not an approved offer or a regulatory APR." };
  }
  if (draft.kind === "lombard") {
    if (scope !== "personal") throw new Error("Lombard applications require a personal account.");
    purpose(draft.purpose); uniqueIds(draft.asset_ids);
    const available = assets;
    const selected = draft.asset_ids.map(id => available.find(asset => asset.id === id && asset.max_ltv_bps > 0));
    if (selected.some(asset => !asset)) throw new Error("A selected asset is no longer eligible.");
    const capacity = units(sumMoney(selected.map(asset => asset!.capacity)), 2);
    const committed = state.applications.filter(application => application.scope === scope && isPendingCredit(application.status) && application.draft.kind === "lombard");
    if (committed.some(application => application.draft.kind === "lombard" && application.draft.asset_ids.some(id => draft.asset_ids.includes(id)))) throw new Error("A selected asset is already included in a pending Lombard application.");
    if (positive(draft.amount) > capacity) throw new Error("Amount exceeds the selected assets' borrowing capacity.");
    if (!Number.isInteger(draft.months) || draft.months < state.policy.lombard_min_months || draft.months > state.policy.lombard_max_months) throw new Error("Choose a term within the Lombard product limits.");
    const annual = Math.max(0, state.policy.lombard_base_rate_bps - state.discounts.filter(item => item.achieved).reduce((sum, item) => sum + item.discount_bps, 0));
    const interest = roundedRatio(units(draft.amount, 2), annual * draft.months, 120000);
    return { amount: draft.amount, currency: "USD", annual_rate_bps: annual, months: draft.months, payment: null, total: decimal(units(draft.amount, 2) + interest, 2), cost: decimal(interest, 2), explanation: "Illustrative interest-only secured credit; principal is due at maturity. Collateral is revalued and reserved only after lender approval. Market falls can trigger additional collateral or liquidation." };
  }
  if (scope === "personal") throw new Error("This request requires a verified business.");
  if (draft.kind === "revenue") {
    purpose(draft.purpose); uniqueIds(draft.source_ids);
    const sources = draft.source_ids.map(id => state.sources.find(source => source.id === id && source.scope === scope && source.status === "connected"));
    if (sources.some(source => !source)) throw new Error("Only connected revenue sources are eligible.");
    const pending = state.applications.filter(application => application.scope === scope && isPendingCredit(application.status) && application.draft.kind === "revenue");
    const used = units(sumMoney(pending.map(application => application.estimate.amount)), 2);
    const capacity = units(sumMoney(sources.map(source => source!.verified_limit)), 2);
    const amount = positive(draft.amount);
    if (amount < units(state.policy.revenue_min_amount, 2) || amount + used > capacity) throw new Error("Funding exceeds the connected revenue capacity remaining after pending requests.");
    if (!Number.isInteger(draft.sales_share_bps) || draft.sales_share_bps < state.policy.revenue_min_share_bps || draft.sales_share_bps > state.policy.revenue_max_share_bps || draft.sales_share_bps % 100 !== 0) throw new Error("Choose a sales share within product limits, in 1% increments.");
    const factorBps = draft.sales_share_bps > state.policy.revenue_factor_threshold_bps ? state.policy.revenue_low_factor_bps : state.policy.revenue_high_factor_bps;
    const total = roundedRatio(amount, factorBps, 10000);
    return { amount: decimal(amount, 2), currency: "USD", annual_rate_bps: null, months: null, payment: null, total: decimal(total, 2), cost: decimal(total - amount, 2), explanation: `Factor ${(factorBps / 10000).toFixed(2)}×; ${(draft.sales_share_bps / 100).toFixed(0)}% of daily sales. Repayment duration varies with actual revenue. The factor fee is not an APR.` };
  }
  if (draft.kind === "factoring") {
    uniqueIds(draft.invoice_ids);
    const invoices = draft.invoice_ids.map(id => state.invoices.find(invoice => invoice.id === id && invoice.scope === scope && invoice.status === "eligible" && invoice.due > at.slice(0, 10)));
    if (invoices.some(invoice => !invoice)) throw new Error("Select eligible, unpaid invoices that are not overdue or already requested.");
    const currency = invoices[0]!.currency;
    if (invoices.some(invoice => invoice!.currency !== currency)) throw new Error("Select invoices with the same currency.");
    const gross = invoices.reduce((sum, invoice) => sum + units(invoice!.amount, 2) * BigInt(invoice!.advance_bps) / bps, zero);
    const fee = invoices.reduce((sum, invoice) => sum + roundedRatio(units(invoice!.amount, 2), invoice!.fee_bps, 10000), zero);
    return { amount: decimal(gross - fee, 2), currency, annual_rate_bps: null, months: null, payment: null, total: null, cost: decimal(fee, 2), explanation: `Net advance after fees. Invoices stay in ${currency}; no FX conversion is assumed. Debtor verification and lender approval are required before funding.` };
  }
  if (draft.kind === "pause") {
    const loan = state.loans.find(item => item.id === draft.loan_id && item.scope === scope && units(item.principal, 2) > zero);
    if (!loan || loan.pauses_used >= 2 || loan.next_due <= at.slice(0, 10)) throw new Error("This loan is not eligible for a payment pause.");
    if (state.applications.some(application => application.scope === scope && isPendingCredit(application.status) && application.draft.kind === "pause" && application.draft.loan_id === loan.id)) throw new Error("A payment pause is already pending for this loan.");
    return { amount: "0.00", currency: "USD", annual_rate_bps: null, months: null, payment: null, total: null, cost: null, explanation: "A review request only. Continue paying the current schedule until the lender confirms revised dates, interest and fees. Up to two pauses per agreement, subject to approval." };
  }
  if (draft.kind === "refinance") {
    purpose(draft.purpose); positive(draft.amount);
    if (!["USD", "EUR", "GBP", "JPY"].includes(draft.currency)) throw new Error("Unsupported external debt currency.");
    return { amount: draft.amount, currency: draft.currency, annual_rate_bps: null, months: null, payment: null, total: null, cost: null, explanation: "External debt review. No exchange rate, savings or payoff is guaranteed. Provide lender and debt details in the purpose; the lender will request supporting documents." };
  }
  throw new Error("Unsupported credit request.");
}
/** Validate and apply everything before the wallet journal writes a single event. */
export function applyCredit(state: CreditState, accounts: TransferAccount[], command: CreditCommand, key: string, at: string) {
  assertScope(state, command.scope);
  if (command.expected_version !== state.version) throw new Error("Credit data changed. Refresh and review the action again.");
  const next = structuredClone(state);
  let delta = zero, amount: string | null = null, description: string;
  if (command.action === "apply") {
    if (state.applications.filter(application => isPendingCredit(application.status)).length >= 50) throw new Error("Please resolve pending applications before submitting more.");
    const estimate = estimateCredit(state, collateral(accounts), command.scope, command.draft, at);
    next.applications.unshift({ id: `application-${key}`, scope: command.scope, draft: structuredClone(command.draft), estimate, status: "submitted", created_at: at });
    if (command.draft.kind === "factoring") for (const invoice of next.invoices) if (command.draft.invoice_ids.includes(invoice.id)) invoice.status = "requested";
    description = `${command.draft.kind} request submitted for review`;
  } else if (command.action === "cancel") {
    const application = next.applications.find(item => item.id === command.application_id && item.scope === command.scope && isPendingCredit(item.status));
    if (!application) throw new Error("Application can no longer be cancelled.");
    application.status = "cancelled";
    if (application.draft.kind === "factoring") for (const invoice of next.invoices) if (application.draft.invoice_ids.includes(invoice.id)) invoice.status = "eligible";
    description = "Application cancelled";
  } else if (command.action === "draw" || command.action === "repay_facility") {
    const facility = next.facilities.find(item => item.id === command.facility_id && item.scope === command.scope);
    if (!facility) throw new Error("Facility is unavailable for this account.");
    const value = positive(command.amount), drawn = units(facility.drawn, 2);
    if (command.action === "draw" && (!facility.enabled || value + drawn > units(facility.limit, 2))) throw new Error("Draw exceeds the enabled facility's available limit.");
    if (command.action === "repay_facility" && value > drawn) throw new Error("Repayment exceeds outstanding principal.");
    delta = command.action === "draw" ? value : -value;
    facility.drawn = decimal(drawn + delta, 2); amount = decimal(value, 2);
    description = `${facility.name}: ${command.action === "draw" ? "funds drawn" : "principal repaid"}`;
  } else if (command.action === "repay_loan") {
    const loan = next.loans.find(item => item.id === command.loan_id && item.scope === command.scope);
    const value = positive(command.amount);
    if (!loan || value > units(loan.principal, 2)) throw new Error("Repayment exceeds outstanding principal.");
    loan.principal = decimal(units(loan.principal, 2) - value, 2); delta = -value; amount = decimal(value, 2);
    description = `${loan.name}: extra principal repayment`;
  } else if (command.action === "buffer_toggle") {
    if (command.scope !== "personal" || typeof command.enabled !== "boolean") throw new Error("Invalid buffer settings.");
    const buffer = next.facilities.find(facility => facility.id === "buffer")!;
    if (!command.enabled && units(buffer.drawn, 2) > zero) throw new Error("Repay the buffer before disabling it.");
    buffer.enabled = command.enabled; description = `Buffer shield ${command.enabled ? "enabled" : "disabled"}`;
  } else if (command.action === "matching") {
    if (command.scope === "personal" || typeof command.enabled !== "boolean" || typeof command.anonymous !== "boolean") throw new Error("Invalid business matching settings.");
    const preference = { enabled: command.enabled, anonymous: command.anonymous, scope: command.scope };
    next.matching = [...next.matching.filter(item => item.scope !== command.scope), preference];
    description = command.enabled ? "Capital matching enabled" : "Capital matching disabled";
  } else throw new Error("Unsupported credit operation.");
  if (command.scope !== "personal") {
    const business = next.businesses.find(item => command.scope === `business:${item.id}`)!;
    const cash = units(business.cash, 2) + delta;
    if (cash < zero) throw new Error("Insufficient business USD balance.");
    business.cash = decimal(cash, 2); delta = zero;
  } else if (units(accounts.find(account => account.id === "account-USD")!.available, 2) + delta < zero) throw new Error("Insufficient personal USD balance.");
  next.version++;
  next.activity.unshift({ id: key, scope: command.scope, action: command.action, description, amount, at });
  return { credit: next, personal_delta: delta };
}
export function projectCredit(state: CreditState, accounts: TransferAccount[], at: string, funds: CreditSnapshot["funds"]): CreditSnapshot {
  return { ...structuredClone(state), schema_version: 1, as_of: at, mode: "demo", personal_cash: accounts.find(account => account.id === "account-USD")!.available, collateral: collateral(accounts), funds: structuredClone(funds) };
}
