export interface RecurringBuy {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  frequency: string;
  day: string;
  nextRun: string;
  status: "ACTIVE" | "PAUSED";
}

export interface RecurringAsset {
  symbol: string;
  name: string;
  type: "Crypto" | "Stock" | "ETF";
}
