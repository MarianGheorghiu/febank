"use client";

import { assertManagedAccess, findManagedUser, readManagedUsers, USERS_EVENT, USERS_KEY } from "../user-management/store";
import { validIssuedCard } from "../card-issuing/response";
import { useSyncExternalStore } from "react";
import { applyCardCommand, applyCustomerCardCommand } from "@/app/lib/admin/card-issuing";
import { enrichIssuingDemo, MOCK_CARD_CUSTOMERS, MOCK_CARD_ISSUING_STATE, MOCK_ISSUING_POLICY } from "@/app/lib/mock/admin/card-issuing";
import type { CardCommand, CardCustomer, CardIssuingState, CardOperator, IssuedCard } from "@/app/lib/types/admin/card-issuing";

export const CARDS_EVENT = "mbank:cards-updated";
export const CARD_ISSUING_KEY = "mbank_admin_card_issuing_v1";
const STORAGE_KEY = "mbank_admin_card_issuing_v1";
const listeners = new Set<() => void>();
let snapshot: CardIssuingState | null = null;
let restoreWarning: string | null = null;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
function isCard(value: unknown, customers: CardCustomer[] = MOCK_CARD_CUSTOMERS): value is IssuedCard {
  return validIssuedCard(value)&&customers.some(customer=>customer.id===value.userId);
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
    if (isObject(data) && data.processed_requests !== undefined && (!Array.isArray(data.processed_requests) || !data.processed_requests.every(r => isObject(r) && typeof r.key === "string" && typeof r.payload === "string"))) throw new Error("Invalid saved requests");
    if (isObject(data) && Array.isArray(data.audit) && new Set(data.audit.map(e=>(e as {id:string}).id)).size!==data.audit.length) throw new Error("Duplicate audit records");
    return enrichIssuingDemo(data as unknown as CardIssuingState);
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
    if (event.key === STORAGE_KEY || event.key === USERS_KEY || event.key === null) {
      snapshot = readPersisted(); listeners.forEach(notify => notify());
    }
  };
  const usersChanged = () => { snapshot = { ...getSnapshot() }; listeners.forEach(notify => notify()); };
  window.addEventListener("storage", onStorage); window.addEventListener(USERS_EVENT, usersChanged);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); window.removeEventListener(USERS_EVENT, usersChanged); };
}
export function useCardIssuingState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => MOCK_CARD_ISSUING_STATE);
}
export function readCardIssuingState() { const state = readPersisted(); if (restoreWarning) throw new Error(restoreWarning); return state; }
export function getCardStorageWarning() { return restoreWarning; }
export function refreshCardIssuing() { snapshot = readPersisted(); listeners.forEach(notify => notify()); }
export function executeMockCardCommand(command: CardCommand, actor: CardOperator, request?: {key:string; expected_revision:number}) {
  const latest = readPersisted();
  if (restoreWarning) throw new Error(restoreWarning);
  if (actor.role !== "admin" || !actor.email.trim()) throw new Error("Administrator access required.");
  const payload = JSON.stringify({command,actor:actor.email.trim().toLowerCase()});
  if (request) {
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(request.key)) throw new Error("Invalid request key.");
    const prior=latest.processed_requests?.find(r=>r.key===request.key);
    if(prior){if(prior.payload!==payload)throw new Error("Request key already used for another operation.");return latest;}
    if(request.expected_revision!==latest.revision)throw new Error("Card registry changed. Refresh and review again.");
  }
  const customers=cardCustomers(latest);
  const added=customers.filter(c=>!MOCK_CARD_CUSTOMERS.some(m=>m.id===c.id)&&!latest.customers?.some(m=>m.id===c.id));
  const prepared={...latest,customers:[...(latest.customers??[]),...added]};
  let next = applyCardCommand(prepared, customers, command, actor, MOCK_ISSUING_POLICY, new Date().toISOString(), prefix => `${prefix}-${crypto.randomUUID()}`);
  if(request)next={...next,processed_requests:[...(latest.processed_requests??[]),{key:request.key,payload}]};
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
  if (!["FREEZE", "TERMINATE"].includes(command.action)) assertManagedAccess(email);
  const next = applyCustomerCardCommand(latest, cardCustomers(latest), command, email, MOCK_ISSUING_POLICY, new Date().toISOString(), prefix => prefix === "CAU" ? `CCU-${key}` : `${prefix}-${crypto.randomUUID()}`);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("The operation could not be saved. No card changes were applied."); }
  snapshot = next; listeners.forEach(notify => notify()); if (typeof window !== "undefined") window.dispatchEvent(new Event(CARDS_EVENT));
  return next;
}

