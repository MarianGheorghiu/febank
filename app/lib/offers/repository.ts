import type { OfferCommand, OffersContext, OffersRepository, OffersSnapshot } from "./contracts";
import { DEMO_OFFER_CATALOG } from "./catalog";
import { projectOffers } from "./engine";
import { parseOffersSnapshot } from "./response";
import { commitWallet, readWallet, WALLET_EVENT } from "../wallet/store";
import { createCardsRepository } from "../cards/repository";
import { SUBSCRIPTION_CUSTOMERS } from "../mock/admin/subscriptions";

export function createOffersRepository(email: string, name = ""): OffersRepository {
  if (!email.trim()) throw new Error("A customer session is required.");
  const mode = process.env.NEXT_PUBLIC_OFFERS_MODE ?? "demo";
  const walletMode = process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (!["demo", "http"].includes(mode) || mode !== walletMode) throw new Error("Offers and the shared wallet must use the same valid service mode.");
  if ((process.env.NEXT_PUBLIC_CARDS_MODE ?? walletMode) !== mode) throw new Error("Offers and Cards Vault must use the same service mode.");
  if (mode === "http") {
    const base = (process.env.NEXT_PUBLIC_OFFERS_API_URL ?? process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "").replace(/\/$/, "");
    async function request(command?: OfferCommand, key?: string, signal?: AbortSignal): Promise<OffersSnapshot> {
      const response = await fetch(`${base}/v1/me/offers${command ? "/commands" : ""}`, { method: command ? "POST" : "GET", credentials: "include", cache: "no-store", signal,
        headers: { Accept: "application/json", ...(command ? { "Content-Type": "application/json", "Idempotency-Key": key! } : {}) }, ...(command ? { body: JSON.stringify(command) } : {}) });
      if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(typeof error?.error?.message === "string" ? error.error.message : `Offers service failed (${response.status}).`); }
      const value = parseOffersSnapshot(await response.json());
      if (command && typeof window !== "undefined") window.dispatchEvent(new Event(WALLET_EVENT));
      return value;
    }
    return { getSnapshot: signal => request(undefined, undefined, signal), execute: (command, key) => request(command, key) };
  }
  const cards = createCardsRepository(email, name);
  async function context(): Promise<OffersContext> {
    const subscriptions = await import("../subscriptions/store");
    const [cardSnapshot, subscriptionSnapshot] = await Promise.all([cards.getSnapshot(), subscriptions.mockSubscriptionsRepository.list()]);
    const customer = SUBSCRIPTION_CUSTOMERS.find(item => item.email.toLowerCase() === email.trim().toLowerCase());
    const subscription = subscriptionSnapshot.subscriptions.find(item => item.customer_id === customer?.id && item.status !== "CANCELED");
    // Unmapped demo identities receive an explicit demo entitlement, never a production fallback.
    const membership: OffersContext["membership"] = customer ? { plan: subscription?.plan_id ?? "STANDARD", active: !!customer.eligible && !!subscription && subscription.status === "ACTIVE", source: "subscription", subscription_id: subscription?.id ?? null } : { plan: "METAL", active: true, source: "demo", subscription_id: null };
    return { catalog: structuredClone(DEMO_OFFER_CATALOG), membership, cards: cardSnapshot.cards.map(card => ({ id: card.id, label: `${card.type === "PHYSICAL" ? "Physical" : "Virtual"} · •••• ${card.last4}`, currency: card.currency, eligible: card.status === "ACTIVE" && cardSnapshot.customer?.accountStatus === "ACTIVE" && cardSnapshot.customer?.kycStatus === "VERIFIED" })) };
  }
  const project = (ctx: OffersContext) => { const { state } = readWallet(email); return projectOffers(state.rewards, ctx, state.transfers.accounts.find(account => account.id === "account-USD")!.available, new Date().toISOString()); };
  return {
    async getSnapshot() { return project(await context()); },
    async execute(command, key) {
      if (!/^[a-zA-Z0-9_-]{8,120}$/.test(key)) throw new Error("A valid idempotency key is required.");
      const ctx = await context();
      commitWallet(email, { kind: "rewards", key, at: new Date().toISOString(), command, context: ctx });
      return project(ctx);
    },
  };
}
