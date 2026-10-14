import type { OverviewSnapshot, PeriodDetails, TimePeriod } from "@/app/lib/types/dashboard";
import { MOCK_OVERVIEW_ACCOUNTS } from "./overview-accounts";
export const OVERVIEW_AS_OF = "2026-10-14T12:00:00Z";
const days: Record<TimePeriod, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
function history(end: number, starts: number[], spending = false): Record<TimePeriod, PeriodDetails> {
  return Object.fromEntries(Object.entries(days).map(([period, duration], index) => {
    const total = spending ? starts[index] : end;
    const start = spending ? 0 : starts[index];
    const points = Array.from({ length: 16 }, (_, i) => ({
      at: new Date(Date.parse(OVERVIEW_AS_OF) - duration * 86400000 * (1 - i / 15)).toISOString(),
      value: (i === 15 ? total : start + (total - start) * i / 15 + (spending ? 0 : Math.sin(i * 1.8) * (total - start) * 0.09)).toFixed(spending || end > 10 ? 2 : 8),
    }));
    return [period, { points, comparison_value: (spending ? total / (index === 1 ? 0.88 : 1.04) : start).toFixed(8) } satisfies PeriodDetails];
  })) as Record<TimePeriod, PeriodDetails>;
}
export const cryptoHistory = history(2.405, [2.35, 2.1, 1.95, 1.6, 1.1]);
export const stocksHistory = history(45120, [45500, 43200, 41100, 38500, 34000]);
export const expensesHistory = history(0, [340.10, 1840.50, 5910, 12450, 28140], true);
export const marketAssetsData: OverviewSnapshot["assets"] = [
  { id: "m1", name: "Bitcoin", ticker: "BTC", category: "CRYPTO", price: "68430.25", currency: "USD", change_percent: "4.12" },
  { id: "m2", name: "Ethereum", ticker: "ETH", category: "CRYPTO", price: "3842.10", currency: "USD", change_percent: "2.85" },
  { id: "m3", name: "Apple Inc.", ticker: "AAPL", category: "STOCKS", price: "189.84", currency: "USD", change_percent: "-0.45" },
  { id: "m4", name: "Tesla", ticker: "TSLA", category: "STOCKS", price: "177.46", currency: "USD", change_percent: "1.92" },
  { id: "m5", name: "Euro / US Dollar", ticker: "EUR/USD", category: "FOREX", price: "1.0842", currency: "USD", change_percent: "-0.12" },
  { id: "m6", name: "Pound / US Dollar", ticker: "GBP/USD", category: "FOREX", price: "1.2715", currency: "USD", change_percent: "0.08" },
  { id: "m7", name: "Gold / Troy ounce", ticker: "XAU", category: "COMMODITIES", price: "2350.80", currency: "USD", change_percent: "0.64" },
];
export const transfersHistoryData: OverviewSnapshot["transactions"] = [
  { id: "t1", reference: "Stripe Payout", type: "DEPOSIT", amount: "1420.00", currency: "USD", status: "COMPLETED", occurred_at: "2026-10-14T10:22:00Z" },
  { id: "t2", reference: "Rent payment", type: "TRANSFER", amount: "850.00", currency: "USD", status: "PENDING", occurred_at: "2026-10-13T09:15:00Z" },
  { id: "t3", reference: "Card withdrawal", type: "WITHDRAW", amount: "200.00", currency: "USD", status: "FAILED", occurred_at: "2026-10-11T11:00:00Z" },
  { id: "t4", reference: "Salary", type: "DEPOSIT", amount: "4200.00", currency: "USD", status: "COMPLETED", occurred_at: "2026-10-01T08:00:00Z" },
  { id: "t5", reference: "Capital funding", type: "LOAN", amount: "12500.00", currency: "USD", status: "COMPLETED", occurred_at: "2026-09-05T08:00:00Z" },
  { id: "t6", reference: "Swiss custody", type: "TRANSFER", amount: "1000.00", currency: "CHF", status: "COMPLETED", occurred_at: "2026-02-05T08:00:00Z" },
];
export const MOCK_OVERVIEW: OverviewSnapshot = {
  schema_version: 1, as_of: OVERVIEW_AS_OF,
  summary: { liquidity: "142350.80", monthly_change_percent: "4.2", crypto_quantity: "2.40500000", crypto_value: "164578.45", investments: "45120.00", stock_positions: 12, index_positions: 3, credit: "12500.00" },
  accounts: MOCK_OVERVIEW_ACCOUNTS,
  histories: { crypto: cryptoHistory, stocks: stocksHistory, expenses: expensesHistory },
  assets: marketAssetsData, transactions: transfersHistoryData,
};