export function cardCustomers(state: CardIssuingState): CardCustomer[] {
  const users = readManagedUsers().users;
  const existing=[...MOCK_CARD_CUSTOMERS, ...(state.customers ?? [])];
  const profiles=[...existing,...users.filter(u=>u.role==="CLIENT"&&!existing.some(c=>c.id===u.id||c.email===u.login_email)).map(u=>({id:u.id,name:u.legal_name,email:u.login_email,accountStatus:u.status,kycStatus:u.kyc_status==="VERIFIED"?"VERIFIED" as const:"IN_REVIEW" as const,deliveryAddress:u.address||null}))];
  return profiles.map(customer => {
    const user = users.find(u => u.login_email === customer.email.toLowerCase());
    return user ? { ...customer, name: user.legal_name, accountStatus: user.status, kycStatus: user.kyc_status === "VERIFIED" ? "VERIFIED" : "IN_REVIEW", deliveryAddress: user.address || null } : customer;
  });
}

/** Every signed-in demo customer sees a populated, isolated Cards Vault. */
export function ensureDemoCardCustomer(email: string, name: string): CardIssuingState {
  email = email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("A signed-in customer is required.");
  const latest = readCardIssuingState();
  const existing = cardCustomers(latest).find(customer => customer.email.toLowerCase() === email);
  // A customer already enrolled by operations does not receive another active sample card.
  if(existing&&!MOCK_CARD_CUSTOMERS.some(c=>c.id===existing.id)&&latest.cards.some(c=>c.userId===existing.id)&&!latest.cards.some(c=>c.id===`CRD-DEMO-${existing.id}`))return latest;
  const previousDemo = existing ? latest.cards.find(card => card.id === `CRD-DEMO-${existing.id}`) : undefined;
  if (previousDemo?.type === "PHYSICAL" && previousDemo.currency === "USD") return latest;
  if (previousDemo) {
    // Upgrade only the sample card; keep its restrictions, spending, identity and audit.
    const restricted = latest.audit.some(entry => entry.cardId === previousDemo.id && entry.action === "UPDATE_CONTROLS" && entry.actor.toLowerCase() !== email);
    const upgraded: IssuedCard = { ...previousDemo, type: "PHYSICAL", currency: "USD", limits: { ...previousDemo.limits, atmDaily: previousDemo.type === "PHYSICAL" || restricted ? previousDemo.limits.atmDaily : 250 }, version: previousDemo.version + 1, updatedAt: new Date().toISOString() };
    const migrated: CardIssuingState = { ...latest, revision: latest.revision + 1, cards: latest.cards.map(card => card.id === upgraded.id ? upgraded : card), audit: [{ id: `CAU-${crypto.randomUUID()}`, timestamp: upgraded.updatedAt, actor: "demo-setup", action: "ISSUE", cardId: upgraded.id, userId: upgraded.userId, reason: "Demo card updated to USD with ATM and contactless capabilities. No funds moved.", before: previousDemo, after: upgraded }, ...latest.audit] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); snapshot = migrated; listeners.forEach(notify => notify()); return migrated;
  }
  const customer: CardCustomer = existing ?? { id: findManagedUser(email)?.id ?? `USR-${crypto.randomUUID()}`, email, name: name.trim() || email.split("@")[0], accountStatus: "ACTIVE", kycStatus: "VERIFIED", deliveryAddress: null };
  const now = new Date(), at = now.toISOString();
  const starter: IssuedCard = {
    id: `CRD-DEMO-${customer.id}`, userId: customer.id, type: "PHYSICAL", network: "VISA", currency: "USD", last4: "4242",
    expiry: `${String(now.getUTCMonth() + 1).padStart(2, "0")}/${String(now.getUTCFullYear() + 3).slice(-2)}`,
    status: customer.accountStatus === "BLOCKED" ? "BLOCKED" : customer.kycStatus === "VERIFIED" ? "ACTIVE" : "PENDING",
    limits: { daily: 1000, monthly: 5000, atmDaily: 250 }, channels: { online: true, atm: false, contactless: false, international: true },
    spentToday: 0, spentThisMonth: 1840, delivery: "NOT_REQUIRED", deliveryAddress: null, trackingReference: null,
    createdAt: at, updatedAt: at, version: 1, replacesCardId: null, replacedByCardId: null,
  };
  const next: CardIssuingState = { ...latest, revision: latest.revision + 1, customers: MOCK_CARD_CUSTOMERS.some(c=>c.id===customer.id)||latest.customers?.some(c=>c.id===customer.id) ? latest.customers : [...(latest.customers ?? []), customer], cards: [starter, ...latest.cards], audit: [{ id: `CAU-DEMO-${customer.id}`, timestamp: at, actor: "demo-setup", action: "ISSUE", cardId: starter.id, userId: customer.id, reason: "Default demonstration card and example activity. No wallet funds were moved.", before: null, after: structuredClone(starter) }, ...latest.audit] };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("Your cards profile could not be saved. Check browser storage and retry."); }
  snapshot = next; listeners.forEach(notify => notify());
  return next;
}
