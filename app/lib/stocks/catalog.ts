import { STOCKS_CATALOG } from "../mock/stock-catalog";
import { MOCK_MARKET_ASSETS, MOCK_STOCK_HOLDINGS } from "../mock/stocks";
import { tradingRestriction } from "../markets/engine";
import { STOCK_PERIODS, type StockInstrument } from "./contracts";
import type { MarketsState } from "../types/admin/markets";
export function stockCatalog(state: MarketsState): StockInstrument[] {
  return state.instruments.filter(item => item.domain === "STOCK").map(item => {
    const metadata = MOCK_MARKET_ASSETS.find(asset => asset.symbol === item.symbol);
    const detail = STOCKS_CATALOG[item.symbol];
    const sector = item.symbol === "TSLA" ? "Consumer discretionary" : MOCK_STOCK_HOLDINGS.find(asset => asset.symbol === item.symbol)?.sector ?? (metadata?.category === "ETFs" ? "ETFs" : metadata?.category === "Oil & Gas" || metadata?.category === "Green Energy" ? "Energy" : metadata?.category === "AI & Robotics" || metadata?.category === "Big Tech" ? "Tech" : "Unclassified");
    const cap = metadata?.marketCap ?? detail?.stats.find(stat => stat.label === "Market Cap")?.value ?? "—";
    const stats = structuredClone(detail?.stats ?? []).map(stat => stat.label === "Market Cap" ? { ...stat, value: cap, unit: "USD" } : stat);
    const buy = tradingRestriction(state, item, "BUY"), sell = tradingRestriction(state, item, "SELL");
    return { symbol: item.symbol, name: item.name, exchange: detail?.exchange ?? item.venue, price_usd: item.priceUsd.toFixed(8), change_24h: metadata?.change24h.toFixed(2) ?? detail?.changePercent.toFixed(2) ?? null, change_7d: metadata?.change7d.toFixed(2) ?? null, volume: metadata?.volume ?? "—", market_cap: cap, category: metadata?.category ?? "Unclassified", sector, region: metadata?.region ?? "US", fractional: item.fractional, can_buy: !buy, can_sell: !sell, buy_restriction: buy, sell_restriction: sell, fee_bps: item.feeBps, spread_bps: item.spreadBps, min_order_usd: item.minOrderUsd.toFixed(2), max_order_usd: item.maxOrderUsd.toFixed(2), stats, news: structuredClone(detail?.news ?? []), charts: Object.fromEntries(STOCK_PERIODS.map(period => {
      const original = detail?.chart[period];
      const scale = original?.length ? item.priceUsd / original[original.length - 1].close : 1;
      const fallback = [0.9, 0.918, 0.913, 0.943, 0.932, 0.961, 0.95, 0.978, 0.969, 1];
      const points = original?.length ? original : fallback.map((factor, index) => ({ name: period === "1D" ? `${9 + index}:30` : `${index + 1}`, open: (fallback[Math.max(0, index - 1)] ?? factor) * item.priceUsd, high: (Math.max(factor, fallback[Math.max(0, index - 1)]) + 0.012) * item.priceUsd, low: (Math.min(factor, fallback[Math.max(0, index - 1)]) - 0.012) * item.priceUsd, close: factor * item.priceUsd }));
      return [period, points.map(point => ({ label: point.name, open: (point.open * scale).toFixed(8), high: (Math.max(point.high, point.open, point.close) * scale).toFixed(8), low: (Math.min(point.low, point.open, point.close) * scale).toFixed(8), close: (point.close * scale).toFixed(8) }))];
    })) as StockInstrument["charts"] };
  });
}
