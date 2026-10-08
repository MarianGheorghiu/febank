export type MarketDomain = "CRYPTO" | "STOCK";
export type MarketStatus = "ACTIVE" | "SELL_ONLY" | "HALTED";
export interface TradingInstrument {
  symbol: string; name: string; domain: MarketDomain; venue: string;
  status: MarketStatus; priceUsd: number; quoteStatus: "HEALTHY" | "STALE";
  feeBps: number; spreadBps: number; minOrderUsd: number; maxOrderUsd: number;
  fractional: boolean; reserveUnits: number; reserveUsd: number; lowLiquidityUsd: number;
  version: number; updatedAt: string;
}
export interface MarketRouting {
  status: MarketStatus; version: number; updatedAt: string;
}
export interface TradingWallet { cash: Record<string, number>; units: Record<string, number>; costBasis: Record<string, number> }
export interface MarketOrder {
  id: string; userEmail: string; symbol: string; domain: MarketDomain; side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | "STOP"; quantity: number; targetPrice: number | null;
  status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED";
  price: number; feeUsd: number; totalUsd: number; currency: string;
  reservedCash: number; createdAt: string; updatedAt: string; note: string;
}
export interface MarketAudit {
  id: string; domain: MarketDomain; action: string; target: string; actor: string;
  reason: string; timestamp: string; before: unknown; after: unknown;
}
export interface MarketsState {
  revision: number; instruments: TradingInstrument[]; routing: Record<MarketDomain, MarketRouting>;
  wallets: Record<string, TradingWallet>; orders: MarketOrder[]; audit: MarketAudit[];
}
export interface MarketActor { email: string; role: "admin" | "client" }
export type MarketAdminCommand =
  | { action: "UPDATE"; symbol: string; expectedVersion: number; values: Pick<TradingInstrument, "status" | "priceUsd" | "quoteStatus" | "feeBps" | "spreadBps" | "minOrderUsd" | "maxOrderUsd" | "fractional" | "lowLiquidityUsd">; reason: string }
  | { action: "LIQUIDITY"; symbol: string; expectedVersion: number; unitsDelta: number; usdDelta: number; reason: string }
  | { action: "CREATE"; instrument: TradingInstrument; reason: string }
  | { action: "ROUTING"; domain: MarketDomain; status: MarketStatus; expectedVersion: number; reason: string }
  | { action: "CANCEL"; orderId: string; reason: string }
  | { action: "PROCESS"; domain: MarketDomain; reason: string };
export interface TradeRequest {
  symbol: string; side: "BUY" | "SELL"; quantity: number;
  type: MarketOrder["type"]; targetPrice?: number; currency?: string;
  expectedVersion: number; expectedRoutingVersion: number;
}
export interface TradeQuote { price: number; notionalUsd: number; feeUsd: number; totalUsd: number; cashAmount: number }
