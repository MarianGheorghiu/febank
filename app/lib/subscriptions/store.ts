"use client";
import { useSyncExternalStore } from "react";
import { MOCK_SUBSCRIPTIONS } from "@/app/lib/mock/admin/subscriptions";
import type { SubscriptionState, SubscriptionsRepository } from "@/app/lib/types/admin/subscriptions";
import { applySubscriptionCommand, validSubscriptionState } from "./engine";
import { readSubscriptions, SUBSCRIPTIONS_STORAGE_KEY, SUBSCRIPTIONS_EVENT } from './registry';
export { SUBSCRIPTIONS_STORAGE_KEY } from './registry';
let cached: SubscriptionState | null = null;
let warning: string | null = null;
const listeners = new Set<() => void>();
function read() {
  return readSubscriptions();
}
function snapshot() {
  if (typeof window === "undefined") return MOCK_SUBSCRIPTIONS;
  if (!cached) {
    try { cached = read(); warning = null; }
    catch { cached = MOCK_SUBSCRIPTIONS; warning = "Subscription storage is unavailable or corrupt. Fixtures are shown; changes and exports are blocked. Preserve stored data for recovery."; }
  }
  return cached;
}
export function refreshSubscriptions() { cached = null; snapshot(); listeners.forEach(fn => fn()); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => { if (event.key === SUBSCRIPTIONS_STORAGE_KEY || event.key === null) refreshSubscriptions(); };
  window.addEventListener("storage", storage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", storage); };
}
export function useSubscriptions() { return useSyncExternalStore(subscribe, snapshot, () => MOCK_SUBSCRIPTIONS); }
export function subscriptionStorageWarning() { return warning; }
export const mockSubscriptionsRepository: SubscriptionsRepository = {
  async list() { refreshSubscriptions(); if (warning) throw new Error(warning); return snapshot(); },
  async execute(command, actor) {
    // Read immediately before a synchronous atomic write. Real Go service must use a DB transaction.
    let state: SubscriptionState;
    try { state = read(); } catch { throw new Error("Subscription storage unavailable. No changes saved."); }
    const next = applySubscriptionCommand(state, command, actor, new Date().toISOString());
    if (!validSubscriptionState(next)) throw new Error("Invalid operation result. No changes saved.");
    try { localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error("Subscription storage is unavailable or full. No changes saved."); }
    cached = next; warning = null; listeners.forEach(fn => fn());
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SUBSCRIPTIONS_EVENT));
      window.dispatchEvent(new Event("mbank:wallet-updated"));
    }
    return next;
  },
};
