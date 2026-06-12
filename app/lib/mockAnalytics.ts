// app/lib/mockAnalytics.ts

export type Timeframe = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";
export type AssetCategory = "fiat" | "crypto" | "stock";

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface AnalyticsAsset {
  id: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  balance: string;
  priceUsd: number;
  change24h: number;
  history: Record<Timeframe, ChartDataPoint[]>;
}

// Generator determinist de date pentru a avea fluxuri curate pe grafice
const generateHistoryPoints = (
  count: number,
  startVal: number,
  volatility: number,
): ChartDataPoint[] => {
  let current = startVal;
  return Array.from({ length: count }).map((_, i) => {
    const change = 1 + (Math.random() * volatility * 2 - volatility);
    current = current * change;
    return {
      date: `${i + 1}`,
      value: Math.round(current * 100) / 100,
    };
  });
};

export const MOCK_MACRO_DATA: Record<Timeframe, ChartDataPoint[]> = {
  "1W": generateHistoryPoints(7, 142000, 0.01),
  "1M": generateHistoryPoints(30, 138000, 0.02),
  "3M": generateHistoryPoints(90, 125000, 0.03),
  "6M": generateHistoryPoints(180, 110000, 0.04),
  "1Y": generateHistoryPoints(365, 95000, 0.05),
  ALL: generateHistoryPoints(500, 60000, 0.07),
};

export const MOCK_ASSETS_DATA: AnalyticsAsset[] = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    category: "crypto",
    balance: "1.34056000",
    priceUsd: 67420.5,
    change24h: 3.45,
    history: {
      "1W": generateHistoryPoints(7, 90300, 0.02),
      "1M": generateHistoryPoints(30, 88000, 0.04),
      "3M": generateHistoryPoints(90, 82000, 0.06),
      "6M": generateHistoryPoints(180, 75000, 0.09),
      "1Y": generateHistoryPoints(365, 62000, 0.12),
      ALL: generateHistoryPoints(500, 32000, 0.2),
    },
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    category: "crypto",
    balance: "14.25000000",
    priceUsd: 3450.25,
    change24h: -1.2,
    history: {
      "1W": generateHistoryPoints(7, 49200, 0.03),
      "1M": generateHistoryPoints(30, 48000, 0.05),
      "3M": generateHistoryPoints(90, 44000, 0.08),
      "6M": generateHistoryPoints(180, 41000, 0.11),
      "1Y": generateHistoryPoints(365, 35000, 0.15),
      ALL: generateHistoryPoints(500, 1800, 0.25),
    },
  },
  {
    id: "aapl",
    name: "Apple Inc.",
    symbol: "AAPL",
    category: "stock",
    balance: "85.0000",
    priceUsd: 182.4,
    change24h: 0.85,
    history: {
      "1W": generateHistoryPoints(7, 15500, 0.01),
      "1M": generateHistoryPoints(30, 15300, 0.015),
      "3M": generateHistoryPoints(90, 15000, 0.03),
      "6M": generateHistoryPoints(180, 14200, 0.05),
      "1Y": generateHistoryPoints(365, 13000, 0.07),
      ALL: generateHistoryPoints(500, 9000, 0.12),
    },
  },
  {
    id: "tsla",
    name: "Tesla Inc.",
    symbol: "TSLA",
    category: "stock",
    balance: "40.0000",
    priceUsd: 178.2,
    change24h: -4.12,
    history: {
      "1W": generateHistoryPoints(7, 7120, 0.03),
      "1M": generateHistoryPoints(30, 7300, 0.04),
      "3M": generateHistoryPoints(90, 7800, 0.06),
      "6M": generateHistoryPoints(180, 8200, 0.09),
      "1Y": generateHistoryPoints(365, 6900, 0.14),
      ALL: generateHistoryPoints(500, 4000, 0.22),
    },
  },
  {
    id: "usd",
    name: "US Dollar",
    symbol: "USD",
    category: "fiat",
    balance: "24500.00",
    priceUsd: 1.0,
    change24h: 0.0,
    history: {
      "1W": generateHistoryPoints(7, 24500, 0.001),
      "1M": generateHistoryPoints(30, 24500, 0.001),
      "3M": generateHistoryPoints(90, 24500, 0.001),
      "6M": generateHistoryPoints(180, 24500, 0.001),
      "1Y": generateHistoryPoints(365, 24500, 0.001),
      ALL: generateHistoryPoints(500, 24500, 0.001),
    },
  },
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    category: "crypto",
    balance: "145.20",
    priceUsd: 142.5,
    change24h: 8.2,
    history: {
      "1W": generateHistoryPoints(7, 120, 0.05),
      "1M": generateHistoryPoints(30, 100, 0.1),
      "3M": generateHistoryPoints(90, 80, 0.15),
      "6M": generateHistoryPoints(180, 60, 0.2),
      "1Y": generateHistoryPoints(365, 40, 0.25),
      ALL: generateHistoryPoints(500, 10, 0.4),
    },
  },
  {
    id: "nvda",
    name: "Nvidia Corp",
    symbol: "NVDA",
    category: "stock",
    balance: "12.00",
    priceUsd: 895.2,
    change24h: 2.15,
    history: {
      "1W": generateHistoryPoints(7, 850, 0.02),
      "1M": generateHistoryPoints(30, 800, 0.04),
      "3M": generateHistoryPoints(90, 700, 0.08),
      "6M": generateHistoryPoints(180, 500, 0.12),
      "1Y": generateHistoryPoints(365, 300, 0.2),
      ALL: generateHistoryPoints(500, 150, 0.3),
    },
  },
  {
    id: "gold",
    name: "Pax Gold",
    symbol: "PAXG",
    category: "crypto",
    balance: "2.50",
    priceUsd: 2350.1,
    change24h: 0.1,
    history: {
      "1W": generateHistoryPoints(7, 2340, 0.005),
      "1M": generateHistoryPoints(30, 2300, 0.01),
      "3M": generateHistoryPoints(90, 2200, 0.02),
      "6M": generateHistoryPoints(180, 2100, 0.03),
      "1Y": generateHistoryPoints(365, 2000, 0.05),
      ALL: generateHistoryPoints(500, 1800, 0.1),
    },
  },
  {
    id: "amd",
    name: "AMD",
    symbol: "AMD",
    category: "stock",
    balance: "55.00",
    priceUsd: 170.4,
    change24h: -1.45,
    history: {
      "1W": generateHistoryPoints(7, 175, 0.02),
      "1M": generateHistoryPoints(30, 180, 0.04),
      "3M": generateHistoryPoints(90, 160, 0.08),
      "6M": generateHistoryPoints(180, 140, 0.12),
      "1Y": generateHistoryPoints(365, 110, 0.2),
      ALL: generateHistoryPoints(500, 80, 0.3),
    },
  },
];
