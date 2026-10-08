export interface CryptoMarketAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume: string;
  cap: string;
  sparkline: number[];
}

export interface CryptoHistoryPoint {
  date: string;
  valoare: number;
}
export type CryptoTimeframe = "1D" | "1W" | "1M" | "1Y" | "ALL";
