import { calculateRate } from "../rates/engine";
import { MOCK_TRADING_FX, MOCK_TRADING_WALLET } from "@/app/lib/markets/seed";
import type { MarketActor, MarketAdminCommand, MarketDomain, MarketOrder, MarketsState, TradeQuote, TradeRequest, TradingInstrument, TradingWallet } from "@/app/lib/types/admin/markets";
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const units = (n: number) => Math.round(n * 1e8) / 1e8;
const finite = (n: number, min = 0, max = 1e12) => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
export function marketInstrument(state: MarketsState, symbol: string) {
  const item = state.instruments.find(item => item.symbol === symbol);
  if (!item) throw new Error(`Trading is unavailable for ${symbol}.`);
  return item;
}
export function walletFor(state: MarketsState, email: string): TradingWallet {
  return state.wallets[email.toLowerCase()] ?? MOCK_TRADING_WALLET;
}
export function availableCash(state: MarketsState, email: string, currency = "USD") {
  return (walletFor(state, email).cash[currency] ?? 0) - state.orders.filter(order => order.userEmail === email.toLowerCase() && order.status === "PENDING" && order.side === "BUY" && order.currency === currency).reduce((sum, order) => sum + order.reservedCash, 0);
}
export function availableUnits(state: MarketsState, email: string, symbol: string) {
  return (walletFor(state, email).units[symbol] ?? 0) - state.orders.filter(order => order.userEmail === email.toLowerCase() && order.symbol === symbol && order.status === "PENDING" && order.side === "SELL").reduce((sum, order) => sum + order.quantity, 0);
}
export function tradingRestriction(state: MarketsState, item: TradingInstrument, side: "BUY" | "SELL", type: MarketOrder["type"] = "MARKET"): string | null {
  if (item.pricing && !item.pricing.policy.enabled) return "This product is paused by the Rates & Fee Engine.";
  if (state.routing[item.domain].status === "HALTED") return `${item.domain === "CRYPTO" ? "Crypto" : "Stock"} trading is suspended by bank operations.`;
  if (side === "BUY" && state.routing[item.domain].status === "SELL_ONLY") return "Only sell orders are currently permitted by bank operations.";
  if (item.status === "HALTED") return `${item.symbol} trading is suspended.`;
  if (side === "BUY" && item.status === "SELL_ONLY") return `${item.symbol} is sell-only.`;
  if (item.quoteStatus === "STALE") return `${item.symbol} price feed needs review. Trading is unavailable.`;
  if (item.domain === "CRYPTO" && type !== "MARKET") return "Crypto pools support market orders only.";
  return null;
}
export function quoteTrade(item: TradingInstrument, side: "BUY" | "SELL", quantity: number, currency = "USD", priceOverride?: number): TradeQuote {
  if (!finite(quantity, 1e-8, 1e10) || Math.abs(quantity * 1e8 - Math.round(quantity * 1e8)) > 0.001) throw new Error("Enter a positive quantity with at most 8 decimal places.");
  if (!item.fractional && !Number.isInteger(quantity)) throw new Error(`${item.symbol} requires whole units.`);
  if (!MOCK_TRADING_FX[currency]) throw new Error("Unsupported settlement currency.");
  const price = priceOverride ?? item.priceUsd * (1 + (side === "BUY" ? 1 : -1) * item.spreadBps / 10000);
  const notionalUsd = money(quantity * price);
  if (!finite(price, 0.00000001) || notionalUsd < item.minOrderUsd || notionalUsd > item.maxOrderUsd) throw new Error(`Order value must be between $${item.minOrderUsd} and $${item.maxOrderUsd}, before fees.`);
  const feeUsd = tradingFee(item, notionalUsd);
  const totalUsd = money(notionalUsd + (side === "BUY" ? feeUsd : -feeUsd));
  if (!finite(price, 0.00000001) || notionalUsd < item.minOrderUsd || notionalUsd > item.maxOrderUsd || totalUsd <= 0) throw new Error(`Order value must be between $${item.minOrderUsd} and $${item.maxOrderUsd}, before fees.`);
  return { price, notionalUsd, feeUsd, totalUsd, cashAmount: money(totalUsd / MOCK_TRADING_FX[currency]) };
}
function tradingFee(item: TradingInstrument, notional: number) {
  const p = item.pricing;
  return p ? calculateRate(p.policy, Math.round(notional * 100), p.tier, p.weekend).fee_minor / 100 : money(notional * item.feeBps / 10000);
}
export function quantityForBudget(item: TradingInstrument, amount: number, currency = "USD", strictBudget = false) {
  const precision = item.fractional ? 1e8 : 1;
  const price = item.priceUsd * (1 + item.spreadBps / 10000);
  const fx = MOCK_TRADING_FX[currency] ?? 0;
  if (!finite(amount, 0, 1e12) || !fx || !Number.isFinite(price) || price <= 0) return 0;
  let high = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(amount * fx / (price * (item.pricing ? 1 : (1 + item.feeBps / 10000))) * precision));
  if (!strictBudget && !item.pricing) return Math.floor(amount * fx / (price * (1 + item.feeBps / 10000)) * precision) / precision;
  let low = 0;
  // Notional, fees and settlement round separately. Never let the rounded buy
  // consume pre-existing cash beyond the selected source budget.
  while (low < high) {
    const middle = low + Math.ceil((high - low) / 2);
    const notional = money(middle / precision * price);
    const cost = money(money(notional + tradingFee(item, notional)) / fx);
    if (cost <= amount) low = middle;
    else high = middle - 1;
  }
  return low / precision;
}
function validateInstrument(item: TradingInstrument) {
  if (MOCK_TRADING_FX[item.symbol]) throw new Error("Settlement currency symbols cannot be registered as trading instruments.");
  if (!/^[A-Z][A-Z0-9.-]{0,11}$/.test(item.symbol) || item.name.trim().length < 2 || item.name.length > 100 || !item.venue.trim() || item.venue.length > 100) throw new Error("Enter a valid symbol, asset name and venue/network.");
  if (!["CRYPTO", "STOCK"].includes(item.domain) || !["ACTIVE", "SELL_ONLY", "HALTED"].includes(item.status) || !["HEALTHY", "STALE"].includes(item.quoteStatus)) throw new Error("Invalid instrument settings.");
  if (!finite(item.priceUsd, 0.00000001) || !finite(item.feeBps, 0, 500) || !finite(item.spreadBps, 0, 500) || !Number.isInteger(item.feeBps) || !Number.isInteger(item.spreadBps) || !finite(item.minOrderUsd, 0.01) || !finite(item.maxOrderUsd, item.minOrderUsd) || !finite(item.reserveUnits) || !finite(item.reserveUsd) || !finite(item.lowLiquidityUsd) || typeof item.fractional !== "boolean") throw new Error("Check price, reserves, limits and fees (whole basis points, 0–500).");
}
function fillOrder(state: MarketsState, order: MarketOrder, now: string): void {
  const item = marketInstrument(state, order.symbol);
  const restriction = tradingRestriction(state, item, order.side, order.type);
  if (restriction) throw new Error(restriction);
  const quote = quoteTrade(item, order.side, order.quantity, order.currency);
  if (order.type === "LIMIT" && (order.side === "BUY" ? quote.price > order.targetPrice! : quote.price < order.targetPrice!)) throw new Error("The limit price has not been reached.");
  if (order.type === "STOP" && (order.side === "BUY" ? quote.price < order.targetPrice! : quote.price > order.targetPrice!)) throw new Error("The stop price has not been reached.");
  // Exclude this order's own reservation when evaluating available funds/units.
  const pendingStatus = order.status; order.status = "FILLED";
  const cash = availableCash(state, order.userEmail, order.currency);
  const owned = availableUnits(state, order.userEmail, order.symbol);
  order.status = pendingStatus;
  if (order.side === "BUY" && cash + 0.000001 < quote.cashAmount) throw new Error("Insufficient available cash at the execution price.");
  if (order.side === "SELL" && owned + 1e-8 < order.quantity) throw new Error("Insufficient available units.");
  if (order.side === "BUY" && item.reserveUnits + 1e-8 < order.quantity) throw new Error("Insufficient base-asset liquidity. Operations must replenish the pool.");
  if (order.side === "SELL" && item.reserveUsd < quote.notionalUsd) throw new Error("Insufficient USD liquidity. Operations must replenish the pool.");
  const wallet = state.wallets[order.userEmail] ??= structuredClone(walletFor(state, order.userEmail));
  const beforeUnits = wallet.units[item.symbol] ?? 0;
  if (order.side === "BUY") wallet.costBasis[item.symbol] = (beforeUnits * (wallet.costBasis[item.symbol] ?? item.priceUsd) + quote.totalUsd) / (beforeUnits + order.quantity);
  wallet.cash[order.currency] = money((wallet.cash[order.currency] ?? 0) + (order.side === "BUY" ? -quote.cashAmount : quote.cashAmount));
  wallet.units[item.symbol] = units(beforeUnits + (order.side === "BUY" ? order.quantity : -order.quantity));
  item.reserveUnits = units(item.reserveUnits + (order.side === "BUY" ? -order.quantity : order.quantity));
  item.reserveUsd = money(item.reserveUsd + (order.side === "BUY" ? quote.notionalUsd : -quote.notionalUsd));
  item.version++; item.updatedAt = now;
  Object.assign(order, { status: "FILLED", price: quote.price, feeUsd: quote.feeUsd, totalUsd: quote.totalUsd, reservedCash: 0, updatedAt: now, note: "Demo execution settled in the shared trading wallet." });
}
export function submitTrade(state: MarketsState, request: TradeRequest, actor: MarketActor, now: string, id: string): MarketsState {
  if (actor.role !== "client" || !actor.email) throw new Error("Use a customer session to place an order.");
  const item = marketInstrument(state, request.symbol);
  if (item.version !== request.expectedVersion || state.routing[item.domain].version !== request.expectedRoutingVersion) throw new Error("Market conditions changed. Review the refreshed quote before confirming again.");
  if (!["BUY", "SELL"].includes(request.side) || !["MARKET", "LIMIT", "STOP"].includes(request.type)) throw new Error("Unsupported order type.");
  const restriction = tradingRestriction(state, item, request.side, request.type);
  if (restriction) throw new Error(restriction);
  if (request.type !== "MARKET" && !finite(request.targetPrice!, 0.00000001)) throw new Error("A positive target price is required.");
  const currency = request.currency ?? "USD";
  const estimate = quoteTrade(item, request.side, request.quantity, currency, request.type === "MARKET" ? undefined : request.targetPrice);
  const email = actor.email.toLowerCase();
  if (request.side === "BUY" && availableCash(state, email, currency) < estimate.cashAmount) throw new Error("Insufficient available cash, including open-order reservations.");
  if (request.side === "SELL" && availableUnits(state, email, item.symbol) + 1e-8 < request.quantity) throw new Error("Insufficient available units, including open-order reservations.");
  const next = structuredClone(state);
  const order: MarketOrder = { id, userEmail: email, symbol: item.symbol, domain: item.domain, side: request.side, type: request.type, quantity: request.quantity, targetPrice: request.type === "MARKET" ? null : request.targetPrice!, status: "PENDING", currency, price: estimate.price, feeUsd: estimate.feeUsd, totalUsd: estimate.totalUsd, reservedCash: request.side === "BUY" ? estimate.cashAmount : 0, createdAt: now, updatedAt: now, note: "Queued. Funds or units reserved; pending operations processing at an eligible price." };
  next.orders.unshift(order);
  if (request.type === "MARKET") fillOrder(next, order, now);
  next.revision++;
  return next;
}
export function cancelCustomerOrder(state: MarketsState, orderId: string, actor: MarketActor, now: string): MarketsState {
  if (actor.role !== "client") throw new Error("Customer access required.");
  const next = structuredClone(state); const order = next.orders.find(item => item.id === orderId);
  if (!order || order.userEmail !== actor.email.toLowerCase() || order.status !== "PENDING") throw new Error("This pending order cannot be cancelled.");
  Object.assign(order, { status: "CANCELLED", reservedCash: 0, updatedAt: now, note: "Cancelled by customer; reservations released." }); next.revision++; return next;
}
export function applyMarketAdminCommand(state: MarketsState, command: MarketAdminCommand, actor: MarketActor, now: string, id: string, processingOrderId?: string): MarketsState {
  if (actor.role !== "admin") throw new Error("Administrator access required.");
  const reason = command.reason.trim(); if (reason.length < 10 || reason.length > 500) throw new Error("An operational reason of 10–500 characters is required.");
  const next = structuredClone(state); let before: unknown = null; let after: unknown = null; let domain: MarketDomain; let target: string;
  if (command.action === "UPDATE" || command.action === "LIQUIDITY") {
    const item = marketInstrument(next, command.symbol); domain = item.domain; target = item.symbol;
    if (item.version !== command.expectedVersion) throw new Error("Instrument changed. Close the dialog and review its latest state.");
    before = structuredClone(item);
    if (command.action === "UPDATE") {
      const v = command.values;
      Object.assign(item, { status: v.status, priceUsd: v.priceUsd, quoteStatus: v.quoteStatus, feeBps: v.feeBps, spreadBps: v.spreadBps, minOrderUsd: v.minOrderUsd, maxOrderUsd: v.maxOrderUsd, fractional: v.fractional, lowLiquidityUsd: v.lowLiquidityUsd });
      if (!item.fractional && next.orders.some(order => order.symbol === item.symbol && order.status === "PENDING" && !Number.isInteger(order.quantity))) throw new Error("Cancel fractional pending orders before disabling fractional trading.");
    } else {
      if (!finite(Math.abs(command.unitsDelta)) || !finite(Math.abs(command.usdDelta)) || (!command.unitsDelta && !command.usdDelta)) throw new Error("Enter a non-zero finite liquidity adjustment.");
      item.reserveUnits = units(item.reserveUnits + command.unitsDelta); item.reserveUsd = money(item.reserveUsd + command.usdDelta);
    }
    validateInstrument(item); item.version++; item.updatedAt = now; after = structuredClone(item);
  } else if (command.action === "CREATE") {
    const item = structuredClone(command.instrument); domain = item.domain; target = item.symbol;
    if (next.instruments.some(existing => existing.symbol === item.symbol)) throw new Error("This symbol is already listed.");
    if (item.status !== "HALTED") throw new Error("New listings must start halted for operational review.");
    validateInstrument(item); item.version = 1; item.updatedAt = now; next.instruments.push(item); after = item;
  } else if (command.action === "ROUTING") {
    domain = command.domain; target = `${domain} routing`;
    const routing = next.routing[domain]; if (!routing || routing.version !== command.expectedVersion) throw new Error("Routing settings changed. Review the latest state.");
    if (!["ACTIVE", "SELL_ONLY", "HALTED"].includes(command.status)) throw new Error("Invalid routing status.");
    before = structuredClone(routing); routing.status = command.status; routing.version++; routing.updatedAt = now; after = structuredClone(routing);
  } else if (command.action === "CANCEL") {
    const order = next.orders.find(order => order.id === command.orderId);
    if (!order || order.status !== "PENDING") throw new Error("Only pending orders can be cancelled.");
    domain = order.domain; target = order.id; before = structuredClone(order);
    Object.assign(order, { status: "CANCELLED", reservedCash: 0, updatedAt: now, note: `Cancelled by bank operations: ${reason}` }); after = structuredClone(order);
  } else {
    domain = command.domain; target = `${domain} order queue`; before = next.orders.filter(order => order.domain === domain && order.status === "PENDING" && (!processingOrderId || order.id === processingOrderId)); before = structuredClone(before);
    // Process in FIFO order. Each attempted fill is transactional; blocked orders remain queued.
    for (const queued of [...next.orders].filter(order => order.domain === domain && order.status === "PENDING" && (!processingOrderId || order.id === processingOrderId)).sort((a,b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))) {
      const working = structuredClone(next); const candidate = working.orders.find(order => order.id === queued.id)!;
      try { fillOrder(working, candidate, now); Object.assign(next, working); }
      catch (error) { const order = next.orders.find(order => order.id === queued.id)!; order.note = error instanceof Error ? error.message : "Execution unavailable."; order.updatedAt = now; }
    }
    after = structuredClone(next.orders.filter(order => (before as MarketOrder[]).some(previous => previous.id === order.id)));
  }
  next.audit.unshift({ id, domain, action: command.action, target, actor: actor.email, reason, timestamp: now, before, after }); next.revision++; return next;
}

