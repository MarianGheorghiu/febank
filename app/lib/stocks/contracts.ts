import type { CurrencySnapshot } from "../currencies/contracts";
import type { StockCatalog } from "../types/stock-catalog";
export const STOCK_PERIODS = ["1D", "1W", "1M", "1Y", "ALL"] as const;
export type StockPeriod = typeof STOCK_PERIODS[number];
export interface StockCandle { label: string; open: string; high: string; low: string; close: string }
export interface StockInstrument {
  symbol: string; name: string; exchange: string; price_usd: string; change_24h: string | null; change_7d: string | null;
  volume: string; market_cap: string; category: string; sector: string; region: string; fractional: boolean;
  can_buy: boolean; can_sell: boolean; buy_restriction: string | null; sell_restriction: string | null;
  min_order_usd: string; max_order_usd: string; fee_bps: number; spread_bps: number;
  stats: StockCatalog[string]["stats"]; news: StockCatalog[string]["news"]; charts: Record<StockPeriod, StockCandle[]>;
}
export interface StockPosition { symbol: string; name: string; sector: string; quantity: string; reserved: string; average_cost_usd: string; price_usd: string; value_usd: string; cost_usd: string; unrealized_usd: string; unrealized_percent: string }
export interface StockOrder { id: string; created_at: string; symbol: string; side: "BUY" | "SELL"; type: "MARKET" | "LIMIT" | "STOP"; status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED"; quantity: string; price_usd: string; target_price_usd: string | null; fee_usd: string; total_usd: string; currency: string; reserved_cash: string; note: string }
export type PlanFrequency = "Daily" | "Weekly" | "Bi-Weekly" | "Monthly";
export interface StockPlanDraft { symbol: string; amount_usd: string; frequency: PlanFrequency; starts_on: string }
export interface StockPlan extends StockPlanDraft { id: string; name: string; status: "ACTIVE" | "PAUSED"; version: number; next_run: string; day: string }
export interface StockDividend { id: string; symbol: string; company: string; ex_date: string; pay_date: string; amount_per_share_usd: string; eligible_quantity: string; estimated_payout_usd: string; paid_amount_usd: string; status: "PENDING" | "UPCOMING" | "PAID" }
export interface StocksSnapshot { schema_version: 1; as_of: string; wallet: CurrencySnapshot; portfolio_history: Record<StockPeriod, { label: string; value_usd: string }[]>; market: StockInstrument[]; holdings: StockPosition[]; orders: StockOrder[]; plans: StockPlan[]; dividends: StockDividend[] }
export interface StockOrderDraft { symbol: string; side: "BUY" | "SELL"; type: "MARKET" | "LIMIT" | "STOP"; quantity: string; currency: string; target_price_usd: string | null }
export interface StockQuote { id: string; draft: StockOrderDraft; execution_price_usd: string; fee_usd: string; total_usd: string; settlement_amount: string; status: "PENDING" | "FILLED"; expires_at: string }
export type StockPlanCommand = { type: "create_plan"; draft: StockPlanDraft } | { type: "update_plan"; id: string; expected_version: number; draft: StockPlanDraft } | { type: "set_plan_status"; id: string; expected_version: number; status: StockPlan["status"] };
export interface StocksRepository { getSnapshot(signal?: AbortSignal): Promise<StocksSnapshot>; quote(draft: StockOrderDraft): Promise<StockQuote>; submit(quote_id: string, key: string): Promise<StocksSnapshot>; cancel(order_id: string, key: string): Promise<StocksSnapshot>; execute(command: StockPlanCommand, key: string): Promise<StocksSnapshot> }
