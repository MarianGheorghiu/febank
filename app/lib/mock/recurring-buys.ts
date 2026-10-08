import type { RecurringBuy, RecurringAsset } from "@/app/lib/types/recurring-buys";

export const MOCK_DCA: RecurringBuy[] = [
  {
    id: "dca_1",
    symbol: "VOO",
    name: "Vanguard S&P 500",
    amount: 150,
    frequency: "Monthly",
    day: "25th",
    nextRun: "2026-06-25",
    status: "ACTIVE",
  },
  {
    id: "dca_2",
    symbol: "AAPL",
    name: "Apple Inc.",
    amount: 25,
    frequency: "Weekly",
    day: "Mondays",
    nextRun: "2026-06-15",
    status: "ACTIVE",
  },
  {
    id: "dca_3",
    symbol: "BTC",
    name: "Bitcoin",
    amount: 50,
    frequency: "Bi-Weekly",
    day: "Fridays",
    nextRun: "2026-06-12",
    status: "PAUSED",
  },
];

export const AVAILABLE_ASSETS: RecurringAsset[] = [
  { symbol: "BTC", name: "Bitcoin", type: "Crypto" },
  { symbol: "ETH", name: "Ethereum", type: "Crypto" },
  { symbol: "SOL", name: "Solana", type: "Crypto" },
  { symbol: "AAPL", name: "Apple Inc.", type: "Stock" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "Stock" },
  { symbol: "NVDA", name: "NVIDIA Corp.", type: "Stock" },
  { symbol: "VOO", name: "Vanguard S&P 500", type: "ETF" },
  { symbol: "QQQ", name: "Invesco QQQ", type: "ETF" },
];
