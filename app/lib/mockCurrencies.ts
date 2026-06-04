export type FiatAccount = {
  id: string;
  currency: string;
  balance: number;
  symbol: string;
  iban: string;
  region: "RO" | "EU" | "US" | "UK";
};

export type CryptoAsset = {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  walletAddress: string;
};

export type StockAsset = {
  id: string;
  name: string;
  symbol: string;
  shares: number;
  value: number;
};

// ==========================================
// 20 ÎNREGISTRĂRI FIAT
// ==========================================
export const MOCK_FIAT: FiatAccount[] = [
  {
    id: "f1",
    currency: "RON",
    balance: 14250.5,
    symbol: "RON",
    iban: "RO49 BTRL 0123 4567 8901 2345",
    region: "RO",
  },
  {
    id: "f2",
    currency: "EUR",
    balance: 3200.0,
    symbol: "€",
    iban: "DE89 3704 0044 0532 0130 00",
    region: "EU",
  },
  {
    id: "f3",
    currency: "USD",
    balance: 1050.25,
    symbol: "$",
    iban: "US Account: 000123456789",
    region: "US",
  },
  {
    id: "f4",
    currency: "GBP",
    balance: 450.0,
    symbol: "£",
    iban: "Sort: 20-45-14 | Acc: 12345678",
    region: "UK",
  },
  {
    id: "f5",
    currency: "RON",
    balance: 850.75,
    symbol: "RON",
    iban: "RO12 INGB 0001 9999 8888 7777",
    region: "RO",
  },
  {
    id: "f6",
    currency: "EUR",
    balance: 12500.0,
    symbol: "€",
    iban: "FR76 3000 6000 0123 4567 8901 234",
    region: "EU",
  },
  {
    id: "f7",
    currency: "RON",
    balance: 430.0,
    symbol: "RON",
    iban: "RO98 RZBR 0000 1111 2222 3333",
    region: "RO",
  },
  {
    id: "f8",
    currency: "EUR",
    balance: 95.5,
    symbol: "€",
    iban: "NL99 ABNA 0412 3456 78",
    region: "EU",
  },
  {
    id: "f9",
    currency: "USD",
    balance: 5400.0,
    symbol: "$",
    iban: "US Account: 987654321000",
    region: "US",
  },
  {
    id: "f10",
    currency: "GBP",
    balance: 2100.0,
    symbol: "£",
    iban: "Sort: 40-11-18 | Acc: 87654321",
    region: "UK",
  },
  {
    id: "f11",
    currency: "RON",
    balance: 27300.4,
    symbol: "RON",
    iban: "RO55 BCRR 0987 6543 2109 8765",
    region: "RO",
  },
  {
    id: "f12",
    currency: "EUR",
    balance: 670.0,
    symbol: "€",
    iban: "ES21 0049 1500 0512 3456 7890",
    region: "EU",
  },
  {
    id: "f13",
    currency: "USD",
    balance: 15.0,
    symbol: "$",
    iban: "US Account: 555566667777",
    region: "US",
  },
  {
    id: "f14",
    currency: "GBP",
    balance: 85.2,
    symbol: "£",
    iban: "Sort: 10-22-05 | Acc: 44332211",
    region: "UK",
  },
  {
    id: "f15",
    currency: "RON",
    balance: 1250.0,
    symbol: "RON",
    iban: "RO33 CECC 0102 0304 0506 0708",
    region: "RO",
  },
  {
    id: "f16",
    currency: "EUR",
    balance: 4120.35,
    symbol: "€",
    iban: "IT56 B030 6903 2000 0000 1234 567",
    region: "EU",
  },
  {
    id: "f17",
    currency: "USD",
    balance: 890.0,
    symbol: "$",
    iban: "US Account: 111122223333",
    region: "US",
  },
  {
    id: "f18",
    currency: "RON",
    balance: 6400.15,
    symbol: "RON",
    iban: "RO77 ALFA 1122 3344 5566 7788",
    region: "RO",
  },
  {
    id: "f19",
    currency: "EUR",
    balance: 18500.0,
    symbol: "€",
    iban: "BE12 3456 7890 1234",
    region: "EU",
  },
  {
    id: "f20",
    currency: "GBP",
    balance: 340.0,
    symbol: "£",
    iban: "Sort: 60-83-01 | Acc: 99887766",
    region: "UK",
  },
];

