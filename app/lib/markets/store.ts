"use client";
import { useSyncExternalStore } from "react";
import { readRiskForExecution } from "@/app/lib/risk/store";
import { enforceMarketRisk } from "@/app/lib/risk/engine";
import { MOCK_MARKETS_STATE } from "@/app/lib/mock/admin/markets";
import { applyMarketAdminCommand, cancelCustomerOrder, exchangeAssets, submitTrade } from "./engine";
import type { MarketActor, MarketAdminCommand, MarketsState, TradeRequest } from "@/app/lib/types/admin/markets";
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
function getSnapshot() { if (typeof window === "undefined") return MOCK_MARKETS_STATE; return snapshot ??= read(); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const changed = (event: StorageEvent) => { if (event.key === KEY || event.key === null) { snapshot = read(); listeners.forEach(notify => notify()); } };
  window.addEventListener("storage", changed);
  return () => { listeners.delete(listener); window.removeEventListener("storage", changed); };
}
export function useMarketsState() { return useSyncExternalStore(subscribe, getSnapshot, () => MOCK_MARKETS_STATE); }
export function marketStorageWarning() { return warning; }
function mutate(operation: (state: MarketsState, now: string, id: string) => MarketsState, checkRisk = false) {
  const latest = read(); if (warning) throw new Error(warning);
  const next = operation(latest, new Date().toISOString(), crypto.randomUUID());
  if (!valid(next)) throw new Error("Invalid market result. No changes were saved.");
  if (checkRisk) enforceMarketRisk(readRiskForExecution(), latest, next);
  try { localStorage.setItem(KEY, JSON.stringify(next)); }
  catch { throw new Error("Browser storage is unavailable or full. No changes were applied."); }
  snapshot = next; listeners.forEach(notify => notify()); return next;
}
export function executeMarketAdmin(command: MarketAdminCommand, actor: MarketActor) { return mutate((state, now, id) => applyMarketAdminCommand(state, command, actor, now, id), command.action === "PROCESS"); }
export function executeTrade(request: TradeRequest, actor: MarketActor) { return mutate((state, now, id) => submitTrade(state, request, actor, now, id), true); }
export function executeExchange(source: string, target: string, amount: number, revision: number, actor: MarketActor) { return mutate((state, now, id) => exchangeAssets(state, source, target, amount, revision, actor, now, id), true); }
export function cancelOwnOrder(id: string, actor: MarketActor) { return mutate((state, now) => cancelCustomerOrder(state, id, actor, now)); }
