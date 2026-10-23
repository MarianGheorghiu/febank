/** Go transport contract: USD decimals as strings, rates in integer basis points, UTC timestamps. */
export type CreditScope = "personal" | `business:${string}`;
export interface CreditProduct {
  id: string; segment: "personal" | "business"; name: string;
  min_amount: string; max_amount: string; step_amount: string;
  min_months: number; max_months: number; annual_rate_bps: number;
}
export interface CreditLoan {
  id: string; scope: CreditScope; name: string; principal: string; annual_rate_bps: number;
  remaining_months: number; next_due: string; pauses_used: number;
}
export interface CreditFacility {
  id: string; scope: CreditScope; name: string; limit: string; drawn: string;
  annual_rate_bps: number; enabled: boolean; requirement: string;
}
export interface RevenueSource { id: string; scope: CreditScope; name: string; monthly_revenue: string; verified_limit: string; status: "connected" | "syncing" | "offline" }
export interface CreditInvoice {
  id: string; scope: CreditScope; reference: string; debtor: string; currency: "USD" | "RON";
  amount: string; advance_bps: number; fee_bps: number; due: string; status: "eligible" | "requested" | "funded";
}
export interface CreditDiscount { id: string; label: string; description: string; discount_bps: number; achieved: boolean }
export type CreditDraft =
  | { kind: "term"; product_id: string; amount: string; months: number; purpose: string }
  | { kind: "lombard"; asset_ids: string[]; amount: string; months: number; purpose: string }
  | { kind: "revenue"; source_ids: string[]; amount: string; sales_share_bps: number; purpose: string }
  | { kind: "factoring"; invoice_ids: string[] }
  | { kind: "pause"; loan_id: string }
  | { kind: "refinance"; amount: string; currency: "USD" | "EUR" | "GBP" | "JPY"; purpose: string };
export interface CreditEstimate {
  amount: string; currency: string; annual_rate_bps: number | null; months: number | null;
  payment: string | null; total: string | null; cost: string | null; explanation: string;
}
export interface CreditApplication {
  id: string; scope: CreditScope; draft: CreditDraft; estimate: CreditEstimate;
  status: "submitted" | "under_review" | "funded" | "declined" | "cancelled"; created_at: string;
}
export type CreditCommand = { scope: CreditScope; expected_version: number } & (
  | { action: "apply"; draft: CreditDraft }
  | { action: "cancel"; application_id: string }
  | { action: "draw" | "repay_facility"; facility_id: string; amount: string }
  | { action: "repay_loan"; loan_id: string; amount: string }
  | { action: "buffer_toggle"; enabled: boolean }
  | { action: "matching"; enabled: boolean; anonymous: boolean }
);
export interface CreditActivity { id: string; scope: CreditScope; action: CreditCommand["action"]; description: string; amount: string | null; at: string }
export interface CreditPolicy {
  lombard_base_rate_bps: number; lombard_min_months: number; lombard_max_months: number;
  revenue_min_amount: string; revenue_min_share_bps: number; revenue_max_share_bps: number;
  revenue_factor_threshold_bps: number; revenue_low_factor_bps: number; revenue_high_factor_bps: number;
}
export interface CreditState {
  policy: CreditPolicy;
  version: number; businesses: { id: string; name: string; verified: boolean; cash: string }[];
  products: CreditProduct[]; loans: CreditLoan[]; facilities: CreditFacility[];
  sources: RevenueSource[]; invoices: CreditInvoice[]; discounts: CreditDiscount[];
  matching: { enabled: boolean; anonymous: boolean; scope: CreditScope }[];
  applications: CreditApplication[]; activity: CreditActivity[];
}
export interface CreditCollateral { id: string; symbol: string; name: string; value: string; max_ltv_bps: number; capacity: string }
export interface CreditSnapshot extends CreditState {
  schema_version: 1; as_of: string; mode: "demo" | "http"; personal_cash: string;
  collateral: CreditCollateral[]; funds: { scope: CreditScope; id: string; name: string; focus: string; ticket: string; match_percent: number }[];
}
export interface CreditRepository {
  getSnapshot(signal?: AbortSignal): Promise<CreditSnapshot>;
  execute(command: CreditCommand, idempotencyKey: string): Promise<CreditSnapshot>;
}
