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
