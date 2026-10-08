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
