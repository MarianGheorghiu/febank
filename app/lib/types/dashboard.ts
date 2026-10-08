export type TimePeriod = "1W" | "1M" | "3M" | "6M" | "1Y";

export interface PeriodDetails {
  val: string;
  change: string;
  pos: boolean;
  data: number[];
  labels: string[];
}

export interface MarketAsset {
  id: string;
  name: string;
  ticker: string;
  category: "CRYPTO" | "STOCKS" | "FOREX" | "COMMODITIES";
  price: string;
  change: string;
  pos: boolean;
}

export type TransferPeriod =
  | "1D"
  | "3D"
  | "1W"
  | "2W"
  | "1M"
  | "3M"
  | "6M"
  | "1Y";

export interface TransferTransaction {
  id: string;
  reference: string;
  type: "DEPOSIT" | "WITHDRAW" | "TRANSFER" | "LOAN";
  amount: string;
  currency: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  date: string;
}
