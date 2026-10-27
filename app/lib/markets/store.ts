"use client";
import { priceMarkets } from "../rates/execution";
import { useSyncExternalStore } from "react";
import { readRiskForExecution } from "@/app/lib/risk/store";
import { enforceMarketRisk } from "@/app/lib/risk/engine";
import { MOCK_MARKETS_STATE } from "@/app/lib/markets/seed";
import { applyMarketAdminCommand } from "./engine";
import type { MarketActor, MarketAdminCommand, MarketsState, TradeRequest } from "@/app/lib/types/admin/markets";
import { commitWallet, readWallet, walletCustomers, WALLET_EVENT } from "../wallet/store";
import { applyTrading, applyTradingAdmin, projectTrading, type TradingCommand } from "../wallet/trading";
const KEY = "mbank_markets_v1";
let snapshot: MarketsState | null = null;
let warning: string | null = null;
const listeners = new Set<() => void>();
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));
const numbers = (value: unknown) => object(value) && Object.values(value).every(number);
function valid(data: unknown): data is MarketsState {
  if (!object(data) || !number(data.revision) || !Number.isInteger(data.revision) || !Array.isArray(data.instruments) || !object(data.routing) || !object(data.wallets) || !Array.isArray(data.orders) || !Array.isArray(data.audit)) return false;
  const instruments = data.instruments.every(item => object(item) && typeof item.symbol === "string" && /^[A-Z][A-Z0-9.-]{0,11}$/.test(item.symbol) && typeof item.name === "string" && typeof item.venue === "string" && ["CRYPTO", "STOCK"].includes(String(item.domain)) && ["ACTIVE", "SELL_ONLY", "HALTED"].includes(String(item.status)) && ["HEALTHY", "STALE"].includes(String(item.quoteStatus)) && [item.priceUsd, item.feeBps, item.spreadBps, item.minOrderUsd, item.maxOrderUsd, item.reserveUnits, item.reserveUsd, item.lowLiquidityUsd].every(number) && Number(item.priceUsd) > 0 && Number(item.minOrderUsd) > 0 && Number(item.minOrderUsd) <= Number(item.maxOrderUsd) && Number(item.feeBps) <= 500 && Number(item.spreadBps) <= 500 && typeof item.fractional === "boolean" && Number.isInteger(item.version) && Number(item.version) > 0 && date(item.updatedAt));
  return instruments && new Set(data.instruments.map(item => item.symbol)).size === data.instruments.length
    && ["CRYPTO", "STOCK"].every(domain => { const item = (data.routing as Record<string, unknown>)[domain]; return object(item) && ["ACTIVE", "SELL_ONLY", "HALTED"].includes(String(item.status)) && Number.isInteger(item.version) && Number(item.version) > 0 && date(item.updatedAt); })
    && Object.values(data.wallets).every(wallet => object(wallet) && numbers(wallet.cash) && numbers(wallet.units) && numbers(wallet.costBasis))
    && data.orders.every(order => object(order) && typeof order.id === "string" && typeof order.userEmail === "string" && typeof order.symbol === "string" && typeof order.note === "string" && ["CRYPTO", "STOCK"].includes(String(order.domain)) && ["BUY", "SELL"].includes(String(order.side)) && ["MARKET", "LIMIT", "STOP"].includes(String(order.type)) && ["PENDING", "FILLED", "CANCELLED", "REJECTED"].includes(String(order.status)) && ["USD", "EUR", "RON"].includes(String(order.currency)) && [order.quantity, order.price, order.feeUsd, order.totalUsd, order.reservedCash].every(number) && (order.targetPrice === null || number(order.targetPrice)) && date(order.createdAt) && date(order.updatedAt))
    && new Set(data.orders.map(item => item.id)).size === data.orders.length
    && data.audit.every(entry => object(entry) && typeof entry.id === "string" && typeof entry.actor === "string" && typeof entry.target === "string" && typeof entry.reason === "string" && typeof entry.action === "string" && ["CRYPTO", "STOCK"].includes(String(entry.domain)) && date(entry.timestamp));
}
function read(): MarketsState {
  warning = null;
  try { const raw = localStorage.getItem(KEY); if (!raw) return MOCK_MARKETS_STATE; const data: unknown = JSON.parse(raw); if (!valid(data)) throw new Error("Invalid market data"); return data; }
  catch { warning = "Saved market data could not be restored. Demo defaults are shown and operations are blocked until browser storage is repaired."; return MOCK_MARKETS_STATE; }
}
export function readMarketCatalog(customer?: string): MarketsState {
  const catalog = read();
  if (warning) throw new Error(warning);
  return customer ? priceMarkets(catalog, customer) : structuredClone(catalog);
}
function getSnapshot() { if (typeof window === "undefined") return MOCK_MARKETS_STATE; return snapshot ??= read(); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const changed = (event: StorageEvent) => { if (event.key === KEY || event.key === null) { snapshot = read(); listeners.forEach(notify => notify()); } };
  window.addEventListener("storage", changed);
  return () => { listeners.delete(listener); window.removeEventListener("storage", changed); };
}
export function useGlobalMarketsState() { return useSyncExternalStore(subscribe, getSnapshot, () => MOCK_MARKETS_STATE); }
export function marketStorageWarning() { return warning; }
function mutate(operation: (state: MarketsState, now: string, id: string) => MarketsState, checkRisk = false) {
  const latest = read(); if (warning) throw new Error(warning);
  const next = operation(latest, new Date().toISOString(), crypto.randomUUID());
  if (!valid(next)) throw new Error("Invalid market result. No changes were saved.");
  if (checkRisk) enforceMarketRisk(readRiskForExecution(), latest, next);
  try { localStorage.setItem(KEY, JSON.stringify(next)); }
  catch { throw new Error("Browser storage is unavailable or full. No changes were applied."); }
  snapshot = next; listeners.forEach(notify => notify());
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WALLET_EVENT));
  return next;
}
function customers(catalog: MarketsState) {
  return [...new Set([...walletCustomers(), ...Object.keys(catalog.wallets), ...catalog.orders.map(order => order.userEmail)])];
}
/** Admin reads customer orders from their owner journal; never saves a second wallet. */
export function projectAllCustomers(catalog: MarketsState): MarketsState {
  const result = { ...catalog, wallets: {}, orders: [], audit: [...catalog.audit] } as MarketsState;
  for (const customer of customers(catalog)) {
    const view = projectTrading(readWallet(customer).state, catalog, customer);
    Object.assign(result.wallets, view.wallets);
    result.orders.push(...view.orders);
    result.audit.push(...view.audit.filter(entry => !result.audit.some(old => old.id === entry.id)));
  }
  result.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return result;
}
export function executeMarketAdmin(command: MarketAdminCommand, actor: MarketActor) {
  if (actor.role !== "admin") throw new Error("Administrator access required.");
  if (command.action !== "PROCESS" && command.action !== "CANCEL") return mutate((catalog, now, id) => {
    const next = applyMarketAdminCommand(projectAllCustomers(catalog), command, actor, now, id);
    return { ...next, wallets: catalog.wallets, orders: catalog.orders };
  });
  const catalog = read(); if (warning) throw new Error(warning);
  const all = projectAllCustomers(catalog);
  const targets = command.action === "CANCEL" ? [all.orders.find(order => order.id === command.orderId)?.userEmail].filter((email): email is string => !!email)
    : [...new Set(all.orders.filter(order => order.domain === command.domain && order.status === "PENDING").map(order => order.userEmail))];
  if (!targets.length) {
    if (command.action === "CANCEL") throw new Error("Only pending orders can be cancelled.");
    // Preserve validation and operational audit even for an empty queue.
    return mutate((state, now, id) => ({ ...applyMarketAdminCommand({ ...state, orders: [] }, command, actor, now, id), orders: state.orders }));
  }
  for (const customer of targets) {
    const at = new Date().toISOString(), key = crypto.randomUUID();
    const executionCatalog = command.action === "PROCESS" ? priceMarkets(catalog, customer) : catalog;
    const execution = applyTradingAdmin(readWallet(customer).state, executionCatalog, customer, command, actor, at, key);
    enforceMarketRisk(readRiskForExecution(), execution.before, execution.after);
    commitWallet(customer, { kind: "trading_admin", key, at, catalog: executionCatalog, command, actor, customer });
  }
  return projectAllCustomers(catalog);
}
/** One canonical journal commit; never write a second balance to market localStorage. */
export function executeCustomerCommand(command: TradingCommand, actor: MarketActor, key = crypto.randomUUID()) {
  if ((process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo") !== "demo") throw new Error("Customer trading requires the shared wallet service adapter in HTTP mode.");
  const catalog = command.type === "cancel_order" ? readMarketCatalog() : readMarketCatalog(actor.email);
  const at = new Date().toISOString();
  const { state, events } = readWallet(actor.email);
  if (events.some(event => event.key === key)) return projectTrading(commitWallet(actor.email, { kind: "trading", key, at, catalog, command, actor }), catalog, actor.email);
  const execution = applyTrading(state, catalog, command, actor, at, key);
  enforceMarketRisk(readRiskForExecution(), execution.before, execution.after);
  const next = commitWallet(actor.email, { kind: "trading", key, at, catalog, command, actor });
  return projectTrading(next, catalog, actor.email);
}
export function executeTrade(request: TradeRequest, actor: MarketActor) { return executeCustomerCommand({ type: "trade", request }, actor); }
export function executeExchange(source: string, target: string, amount: number, revision: number, actor: MarketActor) { return executeCustomerCommand({ type: "exchange", source, target, amount, revision }, actor); }
export function cancelOwnOrder(id: string, actor: MarketActor) { return executeCustomerCommand({ type: "cancel_order", order_id: id }, actor); }
