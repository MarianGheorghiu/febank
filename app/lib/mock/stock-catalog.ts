import type { StockCatalog } from "@/app/lib/types/stock-catalog";

export const STOCKS_CATALOG: StockCatalog = {
  NVDA: {
    name: "NVIDIA Corp.",
    exchange: "NASDAQ",
    price: 127.4,
    change: 4.12,
    changePercent: 3.34,
    stats: [
      { label: "Market Cap", value: "3.13 T", unit: "USD", icon: "Globe" },
      { label: "P/E Ratio", value: "68.42", unit: "x", icon: "Activity" },
      { label: "EPS", value: "1.86", unit: "USD", icon: "DollarSign" },
      { label: "Div. Yield", value: "0.04%", unit: "Annual", icon: "PieChart" },
      {
        label: "Implied Vol. (IV)",
        value: "44.2%",
        unit: "High",
        icon: "Flame",
        highlight: true,
      },
      { label: "Short Float", value: "1.24%", unit: "Low", icon: "ShieldCheck" },
    ],
    news: [
      {
        id: 1,
        source: "Bloomberg",
        time: "24m ago",
        title:
          "NVIDIA rolls out Blackwell B200 updates addressing micro-architectural power leaks.",
        sentiment: "BULLISH",
      },
      {
        id: 2,
        source: "Reuters",
        time: "2h ago",
        title:
          "EU antitrust regulators initiate exploratory inquiries into AI hardware cluster dominance.",
        sentiment: "BEARISH",
      },
      {
        id: 3,
        source: "TechCrunch",
        time: "5h ago",
        title:
          "Hyperscalers lock in 3-year data center capacity orders, sustaining extreme chip demand backlog.",
        sentiment: "BULLISH",
      },
    ],
    chart: {
      "1D": [
        { name: "09:30", open: 120, high: 123, low: 119, close: 122 },
        { name: "11:00", open: 122, high: 125, low: 120, close: 121 },
        { name: "12:30", open: 121, high: 126, low: 121, close: 125 },
        { name: "14:00", open: 125, high: 125, low: 118, close: 119 },
        { name: "15:30", open: 119, high: 128, low: 119, close: 127.4 },
      ],
      "1W": [
        { name: "Mon", open: 115, high: 119, low: 114, close: 118 },
        { name: "Tue", open: 118, high: 122, low: 117, close: 120 },
        { name: "Wed", open: 120, high: 121, low: 115, close: 116 },
        { name: "Thu", open: 116, high: 126, low: 116, close: 124 },
        { name: "Fri", open: 124, high: 129, low: 123, close: 127.4 },
      ],
      "1M": [
        { name: "W1", open: 102, high: 109, low: 100, close: 106 },
        { name: "W2", open: 106, high: 112, low: 103, close: 110 },
        { name: "W3", open: 110, high: 114, low: 107, close: 108 },
        { name: "W4", open: 108, high: 130, low: 108, close: 127.4 },
      ],
      "1Y": [
        { name: "Q1", open: 80, high: 92, low: 75, close: 88 },
        { name: "Q2", open: 88, high: 105, low: 85, close: 101 },
        { name: "Q3", open: 101, high: 104, low: 90, close: 94 },
        { name: "Q4", open: 94, high: 135, low: 93, close: 127.4 },
      ],
      ALL: [
        { name: "2022", open: 35, high: 48, low: 22, close: 42 },
        { name: "2023", open: 42, high: 75, low: 38, close: 68 },
        { name: "2024", open: 68, high: 98, low: 60, close: 85 },
        { name: "2025", open: 85, high: 120, low: 80, close: 118 },
        { name: "2026", open: 118, high: 142, low: 112, close: 127.4 },
      ],
    },
  },
  AAPL: {
    name: "Apple Inc.",
    exchange: "NASDAQ",
    price: 184.25,
    change: -2.15,
    changePercent: -1.15,
    stats: [
      { label: "Market Cap", value: "2.89 T", unit: "USD", icon: "Globe" },
      { label: "P/E Ratio", value: "29.12", unit: "x", icon: "Activity" },
      { label: "EPS", value: "6.15", unit: "USD", icon: "DollarSign" },
      { label: "Div. Yield", value: "0.52%", unit: "Annual", icon: "PieChart" },
      { label: "Implied Vol. (IV)", value: "18.6%", unit: "Low", icon: "Flame" },
      {
        label: "Short Float",
        value: "0.58%",
        unit: "Minimal",
        icon: "ShieldCheck",
      },
    ],
    news: [
      {
        id: 1,
        source: "Financial Times",
        time: "1h ago",
        title:
          "Apple secures exclusive hardware allocation for next-gen 2nm TSMC wafer nodes.",
        sentiment: "BULLISH",
      },
      {
        id: 2,
        source: "WSJ",
        time: "4h ago",
        title:
          "Slowing ecosystem hardware upgrades in key Asian sectors pressuring near-term retail targets.",
        sentiment: "BEARISH",
      },
    ],
    chart: {
      "1D": [
        { name: "09:30", open: 186.0, high: 186.5, low: 183.2, close: 183.8 },
        { name: "11:00", open: 183.8, high: 185.0, low: 183.0, close: 184.9 },
        { name: "12:30", open: 184.9, high: 185.2, low: 184.0, close: 184.2 },
        { name: "14:00", open: 184.2, high: 184.5, low: 182.8, close: 183.1 },
        { name: "15:30", open: 183.1, high: 184.6, low: 183.0, close: 184.25 },
      ],
      "1W": [
        { name: "Mon", open: 188, high: 189, low: 184, close: 185 },
        { name: "Tue", open: 185, high: 187, low: 183, close: 186 },
        { name: "Wed", open: 186, high: 186, low: 182, close: 183 },
        { name: "Thu", open: 183, high: 185, low: 182, close: 184 },
        { name: "Fri", open: 184, high: 185, low: 183, close: 184.25 },
      ],
      "1M": [
        { name: "W1", open: 180, high: 185, low: 179, close: 183 },
        { name: "W2", open: 183, high: 188, low: 182, close: 186 },
        { name: "W3", open: 186, high: 192, low: 185, close: 189 },
        { name: "W4", open: 189, high: 190, low: 183, close: 184.25 },
      ],
      "1Y": [
        { name: "Q1", open: 170, high: 182, low: 165, close: 178 },
        { name: "Q2", open: 178, high: 195, low: 175, close: 192 },
        { name: "Q3", open: 192, high: 200, low: 180, close: 185 },
        { name: "Q4", open: 185, high: 198, low: 181, close: 184.25 },
      ],
      ALL: [
        { name: "2022", open: 130, high: 180, low: 125, close: 150 },
        { name: "2023", open: 150, high: 198, low: 145, close: 192 },
        { name: "2024", open: 192, high: 220, low: 165, close: 185 },
        { name: "2025", open: 185, high: 210, low: 170, close: 180 },
        { name: "2026", open: 180, high: 195, low: 175, close: 184.25 },
      ],
    },
  },
  TSLA: {
    name: "Tesla Inc.",
    exchange: "NASDAQ",
    price: 210.8,
    change: 12.4,
    changePercent: 6.25,
    stats: [
      { label: "Market Cap", value: "668.50 B", unit: "USD", icon: "Globe" },
      { label: "P/E Ratio", value: "54.10", unit: "x", icon: "Activity" },
      { label: "EPS", value: "3.90", unit: "USD", icon: "DollarSign" },
      { label: "Div. Yield", value: "0.00%", unit: "N/A", icon: "PieChart" },
      {
        label: "Implied Vol. (IV)",
        value: "56.4%",
        unit: "Extreme",
        icon: "Flame",
        highlight: true,
      },
      {
        label: "Short Float",
        value: "3.41%",
        unit: "Elevated",
        icon: "ShieldCheck",
      },
    ],
    news: [
      {
        id: 1,
        source: "Electrek",
        time: "45m ago",
        title:
          "Full Self-Driving (FSD) v13 rollout achieves 4x increase in critical intervention thresholds.",
        sentiment: "BULLISH",
      },
      {
        id: 2,
        source: "CNBC",
        time: "3h ago",
        title:
          "Gigafactory regulatory milestones greenlit for alternative grid storage units allocation.",
        sentiment: "BULLISH",
      },
    ],
    chart: {
      "1D": [
        { name: "09:30", open: 198.5, high: 202.0, low: 197.0, close: 201.2 },
        { name: "11:00", open: 201.2, high: 206.5, low: 200.5, close: 205.0 },
        { name: "12:30", open: 205.0, high: 208.4, low: 204.0, close: 207.1 },
        { name: "14:00", open: 207.1, high: 212.0, low: 206.5, close: 209.8 },
        { name: "15:30", open: 209.8, high: 214.5, low: 209.0, close: 210.8 },
      ],
      "1W": [
        { name: "Mon", open: 190, high: 195, low: 188, close: 192 },
        { name: "Tue", open: 192, high: 200, low: 191, close: 198 },
        { name: "Wed", open: 198, high: 204, low: 196, close: 202 },
        { name: "Thu", open: 202, high: 208, low: 201, close: 206 },
        { name: "Fri", open: 206, high: 215, low: 205, close: 210.8 },
      ],
      "1M": [
        { name: "W1", open: 175, high: 185, low: 172, close: 182 },
        { name: "W2", open: 182, high: 190, low: 180, close: 188 },
        { name: "W3", open: 188, high: 202, low: 185, close: 199 },
        { name: "W4", open: 199, high: 216, low: 197, close: 210.8 },
      ],
      "1Y": [
        { name: "Q1", open: 240, high: 250, low: 160, close: 175 },
        { name: "Q2", open: 175, high: 198, low: 165, close: 188 },
        { name: "Q3", open: 188, high: 220, low: 174, close: 205 },
        { name: "Q4", open: 205, high: 235, low: 192, close: 210.8 },
      ],
      ALL: [
        { name: "2022", open: 350, high: 400, low: 110, close: 123 },
        { name: "2023", open: 123, high: 299, low: 120, close: 248 },
        { name: "2024", open: 248, high: 270, low: 140, close: 220 },
        { name: "2025", open: 220, high: 265, low: 160, close: 202 },
        { name: "2026", open: 202, high: 235, low: 180, close: 210.8 },
      ],
    },
  },
  BTC: {
    name: "Bitcoin",
    exchange: "CRYPTO",
    price: 94250.0,
    change: -1420.0,
    changePercent: -1.48,
    stats: [
      { label: "Market Cap", value: "1.85 T", unit: "USD", icon: "Globe" },
      { label: "P/E Ratio", value: "N/A", unit: "Protocol", icon: "Activity" },
      { label: "Block Subsidy", value: "3.125", unit: "BTC", icon: "DollarSign" },
      { label: "Supply Limit", value: "21M", unit: "Max", icon: "PieChart" },
      {
        label: "Implied Vol. (IV)",
        value: "48.9%",
        unit: "High",
        icon: "Flame",
        highlight: true,
      },
      { label: "Hashrate", value: "620E", unit: "EH/s", icon: "ShieldCheck" },
    ],
    news: [
      {
        id: 1,
        source: "CoinDesk",
        time: "12m ago",
        title:
          "Institutional custody inflows match historic peaks as sovereign treasury exploration continues.",
        sentiment: "BULLISH",
      },
      {
        id: 2,
        source: "Blockworks",
        time: "3h ago",
        title:
          "Mining difficulty parameters adjust upwards by 4.2%, squeezing inefficient data center layouts.",
        sentiment: "BEARISH",
      },
    ],
    chart: {
      "1D": [
        { name: "09:30", open: 95670, high: 95900, low: 94800, close: 95100 },
        { name: "11:00", open: 95100, high: 95400, low: 94100, close: 94350 },
        { name: "12:30", open: 94350, high: 94800, low: 93900, close: 94120 },
        { name: "14:00", open: 94120, high: 94650, low: 93850, close: 94500 },
        { name: "15:30", open: 94500, high: 94900, low: 93950, close: 94250 },
      ],
      "1W": [
        { name: "Mon", open: 92000, high: 96500, low: 91500, close: 95800 },
        { name: "Tue", open: 95800, high: 98200, low: 95000, close: 97100 },
        { name: "Wed", open: 97100, high: 97400, low: 93500, close: 94200 },
        { name: "Thu", open: 94200, high: 95600, low: 93800, close: 94950 },
        { name: "Fri", open: 94950, high: 95400, low: 93200, close: 94250 },
      ],
      "1M": [
        { name: "W1", open: 88000, high: 91000, low: 85000, close: 89500 },
        { name: "W2", open: 89500, high: 94000, low: 88200, close: 93200 },
        { name: "W3", open: 93200, high: 99800, low: 92100, close: 96400 },
        { name: "W4", open: 96400, high: 97500, low: 93100, close: 94250 },
      ],
      "1Y": [
        { name: "Q1", open: 42000, high: 73500, low: 40500, close: 68000 },
        { name: "Q2", open: 68000, high: 72000, low: 58000, close: 62500 },
        { name: "Q3", open: 62500, high: 66000, low: 52500, close: 64100 },
        { name: "Q4", open: 64100, high: 99400, low: 63000, close: 94250 },
      ],
      ALL: [
        { name: "2022", open: 47000, high: 48000, low: 15500, close: 16500 },
        { name: "2023", open: 16500, high: 44000, low: 16300, close: 42200 },
        { name: "2024", open: 42200, high: 73500, low: 38500, close: 68500 },
        { name: "2025", open: 68500, high: 99500, low: 50500, close: 88400 },
        { name: "2026", open: 88400, high: 104000, low: 82100, close: 94250 },
      ],
    },
  },
};
