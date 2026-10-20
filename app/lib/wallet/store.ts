import { MOCK_MARKETS_STATE, MOCK_TRADING_WALLET } from "../markets/seed";
import type { MarketsState } from "../types/admin/markets";
import { applyWalletEvent, initialWallet, type WalletEvent, type WalletState } from "./engine";
import { refreshLimits, priceString } from "../transfers/engine";

export const WALLET_EVENT = "mbank:wallet-updated";
const PREFIX = "mbank_wallet_v1:";
const memory = new Map<string, WalletEvent[]>();
function replay(events: WalletEvent[]): WalletState {
  if (!Array.isArray(events) || events.length > 20000) throw new Error("Invalid saved wallet history.");
  let state = initialWallet();
  const keys = new Set<string>();
  for (const event of events) {
    if (!event?.key || keys.has(event.key)) throw new Error("Duplicate or invalid wallet operation.");
    keys.add(event.key);
    state = applyWalletEvent(state, event);
  }
  return state;
}
function legacyEvents(clientId: string, sourceId = clientId): WalletEvent[] {
  const transferRaw = sessionStorage.getItem(`mbank_transfers_v1:${encodeURIComponent(clientId)}`) ?? sessionStorage.getItem(`mbank_transfers_v1:${encodeURIComponent(sourceId)}`);
  const cashRaw = sessionStorage.getItem(`mbank_overview_v1:${clientId}`) ?? sessionStorage.getItem(`mbank_overview_v1:${sourceId}`);
  const transfers = transferRaw ? JSON.parse(transferRaw) : [];
  const cash = cashRaw ? JSON.parse(cashRaw) : [];
  if (!Array.isArray(transfers) || !Array.isArray(cash)) throw new Error("Saved balances could not be migrated.");
  const events: WalletEvent[] = [...transfers, ...cash.map(entry => ({ kind: "overview", key: entry.operation?.id, at: entry.at, operation: entry.operation, legacy: true }))];
  return events.sort((a,b) => Date.parse(a.at) - Date.parse(b.at));
}
export function readWallet(clientId: string) {
  const sourceId = clientId.trim();
  clientId = sourceId.toLowerCase();
  let events: WalletEvent[];
  if (typeof window === "undefined") events = memory.get(clientId) ?? [];
  else {
    const key = PREFIX + encodeURIComponent(clientId);
    const raw = sessionStorage.getItem(key) ?? (sourceId !== clientId ? sessionStorage.getItem(PREFIX + encodeURIComponent(sourceId)) : null);
    if (raw) {
      try { events = JSON.parse(raw); if (sourceId !== clientId && !sessionStorage.getItem(key)) { replay(events); sessionStorage.setItem(key, JSON.stringify(events)); } } catch { throw new Error("Saved wallet history could not be read. No balances were reset."); }
    }
    else {
      try { events = legacyEvents(clientId, sourceId); } catch { throw new Error("Saved balances could not be migrated. No wallet data was reset."); }
      replay(events); // Migration must validate completely before writing one canonical journal.
      sessionStorage.setItem(key, JSON.stringify(events));
    }
  }
  if (typeof window !== "undefined" && typeof localStorage !== "undefined" && !events.some(e => e.kind === "trading_migration")) {
    const raw = localStorage.getItem("mbank_markets_v1");
    if (raw) {
      const saved: MarketsState = JSON.parse(raw);
      const orders = saved.orders.filter(order => order.userEmail === clientId);
      const legacy = saved.wallets[clientId];
      if (legacy || orders.length) {
        const migration: WalletEvent = { kind: "trading_migration", key: "legacy-trading-import-v1", at: new Date().toISOString(), catalog: saved, wallet: legacy ?? MOCK_TRADING_WALLET, orders, customer: clientId };
        const migrated = [...events, migration];
        try { replay(migrated); } catch (cause) { throw new Error(`Saved trading balances cannot be merged: ${cause instanceof Error ? cause.message : "invalid history"}. Original data was preserved.`); }
        sessionStorage.setItem(PREFIX + encodeURIComponent(clientId), JSON.stringify(migrated));
        events = migrated;
      }
    }
  }
  const state = replay(events);
  // One catalog price for trading, account valuations, Overview and transfer quotes.
  const catalog: MarketsState = typeof localStorage !== "undefined" && localStorage.getItem("mbank_markets_v1") ? JSON.parse(localStorage.getItem("mbank_markets_v1")!) : MOCK_MARKETS_STATE;
  for (const account of state.transfers.accounts) {
    const item = catalog.instruments.find(i => i.symbol === account.asset);
    if (item) {
      if (!Number.isFinite(item.priceUsd) || item.priceUsd <= 0) throw new Error("Invalid shared market price.");
      account.usd_price = priceString(item.priceUsd);
    }
  }
  state.transfers = refreshLimits(state.transfers, new Date().toISOString());
  return { events, state };
}
function sameCommand(a: WalletEvent, b: WalletEvent) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "cost_basis" && b.kind === "cost_basis") return JSON.stringify(a.basis) === JSON.stringify(b.basis) && a.actor.email.toLowerCase() === b.actor.email.toLowerCase();
  if (a.kind === "trading_admin" && b.kind === "trading_admin") return a.customer === b.customer && JSON.stringify(a.command) === JSON.stringify(b.command) && a.actor.email.toLowerCase() === b.actor.email.toLowerCase();
  if (a.kind === "trading" && b.kind === "trading") return JSON.stringify(a.command) === JSON.stringify(b.command) && a.actor.email.toLowerCase() === b.actor.email.toLowerCase();
  if (a.kind === "submit" && b.kind === "submit") return a.quote.id === b.quote.id && JSON.stringify(a.quote.draft) === JSON.stringify(b.quote.draft);
  if (a.kind === "cancel" && b.kind === "cancel") return a.transfer_id === b.transfer_id;
  return a.kind === "overview" && b.kind === "overview" && JSON.stringify(a.operation) === JSON.stringify(b.operation);
}
/** One synchronous read/validate/write; no cross-store balance mirroring or partial commits. */
export function commitWallet(clientId: string, event: WalletEvent): WalletState {
  clientId = clientId.trim().toLowerCase();
  if (event.kind === "cost_basis" && (event.actor.role !== "client" || event.actor.email.trim().toLowerCase() !== clientId)) throw new Error("Wallet customer mismatch.");
  if (event.kind === "trading" && event.actor.email.trim().toLowerCase() !== clientId) throw new Error("Wallet customer mismatch.");
  if (event.kind === "trading_admin" && event.customer.toLowerCase() !== clientId) throw new Error("Wallet customer mismatch.");
  const { state, events } = readWallet(clientId);
  const previous = events.find(e => e.key === event.key);
  if (previous) {
    if (!sameCommand(previous, event)) throw new Error("Idempotency key already used for another request.");
    return state;
  }
  event = { ...event, prices: Object.fromEntries(state.transfers.accounts.map(a => [a.asset, a.usd_price])) };
  const next = applyWalletEvent(state, event);
  const updated = [...events, structuredClone(event)];
  if (typeof window === "undefined") memory.set(clientId, updated);
  else {
    sessionStorage.setItem(PREFIX + encodeURIComponent(clientId), JSON.stringify(updated));
    window.dispatchEvent?.(new Event(WALLET_EVENT));
    window.dispatchEvent?.(new Event("mbank:transfers-updated"));
  }
  return next;
}
export function walletCustomers() {
  if (typeof window === "undefined") return [...memory.keys()];
  const customers = new Set<string>();
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(PREFIX)) customers.add(decodeURIComponent(key.slice(PREFIX.length)));
    else if (key?.startsWith("mbank_transfers_v1:")) customers.add(decodeURIComponent(key.slice("mbank_transfers_v1:".length)));
  }
  return [...customers];
}
