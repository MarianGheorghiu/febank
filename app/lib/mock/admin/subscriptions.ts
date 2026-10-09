import { MOCK_CARD_CUSTOMERS } from "./card-issuing";
import type { SubscriptionCustomer, SubscriptionPlan, SubscriptionState } from "@/app/lib/types/admin/subscriptions";

export const SUBSCRIPTIONS_AS_OF = "2026-10-09T12:00:00.000Z";
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "STANDARD", name: "Standard", monthly_minor: 0, annual_minor: 0, currency: "EUR", description: "Everyday banking essentials", benefits: ["Core banking access", "Standard service tier", "No recurring subscription fee"] },
  { id: "PREMIUM", name: "Premium", monthly_minor: 999, annual_minor: 9990, currency: "EUR", description: "More flexibility for everyday banking", benefits: ["Priority support", "Premium service tier", "Annual billing: two months included"] },
  { id: "METAL", name: "Metal", monthly_minor: 1999, annual_minor: 19990, currency: "EUR", description: "Our highest banking service tier", benefits: ["Dedicated support", "Metal service tier", "Annual billing: two months included"] },
];
// Additional synthetic customers are isolated subscription fixtures, not production identities.
const names = ["Ana Ionescu", "Vlad Petrescu", "Elena Marin", "Andrei Pavel", "Diana Tudor", "Mihai Radu", "Ioana Dobre", "Radu Dumitru", "Maria Stan", "Paul Enache", "Cristina Pop", "Alex Matei", "Sofia Barbu", "Victor Nistor", "Laura Neagu", "Dan Ilie", "Irina Oprea", "Tudor Luca", "Alina Dinu", "Stefan Munteanu", "Oana Vasile"];
export const SUBSCRIPTION_CUSTOMERS: SubscriptionCustomer[] = [
  ...MOCK_CARD_CUSTOMERS.map(c => ({ id: c.id, name: c.name, email: c.email, eligible: c.accountStatus === "ACTIVE" && c.kycStatus === "VERIFIED" })),
  ...names.map((name, i) => ({ id: `DEMO-SUB-USER-${i + 1}`, name, email: `subscriber${i + 1}@example.test`, eligible: true })),
];
export const MOCK_SUBSCRIPTIONS: SubscriptionState = {
  schema_version: 1, revision: 0, audit: [], processed_requests: [],
  subscriptions: SUBSCRIPTION_CUSTOMERS.map((customer, i) => {
    const plan = SUBSCRIPTION_PLANS[i % 3];
    const cycle = i % 4 === 0 ? "ANNUAL" : "MONTHLY";
    return { id: `SUB-${1001 + i}`, customer_id: customer.id, plan_id: plan.id, cycle,
      status: !customer.eligible ? "SUSPENDED" : i % 11 === 6 ? "CANCELED" : i % 9 === 4 ? "SUSPENDED" : i % 6 === 2 && cycle === "MONTHLY" ? "PAST_DUE" : "ACTIVE",
      price_minor: cycle === "ANNUAL" ? plan.annual_minor : plan.monthly_minor, currency: "EUR",
      started_at: "2026-05-01T00:00:00.000Z", pending_change: null, period_end: cycle === "ANNUAL" ? "2027-05-01T00:00:00.000Z" : `2026-10-${String(12 + i % 18).padStart(2, "0")}T00:00:00.000Z`,
      cancel_at_period_end: i === 3, version: 1, updated_at: SUBSCRIPTIONS_AS_OF };
  }), invoices: [],
};
// Paid historical invoices are actual fixture rows, not fabricated MRR history.
MOCK_SUBSCRIPTIONS.invoices = MOCK_SUBSCRIPTIONS.subscriptions.flatMap((sub, i) => {
  if (!sub.price_minor) return [];
  return [0, 1, 2, 3, 4, 5].filter(month => sub.cycle === "MONTHLY" || month === 0).map(month => {
    const issued = `2026-${String(5 + month).padStart(2, "0")}-01T00:00:00.000Z`;
    const failed = month === 5 && sub.status === "PAST_DUE";
    const open = month === 5 && i % 5 === 0;
    return { id: `INV-${i + 1}-${month + 1}`, subscription_id: sub.id, amount_minor: sub.price_minor, currency: "EUR" as const,
      status: failed ? "FAILED" as const : open ? "OPEN" as const : "PAID" as const,
      issued_at: issued, due_at: `2026-${String(5 + month).padStart(2, "0")}-08T00:00:00.000Z`,
      paid_at: failed || open ? null : issued, failure_reason: failed ? "Insufficient available balance" : null, retry_requested_at: null };
  });
});
