import type { CardDetails, CardsRepository, CustomerCardsSnapshot } from "./contracts";
import { MOCK_ISSUING_POLICY } from "../mock/admin/card-issuing";
import { customerCardActions } from "../admin/card-issuing";
import { readWallet } from "../wallet/store";
import { demoCardActivity } from "./activity";
export const CARDS_EVENT = "mbank:cards-updated";

export function parseCardsSnapshot(value: unknown): CustomerCardsSnapshot {
  const data = value as CustomerCardsSnapshot;
  if (!data || data.schema_version !== 1 || !Number.isFinite(Date.parse(data.as_of)) || !Array.isArray(data.cards) || !Array.isArray(data.activity) || !Array.isArray(data.audit) || !Array.isArray(data.funding_accounts) || !data.permissions || !data.policy || !Number.isFinite(data.policy.maxMonthlyLimit) || !Number.isInteger(data.policy.maxOpenCardsPerCustomer)) throw new Error("Invalid card service response.");
  if (data.customer !== null && (!data.customer || typeof data.customer.id !== "string" || typeof data.customer.name !== "string" || typeof data.customer.email !== "string" || !["ACTIVE", "BLOCKED"].includes(data.customer.accountStatus) || !["VERIFIED", "IN_REVIEW"].includes(data.customer.kycStatus))) throw new Error("Invalid card customer profile.");
  if (data.funding_accounts.some(account => !account || typeof account.id !== "string" || typeof account.currency !== "string" || !/^\d+(\.\d+)?$/.test(account.available) || !/^\d+(\.\d+)?$/.test(account.reserved) || !Number.isFinite(Number(account.available)) || !Number.isFinite(Number(account.reserved)))) throw new Error("Invalid card funding account.");
  const ids = new Set<string>();
  for (const card of data.cards) {
    if (card.customerDeletedAt || !data.customer || card.userId !== data.customer.id || typeof card.id !== "string" || ids.has(card.id) || !/^\d{4}$/.test(card.last4) || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry) || !["ACTIVE", "FROZEN", "BLOCKED", "PENDING", "TERMINATED"].includes(card.status) || !["PHYSICAL", "VIRTUAL"].includes(card.type) || !["EUR", "USD", "RON"].includes(card.currency) || !["VISA", "MASTERCARD"].includes(card.network) || !card.limits || !card.channels || ![card.spentToday, card.spentThisMonth, card.limits.daily, card.limits.monthly, card.limits.atmDaily].every(n => Number.isFinite(n) && n >= 0) || ![card.channels.online, card.channels.atm, card.channels.contactless, card.channels.international].every(n => typeof n === "boolean") || !Number.isInteger(card.version) || card.version < 1 || !Array.isArray(data.permissions[card.id]) || data.permissions[card.id].some(action => !["FREEZE", "UNFREEZE", "ACTIVATE", "TERMINATE", "UPDATE_CONTROLS"].includes(action))) throw new Error("Invalid card service record.");
    ids.add(card.id);
  }
  for (const tx of data.activity) if (!ids.has(tx.card_id) || !/^\d+\.\d{2}$/.test(tx.amount) || !Number.isFinite(Number(tx.amount)) || !Number.isFinite(Date.parse(tx.occurred_at)) || typeof tx.merchant !== "string" || typeof tx.category !== "string" || !["COMPLETED", "PENDING", "REVERSED"].includes(tx.status) || data.cards.find(c => c.id === tx.card_id)?.currency !== tx.currency) throw new Error("Invalid card activity response.");
  if (data.audit.some(entry => !entry || !entry.cardId || !ids.has(entry.cardId))) throw new Error("Invalid card audit scope.");
  return data;
}
export function createCardsRepository(email: string, name = ""): CardsRepository {
  const mode = process.env.NEXT_PUBLIC_CARDS_MODE ?? process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (mode === "demo") {
    const store = import("../admin/mock-card-issuing-store");
    async function snapshot(): Promise<CustomerCardsSnapshot> {
      const shared = await store;
      const state = shared.ensureDemoCardCustomer(email, name);
      const customer = shared.cardCustomers(state).find(c => c.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
      const asOf = new Date().toISOString();
      const cards = state.cards.filter(c => c.userId === customer?.id && !c.customerDeletedAt), ids = new Set(cards.map(c => c.id));
      return { schema_version: 1, as_of: asOf, customer, cards, funding_accounts: customer ? readWallet(email).state.transfers.accounts.filter(a => a.kind === "fiat").map(a => ({ id: a.id, currency: a.asset, available: a.available, reserved: a.reserved })) : [], activity: demoCardActivity(cards, asOf), audit: state.audit.filter(e => e.cardId && ids.has(e.cardId)), policy: MOCK_ISSUING_POLICY, permissions: Object.fromEntries(cards.map(c => [c.id, customer ? customerCardActions(state, c, customer) : []])) };
    }
    return { getSnapshot: snapshot, revealDetails: async id => {
      const value = await snapshot(), card = value.cards.find(c => c.id === id);
      if (!card || !["ACTIVE", "FROZEN"].includes(card.status)) throw new Error("Details are unavailable for this card.");
      return { pan: card.last4 === "4242" ? "4242 4242 4242 4242" : `4000 0000 0000 ${card.last4}`, cvv: "123", expiry: card.expiry, holder_name: value.customer!.name, expires_at: new Date(Date.now() + 60000).toISOString() };
    }, execute: async (command, key) => { (await store).executeCustomerCardCommand(command, email, key); return snapshot(); } };
  }
  if (mode !== "http") throw new Error("Unknown Cards Vault mode.");
  const base = (process.env.NEXT_PUBLIC_CARDS_API_URL ?? process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "").replace(/\/$/, "");
  async function request(body?: unknown, key?: string, signal?: AbortSignal) {
    const response = await fetch(`${base}/v1/me/cards${body ? "/commands" : ""}`, { method: body ? "POST" : "GET", credentials: "include", cache: "no-store", signal, headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json", "Idempotency-Key": key! } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.error?.message ?? `Card request failed (${response.status}).`); }
    return parseCardsSnapshot(await response.json());
  }
  return { revealDetails: async (id, signal) => {
    const response = await fetch(`${base}/v1/me/cards/${encodeURIComponent(id)}/details`, { method: "POST", credentials: "include", cache: "no-store", signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Card details could not be revealed. Verify your session and try again.");
    const data = await response.json() as CardDetails;
    if (!data || !/^\d{16}$/.test(data.pan?.replaceAll(" ", "")) || !/^\d{3,4}$/.test(data.cvv) || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiry) || typeof data.holder_name !== "string" || !Number.isFinite(Date.parse(data.expires_at)) || Date.parse(data.expires_at) <= Date.now()) throw new Error("Invalid card details response.");
    return data;
  }, getSnapshot: signal => request(undefined, undefined, signal), execute: async (command, key) => { const value = await request(command, key); if (typeof window !== "undefined") window.dispatchEvent(new Event(CARDS_EVENT)); return value; } };
}
