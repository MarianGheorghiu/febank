import { SUBSCRIPTION_CUSTOMERS, SUBSCRIPTION_PLANS } from "@/app/lib/mock/admin/subscriptions";
import { validJournal } from "@/app/lib/audit/engine";
import { SUBSCRIPTION_STATUSES, type Subscription, type SubscriptionCommand, type SubscriptionState } from "@/app/lib/types/admin/subscriptions";
import type { AuditActor, AuditEvent } from "@/app/lib/types/admin/audit";

export const money = (minor: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(minor / 100);
export function availableActions(sub: Subscription): SubscriptionCommand["action"][] {
  if (sub.status === "CANCELED") return [];
  return [...(sub.status === "ACTIVE" ? ["CHANGE_PLAN", "SUSPEND"] as const : sub.status === "SUSPENDED" ? ["RESUME"] as const : ["SUSPEND"] as const), ...(sub.cancel_at_period_end ? ["KEEP_ACTIVE"] as const : ["CANCEL_AT_RENEWAL"] as const)];
}
export function applySubscriptionCommand(state: SubscriptionState, command: SubscriptionCommand, actor: AuditActor, now: string): SubscriptionState {
  if (actor.role !== "admin" || !actor.email.trim()) throw new Error("Administrator access required.");
  if (!command.request_id || !Number.isFinite(Date.parse(now))) throw new Error("Invalid request metadata.");
  const payload = JSON.stringify({ command, actor: actor.email });
  const previous = state.processed_requests.find(r => r.request_id === command.request_id);
  if (previous) { if (previous.payload !== payload) throw new Error("Request ID already used for another operation."); return state; }
  if (command.reason.trim().length < 10 || command.reason.trim().length > 500) throw new Error("An audit reason of 10–500 characters is required.");
  let subscriptions = state.subscriptions.map(s => ({ ...s }));
  const invoices = state.invoices.map(i => ({ ...i }));
  const sub = subscriptions.find(s => s.id === command.subscription_id);
  let before: unknown = sub ? { ...sub } : null;
  let after: unknown;
  let target = command.subscription_id ?? "subscription-registry";
  if (command.action === "ASSIGN") {
    before = null;
    const customer = SUBSCRIPTION_CUSTOMERS.find(c => c.id === command.customer_id);
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === command.plan_id);
    if (!customer?.eligible || !plan || !["MONTHLY", "ANNUAL"].includes(command.cycle ?? "")) throw new Error("Select a verified, active customer and valid billing plan.");
    if (subscriptions.some(s => s.customer_id === customer.id && s.status !== "CANCELED")) throw new Error("Customer already has an open subscription.");
    const end = new Date(now);
    // Anchor to UTC day 1 to avoid month-end rollover; first period is a demo full period.
    end.setUTCDate(1); end.setUTCMonth(end.getUTCMonth() + (command.cycle === "ANNUAL" ? 12 : 1));
    target = `SUB-${crypto.randomUUID()}`;
    const created: Subscription = { id: target, customer_id: customer.id, plan_id: plan.id, cycle: command.cycle!, status: "ACTIVE", price_minor: command.cycle === "ANNUAL" ? plan.annual_minor : plan.monthly_minor, currency: "EUR", started_at: now, period_end: end.toISOString(), pending_change: null, cancel_at_period_end: false, version: 1, updated_at: now };
    subscriptions = [created, ...subscriptions]; after = created;
  } else {
    if (!sub || sub.version !== command.expected_version) throw new Error("Subscription changed. Refresh and reopen the operation.");
    if (command.action === "RETRY_PAYMENT") {
      const invoice = invoices.find(i => i.id === command.invoice_id && i.subscription_id === sub.id);
      if (sub.status === "CANCELED" || !invoice || invoice.status === "PAID" || invoice.retry_requested_at) throw new Error("This invoice cannot be retried.");
      before = { ...invoice }; invoice.retry_requested_at = now; after = { ...invoice }; target = invoice.id;
    } else {
      if (!availableActions(sub).includes(command.action)) throw new Error("Operation is not allowed for this subscription state.");
      if (["RESUME", "CHANGE_PLAN"].includes(command.action) && !SUBSCRIPTION_CUSTOMERS.find(c => c.id === sub.customer_id)?.eligible) throw new Error("Customer must have an active account and verified KYC.");
      if (command.action === "CHANGE_PLAN") {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === command.plan_id);
        if (!plan || !["MONTHLY", "ANNUAL"].includes(command.cycle ?? "")) throw new Error("Invalid plan or cycle.");
        if (sub.cancel_at_period_end) throw new Error("Withdraw scheduled cancellation before changing the plan.");
        if (sub.plan_id === plan.id && sub.cycle === command.cycle) throw new Error("Select a different plan or billing cycle.");
        // Scheduled change: preserve billed period; new price applies only at renewal.
        sub.pending_change = { plan_id: plan.id, cycle: command.cycle!, price_minor: command.cycle === "ANNUAL" ? plan.annual_minor : plan.monthly_minor };
      }
      if (command.action === "SUSPEND") sub.status = "SUSPENDED";
      if (command.action === "RESUME") sub.status = invoices.some(i => i.subscription_id === sub.id && i.status !== "PAID" && Date.parse(i.due_at) < Date.parse(now)) ? "PAST_DUE" : "ACTIVE";
      if (command.action === "CANCEL_AT_RENEWAL") { sub.cancel_at_period_end = true; sub.pending_change = null; }
      if (command.action === "KEEP_ACTIVE") sub.cancel_at_period_end = false;
      after = sub;
    }
    sub.version++; sub.updated_at = now;
  }
  const event: AuditEvent = { id: `subscriptions:${command.request_id}`, timestamp: now, source: "SUBSCRIPTIONS", domain: "PLATFORM", category: "CONFIGURATION", action: command.action, severity: "WARNING", outcome: "SUCCESS", actor: actor.email, actorRole: "ADMIN", target, reason: command.reason.trim(), correlationId: command.request_id, requestId: command.request_id, sessionId: null, ip: null, durationMs: null, before, after, origin: "LOCAL" };
  return { ...state, revision: state.revision + 1, subscriptions, invoices, audit: [event, ...state.audit], processed_requests: [...state.processed_requests, { request_id: command.request_id, payload }] };
}

