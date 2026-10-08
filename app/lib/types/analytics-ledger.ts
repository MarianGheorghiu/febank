export interface LedgerRow {
  id: string;
  asset: string;
  symbol: string;
  category: "crypto" | "stock" | "fiat";
  allocation: number;
  r7d: number;
  r30d: number;
  r1y: number;
  volatility: string;
  sharpe: number;
  maxDrawdown: string;
  status: "OPTIMAL" | "STABLE" | "HIGH_VOL" | "LIQUIDATING";
}
