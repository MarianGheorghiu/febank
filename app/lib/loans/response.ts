import type { CreditSnapshot } from "./contracts";
import { units } from "../transfers/engine";
/** Reject malformed remote snapshots before displaying or using financial values. */
export function validateCreditSnapshot(input: unknown): CreditSnapshot {
  const fail = (): never => { throw new Error("Invalid credit service response."); };
  const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : fail();
  const text = (value: unknown) => typeof value === "string" && value.length > 0 && value.length <= 1000 ? value : fail();
  const integer = (value: unknown, min = 0, max = 1000000) => typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max ? value : fail();
  const money = (value: unknown) => { const str = text(value); if (!/^\d{1,12}\.\d{2}$/.test(str)) fail(); units(str, 2); };
  const bool = (value: unknown) => typeof value === "boolean" ? value : fail();
  const date = (value: unknown) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(text(value)) || !Number.isFinite(Date.parse(String(value)))) fail(); };
  const one = (value: unknown, options: unknown[]) => options.includes(value) ? value : fail();
  const data = object(input); one(data.schema_version, [1]); one(data.mode, ["http"]); integer(data.version); money(data.personal_cash);
  if (!Number.isFinite(Date.parse(text(data.as_of)))) fail();
  const list = (name: string) => {
    const values = data[name]; if (!Array.isArray(values) || values.length > 20000) return fail();
    const rows = values.map(object); const ids = rows.map(row => text(row.id)); if (new Set(ids).size !== ids.length) fail(); return rows;
  };
  const policy = object(data.policy);
  integer(policy.lombard_base_rate_bps, 0, 10000); integer(policy.lombard_min_months, 1, 600); integer(policy.lombard_max_months, Number(policy.lombard_min_months), 600);
  money(policy.revenue_min_amount); if (Number(policy.revenue_min_amount) <= 0) fail();
  integer(policy.revenue_min_share_bps, 100, 10000); integer(policy.revenue_max_share_bps, Number(policy.revenue_min_share_bps), 10000);
  integer(policy.revenue_factor_threshold_bps, Number(policy.revenue_min_share_bps), Number(policy.revenue_max_share_bps));
  integer(policy.revenue_low_factor_bps, 10000, 20000); integer(policy.revenue_high_factor_bps, Number(policy.revenue_low_factor_bps), 20000);
  const businesses = list("businesses");
  for (const row of businesses) { text(row.name); bool(row.verified); money(row.cash); }
  const scopes = ["personal", ...businesses.filter(row => row.verified).map(row => `business:${row.id}`)];
  for (const row of list("products")) {
    text(row.name); one(row.segment, ["personal", "business"]);
    for (const field of ["min_amount", "max_amount", "step_amount"]) money(row[field]);
    if (Number(row.min_amount) <= 0 || Number(row.max_amount) < Number(row.min_amount) || Number(row.step_amount) <= 0) fail();
    integer(row.min_months, 1, 600); integer(row.max_months, Number(row.min_months), 600); integer(row.annual_rate_bps, 0, 10000);
  }
  for (const row of list("loans")) { text(row.name); one(row.scope, scopes); money(row.principal); integer(row.annual_rate_bps, 0, 10000); integer(row.remaining_months, 1, 600); integer(row.pauses_used, 0, 2); date(row.next_due); }
  const facilities = list("facilities");
  for (const row of facilities) { text(row.name); one(row.scope, scopes); money(row.limit); money(row.drawn); if (Number(row.drawn) > Number(row.limit)) fail(); integer(row.annual_rate_bps, 0, 10000); bool(row.enabled); text(row.requirement); }
  if (facilities.filter(row => row.id === "buffer" && row.scope === "personal").length !== 1) fail();
  for (const row of list("sources")) { text(row.name); one(row.scope, scopes.filter(scope => scope !== "personal")); money(row.monthly_revenue); money(row.verified_limit); one(row.status, ["connected", "syncing", "offline"]); }
  for (const row of list("invoices")) { one(row.scope, scopes.filter(scope => scope !== "personal")); text(row.reference); text(row.debtor); one(row.currency, ["USD", "RON"]); money(row.amount); integer(row.advance_bps, 0, 10000); integer(row.fee_bps, 0, Number(row.advance_bps)); date(row.due); one(row.status, ["eligible", "requested", "funded"]); }
  for (const row of list("discounts")) { text(row.label); text(row.description); integer(row.discount_bps, 0, Number(policy.lombard_base_rate_bps)); bool(row.achieved); }
  if (!Array.isArray(data.matching)) fail();
  const preferences = (data.matching as unknown[]).map(object);
  if (new Set(preferences.map(item => item.scope)).size !== preferences.length) fail();
  for (const matching of preferences) { bool(matching.enabled); bool(matching.anonymous); one(matching.scope, scopes.filter(scope => scope !== "personal")); }
  for (const row of list("collateral")) { text(row.symbol); text(row.name); money(row.value); money(row.capacity); integer(row.max_ltv_bps, 0, 10000); if (units(String(row.capacity), 2) > units(String(row.value), 2) * BigInt(Number(row.max_ltv_bps)) / BigInt(10000)) fail(); }
  for (const row of list("funds")) { one(row.scope, scopes.filter(scope => scope !== "personal")); text(row.name); text(row.focus); text(row.ticket); integer(row.match_percent, 0, 100); }
  for (const row of list("applications")) {
    one(row.scope, scopes); one(row.status, ["submitted", "under_review", "funded", "declined", "cancelled"]); if (!Number.isFinite(Date.parse(text(row.created_at)))) fail();
    const draft = object(row.draft); one(draft.kind, ["term", "lombard", "revenue", "factoring", "pause", "refinance"]);
    if (["term", "lombard", "revenue", "refinance"].includes(String(draft.kind))) { text(draft.purpose); money(draft.amount); if (Number(draft.amount) <= 0) fail(); }
    const ids = (value: unknown) => { if (!Array.isArray(value) || !value.length || value.length > 100) fail(); const values = (value as unknown[]).map(text); if (new Set(values).size !== values.length) fail(); };
    if (draft.kind === "term") { text(draft.product_id); integer(draft.months, 1, 600); }
    if (draft.kind === "lombard") { ids(draft.asset_ids); integer(draft.months, 1, 600); }
    if (draft.kind === "revenue") { ids(draft.source_ids); integer(draft.sales_share_bps, 100, 10000); }
    if (draft.kind === "factoring") ids(draft.invoice_ids);
    if (draft.kind === "pause") text(draft.loan_id);
    if (draft.kind === "refinance") one(draft.currency, ["USD", "EUR", "GBP", "JPY"]);
    const estimate = object(row.estimate); money(estimate.amount); one(estimate.currency, ["USD", "RON", "EUR", "GBP", "JPY"]); text(estimate.explanation);
    for (const field of ["payment", "total", "cost"]) if (estimate[field] !== null) money(estimate[field]);
    if (estimate.annual_rate_bps !== null) integer(estimate.annual_rate_bps, 0, 10000); if (estimate.months !== null) integer(estimate.months, 1, 600);
  }
  for (const row of list("activity")) { one(row.scope, scopes); text(row.description); one(row.action, ["apply", "cancel", "draw", "repay_facility", "repay_loan", "buffer_toggle", "matching"]); if (row.amount !== null) money(row.amount); if (!Number.isFinite(Date.parse(text(row.at)))) fail(); }
  return input as CreditSnapshot;
}
