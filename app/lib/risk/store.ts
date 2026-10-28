"use client";
import { useSyncExternalStore } from "react";
import { MOCK_RISK_STATE } from "@/app/lib/mock/admin/risk";
import type { RiskActor, RiskCommand, RiskState } from "@/app/lib/types/admin/risk";
import { applyRiskCommand } from "./engine";
export const RISK_STORAGE_KEY = "mbank_risk_v1";
export const RISK_EVENT = "mbank:risk-updated";
let cached: RiskState | null = null;
let warning: string | null = null;
const listeners = new Set<() => void>();
export { validRiskState } from "./validation";
import { validRiskState } from "./validation";
export function readRiskForExecution(): RiskState {
  if ((process.env.NEXT_PUBLIC_RISK_MODE ?? process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo") !== "demo") throw new Error("Risk Control requires server-side execution in HTTP mode. Local financial execution is blocked.");
  const raw = localStorage.getItem(RISK_STORAGE_KEY);
  if (!raw) return MOCK_RISK_STATE;
  const parsed: unknown = JSON.parse(raw);
  if (!validRiskState(parsed)) throw new Error("Saved risk data is invalid. Risk operations and trading are blocked until storage is repaired.");
  return parsed;
}
function read() {
  warning = null;
  try { return readRiskForExecution(); }
  catch { warning = "Risk storage could not be restored. Demo defaults are displayed; changes and trading are blocked. Preserve browser data for recovery."; return MOCK_RISK_STATE; }
}
function snapshot() { if (typeof window === "undefined") return MOCK_RISK_STATE; return cached ??= read(); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => { if (event.key === RISK_STORAGE_KEY || event.key === null) { cached = read(); listeners.forEach(fn => fn()); } };
  window.addEventListener("storage", storage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", storage); };
}
export function useRiskState() { return useSyncExternalStore(subscribe, snapshot, () => MOCK_RISK_STATE); }
export function riskStorageWarning() { return warning; }
export function refreshRiskState() { cached = read(); listeners.forEach(fn => fn()); }
export function saveRiskDemo(state: RiskState) {
  if (!validRiskState(state)) throw new Error("Invalid risk demo state.");
  localStorage.setItem(RISK_STORAGE_KEY, JSON.stringify(state)); cached = state;
  listeners.forEach(fn => fn());
}
export function executeRiskCommand(command: RiskCommand, actor: RiskActor, request?: { key: string }) {
  const state = readRiskForExecution();
  const payload = JSON.stringify({ actor: actor.email.trim().toLowerCase(), command });
  if (request) {
    if (actor.role !== "admin" || !request.key.trim()) throw new Error("Administrator and idempotency key required.");
    const receipt = state.processedRequests?.find(item => item.key === request.key);
    if (receipt) { if (receipt.payload !== payload) throw new Error("Idempotency key already used for another operation."); return state; }
  }
  const next = applyRiskCommand(state, command, actor, new Date().toISOString(), `RSK-${crypto.randomUUID()}`);
  if (request) next.processedRequests = [...(next.processedRequests ?? []), { key: request.key, payload }];
  if (!validRiskState(next)) throw new Error("Invalid risk result. No changes were saved.");
  try { localStorage.setItem(RISK_STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("Browser storage is unavailable or full. No changes were saved."); }
  cached = next; warning = null; listeners.forEach(fn => fn());
  if (typeof window !== "undefined") window.dispatchEvent?.(new Event(RISK_EVENT));
  return next;
}