export function previewExchange(state: MarketsState, source: string, target: string, amount: number, pricingVersion = 1) {
  if (source === target || !finite(amount, 0.00000001)) throw new Error("Select different assets and enter a positive amount.");
  const sourceItem = state.instruments.find(item => item.symbol === source);
  const targetItem = state.instruments.find(item => item.symbol === target);
  if (!sourceItem && !MOCK_TRADING_FX[source] || !targetItem && !MOCK_TRADING_FX[target]) throw new Error("Unsupported exchange asset.");
  let proceedsUsd = amount * (MOCK_TRADING_FX[source] ?? 1);
  let feeUsd = 0;
  if (sourceItem) {
    const restriction = tradingRestriction(state, sourceItem, "SELL"); if (restriction) throw new Error(restriction);
    const quote = quoteTrade(sourceItem, "SELL", amount); proceedsUsd = quote.totalUsd; feeUsd += quote.feeUsd;
  } else if (money(amount) !== amount) throw new Error("Fiat amounts support at most two decimal places.");
  if (!sourceItem && !targetItem && state.fx_pricing) {
    const p = state.fx_pricing;
    feeUsd = calculateRate(p.policy, Math.round(proceedsUsd * 100), p.tier, p.weekend).fee_minor / 100;
    proceedsUsd -= feeUsd;
  }
  let received = money(proceedsUsd / (MOCK_TRADING_FX[target] ?? 1));
  if (targetItem) {
    const restriction = tradingRestriction(state, targetItem, "BUY"); if (restriction) throw new Error(restriction);
    received = quantityForBudget(targetItem, proceedsUsd, "USD", pricingVersion >= 2);
    feeUsd += quoteTrade(targetItem, "BUY", received).feeUsd;
  }
  if (received <= 0) throw new Error("The amount is too small to exchange.");
  return { received, feeUsd: money(feeUsd), proceedsUsd };
}
export function exchangeAssets(state: MarketsState, source: string, target: string, amount: number, expectedRevision: number, actor: MarketActor, now: string, id: string, pricingVersion = 1): MarketsState {
  if (actor.role !== "client") throw new Error("Use a customer session to trade.");
  if (state.revision !== expectedRevision) throw new Error("Market conditions changed. Review the refreshed quote before confirming again.");
  const preview = previewExchange(state, source, target, amount, pricingVersion);
  const sourceItem = state.instruments.find(item => item.symbol === source);
  const targetItem = state.instruments.find(item => item.symbol === target);
  let next = structuredClone(state);
  const email = actor.email.toLowerCase();
  if (sourceItem) next = submitTrade(next, { symbol: source, side: "SELL", quantity: amount, type: "MARKET", currency: targetItem ? "USD" : target, expectedVersion: sourceItem.version, expectedRoutingVersion: state.routing[sourceItem.domain].version }, actor, now, `${id}-SELL`);
  else {
    if (availableCash(next, email, source) < amount) throw new Error("Insufficient available cash.");
    // For an asset purchase settle directly in the selected fiat currency.
    if (!targetItem) {
      const wallet = next.wallets[email] ??= structuredClone(walletFor(next, email));
      wallet.cash[source] = money(wallet.cash[source] - amount); wallet.cash[target] = money((wallet.cash[target] ?? 0) + preview.received); next.revision++;
    }
  }
  if (targetItem) next = submitTrade(next, { symbol: target, side: "BUY", quantity: preview.received, type: "MARKET", currency: sourceItem ? "USD" : source, expectedVersion: targetItem.version, expectedRoutingVersion: state.routing[targetItem.domain].version }, actor, now, `${id}-BUY`);
  return next;
}
