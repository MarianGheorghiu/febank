import { decimal, units } from "../transfers/engine";
import type { MemberPlan, OfferCatalog, OfferCommand, OffersContext, OffersSnapshot, PointAllocation, RewardsState } from "./contracts";
const zero = BigInt(0);
const future = (date: string, at: string) => Date.parse(date) > Date.parse(at);
export const pointsLabel = (points: number) => `${new Intl.NumberFormat("en-US").format(points)} pts`;
export const offerMoney = (money: string | number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(money));
export function canUse(context: OffersContext, plans: MemberPlan[]) { return context.membership.active && plans.includes(context.membership.plan); }
export function offerIsLive(offer: OfferCatalog["offers"][number], at: string) { return !future(offer.starts_at, at) && future(offer.expires_at, at); }
export function validPoints(points: number) {
  if (!Number.isSafeInteger(points) || points <= 0 || points > 1000000000) throw new Error("Enter a whole number of points above zero.");
}
export function availablePoints(state: RewardsState, at: string) {
  return state.lots.filter(lot => lot.expires_at === null || future(lot.expires_at, at)).reduce((sum, lot) => sum + lot.remaining, 0);
}
export function settleExpiries(state: RewardsState, at: string) {
  const next = structuredClone(state);
  for (const lot of next.lots) if (lot.remaining > 0 && lot.expires_at !== null && !future(lot.expires_at, at)) {
    next.entries.unshift({ id: `expiry-${lot.id}`, kind: "expired", points: -lot.remaining, cash: null, description: "Unused points expired", at: lot.expires_at });
    lot.remaining = 0;
  }
  return next;
}
function spend(state: RewardsState, points: number, at: string): PointAllocation[] {
  validPoints(points);
  if (points > availablePoints(state, at)) throw new Error("You do not have enough available points.");
  let remaining = points;
  const allocations: PointAllocation[] = [];
  const lots = [...state.lots].sort((a,b) => (a.expires_at === null ? Infinity : Date.parse(a.expires_at)) - (b.expires_at === null ? Infinity : Date.parse(b.expires_at)));
  for (const lot of lots) {
    if (!remaining) break;
    if (!lot.remaining || (lot.expires_at !== null && !future(lot.expires_at, at))) continue;
    const allocated = Math.min(remaining, lot.remaining); lot.remaining -= allocated; remaining -= allocated;
    allocations.push({ lot_id: lot.id, points: allocated });
  }
  return allocations;
}
export function refundablePoints(state: RewardsState, allocations: PointAllocation[], at: string) {
  return allocations.reduce((sum, allocation) => {
    const lot = state.lots.find(item => item.id === allocation.lot_id);
    return sum + (lot && (lot.expires_at === null || future(lot.expires_at, at)) ? allocation.points : 0);
  }, 0);
}
function refund(state: RewardsState, allocations: PointAllocation[], at: string) {
  const total = refundablePoints(state, allocations, at);
  for (const allocation of allocations) {
    const lot = state.lots.find(item => item.id === allocation.lot_id);
    if (lot && (lot.expires_at === null || future(lot.expires_at, at))) lot.remaining += allocation.points;
  }
  return total;
}
export function loungeRemaining(state: RewardsState, context: OffersContext, at: string) {
  if (!context.membership.active || context.catalog.policy.lounge_year !== new Date(at).getUTCFullYear()) return 0;
  const allowance = context.catalog.policy.lounge_allowance[context.membership.plan];
  const used = state.passes.filter(pass => pass.year === context.catalog.policy.lounge_year && (pass.status === "used" || (pass.status === "reserved" && future(pass.expires_at, at)))).length;
  return Math.max(0, allowance - used);
}
export function cashReward(points: number, catalog: OfferCatalog) {
  validPoints(points);
  const policy = catalog.policy;
  if (points < policy.cash_min_points || points % policy.cash_step_points !== 0) throw new Error(`Use at least ${pointsLabel(policy.cash_min_points)}, in steps of ${policy.cash_step_points}.`);
  const numerator = BigInt(points) * BigInt(100), divisor = BigInt(policy.cash_points_per_dollar);
  if (numerator % divisor !== zero) throw new Error("This points amount cannot be redeemed to exact USD cents.");
  return decimal(numerator / divisor, 2);
}
function text(value: string, min: number, max: number) { if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) throw new Error(`Enter between ${min} and ${max} characters.`); }
/** Pure transaction: the wallet commits points, reward state, cash and audit in one journal write. */
export function applyOfferCommand(state: RewardsState, context: OffersContext, command: OfferCommand, key: string, at: string) {
  if (command.expected_version !== state.version) throw new Error("Your rewards changed. Refresh and review this action again.");
  if (command.catalog_version !== context.catalog.version) throw new Error("This offer or conversion rate changed. Refresh and review again.");
  const next = settleExpiries(state, at), catalog = context.catalog;
  let points = 0, cash: string | null = null, description: string;
  let kind: "spent" | "refund" = "spent";
  if (command.action === "save" || command.action === "activate") {
    const offer = catalog.offers.find(item => item.id === command.offer_id);
    if (!offer || !offerIsLive(offer, at)) throw new Error("This offer is no longer available.");
    if (command.action === "save") {
      if (typeof command.saved !== "boolean") throw new Error("Invalid saved-offer preference.");
      next.saved_offer_ids = [...next.saved_offer_ids.filter(id => id !== offer.id), ...(command.saved ? [offer.id] : [])];
      description = `${command.saved ? "Saved" : "Unsaved"}: ${offer.merchant}`;
    } else {
      if (!canUse(context, offer.plans)) throw new Error("This offer is not included in your active membership.");
      const card = context.cards.find(item => item.id === command.card_id && item.eligible && item.currency === "USD");
      if (!card) throw new Error("Choose an active, eligible USD card from your Cards Vault.");
      if (next.activations.some(activation => activation.offer_id === offer.id)) throw new Error("This offer is already activated.");
      next.activations.unshift({ id: key, offer_id: offer.id, card_id: card.id, activated_at: at });
      description = `Activated ${offer.merchant} on ${card.label}`;
    }
  } else if (command.action === "redeem_cash") {
    if (!context.membership.active) throw new Error("An active membership is required to redeem points.");
    cash = cashReward(command.points, catalog); spend(next, command.points, at); points = -command.points;
    description = `Points redeemed to your USD wallet · ${offerMoney(cash)}`;
  } else if (command.action === "transfer_miles") {
    if (!context.membership.active || context.membership.plan === "STANDARD") throw new Error("Airline transfers require an active Premium or Metal membership.");
    const partner = catalog.airlines.find(item => item.id === command.partner_id);
    validPoints(command.points);
    if (!partner || command.points < partner.minimum_points || command.points % partner.step_points !== 0 || command.points % partner.points_per_mile !== 0) throw new Error("Choose a valid partner and points amount.");
    if (typeof command.member_number !== "string" || !/^\d+$/.test(command.member_number) || command.member_number.length !== partner.member_digits) throw new Error(`Enter the ${partner.member_digits}-digit airline membership number.`);
    const allocations = spend(next, command.points, at); points = -command.points;
    next.transfers.unshift({ id: key, partner_id: partner.id, member_last4: command.member_number.slice(-4), points: command.points, miles: command.points / partner.points_per_mile, status: "pending", allocations, created_at: at });
    description = `Airline transfer requested · ${partner.name}`;
  } else if (command.action === "cancel_transfer") {
    const transfer = next.transfers.find(item => item.id === command.transfer_id && item.status === "pending");
    if (!transfer) throw new Error("This transfer can no longer be cancelled.");
    points = refund(next, transfer.allocations, at); kind = "refund"; transfer.status = "cancelled";
    description = "Pending airline transfer cancelled";
  } else if (command.action === "book") {
    const experience = catalog.experiences.find(item => item.id === command.experience_id);
    if (!experience || !future(experience.starts_at, at) || !future(experience.cancel_until, at) || experience.capacity < 1) throw new Error("This experience is no longer available.");
    if (!canUse(context, experience.plans)) throw new Error("This experience is not included in your active membership.");
    if (next.bookings.some(booking => booking.experience_id === experience.id && booking.status !== "cancelled")) throw new Error("You already have a booking for this experience.");
    const allocations = spend(next, experience.points_cost, at); points = -experience.points_cost;
    next.bookings.unshift({ id: key, experience_id: experience.id, status: "pending", points_paid: experience.points_cost, allocations, created_at: at, reference: `DEMO-${key.slice(-8).toUpperCase()}` });
    description = `Experience requested · ${experience.title}`;
  } else if (command.action === "cancel_booking") {
    const booking = next.bookings.find(item => item.id === command.booking_id && ["pending", "confirmed"].includes(item.status));
    const experience = catalog.experiences.find(item => item.id === booking?.experience_id);
    if (!booking || !experience || !future(experience.cancel_until, at)) throw new Error("The cancellation deadline has passed or this booking is unavailable.");
    points = refund(next, booking.allocations, at); kind = "refund"; booking.status = "cancelled";
    description = `Experience cancelled · ${experience.title}`;
  } else if (command.action === "lounge_pass") {
    const lounge = catalog.lounges.find(item => item.id === command.lounge_id);
    if (!lounge || loungeRemaining(next, context, at) < 1) throw new Error("No lounge visits are available under your current membership.");
    if (next.passes.some(pass => pass.status === "reserved" && future(pass.expires_at, at))) throw new Error("You already have an active lounge pass. Use or cancel it first.");
    next.passes.unshift({ id: key, lounge_id: lounge.id, reference: `DEMO-${key.slice(-8).toUpperCase()}`, year: catalog.policy.lounge_year, status: "reserved", created_at: at, expires_at: new Date(Date.parse(at) + 3600000).toISOString() });
    description = `Lounge visit reserved · ${lounge.airport}`;
  } else if (command.action === "cancel_pass") {
    const pass = next.passes.find(item => item.id === command.pass_id && item.status === "reserved" && future(item.expires_at, at));
    if (!pass) throw new Error("This pass has been used, cancelled or expired.");
    pass.status = "cancelled"; description = "Unused lounge pass cancelled";
  } else if (command.action === "request") {
    text(command.subject, 5, 120); text(command.details, 10, 1000);
    if (next.requests.filter(item => ["submitted", "in_progress"].includes(item.status)).length >= 10) throw new Error("Please wait for an open request to be resolved before sending more.");
    if (command.kind === "concierge") {
      if (!canUse(context, catalog.policy.concierge_plans)) throw new Error("Concierge is not included in your active membership.");
    } else if (command.kind === "research") {
      const service = catalog.research.find(item => item.id === command.service_id);
      if (!service || !canUse(context, service.plans)) throw new Error("This research service is not available for your membership.");
    } else throw new Error("Unsupported service request.");
    next.requests.unshift({ id: key, kind: command.kind, subject: command.subject.trim(), details: command.details.trim(), status: "submitted", created_at: at });
    description = `${command.kind === "concierge" ? "Concierge" : "Investment information"} request submitted`;
  } else if (command.action === "cancel_request") {
    const request = next.requests.find(item => item.id === command.request_id && item.status === "submitted");
    if (!request) throw new Error("This request can no longer be cancelled.");
    request.status = "cancelled"; description = "Service request cancelled";
  } else throw new Error("Unsupported rewards operation.");
  next.version++;
  next.entries.unshift({ id: key, kind: points === 0 && cash === null && kind !== "refund" ? "activity" : points > 0 ? "refund" : kind, points, cash, description, at });
  return { rewards: next, cash_credit: cash ?? "0.00" };
}
export function projectOffers(state: RewardsState, context: OffersContext, walletUsd: string, at: string): OffersSnapshot {
  const current = settleExpiries(state, at);
  const expiring = current.lots.filter(lot => lot.remaining && lot.expires_at && Date.parse(lot.expires_at) <= Date.parse(at) + 30 * 86400000);
  return { ...current, ...structuredClone(context), schema_version: 1, mode: "demo", as_of: at,
    available_points: availablePoints(current, at), expiring_points: expiring.reduce((sum, lot) => sum + lot.remaining, 0), next_expiry: expiring.map(lot => lot.expires_at!).sort()[0] ?? null,
    lounge_remaining: loungeRemaining(current, context, at), wallet_usd: walletUsd };
}
export function totalCashback(state: RewardsState) { return decimal(state.entries.filter(entry => entry.kind === "cashback").reduce((sum, entry) => sum + units(entry.cash ?? "0.00", 2), zero), 2); }
export function rewardHistory(state: RewardsState, at: string, months: number) {
  const end = new Date(at);
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + index + 1, 1));
    const month = date.toISOString().slice(0, 7);
    const entries = state.entries.filter(entry => entry.at.slice(0,7) === month && !future(entry.at, at));
    return { month, earned: entries.filter(entry => entry.kind === "earned" || entry.kind === "refund").reduce((sum, entry) => sum + entry.points, 0), used: entries.filter(entry => entry.points < 0 && entry.kind !== "expired").reduce((sum, entry) => sum - entry.points, 0), cashback: Number(totalCashback({ ...state, entries })) };
  });
}
