/** Customer execution adapter. Every debit, credit and reservation settles in WalletState. */
import { MOCK_TRADING_WALLET } from "../markets/seed";
import { availableCash, availableUnits, applyMarketAdminCommand, cancelCustomerOrder, exchangeAssets, submitTrade, walletFor } from "../markets/engine";
import { decimal, units, priceString } from "../transfers/engine";
import type { MarketActor, MarketAdminCommand, MarketAudit, MarketOrder, MarketsState, TradeRequest } from "../types/admin/markets";
import type { WalletState } from "./engine";

export type TradingCommand =
  | { type: "trade"; request: TradeRequest }
  | { type: "exchange"; source: string; target: string; amount: number; revision: number }
  | { type: "cancel_order"; order_id: string };
export interface WalletTrading {
  orders: MarketOrder[];
  audit: MarketAudit[];
  cost_basis: Record<string, number>;
  revision: number;
  liquidity: Record<string, { units: number; usd: number; version: number }>;
}
export function initialTrading(): WalletTrading { return { orders: [], audit: [], cost_basis: {}, revision: 0, liquidity: {} }; }
/** Pending trading reservations are already in account.reserved. Add only those back
 * for the existing matching engine, which subtracts open orders itself. Transfer holds stay excluded. */
export function projectTrading(state: WalletState, catalog: MarketsState, customer: string): MarketsState {
  const email = customer.toLowerCase();
  const cash: Record<string, number> = {}, owned: Record<string, number> = {};
  for (const account of state.transfers.accounts) (account.kind === "fiat" ? cash : owned)[account.asset] = Number(account.available);
  for (const order of state.trading.orders.filter(o => o.status === "PENDING")) {
    if (order.side === "BUY") cash[order.currency] = (cash[order.currency] ?? 0) + order.reservedCash;
    else owned[order.symbol] = (owned[order.symbol] ?? 0) + order.quantity;
  }
  return { ...structuredClone(catalog), accountBalances: structuredClone(state.transfers.accounts), revision: catalog.revision + state.trading.revision,
    instruments: catalog.instruments.map(item => {
      const delta = state.trading.liquidity[item.symbol];
      return delta ? { ...item, reserveUnits: item.reserveUnits + delta.units, reserveUsd: item.reserveUsd + delta.usd, version: item.version + delta.version } : { ...item };
    }),
    wallets: { [email]: { cash, units: owned, costBasis: { ...state.trading.cost_basis } } },
    orders: structuredClone(state.trading.orders),
    audit: [...state.trading.audit, ...catalog.audit],
  };
}
function fixed(value: number, decimals: number): bigint {
  if (!Number.isFinite(value) || value < -1e-7) throw new Error("Invalid execution balance.");
  return units(Math.max(0, value).toFixed(Math.min(decimals, 8)), decimals);
}
export function settleTrading(state: WalletState, before: MarketsState, after: MarketsState, customer: string): WalletState {
  const next = structuredClone(state);
  const email = customer.toLowerCase();
  const wallet = walletFor(after, email);
  for (const item of after.instruments) {
    if (!next.transfers.accounts.some(a => a.asset === item.symbol)) next.transfers.accounts.push({ id: `account-${item.symbol}`, kind: item.domain === "CRYPTO" ? "crypto" : "stock", name: item.name, asset: item.symbol, decimals: 8, available: "0", reserved: "0", usd_price: priceString(item.priceUsd) });
  }
  const custody = next.transfers.routes.find(route => route.id === "route-AAPL")!;
  for (const account of next.transfers.accounts.filter(a => a.kind === "stock")) {
    if (!next.transfers.routes.some(route => route.asset === account.asset)) next.transfers.routes.push({ ...structuredClone(custody), id: `route-${account.asset}`, asset: account.asset });
  }
  for (const account of next.transfers.accounts) {
    const cash = account.kind === "fiat";
    const oldAvailable = cash ? availableCash(before, email, account.asset) : availableUnits(before, email, account.asset);
    const newAvailable = cash ? availableCash(after, email, account.asset) : availableUnits(after, email, account.asset);
    const oldTotal = (cash ? walletFor(before, email).cash : walletFor(before, email).units)[account.asset] ?? 0;
    const newTotal = (cash ? wallet.cash : wallet.units)[account.asset] ?? 0;
    const availableDelta = fixed(newAvailable, account.decimals) - fixed(oldAvailable, account.decimals);
    const reservedDelta = (fixed(newTotal, account.decimals) - fixed(newAvailable, account.decimals)) - (fixed(oldTotal, account.decimals) - fixed(oldAvailable, account.decimals));
    // Preserve transfer reservations and sub-trading precision (e.g. ETH's 18 decimals).
    account.available = decimal(units(account.available, account.decimals) + availableDelta, account.decimals);
    account.reserved = decimal(units(account.reserved, account.decimals) + reservedDelta, account.decimals);
    const item = after.instruments.find(i => i.symbol === account.asset);
    if (item) account.usd_price = priceString(item.priceUsd);
  }
  next.trading.orders = structuredClone(after.orders);
  next.trading.audit = structuredClone(after.audit.filter(entry => !before.audit.some(old => old.id === entry.id)).concat(state.trading.audit));
  next.trading.cost_basis = { ...wallet.costBasis };
  next.trading.revision += after.revision - before.revision;
  for (const item of after.instruments) {
    const previous = before.instruments.find(i => i.symbol === item.symbol)!;
    const delta = next.trading.liquidity[item.symbol] ?? { units: 0, usd: 0, version: 0 };
    next.trading.liquidity[item.symbol] = { units: delta.units + item.reserveUnits - previous.reserveUnits, usd: delta.usd + item.reserveUsd - previous.reserveUsd, version: delta.version + item.version - previous.version };
  }
  return next;
}
export function applyTrading(state: WalletState, catalog: MarketsState, command: TradingCommand, actor: MarketActor, at: string, key: string) {
  if (!actor.email.trim() || actor.role !== "client") throw new Error("Customer session required.");
  const before = projectTrading(state, catalog, actor.email);
  const after = command.type === "trade" ? submitTrade(before, command.request, actor, at, key)
    : command.type === "exchange" ? exchangeAssets(before, command.source, command.target, command.amount, command.revision, actor, at, key)
    : cancelCustomerOrder(before, command.order_id, actor, at);
  return { state: settleTrading(state, before, after, actor.email), before, after };
}

