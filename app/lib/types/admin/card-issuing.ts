export type IssuedCardStatus = "PENDING" | "ACTIVE" | "FROZEN" | "BLOCKED" | "TERMINATED";
export type IssuedCardType = "PHYSICAL" | "VIRTUAL";
export type CardCurrency = "EUR" | "USD" | "RON";
export type CardNetwork = "VISA" | "MASTERCARD";
export type CardDelivery = "NOT_REQUIRED" | "ORDERED" | "DISPATCHED" | "DELIVERED";
export interface CardCustomer {
  id: string;
  name: string;
  email: string;
  accountStatus: "ACTIVE" | "BLOCKED";
  kycStatus: "VERIFIED" | "IN_REVIEW";
  deliveryAddress: string | null;
}
export interface CardLimits { daily: number; monthly: number; atmDaily: number }
export interface CardChannels { online: boolean; atm: boolean; contactless: boolean; international: boolean }
export interface IssuedCard {
  id: string;
  userId: string;
  type: IssuedCardType;
  network: CardNetwork;
  currency: CardCurrency;
  last4: string;
  expiry: string;
  status: IssuedCardStatus;
  limits: CardLimits;
  channels: CardChannels;
  spentToday: number;
  spentThisMonth: number;
  delivery: CardDelivery;
  deliveryAddress: string | null;
  trackingReference: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  replacesCardId: string | null;
  replacedByCardId: string | null;
}
export type CardAction = "ACTIVATE" | "FREEZE" | "UNFREEZE" | "BLOCK" | "TERMINATE" | "REPLACE" | "DISPATCH" | "DELIVER" | "UPDATE_CONTROLS";
export interface CardAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: CardAction | "ISSUE" | "EXPORT";
  cardId: string | null;
  userId: string | null;
  reason: string;
  before: IssuedCard | null;
  after: IssuedCard | null;
}
export interface CardIssuingState { revision: number; cards: IssuedCard[]; audit: CardAuditEntry[] }
export type CardCommand =
  | { action: "ISSUE"; userId: string; type: IssuedCardType; network: CardNetwork; currency: CardCurrency; limits: CardLimits; reason: string }
  | { action: "EXPORT"; reason: string }
  | { action: CardAction; cardId: string; expectedVersion: number; reason: string; limits?: CardLimits; channels?: CardChannels; trackingReference?: string };
export interface CardOperator { name: string; email: string; role: "admin" | "client" }
export interface CardIssuingPolicy { maxOpenCardsPerCustomer: number; maxMonthlyLimit: number }