export function subscriptionMetrics(subscriptions: Subscription[], invoices: SubscriptionState["invoices"], asOf: string) {
  const recurring = subscriptions.filter(s => ["ACTIVE", "PAST_DUE"].includes(s.status));
  const mrr = recurring.reduce((sum, s) => sum + s.price_minor / (s.cycle === "ANNUAL" ? 12 : 1), 0);
  const overdue = invoices.filter(i => i.status !== "PAID" && Date.parse(i.due_at) < Date.parse(asOf));
  return { mrr, arr: mrr * 12, active: subscriptions.filter(s => s.status === "ACTIVE").length, overdue_minor: overdue.reduce((sum, i) => sum + i.amount_minor, 0), overdue_count: overdue.length, canceling: subscriptions.filter(s => s.cancel_at_period_end && s.status !== "CANCELED").length };
}
export function validSubscriptionState(value: unknown): value is SubscriptionState {
  if (!value || typeof value !== "object") return false;
  const s = value as SubscriptionState;
  const date = (v: unknown) => typeof v === "string" && /^\d{4}-\d\d-\d\dT.*Z$/.test(v) && Number.isFinite(Date.parse(v));
  const minor = (v: number) => Number.isSafeInteger(v) && v >= 0;
  if (s.schema_version !== 1 || !Number.isSafeInteger(s.revision) || s.revision < 0 || !Array.isArray(s.subscriptions) || !Array.isArray(s.invoices) || !Array.isArray(s.processed_requests) || !validJournal({ revision: s.revision, events: s.audit, notes: [] })) return false;
  if (!s.subscriptions.every(r => r && typeof r.id === "string" && SUBSCRIPTION_CUSTOMERS.some(c => c.id === r.customer_id) && SUBSCRIPTION_PLANS.some(p => p.id === r.plan_id) && SUBSCRIPTION_STATUSES.includes(r.status) && ["MONTHLY", "ANNUAL"].includes(r.cycle) && r.currency === "EUR" && minor(r.price_minor) && Number.isSafeInteger(r.version) && r.version > 0 && typeof r.cancel_at_period_end === "boolean" && (r.pending_change === null || (!!r.pending_change && SUBSCRIPTION_PLANS.some(p => p.id === r.pending_change!.plan_id) && ["MONTHLY", "ANNUAL"].includes(r.pending_change.cycle) && minor(r.pending_change.price_minor))) && date(r.started_at) && date(r.period_end) && date(r.updated_at))) return false;
  if (new Set(s.subscriptions.map(r => r.id)).size !== s.subscriptions.length || new Set(s.subscriptions.filter(r => r.status !== "CANCELED").map(r => r.customer_id)).size !== s.subscriptions.filter(r => r.status !== "CANCELED").length) return false;
  return new Set(s.invoices.map(i => i?.id)).size === s.invoices.length && s.invoices.every(i => i && typeof i.id === "string" && s.subscriptions.some(r => r.id === i.subscription_id) && minor(i.amount_minor) && i.currency === "EUR" && ["PAID", "OPEN", "FAILED"].includes(i.status) && date(i.issued_at) && date(i.due_at) && (i.paid_at === null || date(i.paid_at)) && (i.retry_requested_at === null || date(i.retry_requested_at)) && (i.failure_reason === null || typeof i.failure_reason === "string")) && s.processed_requests.every(r => r && typeof r.request_id === "string" && typeof r.payload === "string");
}
