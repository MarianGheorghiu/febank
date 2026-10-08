import type { ConversionTarget } from "@/app/lib/types/offer-conversions";

export const MOCK_TARGETS: ConversionTarget[] = [
  {
    id: "trg-01",
    category: "AIR_MILES",
    name: "EMIRATES SKYWARDS",
    ticker: "MILES",
    rateMultiplier: 8,
    networkFee: "ZERO FEES",
  },
  {
    id: "trg-02",
    category: "AIR_MILES",
    name: "AF-KLM FLYING BLUE",
    ticker: "MILES",
    rateMultiplier: 10,
    networkFee: "ZERO FEES",
  },
  {
    id: "trg-03",
    category: "AIR_MILES",
    name: "ANA MILEAGE CLUB VVIP",
    ticker: "MILES",
    rateMultiplier: 6,
    networkFee: "500 PTS SYNC",
  },
  {
    id: "trg-04",
    category: "CRYPTO_NODES",
    name: "BITCOIN SECURE BLOCK",
    ticker: "SATS",
    rateMultiplier: 1.2,
    networkFee: "1200 PTS MINER",
  },
  {
    id: "trg-05",
    category: "CRYPTO_NODES",
    name: "ETHER VALIDATOR NODE",
    ticker: "GWEI",
    rateMultiplier: 0.8,
    networkFee: "800 PTS GAS",
  },
];