/** Import legacy execution deltas, never add the old independent opening funds. */
export function importLegacyTrading(state: WalletState, catalog: MarketsState, legacy: import("../types/admin/markets").TradingWallet, orders: MarketOrder[], customer: string): WalletState {
  const email = customer.toLowerCase();
  const before = projectTrading(state, catalog, email);
  const after = structuredClone(before);
  const target = after.wallets[email];
  for (const field of ["cash", "units"] as const) {
    for (const symbol of new Set([...Object.keys(legacy[field]), ...Object.keys(MOCK_TRADING_WALLET[field])])) {
      const value = legacy[field][symbol] ?? 0;
      if (!Number.isFinite(value) || value < 0) throw new Error("Invalid legacy execution wallet.");
      const delta = value - (MOCK_TRADING_WALLET[field][symbol] ?? 0);
      if (Math.abs(delta) < 1e-8) continue;
      if (!state.transfers.accounts.some(a => a.asset === symbol)) throw new Error(`Cannot migrate unsupported asset ${symbol}.`);
      target[field][symbol] = (target[field][symbol] ?? 0) + delta;
    }
  }
  if (!orders.every(order => order.userEmail === email && ["PENDING", "FILLED", "CANCELLED", "REJECTED"].includes(order.status) && Number.isFinite(order.quantity) && order.quantity > 0 && Number.isFinite(order.reservedCash) && order.reservedCash >= 0)) throw new Error("Invalid legacy order history.");
  target.costBasis = { ...legacy.costBasis };
  after.orders = structuredClone(orders);
  after.revision++;
  return settleTrading(state, before, after, email);
}

export function applyTradingAdmin(state: WalletState, catalog: MarketsState, customer: string, command: MarketAdminCommand, actor: MarketActor, at: string, key: string) {
  if (command.action !== "PROCESS" && command.action !== "CANCEL") throw new Error("Only order processing/cancellation may mutate customer execution state.");
  const before = projectTrading(state, catalog, customer);
  const after = applyMarketAdminCommand(before, command, actor, at, key);
  return { before, after, state: settleTrading(state, before, after, customer) };
}
