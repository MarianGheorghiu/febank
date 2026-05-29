// app/lib/mockData.ts

export type TimePeriod = "1W" | "1M" | "3M" | "6M" | "1Y";

export interface PeriodDetails {
  val: string;
  change: string;
  pos: boolean;
  data: number[];
  labels: string[];
}

export const cryptoHistory: Record<TimePeriod, PeriodDetails> = {
  "1W": {
    val: "2.405 BTC",
    change: "+1.2%",
    pos: true,
    labels: ["22 May", "25 May", "29 May"],
    data: [2.35, 2.39, 2.405],
  },
  "1M": {
    val: "2.405 BTC",
    change: "+6.8%",
    pos: true,
    labels: ["W1", "W2", "W3", "W4"],
    data: [2.1, 2.25, 2.32, 2.405],
  },
  "3M": {
    val: "2.405 BTC",
    change: "+18.4%",
    pos: true,
    labels: ["Mar", "Apr", "May"],
    data: [1.95, 2.12, 2.05, 2.38, 2.405],
  },
  "6M": {
    val: "2.405 BTC",
    change: "+32.1%",
    pos: true,
    labels: ["Dec", "Feb", "Apr", "May"],
    data: [1.6, 1.85, 1.72, 2.1, 2.25, 2.405],
  },
  "1Y": {
    val: "2.405 BTC",
    change: "+74.2%",
    pos: true,
    labels: ["Jun 25", "Sep 25", "Dec 25", "Mar 26", "May 26"],
    data: [1.1, 1.45, 1.32, 1.8, 2.15, 2.405],
  },
};

export const stocksHistory: Record<TimePeriod, PeriodDetails> = {
  "1W": {
    val: "$45,120.00",
    change: "-0.4%",
    pos: false,
    labels: ["22 May", "25 May", "29 May"],
    data: [45500, 44900, 45120],
  },
  "1M": {
    val: "$45,120.00",
    change: "+3.5%",
    pos: true,
    labels: ["W1", "W2", "W3", "W4"],
    data: [43200, 44100, 43900, 45120],
  },
  "3M": {
    val: "$45,120.00",
    change: "+9.1%",
    pos: true,
    labels: ["Mar", "Apr", "May"],
    data: [41100, 42900, 42500, 44800, 45120],
  },
  "6M": {
    val: "$45,120.00",
    change: "+14.8%",
    pos: true,
    labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    data: [38500, 40100, 41200, 43000, 42900, 45120],
  },
  "1Y": {
    val: "$45,120.00",
    change: "+24.5%",
    pos: true,
    labels: ["Jun 25", "Sep 25", "Dec 25", "Mar 26", "May 26"],
    data: [34000, 36500, 39000, 42100, 41000, 45120],
  },
};

export const expensesHistory: Record<TimePeriod, PeriodDetails> = {
  "1W": {
    val: "$340.10",
    change: "Within safety index",
    pos: true,
    labels: ["22 May", "25 May", "29 May"],
    data: [50, 180, 340],
  },
  "1M": {
    val: "$1,840.50",
    change: "-12% vs last month",
    pos: true,
    labels: ["W1", "W2", "W3", "W4"],
    data: [400, 950, 1400, 1840],
  },
  "3M": {
    val: "$5,910.00",
    change: "+4.2% acceleration",
    pos: false,
    labels: ["Mar", "Apr", "May"],
    data: [1500, 3200, 4100, 5200, 5910],
  },
  "6M": {
    val: "$12,450.00",
    change: "-2.1% dynamically optimized",
    pos: true,
    labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    data: [2000, 4500, 6800, 9100, 11200, 12450],
  },
  "1Y": {
    val: "$28,140.00",
    change: "Annual structure standard",
    pos: true,
    labels: ["Jun 25", "Sep 25", "Dec 25", "Mar 26", "May 26"],
    data: [3000, 8000, 14000, 19500, 24000, 28140],
  },
};

// Adaugă la finalul fișierului app/lib/mockData.ts

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

