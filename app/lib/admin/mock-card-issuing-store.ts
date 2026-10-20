"use client";

import { useSyncExternalStore } from "react";
import { applyCardCommand, applyCustomerCardCommand } from "@/app/lib/admin/card-issuing";
import { MOCK_CARD_CUSTOMERS, MOCK_CARD_ISSUING_STATE, MOCK_ISSUING_POLICY } from "@/app/lib/mock/admin/card-issuing";
import type { CardCommand, CardCustomer, CardIssuingState, CardOperator, IssuedCard } from "@/app/lib/types/admin/card-issuing";

export const CARDS_EVENT = "mbank:cards-updated";
const STORAGE_KEY = "mbank_admin_card_issuing_v1";
const listeners = new Set<() => void>();
let snapshot: CardIssuingState | null = null;
let restoreWarning: string | null = null;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
function isCard(value: unknown, customers: CardCustomer[] = MOCK_CARD_CUSTOMERS): value is IssuedCard {
  if (!isObject(value) || !isObject(value.limits) || !isObject(value.channels)) return false;
  return (value.customerDeletedAt === undefined || value.customerDeletedAt === null || (typeof value.customerDeletedAt === "string" && Number.isFinite(Date.parse(value.customerDeletedAt)))) && typeof value.id === "string" && customers.some(customer => customer.id === value.userId)
    && ["PHYSICAL", "VIRTUAL"].includes(String(value.type)) && ["VISA", "MASTERCARD"].includes(String(value.network))
    && ["EUR", "USD", "RON"].includes(String(value.currency)) && /^\d{4}$/.test(String(value.last4))
    && /^(0[1-9]|1[0-2])\/\d{2}$/.test(String(value.expiry))
    && ["PENDING", "ACTIVE", "FROZEN", "BLOCKED", "TERMINATED"].includes(String(value.status))
    && ["NOT_REQUIRED", "ORDERED", "DISPATCHED", "DELIVERED"].includes(String(value.delivery))
    && [value.spentToday, value.spentThisMonth, value.limits.daily, value.limits.monthly, value.limits.atmDaily].every(item => typeof item === "number" && Number.isFinite(item) && item >= 0)
    && [value.channels.online, value.channels.atm, value.channels.contactless, value.channels.international].every(item => typeof item === "boolean")
    && Number.isInteger(value.version) && Number(value.version) > 0
    && [value.createdAt, value.updatedAt].every(item => typeof item === "string" && Number.isFinite(Date.parse(item)))
    && [value.deliveryAddress, value.trackingReference, value.replacesCardId, value.replacedByCardId].every(item => item === null || typeof item === "string");
}
function readPersisted(): CardIssuingState {
  restoreWarning = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return MOCK_CARD_ISSUING_STATE;
    const data: unknown = JSON.parse(raw);
    const profiles = isObject(data) && Array.isArray(data.customers) ? data.customers : [];
    if ((isObject(data) && data.customers !== undefined && !Array.isArray(data.customers)) || !profiles.every(item => isObject(item) && typeof item.id === "string" && typeof item.name === "string" && typeof item.email === "string" && item.email === item.email.trim().toLowerCase() && ["ACTIVE", "BLOCKED"].includes(String(item.accountStatus)) && ["VERIFIED", "IN_REVIEW"].includes(String(item.kycStatus)) && (item.deliveryAddress === null || typeof item.deliveryAddress === "string"))) throw new Error("Invalid saved customer profiles");
    const customers = [...MOCK_CARD_CUSTOMERS, ...profiles] as CardCustomer[];
    if (new Set(customers.map(c => c.id)).size !== customers.length || new Set(customers.map(c => c.email.toLowerCase())).size !== customers.length) throw new Error("Duplicate customer profiles");
    if (!isObject(data) || !Number.isInteger(data.revision) || Number(data.revision) < 0 || !Array.isArray(data.cards) || !data.cards.every(card => isCard(card, customers)) || new Set(data.cards.map(card => card.id)).size !== data.cards.length || !Array.isArray(data.audit) || !data.audit.every(entry => isObject(entry) && typeof entry.id === "string" && typeof entry.actor === "string" && ["ISSUE", "EXPORT", "ACTIVATE", "FREEZE", "UNFREEZE", "BLOCK", "TERMINATE", "REPLACE", "DISPATCH", "DELIVER", "UPDATE_CONTROLS"].includes(String(entry.action)) && typeof entry.reason === "string" && typeof entry.timestamp === "string" && Number.isFinite(Date.parse(entry.timestamp)) && (entry.cardId === null || typeof entry.cardId === "string") && (entry.userId === null || typeof entry.userId === "string") && (entry.before === null || isCard(entry.before, customers)) && (entry.after === null || isCard(entry.after, customers)))) throw new Error("Invalid saved registry");
    return data as unknown as CardIssuingState;
  } catch {
    restoreWarning = "Saved demo data could not be restored. The initial registry is shown; check browser storage before making changes.";
    return MOCK_CARD_ISSUING_STATE;
  }
}
function getSnapshot(): CardIssuingState {
  if (typeof window === "undefined") return MOCK_CARD_ISSUING_STATE;
  if (!snapshot) snapshot = readPersisted();
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      snapshot = readPersisted(); listeners.forEach(notify => notify());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
export function useCardIssuingState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => MOCK_CARD_ISSUING_STATE);
}
export function readCardIssuingState() { const state = readPersisted(); if (restoreWarning) throw new Error(restoreWarning); return state; }
export function getCardStorageWarning() { return restoreWarning; }
export function executeMockCardCommand(command: CardCommand, actor: CardOperator) {
  const latest = readPersisted();
  if (restoreWarning) throw new Error(restoreWarning);
  const next = applyCardCommand(latest, cardCustomers(latest), command, actor, MOCK_ISSUING_POLICY, new Date().toISOString(), prefix => `${prefix}-${crypto.randomUUID()}`);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("The operation was not saved. Browser storage is unavailable or full; no changes were applied."); }
  snapshot = next;
  listeners.forEach(notify => notify());
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CARDS_EVENT));
  return next;
}

