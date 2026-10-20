import type { CardChannels, CardCurrency, CardCustomer, CardLimits, CardNetwork, IssuedCard, CardAuditEntry, CardIssuingPolicy } from "../types/admin/card-issuing";

export type CustomerCardCommand =
  | { action: "ISSUE"; type: IssuedCard["type"]; network: CardNetwork; currency: CardCurrency }
  | { action: "FREEZE" | "UNFREEZE" | "ACTIVATE" | "TERMINATE"; card_id: string; expected_version: number }
  | { action: "UPDATE_CONTROLS"; card_id: string; expected_version: number; limits: CardLimits; channels: CardChannels };
export interface CardActivity {
  id: string; card_id: string; merchant: string; category: string; amount: string; currency: CardCurrency;
  occurred_at: string; status: "COMPLETED" | "PENDING" | "REVERSED";
}
export interface CustomerCardsSnapshot {
  schema_version: 1; as_of: string; customer: CardCustomer | null; cards: IssuedCard[];
  funding_accounts: Array<{ id: string; currency: string; available: string; reserved: string }>;
  activity: CardActivity[]; audit: CardAuditEntry[]; policy: CardIssuingPolicy;
  permissions: Record<string, Array<"FREEZE" | "UNFREEZE" | "ACTIVATE" | "TERMINATE" | "UPDATE_CONTROLS">>;
}
export interface CardDetails { pan: string; cvv: string; expiry: string; holder_name: string; expires_at: string }
export interface CardsRepository {
  revealDetails(cardId: string, signal?: AbortSignal): Promise<CardDetails>;
  getSnapshot(signal?: AbortSignal): Promise<CustomerCardsSnapshot>;
  execute(command: CustomerCardCommand, idempotencyKey: string): Promise<CustomerCardsSnapshot>;
}
