import { MOCK_MARKETS_STATE } from "../markets/seed";
import { initialTrading, applyTrading, applyTradingAdmin, importLegacyTrading, type WalletTrading, type TradingCommand } from "./trading";
import type { MarketsState, MarketActor, MarketAdminCommand, TradingWallet, MarketOrder } from "../types/admin/markets";
import { MOCK_OVERVIEW } from "../mock/dashboard";
import { applyOperation } from "../overview/engine";
import { applyTransfer, cancelTransfer, decimal, refreshLimits, units, usdValue, priceString } from "../transfers/engine";
import { transferSeed } from "../transfers/seed";
import type { TransferQuote, TransferSnapshot } from "../transfers/contracts";
import type { OverviewOperation, OverviewSnapshot, TransferTransaction } from "../types/dashboard";
import type { CreditCommand, CreditState } from "../loans/contracts";
import { creditSeed } from "../loans/seed";
import { applyCredit, outstanding } from "../loans/engine";
import type { OfferCommand, OffersContext, RewardsState } from "../offers/contracts";
import { rewardsSeed } from "../offers/seed";
import { applyOfferCommand } from "../offers/engine";

export type WalletEvent = (
  | { kind: "rewards"; key: string; at: string; command: OfferCommand; context: OffersContext }
  | { kind: "credit"; key: string; at: string; command: CreditCommand }
  | { kind: "cost_basis"; key: string; at: string; basis: Record<string, string>; actor: MarketActor }
  | { kind: "trading_admin"; key: string; at: string; catalog: MarketsState; command: MarketAdminCommand; actor: MarketActor; customer: string }
  | { kind: "trading_migration"; key: string; at: string; catalog: MarketsState; wallet: TradingWallet; orders: MarketOrder[]; customer: string }
  | { kind: "trading"; key: string; at: string; catalog: MarketsState; command: TradingCommand; actor: MarketActor }
  | { kind: "submit"; key: string; at: string; quote: TransferQuote; overview_operation?: OverviewOperation }
  | { kind: "cancel"; key: string; at: string; transfer_id: string }
  | { kind: "overview"; key: string; at: string; operation: OverviewOperation; legacy?: boolean }) & { prices?: Record<string, string> };
export interface WalletState {
  rewards: RewardsState;
  credit: CreditState;
  trading: WalletTrading;
  transfers: TransferSnapshot;
  cash_operations: { operation: OverviewOperation; at: string }[];
}
export function initialWallet(): WalletState { const transfers = transferSeed();
  // Equities support the same fractional precision as customer trading.
  transfers.accounts = transfers.accounts.map(a => a.kind === "stock" ? { ...a, decimals: 8 } : a);
  for (const item of MOCK_MARKETS_STATE.instruments) {
    if (!transfers.accounts.some(a => a.asset === item.symbol)) transfers.accounts.push({ id: `account-${item.symbol}`, kind: item.domain === "CRYPTO" ? "crypto" : "stock", name: item.name, asset: item.symbol, decimals: 8, available: "0", reserved: "0", usd_price: priceString(item.priceUsd) });
  }
  const custody = transfers.routes.find(route => route.id === "route-AAPL")!;
  for (const account of transfers.accounts.filter(a => a.kind === "stock")) {
    if (!transfers.routes.some(route => route.asset === account.asset)) transfers.routes.push({ ...structuredClone(custody), id: `route-${account.asset}`, asset: account.asset });
  }
  return { rewards: rewardsSeed(), credit: creditSeed(), transfers, cash_operations: [], trading: initialTrading() }; }
