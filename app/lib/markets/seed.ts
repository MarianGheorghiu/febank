import { transferSeed } from "../transfers/seed";
import { MOCK_MARKET } from "../mock/crypto";
import { MOCK_MARKET_ASSETS, MOCK_STOCK_HOLDINGS } from "../mock/stocks";
import { MOCK_CRYPTO, MOCK_FIAT, MOCK_STOCKS } from "../mock/currencies";
import { MOCK_BALANCES } from "../mock/balances";
import type { MarketsState, TradingInstrument, TradingWallet } from "@/app/lib/types/admin/markets";

export const MOCK_MARKET_DATE = "2026-10-08T08:00:00Z";
export const MOCK_TRADING_FX: Record<string, number> = Object.fromEntries(transferSeed().accounts.filter(a => a.kind === "fiat").map(a => [a.asset, Number(a.usd_price)]));
const instrument = (symbol: string, name: string, domain: TradingInstrument["domain"], priceUsd: number, venue: string): TradingInstrument => ({
  symbol, name, domain, venue, priceUsd, status: "ACTIVE", quoteStatus: "HEALTHY",
  feeBps: domain === "CRYPTO" ? 25 : 10, spreadBps: domain === "CRYPTO" ? 15 : 5,
  minOrderUsd: 1, maxOrderUsd: 25000, fractional: true,
  reserveUnits: Math.round(1000000 / priceUsd * 1e6) / 1e6, reserveUsd: 1000000,
  lowLiquidityUsd: 50000, version: 1, updatedAt: MOCK_MARKET_DATE,
});
const instruments = [
  ...MOCK_MARKET.map(asset => instrument(asset.symbol, asset.name, "CRYPTO", asset.price, asset.symbol === "BTC" ? "Bitcoin" : asset.symbol === "SOL" ? "Solana" : asset.symbol === "ADA" ? "Cardano" : asset.symbol === "DOT" ? "Polkadot" : "Ethereum")),
  instrument("USDT", "Tether USD", "CRYPTO", 1, "Ethereum / multi-chain"),
  ...MOCK_MARKET_ASSETS.map(asset => instrument(asset.symbol, asset.name, "STOCK", asset.price, asset.region === "EU" ? "Europe • USD quote" : "US equities • USD")),
  ...MOCK_STOCK_HOLDINGS.filter(asset => !MOCK_MARKET_ASSETS.some(item => item.symbol === asset.symbol)).map(asset => instrument(asset.symbol, asset.name, "STOCK", asset.currentPrice, "US equities • USD")),
  ...MOCK_STOCKS.filter(asset => !MOCK_MARKET_ASSETS.some(item => item.symbol === asset.symbol) && !MOCK_STOCK_HOLDINGS.some(item => item.symbol === asset.symbol)).map(asset => instrument(asset.symbol, asset.name, "STOCK", asset.value / asset.shares, "US equities • USD")),
];
// The opening account price is shared with Overview and Transfers.
for (const item of instruments) {
  const opening = transferSeed().accounts.find(account => account.asset === item.symbol);
  if (opening) item.priceUsd = Number(opening.usd_price);
}
export const MOCK_TRADING_WALLET: TradingWallet = {
  cash: { USD: MOCK_BALANCES.stockAvailableUsd, EUR: MOCK_FIAT.filter(item => item.currency === "EUR").reduce((sum, item) => sum + item.balance, 0), RON: MOCK_FIAT.filter(item => item.currency === "RON").reduce((sum, item) => sum + item.balance, 0) },
  units: { ...Object.fromEntries(MOCK_CRYPTO.map(item => [item.symbol, item.balance])), ...Object.fromEntries(MOCK_STOCK_HOLDINGS.map(item => [item.symbol, item.shares])) },
  costBasis: Object.fromEntries(MOCK_STOCK_HOLDINGS.map(item => [item.symbol, item.avgCost])),
};
export const MOCK_MARKETS_STATE: MarketsState = {
  revision: 0, instruments, wallets: {}, orders: [], audit: [],
  routing: { CRYPTO: { status: "ACTIVE", version: 1, updatedAt: MOCK_MARKET_DATE }, STOCK: { status: "ACTIVE", version: 1, updatedAt: MOCK_MARKET_DATE } },
};
