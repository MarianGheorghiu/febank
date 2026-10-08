import type { CardAction, CardChannels, CardCommand, CardCustomer, CardIssuingPolicy, CardIssuingState, CardLimits, CardOperator, IssuedCard } from "@/app/lib/types/admin/card-issuing";

export function customerIsEligible(customer: CardCustomer): boolean {
  return customer.accountStatus === "ACTIVE" && customer.kycStatus === "VERIFIED";
}
export function availableCardActions(card: IssuedCard, customer: CardCustomer): CardAction[] {
  if (card.status === "TERMINATED") return [];
  const actions: CardAction[] = ["TERMINATE"];
  if (card.status === "ACTIVE") actions.unshift("FREEZE", "BLOCK");
  if (card.status === "FROZEN") actions.unshift("BLOCK");
  if (!customerIsEligible(customer)) return actions;
  if (card.status === "FROZEN") actions.unshift("UNFREEZE");
  if (card.status === "ACTIVE" || card.status === "FROZEN") actions.push("UPDATE_CONTROLS");
  if (["ACTIVE", "FROZEN", "BLOCKED"].includes(card.status)) actions.push("REPLACE");
  if (card.status === "PENDING") {
    if (card.type === "VIRTUAL" || card.delivery === "DELIVERED") actions.unshift("ACTIVATE");
    if (card.delivery === "ORDERED") actions.unshift("DISPATCH");
    if (card.delivery === "DISPATCHED") actions.unshift("DELIVER");
  }
  return actions;
}
export function validateCardLimits(limits: CardLimits, type: IssuedCard["type"], policy: CardIssuingPolicy, card?: IssuedCard): void {
  if (!limits || ![limits.daily, limits.monthly, limits.atmDaily].every(value => Number.isFinite(value) && value >= 0 && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001)) {
    throw new Error("Limits must be valid amounts with at most two decimal places.");
  }
  if (limits.daily <= 0 || limits.monthly <= 0 || limits.daily > limits.monthly || limits.monthly > policy.maxMonthlyLimit || limits.atmDaily > limits.daily) {
    throw new Error(`Daily limit must be positive and no higher than the monthly limit; monthly maximum is ${policy.maxMonthlyLimit.toLocaleString("en-US")}. ATM limit cannot exceed the daily limit.`);
  }
  if (type === "VIRTUAL" && limits.atmDaily !== 0) throw new Error("Virtual cards do not support ATM withdrawals.");
  if (card && (limits.daily < card.spentToday || limits.monthly < card.spentThisMonth)) throw new Error("Limits cannot be lower than the amount already spent today or this month.");
}
function validateChannels(channels: CardChannels, type: IssuedCard["type"]): void {
  if (!channels || ![channels.online, channels.atm, channels.contactless, channels.international].every(value => typeof value === "boolean")) throw new Error("All payment channel settings are required.");
  if (type === "VIRTUAL" && (channels.atm || channels.contactless)) throw new Error("Virtual cards only support online and international payments.");
}

