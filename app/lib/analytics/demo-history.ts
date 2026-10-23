import type { AnalyticsPosition, AnalyticsSnapshot } from "./contracts";
import { decimal, units, usdValue } from "../transfers/engine";
const signedMoney = (value: bigint) => `${value < BigInt(0) ? "-" : ""}${decimal(value < BigInt(0) ? -value : value, 2)}`;
/** Deterministic demo quotes only. Never used by the HTTP adapter or for investment returns. */
export function demoPriceHistory(position: Pick<AnalyticsPosition, "symbol" | "kind" | "price_usd">, now: string) {
  const seed = [...position.symbol].reduce((total, char) => total * 31 + char.charCodeAt(0), 7) >>> 0;
  const end = new Date(now); end.setUTCHours(0, 0, 0, 0);
  const amplitude = position.symbol === "USD" ? 0 : position.kind === "fiat" ? .018 : position.kind === "crypto" ? .18 : .1;
  const shape = (day: number) => Math.sin(day * .055 + seed % 13) * .6 + Math.sin(day * .19 + seed % 7) * .24 + Math.sin(day * 1.31 + seed % 19) * .04 + day / 365 * .4;
  return Array.from({ length: 366 }, (_, index) => {
    const date = new Date(end); date.setUTCDate(date.getUTCDate() - 365 + index);
    return { at: index === 365 ? now : date.toISOString(), price_usd: (Number(position.price_usd) * (1 + amplitude * (shape(index) - shape(365)))).toFixed(8) };
  });
}
export function demoPortfolioHistory(positions: AnalyticsPosition[], debt: string, now: string): AnalyticsSnapshot["history"] {
  if (!positions.length) return [{ at: now, assets_usd: "0.00", debt_usd: debt, net_worth_usd: signedMoney(-units(debt, 2)) }];
  return positions[0].price_history.map((point, index) => {
    const assets = positions.reduce((sum, position) => sum + usdValue(units(position.quantity, position.decimals), position.decimals, position.price_history[index].price_usd, "nearest"), BigInt(0));
    return { at: point.at, assets_usd: decimal(assets, 2), debt_usd: debt, net_worth_usd: signedMoney(assets - units(debt, 2)) };
  });
}
