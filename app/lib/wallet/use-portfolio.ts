"use client";
import { useTradingPortfolio } from "../markets/projections";
import { MOCK_ASSETS_DATA, MOCK_MACRO_DATA } from "../mock/analytics";
import type { AnalyticsAsset } from "../types/analytics";
import { availableUnits } from "../markets/engine";
import { useUser } from "../../context/UserContext";
import { MOCK_TRADING_FX } from "../markets/seed";

/** Analytics reads quantities and marks from the same customer account projection. */
export function usePortfolio() {
  const portfolio = useTradingPortfolio();
  const { user } = useUser();
  const assets: AnalyticsAsset[] = [
    ...portfolio.fiatAccounts.map(a => ({ id: a.id, symbol: a.currency, name: a.currency, category: "fiat" as const, balance: String(a.balance), priceUsd: MOCK_TRADING_FX[a.currency] ?? 0 })),
    ...portfolio.state.instruments.map(item => ({ id: `account-${item.symbol}`, symbol: item.symbol, name: item.name, category: item.domain === "CRYPTO" ? "crypto" as const : "stock" as const, balance: String(availableUnits(portfolio.state, user?.email ?? "", item.symbol)), priceUsd: item.priceUsd })),
  ].filter(a => Number(a.balance) > 0).map(asset => {
    const fixture = MOCK_ASSETS_DATA.find(item => item.symbol === asset.symbol);
    const value = Number(asset.balance) * asset.priceUsd;
    const history = Object.fromEntries(Object.entries(fixture?.history ?? MOCK_MACRO_DATA).map(([period, points]) => [period, points.map((point, index) => index === points.length - 1 ? { ...point, value } : point)])) as AnalyticsAsset["history"];
    return { ...asset, change24h: fixture?.change24h ?? 0, history };
  });
  const fiatValue = Math.round(assets.filter(a => a.category === "fiat").reduce((sum, a) => sum + Number(a.balance) * a.priceUsd, 0) * 100) / 100;
  return { ...portfolio, assets, fiatValue, totalValue: fiatValue + portfolio.cryptoValue + portfolio.stockValue };
}
