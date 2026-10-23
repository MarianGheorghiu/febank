/** Customer analytics read model. Exact decimal strings, UTC dates, USD valuations. */
export type AnalyticsPeriod = "30D" | "90D" | "1Y" | "ALL";
export type AssetKind = "fiat" | "crypto" | "stock";
export interface AnalyticsPosition {
  id: string; symbol: string; name: string; kind: AssetKind; decimals: number;
  available: string; reserved: string; quantity: string; price_usd: string;
  value_usd: string; available_usd: string; reserved_usd: string;
  cost_usd: string | null; unrealized_usd: string | null; allocation_bps: number;
  price_history: { at: string; price_usd: string }[];
}
export interface AnalyticsMovement {
  id: string; at: string; description: string; category: "Cash movement" | "Asset transfer" | "Financing" | "Rewards" | "Investment" | "Exchange";
  direction: "incoming" | "outgoing"; amount: string; currency: string; value_usd: string;
  fee_usd: string; status: "completed" | "pending" | "cancelled" | "rejected";
}
export interface AnalyticsSnapshot {
  schema_version: 1; mode: "demo" | "http"; as_of: string; currency: "USD";
  period: AnalyticsPeriod; from: string | null;
  summary: { assets_usd: string; debt_usd: string; net_worth_usd: string; available_cash_usd: string; reserved_usd: string; investment_usd: string; known_cost_usd: string; known_value_usd: string; unrealized_usd: string | null; basis_coverage_bps: number };
  positions: AnalyticsPosition[];
  allocation: { kind: AssetKind; value_usd: string; weight_bps: number }[];
  history: { at: string; net_worth_usd: string; assets_usd: string; debt_usd: string }[];
  demo_history: AnalyticsSnapshot["history"];
  flows: { at: string; incoming_usd: string; outgoing_usd: string }[];
  cashflow: { incoming_usd: string; outgoing_usd: string; net_usd: string; fees_usd: string; financing_in_usd: string; financing_out_usd: string; rewards_usd: string };
  movements: AnalyticsMovement[];
  debts: { id: string; name: string; type: "Loan" | "Credit line"; principal_usd: string; limit_usd: string | null; next_due: string | null; payment_usd: string | null }[];
  businesses: { id: string; name: string; cash_usd: string; debt_usd: string }[];
  rewards: { available_points: number; expiring_points: number; redeemed_usd: string; cashback_usd: string; pending_requests: number };
  cards: { count: number; active: number; as_of: string; spending: { currency: string; completed: string; pending: string; transactions: number; categories: { name: string; amount: string }[] }[] };
}
export interface AnalyticsRepository { getSnapshot(period: AnalyticsPeriod, signal?: AbortSignal): Promise<AnalyticsSnapshot> }
