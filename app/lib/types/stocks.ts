export interface StockHolding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  sector: "Tech" | "Healthcare" | "Energy" | "ETFs" | "Unclassified";
  change24h: number;
}

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume: string;
  marketCap: string;
  category:
    | "Unclassified"
    | "Big Tech"
    | "AI & Robotics"
    | "Green Energy"
    | "Metals"
    | "Oil & Gas"
    | "Dividends"
    | "ETFs";
  region: "US" | "EU" | "GLOBAL";
  isFractional: boolean;
}