export const marketAssetsData: MarketAsset[] = [
  {
    id: "m1",
    name: "Bitcoin",
    ticker: "BTC",
    category: "CRYPTO",
    price: "$68,430.25",
    change: "+4.12%",
    pos: true,
  },
  {
    id: "m2",
    name: "Ethereum",
    ticker: "ETH",
    category: "CRYPTO",
    price: "$3,842.10",
    change: "+2.85%",
    pos: true,
  },
  {
    id: "m3",
    name: "Apple Inc.",
    ticker: "AAPL",
    category: "STOCKS",
    price: "$189.84",
    change: "-0.45%",
    pos: false,
  },
  {
    id: "m4",
    name: "Tesla Motors",
    ticker: "TSLA",
    category: "STOCKS",
    price: "$177.46",
    change: "+1.92%",
    pos: true,
  },
  {
    id: "m5",
    name: "Euro / US Dollar",
    ticker: "EUR/USD",
    category: "FOREX",
    price: "1.0842",
    change: "-0.12%",
    pos: false,
  },
  {
    id: "m6",
    name: "Pound / US Dollar",
    ticker: "GBP/USD",
    category: "FOREX",
    price: "1.2715",
    change: "+0.08%",
    pos: true,
  },
  {
    id: "m7",
    name: "Gold Ounce",
    ticker: "XAU",
    category: "COMMODITIES",
    price: "$2,344.80",
    change: "+0.64%",
    pos: true,
  },
  {
    id: "m8",
    name: "Brent Crude Oil",
    ticker: "OIL",
    category: "COMMODITIES",
    price: "$83.15",
    change: "-1.54%",
    pos: false,
  },
];

export const transfersHistoryData: Record<
  TransferPeriod,
  TransferTransaction[]
