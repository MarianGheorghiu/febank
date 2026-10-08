export interface ConversionTarget {
  id: string;
  category: ConversionCategory;
  name: string;
  ticker: string;
  rateMultiplier: number; // Ex: 10 puncte = 1 unitate
  networkFee: string;
}

export type ConversionCategory = "AIR_MILES" | "CRYPTO_NODES";
