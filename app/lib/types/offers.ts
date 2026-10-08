export interface LoungeAccess {
  provider: string;
  tierStatus: string;
  qrCodePayload: string;
  tokensAvailable: number;
  activeLounge: string;
}

export interface ExclusiveEvent {
  id: string;
  title: string;
  location: string;
  date: string;
  ticketPricePoints: number;
  status: "AVAILABLE" | "SOLD_OUT" | "RESERVED";
}

export interface CashbackOffer {
  id: string;
  brand: string;
  category: string;
  rate: number;
  minSpend: number;
}

export interface RestrictedAsset {
  id: string;
  name: string;
  expectedYield: string;
  minEntryCapital: number;
  riskRating: "ALPHA" | "OMEGA" | "SIGMA";
  isLocked: boolean;
}

export interface PremiumOffersDataset {
  userPointsBalance: number;
  premiumTier: string;
  lounge: LoungeAccess;
  events: ExclusiveEvent[];
  cashback: CashbackOffer[];
  restrictedInvestments: RestrictedAsset[];
}
