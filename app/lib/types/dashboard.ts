/** Exact base-10 values on the wire; Go should decode these into a decimal type. */
export type Decimal = string;
export type TimePeriod = "1W" | "1M" | "3M" | "6M" | "1Y";
export type TransferPeriod = "1D" | "3D" | "1W" | "2W" | "1M" | "3M" | "6M" | "1Y";
export interface HistoryPoint { at: string; value: Decimal }
export interface PeriodDetails { points: HistoryPoint[]; comparison_value: Decimal }
export interface MarketAsset {
  id: string; name: string; ticker: string;
  category: "CRYPTO" | "STOCKS" | "FOREX" | "COMMODITIES";
  price: Decimal; currency: string; change_percent: Decimal;
}
export interface TransferTransaction {
  id: string; reference: string;
  type: "DEPOSIT" | "WITHDRAW" | "TRANSFER" | "LOAN";
  amount: Decimal; currency: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | "CANCELLED";
  direction?: "incoming" | "outgoing";
  occurred_at: string;
}
export interface OverviewSnapshot {
  schema_version: 1; as_of: string;
  summary: { liquidity: Decimal; monthly_change_percent: Decimal; crypto_quantity: Decimal; crypto_value: Decimal; investments: Decimal; stock_positions: number; index_positions: number; credit: Decimal };
  accounts: import("./overview-accounts").CurrencyAccount[];
  histories: Record<"crypto" | "stocks" | "expenses", Record<TimePeriod, PeriodDetails>>;
  assets: MarketAsset[]; transactions: TransferTransaction[];
}
export interface OverviewOperation {
  id: string; type: "deposit" | "withdraw" | "transfer"; amount: Decimal;
  recipient_name?: string; recipient_kind?: "iban" | "phone"; recipient?: string;
}