export function executeCustomerCardCommand(command: import("../cards/contracts").CustomerCardCommand, email: string, key: string) {
  if (!key || key.length > 200) throw new Error("A valid operation key is required.");
  const latest = readCardIssuingState();
  const previous = latest.audit.find(entry => entry.id === `CCU-${key}`);
  const reason = `Customer requested ${command.action.toLowerCase().replaceAll("_", " ")} in Cards Vault.`;
  if (previous) {
    if (previous.actor.toLowerCase() !== email.trim().toLowerCase() || previous.reason !== reason || (command.action === "ISSUE" ? previous.after?.type !== command.type || previous.after?.network !== command.network || previous.after?.currency !== command.currency : previous.cardId !== command.card_id || previous.before?.version !== command.expected_version || (command.action === "UPDATE_CONTROLS" && (JSON.stringify(previous.after?.limits) !== JSON.stringify(command.limits) || JSON.stringify(previous.after?.channels) !== JSON.stringify(command.channels))))) throw new Error("Operation key already used for another request.");
    return latest;
  }
  const next = applyCustomerCardCommand(latest, cardCustomers(latest), command, email, MOCK_ISSUING_POLICY, new Date().toISOString(), prefix => prefix === "CAU" ? `CCU-${key}` : `${prefix}-${crypto.randomUUID()}`);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("The operation could not be saved. No card changes were applied."); }
  snapshot = next; listeners.forEach(notify => notify()); if (typeof window !== "undefined") window.dispatchEvent(new Event(CARDS_EVENT));
  return next;
}

export function cardCustomers(state: CardIssuingState): CardCustomer[] { return [...MOCK_CARD_CUSTOMERS, ...(state.customers ?? [])]; }

/** Every signed-in demo customer sees a populated, isolated Cards Vault. */
export function ensureDemoCardCustomer(email: string, name: string): CardIssuingState {
  email = email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("A signed-in customer is required.");
  const latest = readCardIssuingState();
  const existing = cardCustomers(latest).find(customer => customer.email.toLowerCase() === email);
  const previousDemo = existing ? latest.cards.find(card => card.id === `CRD-DEMO-${existing.id}`) : undefined;
  if (previousDemo?.type === "PHYSICAL" && previousDemo.currency === "USD") return latest;
  if (previousDemo) {
    // Upgrade only the sample card; keep its restrictions, spending, identity and audit.
    const restricted = latest.audit.some(entry => entry.cardId === previousDemo.id && entry.action === "UPDATE_CONTROLS" && entry.actor.toLowerCase() !== email);
    const upgraded: IssuedCard = { ...previousDemo, type: "PHYSICAL", currency: "USD", limits: { ...previousDemo.limits, atmDaily: previousDemo.type === "PHYSICAL" || restricted ? previousDemo.limits.atmDaily : 250 }, version: previousDemo.version + 1, updatedAt: new Date().toISOString() };
    const migrated: CardIssuingState = { ...latest, revision: latest.revision + 1, cards: latest.cards.map(card => card.id === upgraded.id ? upgraded : card), audit: [{ id: `CAU-${crypto.randomUUID()}`, timestamp: upgraded.updatedAt, actor: "demo-setup", action: "ISSUE", cardId: upgraded.id, userId: upgraded.userId, reason: "Demo card updated to USD with ATM and contactless capabilities. No funds moved.", before: previousDemo, after: upgraded }, ...latest.audit] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); snapshot = migrated; listeners.forEach(notify => notify()); return migrated;
  }
  const customer: CardCustomer = existing ?? { id: `USR-${crypto.randomUUID()}`, email, name: name.trim() || email.split("@")[0], accountStatus: "ACTIVE", kycStatus: "VERIFIED", deliveryAddress: null };
  const now = new Date(), at = now.toISOString();
  const starter: IssuedCard = {
    id: `CRD-DEMO-${customer.id}`, userId: customer.id, type: "PHYSICAL", network: "VISA", currency: "USD", last4: "4242",
    expiry: `${String(now.getUTCMonth() + 1).padStart(2, "0")}/${String(now.getUTCFullYear() + 3).slice(-2)}`,
    status: customer.accountStatus === "BLOCKED" ? "BLOCKED" : customer.kycStatus === "VERIFIED" ? "ACTIVE" : "PENDING",
    limits: { daily: 1000, monthly: 5000, atmDaily: 250 }, channels: { online: true, atm: false, contactless: false, international: true },
    spentToday: 0, spentThisMonth: 1840, delivery: "NOT_REQUIRED", deliveryAddress: null, trackingReference: null,
    createdAt: at, updatedAt: at, version: 1, replacesCardId: null, replacedByCardId: null,
  };
  const next: CardIssuingState = { ...latest, revision: latest.revision + 1, customers: existing ? latest.customers : [...(latest.customers ?? []), customer], cards: [starter, ...latest.cards], audit: [{ id: `CAU-DEMO-${customer.id}`, timestamp: at, actor: "demo-setup", action: "ISSUE", cardId: starter.id, userId: customer.id, reason: "Default demonstration card and example activity. No wallet funds were moved.", before: null, after: structuredClone(starter) }, ...latest.audit] };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("Your cards profile could not be saved. Check browser storage and retry."); }
  snapshot = next; listeners.forEach(notify => notify());
  return next;
}
