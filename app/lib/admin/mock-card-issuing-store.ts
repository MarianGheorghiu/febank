"use client";

import { useSyncExternalStore } from "react";
import { applyCardCommand } from "@/app/lib/admin/card-issuing";
import { MOCK_CARD_CUSTOMERS, MOCK_CARD_ISSUING_STATE, MOCK_ISSUING_POLICY } from "@/app/lib/mock/admin/card-issuing";
import type { CardCommand, CardIssuingState, CardOperator, IssuedCard } from "@/app/lib/types/admin/card-issuing";

const STORAGE_KEY = "mbank_admin_card_issuing_v1";
const listeners = new Set<() => void>();
let snapshot: CardIssuingState | null = null;
let restoreWarning: string | null = null;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
function isCard(value: unknown): value is IssuedCard {
  if (!isObject(value) || !isObject(value.limits) || !isObject(value.channels)) return false;
  return typeof value.id === "string" && MOCK_CARD_CUSTOMERS.some(customer => customer.id === value.userId)
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
    if (!isObject(data) || !Number.isInteger(data.revision) || Number(data.revision) < 0 || !Array.isArray(data.cards) || !data.cards.every(isCard) || new Set(data.cards.map(card => card.id)).size !== data.cards.length || !Array.isArray(data.audit) || !data.audit.every(entry => isObject(entry) && typeof entry.id === "string" && typeof entry.actor === "string" && ["ISSUE", "EXPORT", "ACTIVATE", "FREEZE", "UNFREEZE", "BLOCK", "TERMINATE", "REPLACE", "DISPATCH", "DELIVER", "UPDATE_CONTROLS"].includes(String(entry.action)) && typeof entry.reason === "string" && typeof entry.timestamp === "string" && Number.isFinite(Date.parse(entry.timestamp)) && (entry.cardId === null || typeof entry.cardId === "string") && (entry.userId === null || typeof entry.userId === "string") && (entry.before === null || isCard(entry.before)) && (entry.after === null || isCard(entry.after)))) throw new Error("Invalid saved registry");
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
export function getCardStorageWarning() { return restoreWarning; }
export function executeMockCardCommand(command: CardCommand, actor: CardOperator) {
  const latest = readPersisted();
  if (restoreWarning) throw new Error(restoreWarning);
  const next = applyCardCommand(latest, MOCK_CARD_CUSTOMERS, command, actor, MOCK_ISSUING_POLICY, new Date().toISOString(), prefix => `${prefix}-${crypto.randomUUID()}`);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("The operation was not saved. Browser storage is unavailable or full; no changes were applied."); }
  snapshot = next;
  listeners.forEach(notify => notify());
  return next;
}
