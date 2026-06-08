// ==========================================
// 1. DATELE PENTRU PORTOFOLIUL TĂU (ACTIVE)
// ==========================================

export interface StockHolding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  sector: "Tech" | "Healthcare" | "Energy" | "ETFs";
  change24h: number;
}

export const MOCK_STOCK_HOLDINGS: StockHolding[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    shares: 85,
    avgCost: 420.0,
    currentPrice: 912.4,
    sector: "Tech",
    change24h: 4.25,
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    shares: 15,
    avgCost: 172.5,
    currentPrice: 198.3,
    sector: "Tech",
    change24h: -0.82,
  },
  {
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    shares: 45,
    avgCost: 412.0,
    currentPrice: 489.2,
    sector: "ETFs",
    change24h: 1.12,
  },
  {
    symbol: "XOM",
    name: "Exxon Mobil Corp.",
    shares: 120,
    avgCost: 102.1,
    currentPrice: 114.5,
    sector: "Energy",
    change24h: 2.31,
  },
  {
    symbol: "PFE",
    name: "Pfizer Inc.",
    shares: 210,
    avgCost: 35.4,
    currentPrice: 28.9,
    sector: "Healthcare",
    change24h: -1.45,
  },
];

export const MOCK_STOCK_ALLOCATION = [
  { name: "Tech Matrix", value: 80506.5, color: "#06b6d4" },
  { name: "ETFs & Indices", value: 22014.0, color: "#f59e0b" },
  { name: "Energy & Infrastructure", value: 13740.0, color: "#10b981" },
  { name: "Bio Healthcare", value: 6069.0, color: "#3b82f6" },
];

export const MOCK_STOCK_HISTORY: Record<
  string,
  { date: string; valoare: number }[]
> = {
  "1D": [
    { date: "09:00", valoare: 121000 },
    { date: "11:00", valoare: 121800 },
    { date: "13:00", valoare: 120500 },
    { date: "15:00", valoare: 122100 },
    { date: "17:30", valoare: 122329.5 },
  ],
  "1W": [
    { date: "Mon", valoare: 118000 },
    { date: "Tue", valoare: 119400 },
    { date: "Wed", valoare: 121000 },
    { date: "Thu", valoare: 120200 },
    { date: "Fri", valoare: 122329.5 },
  ],
  "1M": [
    { date: "S1", valoare: 112000 },
    { date: "S2", valoare: 115800 },
    { date: "S3", valoare: 119000 },
    { date: "S4", valoare: 122329.5 },
  ],
  "1Y": [
    { date: "Q1 25", valoare: 92000 },
    { date: "Q2 25", valoare: 101000 },
    { date: "Q3 25", valoare: 108500 },
    { date: "Q4 25", valoare: 115000 },
    { date: "NOW", valoare: 122329.5 },
  ],
  ALL: [
    { date: "2023", valoare: 45000 },
    { date: "2024", valoare: 78000 },
    { date: "2025", valoare: 112000 },
    { date: "2026", valoare: 122329.5 },
  ],
};

// ==========================================
// 2. DATELE NOI PENTRU MARKET EXPLORER (SCREENER)
// ==========================================

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume: string;
  marketCap: string;
  category:
    | "Big Tech"
    | "AI & Robotics"
    | "Green Energy"
    | "Metals"
    | "Oil & Gas"
    | "Dividends"
    | "ETFs";
  region: "US" | "EU" | "GLOBAL";
  isFractional: boolean;
}

export const MOCK_MARKET_ASSETS: MarketAsset[] = [
  {
    id: "mkt_1",
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 912.4,
    change24h: 4.25,
    change7d: 12.4,
    volume: "42.1M",
    marketCap: "2.2T",
    category: "AI & Robotics",
    region: "US",
    isFractional: true,
  },
  {
    id: "mkt_2",
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 172.5,
    change24h: -0.82,
    change7d: -1.5,
    volume: "55.3M",
    marketCap: "2.8T",
    category: "Big Tech",
    region: "US",
    isFractional: true,
  },
  {
    id: "mkt_3",
    symbol: "XOM",
    name: "Exxon Mobil Corp.",
    price: 114.5,
    change24h: 2.31,
    change7d: 4.1,
    volume: "18.2M",
    marketCap: "450B",
    category: "Oil & Gas",
    region: "US",
    isFractional: true,
  },
  {
    id: "mkt_4",
    symbol: "GOLD",
    name: "Barrick Gold",
    price: 16.8,
    change24h: 1.15,
    change7d: 3.2,
    volume: "22.4M",
    marketCap: "29B",
    category: "Metals",
    region: "US",
    isFractional: true,
  },
  {
    id: "mkt_5",
    symbol: "VOO",
    name: "Vanguard S&P 500",
    price: 489.2,
    change24h: 1.12,
    change7d: 2.1,
    volume: "4.5M",
    marketCap: "1.1T",
    category: "ETFs",
    region: "GLOBAL",
    isFractional: true,
  },
  {
    id: "mkt_6",
    symbol: "ASML",
    name: "ASML Holding",
    price: 945.2,
    change24h: 5.4,
    change7d: 8.9,
    volume: "1.2M",
    marketCap: "370B",
    category: "AI & Robotics",
    region: "EU",
    isFractional: true,
  },
  {
    id: "mkt_7",
    symbol: "ENPH",
    name: "Enphase Energy",
    price: 120.5,
    change24h: -4.2,
    change7d: -10.5,
    volume: "3.8M",
    marketCap: "16B",
    category: "Green Energy",
    region: "US",
    isFractional: true,
  },
  {
    id: "mkt_8",
    symbol: "KO",
    name: "Coca-Cola Co.",
    price: 60.2,
    change24h: 0.45,
    change7d: 1.2,
    volume: "12.1M",
    marketCap: "260B",
    category: "Dividends",
    region: "US",
    isFractional: true,
  },
];
