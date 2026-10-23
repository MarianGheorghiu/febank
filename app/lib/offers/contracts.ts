/** Customer rewards transport: points are safe integers; money is exact decimal USD strings. */
export type MemberPlan = "STANDARD" | "PREMIUM" | "METAL";
export type OfferCategory = "Travel" | "Dining" | "Shopping" | "Wellness";
export interface OfferMembership { plan: MemberPlan; active: boolean; source: "subscription" | "demo"; subscription_id: string | null }
export interface MerchantOffer {
  id: string; merchant: string; title: string; category: OfferCategory; description: string;
  rate_bps: number; min_spend: string; max_cashback: string; starts_at: string; expires_at: string;
  plans: MemberPlan[]; channels: string; region: string; terms: string;
}
export interface RewardExperience {
  id: string; title: string; venue: string; location: string; starts_at: string; timezone: string;
  points_cost: number; capacity: number; cancel_until: string; plans: MemberPlan[]; description: string;
}
export interface RewardLounge { id: string; name: string; airport: string; location: string; opening_hours: string; terms: string }
export interface AirlinePartner { id: string; name: string; points_per_mile: number; minimum_points: number; step_points: number; member_digits: number; eta: string }
export interface ResearchService { id: string; name: string; description: string; minimum_capital: string; risk: string; plans: MemberPlan[] }
export interface OfferCatalog {
  version: number; offers: MerchantOffer[]; experiences: RewardExperience[]; lounges: RewardLounge[];
  airlines: AirlinePartner[]; research: ResearchService[];
  policy: { cash_points_per_dollar: number; cash_min_points: number; cash_step_points: number; lounge_year: number; lounge_allowance: Record<MemberPlan, number>; concierge_plans: MemberPlan[] };
}
export interface RewardCard { id: string; label: string; currency: string; eligible: boolean }
export interface PointAllocation { lot_id: string; points: number }
export interface PointLot { id: string; remaining: number; expires_at: string | null }
export interface RewardEntry {
  id: string; kind: "earned" | "spent" | "refund" | "expired" | "cashback" | "activity";
  points: number; cash: string | null; description: string; at: string;
}
export interface OfferActivation { id: string; offer_id: string; card_id: string; activated_at: string }
export interface RewardBooking {
  id: string; experience_id: string; status: "pending" | "confirmed" | "cancelled" | "used";
  points_paid: number; allocations: PointAllocation[]; created_at: string; reference: string;
}
export interface RewardTransfer {
  id: string; partner_id: string; member_last4: string; points: number; miles: number;
  status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  allocations: PointAllocation[]; created_at: string;
}
export interface LoungePass { id: string; lounge_id: string; reference: string; year: number; status: "reserved" | "used" | "cancelled"; expires_at: string; created_at: string }
export interface MemberRequest { id: string; kind: "concierge" | "research"; subject: string; details: string; status: "submitted" | "in_progress" | "closed" | "cancelled"; created_at: string }
export interface RewardsState {
  version: number; lots: PointLot[]; entries: RewardEntry[]; saved_offer_ids: string[];
  activations: OfferActivation[]; bookings: RewardBooking[]; transfers: RewardTransfer[];
  passes: LoungePass[]; requests: MemberRequest[];
}
export type OfferCommand = { expected_version: number; catalog_version: number } & (
  | { action: "save"; offer_id: string; saved: boolean }
  | { action: "activate"; offer_id: string; card_id: string }
  | { action: "redeem_cash"; points: number }
  | { action: "transfer_miles"; partner_id: string; member_number: string; points: number }
  | { action: "cancel_transfer"; transfer_id: string }
  | { action: "book"; experience_id: string }
  | { action: "cancel_booking"; booking_id: string }
  | { action: "lounge_pass"; lounge_id: string }
  | { action: "cancel_pass"; pass_id: string }
  | { action: "request"; kind: "concierge" | "research"; subject: string; details: string; service_id: string | null }
  | { action: "cancel_request"; request_id: string }
);
export interface OffersContext { catalog: OfferCatalog; membership: OfferMembership; cards: RewardCard[] }
export interface OffersSnapshot extends RewardsState, OffersContext {
  schema_version: 1; mode: "demo" | "http"; as_of: string; available_points: number;
  expiring_points: number; next_expiry: string | null; lounge_remaining: number; wallet_usd: string;
}
export interface OffersRepository {
  getSnapshot(signal?: AbortSignal): Promise<OffersSnapshot>;
  execute(command: OfferCommand, idempotencyKey: string): Promise<OffersSnapshot>;
}