export function applyWalletEvent(state: WalletState, event: WalletEvent): WalletState {
  if (!event || !event.key?.trim() || !Number.isFinite(Date.parse(event.at))) throw new Error("Invalid wallet operation.");
  if (event.prices) {
    state = structuredClone(state);
    for (const account of state.transfers.accounts) if (event.prices[account.asset] !== undefined) { units(event.prices[account.asset], 8); account.usd_price = event.prices[account.asset]; }
  }
  if (event.kind === "rewards") {
    const result = applyOfferCommand(state.rewards, event.context, event.command, event.key, event.at);
    const next = structuredClone(state);
    next.rewards = result.rewards;
    const usd = next.transfers.accounts.find(account => account.id === "account-USD")!;
    usd.available = decimal(units(usd.available, 2) + units(result.cash_credit, 2), 2);
    return next;
  }
  if (event.kind === "credit") {
    const result = applyCredit(state.credit, state.transfers.accounts, event.command, event.key, event.at);
    const next = structuredClone(state);
    next.credit = result.credit;
    const usd = next.transfers.accounts.find(account => account.id === "account-USD")!;
    usd.available = decimal(units(usd.available, 2) + result.personal_delta, 2);
    return next;
  }
  if (event.kind === "cost_basis") {
    if (event.actor.role !== "client" || !event.actor.email.trim()) throw new Error("Customer session required.");
    const next = structuredClone(state);
    for (const [symbol, basis] of Object.entries(event.basis)) {
      if (!next.transfers.accounts.some(account => account.kind === "stock" && account.asset === symbol) || units(basis, 8) <= BigInt(0)) throw new Error("Invalid opening stock cost basis.");
      next.trading.cost_basis[symbol] ??= Number(basis);
    }
    return next;
  }
  if (event.kind === "trading_admin") return applyTradingAdmin(state, event.catalog, event.customer, event.command, event.actor, event.at, event.key).state;
  if (event.kind === "trading_migration") return importLegacyTrading(state, event.catalog, event.wallet, event.orders, event.customer);
  if (event.kind === "trading") return applyTrading(state, event.catalog, event.command, event.actor, event.at, event.key).state;
  if (event.kind === "submit") {
    const quote = structuredClone(event.quote);
    const account = state.transfers.accounts.find(a => a.id === quote.draft.source_account_id);
    if (account?.kind === "stock" && !quote.draft.amount.includes(".")) {
      quote.draft.amount = decimal(units(quote.draft.amount, account.decimals), account.decimals);
      quote.total = decimal(units(quote.total, account.decimals), account.decimals);
    }
    return { ...state, transfers: applyTransfer(state.transfers, quote, `trf-${event.key}`, event.at) };
  }
  if (event.kind === "cancel") return { ...state, transfers: cancelTransfer(state.transfers, event.transfer_id, event.at) };
  if (event.kind !== "overview" || event.operation.id !== event.key) throw new Error("Unsupported wallet operation.");
  if (event.operation.type === "transfer" && !event.legacy) throw new Error("Transfers require a quote.");
  const next = structuredClone(state);
  const usd = next.transfers.accounts.find(a => a.asset === "USD")!;
  // Reuse the existing cash/beneficiary validation against the actual shared available balance.
  const validation = structuredClone(MOCK_OVERVIEW);
  validation.summary.liquidity = usd.available;
  validation.transactions = [];
  const result = applyOperation(validation, event.operation, event.at);
  usd.available = result.summary.liquidity;
  if (event.operation.type === "transfer") {
    next.transfers.transfers.unshift({ id: `trf-${event.key}`, account_id: usd.id, kind: "fiat", asset: "USD", amount: decimal(units(event.operation.amount, 2), 2), fee: "0.00", value_usd: decimal(units(event.operation.amount, 2), 2), direction: "outgoing", recipient_name: event.operation.recipient_name!.trim(), destination: event.operation.recipient!.replace(/\s/g, ""), route_id: event.operation.recipient_kind === "phone" ? "phone-USD" : "route-USD", reference: "Overview transfer", status: "completed", created_at: event.at, updated_at: event.at, can_cancel: false });
  } else next.cash_operations.push({ operation: structuredClone(event.operation), at: event.at });
  next.transfers = refreshLimits(next.transfers, event.at);
  return next;
}
export function valuation(snapshot: Pick<TransferSnapshot, "accounts">, kind: "crypto" | "stock") {
  return snapshot.accounts.filter(a => a.kind === kind).reduce((sum, a) => {
    return sum + usdValue(units(a.available, a.decimals), a.decimals, a.usd_price, "nearest");
  }, BigInt(0));
}
export function projectOverview(state: WalletState, now: string): OverviewSnapshot {
  const result = structuredClone(MOCK_OVERVIEW);
  const wallet = state.transfers;
  result.as_of = now;
  result.summary.liquidity = wallet.accounts.find(a => a.asset === "USD")!.available;
  result.summary.credit = outstanding(state.credit, "personal");
  result.summary.crypto_quantity = wallet.accounts.find(a => a.asset === "BTC")?.available ?? "0";
  result.summary.crypto_value = decimal(valuation(wallet, "crypto"), 2);
  result.summary.investments = decimal(valuation(wallet, "stock"), 2);
  result.summary.stock_positions = wallet.accounts.filter(a => a.kind === "stock" && units(a.available, a.decimals) > BigInt(0)).length;
  result.summary.index_positions = 0;
  result.accounts = wallet.accounts.filter(a => a.kind === "fiat").map(a => ({ code: a.asset, balance: a.available, rate_to_eur: (Number(a.usd_price) / 1.08).toFixed(8) }));
  result.assets = result.assets.map(asset => {
    const account = wallet.accounts.find(a => a.asset === asset.ticker);
    return account ? { ...asset, price: account.usd_price } : asset;
  });
  const cash: TransferTransaction[] = state.cash_operations.map(({ operation, at }) => ({ id: operation.id, reference: operation.type === "deposit" ? "Deposit" : "Withdrawal", type: operation.type === "deposit" ? "DEPOSIT" : "WITHDRAW", amount: decimal(units(operation.amount, 2), 2), currency: "USD", status: "COMPLETED", occurred_at: at }));
  const transfers: TransferTransaction[] = wallet.transfers.map(t => ({ id: t.id, reference: `${t.direction === "incoming" ? "From" : "To"} ${t.recipient_name}`, type: "TRANSFER", amount: t.amount, currency: t.asset, status: t.status === "completed" ? "COMPLETED" : t.status === "cancelled" ? "CANCELLED" : t.status === "rejected" ? "FAILED" : "PENDING", direction: t.direction, occurred_at: t.created_at }));
  const credit: TransferTransaction[] = state.credit.activity.filter(entry => entry.scope === "personal" && entry.amount !== null).map(entry => ({ id: entry.id, reference: entry.description, type: "LOAN", amount: entry.amount!, currency: "USD", status: "COMPLETED", direction: entry.action === "draw" ? "incoming" : "outgoing", occurred_at: entry.at }));
  const rewards: TransferTransaction[] = state.rewards.entries.filter(entry => entry.kind === "spent" && entry.cash !== null).map(entry => ({ id: entry.id, reference: entry.description, type: "DEPOSIT", amount: entry.cash!, currency: "USD", status: "COMPLETED", direction: "incoming", occurred_at: entry.at }));
  result.transactions = [...cash, ...transfers, ...credit, ...rewards, ...result.transactions.filter(t => t.type !== "TRANSFER")].sort((a,b) => b.occurred_at.localeCompare(a.occurred_at));
  for (const history of Object.values(result.histories.crypto)) history.points[history.points.length - 1] = { at: now, value: result.summary.crypto_quantity };
  for (const history of Object.values(result.histories.stocks)) history.points[history.points.length - 1] = { at: now, value: result.summary.investments };
  return result;
}
