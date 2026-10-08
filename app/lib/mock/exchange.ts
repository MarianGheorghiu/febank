export const ASSET_PRICES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  RON: 0.22,
  BTC: 67500.0,
  ETH: 3500.0,
  AAPL: 190.0,
  NVDA: 950.0,
};

export const ASSET_TYPES: Record<string, "FIAT" | "CRYPTO" | "STOCK"> = {
  RON: "FIAT",
  EUR: "FIAT",
  USD: "FIAT",
  BTC: "CRYPTO",
  ETH: "CRYPTO",
  AAPL: "STOCK",
  NVDA: "STOCK",
};
