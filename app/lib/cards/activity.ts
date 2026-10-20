import type { CardActivity } from "./contracts";

/** Shared demo card ledger, keyed to the issuing registry. Never changes wallet balances. */
export const CARD_ACTIVITY: CardActivity[] = [
  { id: "CTX-1001", card_id: "CRD-1001", merchant: "Mega Image", category: "Groceries", amount: "125.00", currency: "EUR", occurred_at: "2026-10-08T07:00:00Z", status: "COMPLETED" },
  { id: "CTX-1002", card_id: "CRD-1001", merchant: "IKEA", category: "Shopping", amount: "940.00", currency: "EUR", occurred_at: "2026-10-05T12:20:00Z", status: "COMPLETED" },
  { id: "CTX-1003", card_id: "CRD-1001", merchant: "Booking.com", category: "Travel", amount: "650.00", currency: "EUR", occurred_at: "2026-10-03T09:45:00Z", status: "COMPLETED" },
  { id: "CTX-1004", card_id: "CRD-1001", merchant: "Restaurant reservation", category: "Dining", amount: "125.00", currency: "EUR", occurred_at: "2026-10-01T18:30:00Z", status: "COMPLETED" },
  { id: "CTX-2001", card_id: "CRD-1002", merchant: "Adobe", category: "Subscriptions", amount: "80.00", currency: "USD", occurred_at: "2026-10-06T10:00:00Z", status: "COMPLETED" },
  { id: "CTX-2002", card_id: "CRD-1002", merchant: "Amazon", category: "Shopping", amount: "300.00", currency: "USD", occurred_at: "2026-10-02T11:00:00Z", status: "COMPLETED" },
  { id: "CTX-3001", card_id: "CRD-1003", merchant: "City break", category: "Travel", amount: "620.00", currency: "EUR", occurred_at: "2026-10-04T10:00:00Z", status: "COMPLETED" },
];

export function cardAnalytics(activity: CardActivity[], asOf: string, days: number) {
  const end = new Date(asOf); end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - days + 1);
  const filtered = activity.filter(tx => tx.status === "COMPLETED" && Date.parse(tx.occurred_at) >= start.getTime() && Date.parse(tx.occurred_at) <= Date.parse(asOf));
  const daily = new Map<string, number>(); const categories = new Map<string, number>();
  for (const tx of filtered) {
    const cents = Math.round(Number(tx.amount) * 100), day = tx.occurred_at.slice(0, 10);
    daily.set(day, (daily.get(day) ?? 0) + cents); categories.set(tx.category, (categories.get(tx.category) ?? 0) + cents);
  }
  const points = Array.from({ length: days }, (_, index) => { const date = new Date(start); date.setUTCDate(date.getUTCDate() + index); const day = date.toISOString().slice(0, 10); return { day, spent: (daily.get(day) ?? 0) / 100 }; });
  return { points, categories: [...categories].map(([name, cents]) => ({ name, value: cents / 100 })).sort((a, b) => b.value - a.value), total: filtered.reduce((sum, tx) => sum + Math.round(Number(tx.amount) * 100), 0) / 100, count: filtered.length };
}

/** Starter examples follow the selected demo card, without touching the wallet journal. */
export function demoCardActivity(cards: import("../types/admin/card-issuing").IssuedCard[], asOf: string): CardActivity[] {
  const ids = new Set(cards.map(card => card.id));
  const starter = cards.filter(card => card.id.startsWith("CRD-DEMO-")).flatMap(card => {
    const created = new Date(card.createdAt);
    const examples = [
      ["Mega Image", "Groceries", "85.00"], ["Restaurant reservation", "Dining", "125.00"], ["Metro pass", "Transport", "60.00"],
      ["eMAG", "Shopping", "180.00"], ["IKEA", "Shopping", "240.00"], ["Carrefour", "Groceries", "95.00"],
      ["Weekend stay", "Travel", "175.00"], ["Local restaurant", "Dining", "140.00"], ["Zara", "Shopping", "160.00"],
      ["Booking.com", "Travel", "250.00"], ["Fresh groceries", "Groceries", "180.00"], ["City dinner", "Dining", "150.00"],
    ];
    return examples.map(([merchant, category, amount], index) => {
      const day = 1 + Math.floor(index * Math.max(0, created.getUTCDate() - 2) / (examples.length - 1));
      const date = new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), day, 10));
      return { id: `${card.id}-TX-${index + 1}`, card_id: card.id, merchant, category, amount, currency: card.currency, status: "COMPLETED" as const, occurred_at: new Date(Math.min(date.getTime(), Date.parse(asOf))).toISOString() };
    });
  });
  return [...CARD_ACTIVITY.filter(tx => ids.has(tx.card_id)), ...starter];
}

/** Calendar-month budget: reconcile partial ledger coverage against issuing usage. */
export function cardBudgetSeries(activity: CardActivity[], asOf: string, usage: number) {
  const now = new Date(asOf), year = now.getUTCFullYear(), month = now.getUTCMonth();
  const prefix = asOf.slice(0, 7), day = now.getUTCDate(), length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daily = new Map<number, number>();
  for (const tx of activity) if (tx.status === "COMPLETED" && tx.occurred_at.startsWith(prefix) && Date.parse(tx.occurred_at) <= Date.parse(asOf)) {
    const index = new Date(tx.occurred_at).getUTCDate(); daily.set(index, (daily.get(index) ?? 0) + Math.round(Number(tx.amount) * 100));
  }
  const recorded = [...daily.values()].reduce((sum, value) => sum + value, 0);
  const opening = Math.max(0, Math.round(usage * 100) - recorded);
  let cumulative = opening;
  return Array.from({ length }, (_, index) => {
    const date = index + 1; cumulative += daily.get(date) ?? 0;
    return { day: new Date(Date.UTC(year, month, date)).toISOString().slice(0, 10), spent: date > day ? null : date === day ? usage : cumulative / 100, daily: (daily.get(date) ?? 0) / 100 };
  });
}