> = {
  "1D": [
    {
      id: "t1",
      reference: "Stripe Payout",
      type: "DEPOSIT",
      amount: "1,420.00",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 14:22",
    },
    {
      id: "t2",
      reference: "Starbucks Coffee",
      type: "WITHDRAW",
      amount: "6.80",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 08:45",
    },
  ],
  "3D": [
    {
      id: "t1",
      reference: "Stripe Payout",
      type: "DEPOSIT",
      amount: "1,420.00",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 14:22",
    },
    {
      id: "t2",
      reference: "Starbucks Coffee",
      type: "WITHDRAW",
      amount: "6.80",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 08:45",
    },
    {
      id: "t3",
      reference: "Amazon Web Services",
      type: "WITHDRAW",
      amount: "142.50",
      currency: "USD",
      status: "COMPLETED",
      date: "Yesterday, 23:11",
    },
    {
      id: "t4",
      reference: "Internal Transfer (Vault)",
      type: "TRANSFER",
      amount: "500.00",
      currency: "USD",
      status: "COMPLETED",
      date: "27 May, 11:15",
    },
  ],
  "1W": [
    {
      id: "t1",
      reference: "Stripe Payout",
      type: "DEPOSIT",
      amount: "1,420.00",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 14:22",
    },
    {
      id: "t3",
      reference: "Amazon Web Services",
      type: "WITHDRAW",
      amount: "142.50",
      currency: "USD",
      status: "COMPLETED",
      date: "Yesterday, 23:11",
    },
    {
      id: "t5",
      reference: "Crypto Liquidity Node",
      type: "DEPOSIT",
      amount: "0.045",
      currency: "BTC",
      status: "COMPLETED",
      date: "24 May, 19:02",
    },
    {
      id: "t6",
      reference: "Adobe Creative Cloud",
      type: "WITHDRAW",
      amount: "54.99",
      currency: "USD",
      status: "FAILED",
      date: "23 May, 04:00",
    },
  ],
  "2W": [
    {
      id: "t1",
      reference: "Stripe Payout",
      type: "DEPOSIT",
      amount: "1,420.00",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 14:22",
    },
    {
      id: "t5",
      reference: "Crypto Liquidity Node",
      type: "DEPOSIT",
      amount: "0.045",
      currency: "BTC",
      status: "COMPLETED",
      date: "24 May, 19:02",
    },
    {
      id: "t7",
      reference: "Core Ledger Credit",
      type: "LOAN",
      amount: "12,500.00",
      currency: "USD",
      status: "COMPLETED",
      date: "18 May, 10:00",
    },
    {
      id: "t8",
      reference: "GitHub Enterprise",
      type: "WITHDRAW",
      amount: "250.00",
      currency: "USD",
      status: "COMPLETED",
      date: "15 May, 16:30",
    },
  ],
  "1M": [
    {
      id: "t1",
      reference: "Stripe Payout",
      type: "DEPOSIT",
      amount: "1,420.00",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 14:22",
    },
    {
      id: "t7",
      reference: "Core Ledger Credit",
      type: "LOAN",
      amount: "12,500.00",
      currency: "USD",
      status: "COMPLETED",
      date: "18 May, 10:00",
    },
    {
      id: "t9",
      reference: "Tesla Investment Corp",
      type: "TRANSFER",
      amount: "2,000.00",
      currency: "USD",
      status: "COMPLETED",
      date: "10 May, 09:15",
    },
    {
      id: "t10",
      reference: "SpaceX Secondary Node",
      type: "WITHDRAW",
      amount: "850.00",
      currency: "USD",
      status: "PENDING",
      date: "02 May, 14:20",
    },
  ],
  "3M": [
    {
      id: "t1",
      reference: "Stripe Payout",
      type: "DEPOSIT",
      amount: "1,420.00",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 14:22",
    },
    {
      id: "t7",
      reference: "Core Ledger Credit",
      type: "LOAN",
      amount: "12,500.00",
      currency: "USD",
      status: "COMPLETED",
      date: "18 May, 10:00",
    },
    {
      id: "t11",
      reference: "Google Alpha Yield",
      type: "DEPOSIT",
      amount: "3,150.00",
      currency: "USD",
      status: "COMPLETED",
      date: "14 Apr, 18:40",
    },
    {
      id: "t12",
      reference: "OpenAI API Premium",
      type: "WITHDRAW",
      amount: "1,200.00",
      currency: "USD",
      status: "COMPLETED",
      date: "05 Apr, 11:02",
    },
    {
      id: "t13",
      reference: "Binance Corporate Out",
      type: "TRANSFER",
      amount: "0.85",
      currency: "BTC",
      status: "COMPLETED",
      date: "22 Mar, 21:55",
    },
  ],
  "6M": [
    {
      id: "t1",
      reference: "Stripe Payout",
      type: "DEPOSIT",
      amount: "1,420.00",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 14:22",
    },
    {
      id: "t11",
      reference: "Google Alpha Yield",
      type: "DEPOSIT",
      amount: "3,150.00",
      currency: "USD",
      status: "COMPLETED",
      date: "14 Apr, 18:40",
    },
    {
      id: "t14",
      reference: "Angel Round Funding",
      type: "DEPOSIT",
      amount: "50,000.00",
      currency: "USD",
      status: "COMPLETED",
      date: "19 Feb, 09:00",
    },
    {
      id: "t15",
      reference: "Hedge Fund Rebalance",
      type: "TRANSFER",
      amount: "15,000.00",
      currency: "USD",
      status: "COMPLETED",
      date: "12 Jan, 15:45",
    },
  ],
  "1Y": [
    {
      id: "t1",
      reference: "Stripe Payout",
      type: "DEPOSIT",
      amount: "1,420.00",
      currency: "USD",
      status: "COMPLETED",
      date: "Today, 14:22",
    },
    {
      id: "t14",
      reference: "Angel Round Funding",
      type: "DEPOSIT",
      amount: "50,000.00",
      currency: "USD",
      status: "COMPLETED",
      date: "19 Feb, 09:00",
    },
    {
      id: "t16",
      reference: "Equinix Data Center",
      type: "WITHDRAW",
      amount: "4,500.00",
      currency: "USD",
      status: "COMPLETED",
      date: "14 Nov 2025",
    }, // Corectat aici
    {
      id: "t17",
      reference: "Swiss Custody Setup",
      type: "TRANSFER",
      amount: "10,000.00",
      currency: "CHF",
      status: "COMPLETED",
      date: "05 Aug 2025",
    },
    {
      id: "t18",
      reference: "Seed Capital Injection",
      type: "DEPOSIT",
      amount: "120,000.00",
      currency: "USD",
      status: "COMPLETED",
      date: "01 Jun 2025",
    },
  ],
};