// ==========================================
// 20 ÎNREGISTRĂRI CRYPTO
// ==========================================
export const MOCK_CRYPTO: CryptoAsset[] = [
  {
    id: "c1",
    name: "Bitcoin",
    symbol: "BTC",
    balance: 0.45,
    walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  },
  {
    id: "c2",
    name: "Ethereum",
    symbol: "ETH",
    balance: 4.2,
    walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  },
  {
    id: "c3",
    name: "Solana",
    symbol: "SOL",
    balance: 145.0,
    walletAddress: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
  },
  {
    id: "c4",
    name: "Cardano",
    symbol: "ADA",
    balance: 2500.0,
    walletAddress: "addr1q8u9z6v3k7g6p5y8x2q1w0e9r8t7y6u5i4o3p2",
  },
  {
    id: "c5",
    name: "Ripple",
    symbol: "XRP",
    balance: 1850.25,
    walletAddress: "rMdG3V96gYnnUArAn6zY6vV4LBpP1C2g4A",
  },
  {
    id: "c6",
    name: "Polkadot",
    symbol: "DOT",
    balance: 75.8,
    walletAddress: "14E5iJm39ZpDg9XwWwNTCu9kP5M2C5G3K",
  },
  {
    id: "c7",
    name: "Avalanche",
    symbol: "AVAX",
    balance: 32.15,
    walletAddress: "0x34B22646EC7ab88b098defB751B7401B5f6d8988A",
  },
  {
    id: "c8",
    name: "Chainlink",
    symbol: "LINK",
    balance: 120.0,
    walletAddress: "0x43C12646EC7ab88b098defB751B7401B5f6d8911B",
  },
  {
    id: "c9",
    name: "Polygon",
    symbol: "MATIC",
    balance: 840.5,
    walletAddress: "0x52D32646EC7ab88b098defB751B7401B5f6d8922C",
  },
  {
    id: "c10",
    name: "Litecoin",
    symbol: "LTC",
    balance: 8.4,
    walletAddress: "LNWu4W96gYnnUArAn6zY6vV4LBpP1C2g4A",
  },
  {
    id: "c11",
    name: "Uniswap",
    symbol: "UNI",
    balance: 45.0,
    walletAddress: "0x61E42646EC7ab88b098defB751B7401B5f6d8933D",
  },
  {
    id: "c12",
    name: "Cosmos",
    symbol: "ATOM",
    balance: 63.2,
    walletAddress: "cosmos1q8u9z6v3k7g6p5y8x2q1w0e9r8t7y6u5i4o3p2",
  },
  {
    id: "c13",
    name: "Stellar",
    symbol: "XLM",
    balance: 3100.0,
    walletAddress: "GAYO3V96gYnnUArAn6zY6vV4LBpP1C2g4A",
  },
  {
    id: "c14",
    name: "Dogecoin",
    symbol: "DOGE",
    balance: 12500.0,
    walletAddress: "D9dG3V96gYnnUArAn6zY6vV4LBpP1C2g4A",
  },
  {
    id: "c15",
    name: "Shiba Inu",
    symbol: "SHIB",
    balance: 45000000.0,
    walletAddress: "0x72F52646EC7ab88b098defB751B7401B5f6d8944E",
  },
  {
    id: "c16",
    name: "TRON",
    symbol: "TRX",
    balance: 1950.0,
    walletAddress: "TMdG3V96gYnnUArAn6zY6vV4LBpP1C2g4A",
  },
  {
    id: "c17",
    name: "Bitcoin Cash",
    symbol: "BCH",
    balance: 2.15,
    walletAddress: "bitcoincash:qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  },
  {
    id: "c18",
    name: "Algorand",
    symbol: "ALGO",
    balance: 740.0,
    walletAddress: "ALGO3V96gYnnUArAn6zY6vV4LBpP1C2g4A",
  },
  {
    id: "c19",
    name: "Near Protocol",
    symbol: "NEAR",
    balance: 115.6,
    walletAddress: "near1q8u9z6v3k7g6p5y8x2q1w0e9r8t7y6u5i4o3p2",
  },
  {
    id: "c20",
    name: "Fantom",
    symbol: "FTM",
    balance: 580.0,
    walletAddress: "0x83A62646EC7ab88b098defB751B7401B5f6d8955F",
  },
];

// ==========================================
// 20 ÎNREGISTRĂRI STOCKS
// ==========================================
export const MOCK_STOCKS: StockAsset[] = [
  { id: "s1", name: "Apple Inc.", symbol: "AAPL", shares: 15, value: 2550.0 },
  { id: "s2", name: "NVIDIA", symbol: "NVDA", shares: 8, value: 6400.0 },
  { id: "s3", name: "Tesla", symbol: "TSLA", shares: 12, value: 2160.0 },
  {
    id: "s4",
    name: "Microsoft Corp.",
    symbol: "MSFT",
    shares: 10,
    value: 4200.0,
  },
  { id: "s5", name: "Alphabet Inc.", symbol: "GOOGL", shares: 5, value: 875.5 },
  {
    id: "s6",
    name: "Amazon.com Inc.",
    symbol: "AMZN",
    shares: 18,
    value: 3150.0,
  },
  {
    id: "s7",
    name: "Meta Platforms",
    symbol: "META",
    shares: 6,
    value: 2820.0,
  },
  {
    id: "s8",
    name: "Taiwan Semiconductor",
    symbol: "TSMC",
    shares: 25,
    value: 3625.0,
  },
  { id: "s9", name: "Visa Inc.", symbol: "V", shares: 14, value: 3780.0 },
  {
    id: "s10",
    name: "Exxon Mobil Corp.",
    symbol: "XOM",
    shares: 22,
    value: 2530.0,
  },
  {
    id: "s11",
    name: "UnitedHealth Group",
    symbol: "UNH",
    shares: 4,
    value: 2120.0,
  },
  {
    id: "s12",
    name: "Johnson & Johnson",
    symbol: "JNJ",
    shares: 16,
    value: 2480.0,
  },
  {
    id: "s13",
    name: "JPMorgan Chase & Co.",
    symbol: "JPM",
    shares: 11,
    value: 2145.0,
  },
  { id: "s14", name: "Walmart Inc.", symbol: "WMT", shares: 35, value: 2310.0 },
  {
    id: "s15",
    name: "Mastercard Inc.",
    symbol: "MA",
    shares: 5,
    value: 2250.0,
  },
  { id: "s16", name: "Nike Inc.", symbol: "NKE", shares: 20, value: 1900.0 },
  {
    id: "s17",
    name: "The Walt Disney Co.",
    symbol: "DIS",
    shares: 15,
    value: 1425.0,
  },
  { id: "s18", name: "Pfizer Inc.", symbol: "PFE", shares: 50, value: 1450.0 },
  {
    id: "s19",
    name: "The Coca-Cola Co.",
    symbol: "KO",
    shares: 40,
    value: 2480.0,
  },
  { id: "s20", name: "PepsiCo Inc.", symbol: "PEP", shares: 12, value: 2040.0 },
];
