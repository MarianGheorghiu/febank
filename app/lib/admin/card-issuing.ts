import type { CardAction, CardAuditEntry, CardChannels, CardCommand, CardCustomer, CardIssuingPolicy, CardIssuingState, CardLimits, CardOperator, IssuedCard } from "@/app/lib/types/admin/card-issuing";

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
function applyValidatedCardCommand(state: CardIssuingState, customers: CardCustomer[], command: CardCommand, actor: CardOperator, policy: CardIssuingPolicy, now: string, createId: (prefix: string) => string): CardIssuingState {
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
    if (cards.filter(card => card.userId === customer.id && card.status !== "TERMINATED" && !card.id.startsWith("CRD-DEMO-") && card.id !== replacesCardId).length >= policy.maxOpenCardsPerCustomer) throw new Error(`The customer already has ${policy.maxOpenCardsPerCustomer} open cards.`);
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
      case "TERMINATE": after.status = "TERMINATED"; if (actor.role === "client") after.customerDeletedAt = now; break;
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
  return { ...state, revision: state.revision + 1, cards, audit: [{ id: createId("CAU"), timestamp: now, actor: actor.email, action: command.action, cardId, userId: targetUserId, reason, before, after: after ? structuredClone(after) : null }, ...state.audit] };
}

/** Admin entry point; customer operations use the narrower entry point below. */
export function applyCardCommand(...args: Parameters<typeof applyValidatedCardCommand>): CardIssuingState {
  if (args[3].role !== "admin") throw new Error("Only an administrator can manage customer cards.");
  return applyValidatedCardCommand(...args);
}

export function customerCardActions(state: CardIssuingState, card: IssuedCard, customer: CardCustomer): Array<"FREEZE" | "UNFREEZE" | "ACTIVATE" | "TERMINATE" | "UPDATE_CONTROLS"> {
  if (card.userId !== customer.id || card.status === "TERMINATED") return [];
  const actions: Array<"FREEZE" | "UNFREEZE" | "ACTIVATE" | "TERMINATE" | "UPDATE_CONTROLS"> = ["TERMINATE"];
  if (card.status === "ACTIVE") actions.push("FREEZE");
  if (!customerIsEligible(customer)) return actions;
  // A customer may only remove their own freeze, never an operations freeze.
  const freeze = state.audit.find(entry => entry.cardId === card.id && ["FREEZE", "UNFREEZE", "BLOCK", "TERMINATE"].includes(entry.action));
  if (card.status === "FROZEN" && freeze?.action === "FREEZE" && freeze.actor.toLowerCase() === customer.email.toLowerCase()) actions.push("UNFREEZE");
  if (card.status === "PENDING" && (card.type === "VIRTUAL" || card.delivery === "DELIVERED")) actions.push("ACTIVATE");
  if (card.status === "ACTIVE" || (card.status === "FROZEN" && actions.includes("UNFREEZE"))) actions.push("UPDATE_CONTROLS");
  return actions;
}

/** Approved capabilities stay separate from the customer's current preferences. */
export function customerControlCeiling(audit: CardAuditEntry[], card: IssuedCard, email: string) {
  const operations = audit.find(entry => entry.cardId === card.id && entry.action === "UPDATE_CONTROLS" && entry.actor.toLowerCase() !== email.toLowerCase() && entry.after)?.after;
  const original = audit.filter(entry => entry.cardId === card.id && entry.action === "UPDATE_CONTROLS").at(-1)?.before ?? card;
  return operations ?? (card.id.startsWith("CRD-DEMO-") ? { ...original, limits: { daily: 1000, monthly: 5000, atmDaily: 250 }, channels: { online: true, atm: true, contactless: true, international: true } } : original);
}

export function applyCustomerCardCommand(state: CardIssuingState, customers: CardCustomer[], command: import("../cards/contracts").CustomerCardCommand, email: string, policy: CardIssuingPolicy, now: string, createId: (prefix: string) => string): CardIssuingState {
  const customer = customers.find(item => item.email.toLowerCase() === email.trim().toLowerCase());
  if (!customer) throw new Error("Your account is not in the card registry. Contact support to complete card enrollment.");
  const reason = `Customer requested ${command.action.toLowerCase().replaceAll("_", " ")} in Cards Vault.`;
  const actor: CardOperator = { name: customer.name, email: customer.email, role: "client" };
  if (command.action === "ISSUE") {
    return applyValidatedCardCommand(state, customers, { action: "ISSUE", userId: customer.id, type: command.type, network: command.network, currency: command.currency, limits: { daily: 1000, monthly: 5000, atmDaily: command.type === "PHYSICAL" ? 250 : 0 }, reason }, actor, policy, now, createId);
  }
  const card = state.cards.find(item => item.id === command.card_id && item.userId === customer.id);
  if (!card || !customerCardActions(state, card, customer).includes(command.action)) throw new Error("This action is restricted by the card or account status. Refresh your cards or contact support.");
  // Do not let customer controls exceed the latest limits imposed by operations.
  if (command.action === "UPDATE_CONTROLS") {
    const maximum = customerControlCeiling(state.audit, card, customer.email);
    if (!command.limits || !command.channels || command.limits.daily > maximum.limits.daily || command.limits.monthly > maximum.limits.monthly || command.limits.atmDaily > maximum.limits.atmDaily || (Object.keys(maximum.channels) as Array<keyof CardChannels>).some(key => command.channels[key] && !maximum.channels[key])) throw new Error("The requested controls exceed the limits or payment permissions approved by operations.");
  }
  return applyValidatedCardCommand(state, customers, { ...command, cardId: card.id, expectedVersion: command.expected_version, reason }, actor, policy, now, createId);
}