/** Pure demo domain operation. Go must enforce the same transitions transactionally. */
export function applyCardCommand(state: CardIssuingState, customers: CardCustomer[], command: CardCommand, actor: CardOperator, policy: CardIssuingPolicy, now: string, createId: (prefix: string) => string): CardIssuingState {
  if (actor.role !== "admin") throw new Error("Only an administrator can manage customer cards.");
  const reason = command.reason.trim();
  if (reason.length < 10 || reason.length > 500) throw new Error("Enter an operational reason between 10 and 500 characters.");
  let before: IssuedCard | null = null;
  let after: IssuedCard | null = null;
  let cards = state.cards;
  let targetUserId: string | null = null;
  const createCard = (customer: CardCustomer, input: { type: IssuedCard["type"]; network: IssuedCard["network"]; currency: IssuedCard["currency"]; limits: CardLimits }, replacesCardId: string | null): IssuedCard => {
    if (!customerIsEligible(customer)) throw new Error("The customer must have an active account and verified KYC.");
    if (!["PHYSICAL", "VIRTUAL"].includes(input.type) || !["VISA", "MASTERCARD"].includes(input.network) || !["EUR", "USD", "RON"].includes(input.currency)) throw new Error("Select a supported card type, network and currency.");
    if (input.type === "PHYSICAL" && !customer.deliveryAddress) throw new Error("A verified delivery address is required for physical cards.");
    if (cards.filter(card => card.userId === customer.id && card.status !== "TERMINATED" && card.id !== replacesCardId).length >= policy.maxOpenCardsPerCustomer) throw new Error(`The customer already has ${policy.maxOpenCardsPerCustomer} open cards.`);
    validateCardLimits(input.limits, input.type, policy);
    const id = createId("CRD");
    const hash = [...id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 10000, 0);
    const date = new Date(now);
    const expiry = `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCFullYear() + 3).slice(-2)}`;
    return { id, userId: customer.id, type: input.type, network: input.network, currency: input.currency, limits: { ...input.limits }, last4: String(hash).padStart(4, "0"), expiry, status: "PENDING", channels: { online: true, atm: input.type === "PHYSICAL", contactless: input.type === "PHYSICAL", international: true }, spentToday: 0, spentThisMonth: 0, delivery: input.type === "PHYSICAL" ? "ORDERED" : "NOT_REQUIRED", deliveryAddress: input.type === "PHYSICAL" ? customer.deliveryAddress : null, trackingReference: null, createdAt: now, updatedAt: now, version: 1, replacesCardId, replacedByCardId: null };
  };
  if (command.action === "ISSUE") {
    const customer = customers.find(customer => customer.id === command.userId);
    if (!customer) throw new Error("Customer not found in the client registry.");
    after = createCard(customer, command, null);
    targetUserId = customer.id;
    cards = [after, ...cards];
  } else if (command.action !== "EXPORT") {
    const current = cards.find(card => card.id === command.cardId);
    if (!current) throw new Error("Card no longer exists. Refresh the registry.");
    if (current.version !== command.expectedVersion) throw new Error("This card was updated by another operation. Close this dialog and review its latest state.");
    const customer = customers.find(customer => customer.id === current.userId);
    if (!customer) throw new Error("The card owner could not be found.");
    if (!availableCardActions(current, customer).includes(command.action)) throw new Error("This action is not allowed for the card or customer in their current state.");
    before = structuredClone(current);
    targetUserId = customer.id;
    after = { ...current, version: current.version + 1, updatedAt: now };
    switch (command.action) {
      case "ACTIVATE": after.status = "ACTIVE"; break;
      case "FREEZE": after.status = "FROZEN"; break;
      case "UNFREEZE": after.status = "ACTIVE"; break;
      case "BLOCK": after.status = "BLOCKED"; break;
      case "TERMINATE": after.status = "TERMINATED"; break;
      case "DISPATCH": {
        const tracking = command.trackingReference?.trim() ?? "";
        if (!/^[a-zA-Z0-9][a-zA-Z0-9 ./_-]{5,79}$/.test(tracking)) throw new Error("Enter a carrier tracking reference of 6–80 characters.");
        after.delivery = "DISPATCHED"; after.trackingReference = tracking; break;
      }
      case "DELIVER": after.delivery = "DELIVERED"; break;
      case "UPDATE_CONTROLS":
        if (!command.limits || !command.channels) throw new Error("Limits and payment channels are required.");
        validateCardLimits(command.limits, current.type, policy, current);
        validateChannels(command.channels, current.type);
        after.limits = { ...command.limits }; after.channels = { ...command.channels }; break;
      case "REPLACE": {
        const replacement = createCard(customer, current, current.id);
        // Preserve restrictions; a replacement must not silently re-enable channels.
        replacement.channels = { ...current.channels };
        after.status = "TERMINATED"; after.replacedByCardId = replacement.id;
        cards = [replacement, ...cards]; break;
      }
    }
    cards = cards.map(card => card.id === current.id ? after! : card);
  }
  const cardId = command.action === "ISSUE" ? after?.id ?? null : command.action === "EXPORT" ? null : command.cardId;
  return { revision: state.revision + 1, cards, audit: [{ id: createId("CAU"), timestamp: now, actor: actor.email, action: command.action, cardId, userId: targetUserId, reason, before, after: after ? structuredClone(after) : null }, ...state.audit] };
}
