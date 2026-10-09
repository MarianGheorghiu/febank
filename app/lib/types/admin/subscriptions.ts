import type { AuditEvent } from "./audit";

// Wire DTOs: JSON-compatible, integer minor units, RFC3339 UTC timestamps.
export const SUBSCRIPTION_STATUSES = ["ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELED"] as const;
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number];
export type PlanId = "STANDARD" | "PREMIUM" | "METAL";
export type BillingCycle = "MONTHLY" | "ANNUAL";
export interface SubscriptionPlan {
  id: PlanId; name: string; monthly_minor: number; annual_minor: number;
  currency: "EUR"; description: string; benefits: string[];
}
export interface SubscriptionCustomer {
  id: string; name: string; email: string; eligible: boolean;
}
export interface Subscription {
  id: string; customer_id: string; plan_id: PlanId; cycle: BillingCycle;
  status: SubscriptionStatus; price_minor: number; currency: "EUR";
  started_at: string; period_end: string; cancel_at_period_end: boolean;
  pending_change: { plan_id: PlanId; cycle: BillingCycle; price_minor: number } | null;
  version: number; updated_at: string;
}
export interface SubscriptionInvoice {
  id: string; subscription_id: string; amount_minor: number; currency: "EUR";
  status: "PAID" | "OPEN" | "FAILED"; issued_at: string; due_at: string;
  paid_at: string | null; failure_reason: string | null; retry_requested_at: string | null;
}
export type SubscriptionAction = "ASSIGN" | "CHANGE_PLAN" | "SUSPEND" | "RESUME" | "CANCEL_AT_RENEWAL" | "KEEP_ACTIVE" | "RETRY_PAYMENT";
export interface SubscriptionCommand {
  request_id: string; action: SubscriptionAction; subscription_id?: string;
  customer_id?: string; expected_version?: number; plan_id?: PlanId;
  cycle?: BillingCycle; invoice_id?: string; reason: string;
}
export interface SubscriptionState {
  schema_version: 1; revision: number; subscriptions: Subscription[];
  invoices: SubscriptionInvoice[]; audit: AuditEvent[];
  processed_requests: { request_id: string; payload: string }[];
}
export interface SubscriptionsRepository {
  list(): Promise<SubscriptionState>;
  execute(command: SubscriptionCommand, actor: { email: string; role: "admin" | "client" }): Promise<SubscriptionState>;
}
