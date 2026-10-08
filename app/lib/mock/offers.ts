import type { PremiumOffersDataset } from "@/app/lib/types/offers";

export const mockPremiumOffers: PremiumOffersDataset = {
  userPointsBalance: 345200,
  premiumTier: "BLACK SHOGUN UNLIMITED",
  lounge: {
    provider: "PRIORITY PASS ELITE",
    tierStatus: "UNLIMITED PRESTIGE",
    qrCodePayload: "MBANK-VIP-99210-TOK-2026",
    tokensAvailable: 8,
    activeLounge: "HANEDA TIAT LOUNGE VVIP",
  },
  events: [
    {
      id: "evt-01",
      title: "SAKURA PRIVATE WINE DEGUSTATION",
      location: "ROPPONGI HILLS CLUB",
      date: "2026-06-18",
      ticketPricePoints: 50000,
      status: "AVAILABLE",
    },
    {
      id: "evt-02",
      title: "FUJI CYBER-GOLF VIP CHAMPIONSHIP",
      location: "GOTEMBA GOLF CORE",
      date: "2026-07-02",
      ticketPricePoints: 120000,
      status: "RESERVED",
    },
    {
      id: "evt-03",
      title: "CONCOURS D'ELEGANCE EXOTICS",
      location: "TSUKUBA CIRCUIT S-GRID",
      date: "2026-08-14",
      ticketPricePoints: 85000,
      status: "SOLD_OUT",
    },
  ],
  cashback: [
    {
      id: "cb-01",
      brand: "AMAN HOTELS & RESORTS",
      category: "LUXURY STAY",
      rate: 12.5,
      minSpend: 2000,
    },
    {
      id: "cb-02",
      brand: "BALENCIAGA TOKYO",
      category: "HIGH APPAREL",
      rate: 8.0,
      minSpend: 500,
    },
    {
      id: "cb-03",
      brand: "EMIRATES FIRST CLASS",
      category: "AVIONICS",
      rate: 15.0,
      minSpend: 5000,
    },
  ],
  restrictedInvestments: [
    {
      id: "inv-801",
      name: "QUANTUM HFT ALGORITHMIC POOL",
      expectedYield: "24.5% APR",
      minEntryCapital: 100000,
      riskRating: "SIGMA",
      isLocked: false,
    },
    {
      id: "inv-802",
      name: "TOKYO SHIBUYA REAL ESTATE TOKENIZED",
      expectedYield: "11.2% YIELD",
      minEntryCapital: 50000,
      riskRating: "ALPHA",
      isLocked: false,
    },
    {
      id: "inv-803",
      name: "NEOM URBAN BLOCK PRIVATE EQUITY",
      expectedYield: "38.0% TARGET",
      minEntryCapital: 250000,
      riskRating: "OMEGA",
      isLocked: true,
    },
  ],
};
