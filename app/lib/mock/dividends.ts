import type { Dividend } from "@/app/lib/types/dividends";

export const MOCK_DIVIDENDS: Dividend[] = [
  {
    id: 1,
    symbol: "KO",
    company: "Coca-Cola Co.",
    exDate: "2026-06-01",
    payDate: "2026-06-15",
    amountPerShare: 0.485,
    sharesOwned: 50,
    status: "PENDING",
  },
  {
    id: 2,
    symbol: "AAPL",
    company: "Apple Inc.",
    exDate: "2026-06-10",
    payDate: "2026-06-22",
    amountPerShare: 0.25,
    sharesOwned: 15,
    status: "UPCOMING",
  },
  {
    id: 3,
    symbol: "XOM",
    company: "Exxon Mobil",
    exDate: "2026-06-20",
    payDate: "2026-07-05",
    amountPerShare: 0.95,
    sharesOwned: 120,
    status: "UPCOMING",
  },
  {
    id: 4,
    symbol: "PFE",
    company: "Pfizer Inc.",
    exDate: "2026-05-10",
    payDate: "2026-06-01",
    amountPerShare: 0.42,
    sharesOwned: 210,
    status: "PAID",
  },
];
