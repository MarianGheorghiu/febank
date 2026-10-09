"use client";
import { useSyncExternalStore } from "react";
import { MOCK_RISK_STATE } from "@/app/lib/mock/admin/risk";
import { RISK_DOMAINS } from "@/app/lib/types/admin/risk";
import type { RiskActor, RiskCommand, RiskState } from "@/app/lib/types/admin/risk";
import { applyRiskCommand, validatePolicy } from "./engine";
export const RISK_STORAGE_KEY = "mbank_risk_v1";
let cached: RiskState | null = null;
let warning: string | null = null;
const listeners = new Set<() => void>();
const obj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === "string";
const date = (v: unknown) => str(v) && Number.isFinite(Date.parse(v));
const email = (v: unknown) => str(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export function validRiskState(v: unknown): v is RiskState {
  if (!obj(v) || !Number.isInteger(v.revision) || Number(v.revision) < 0 || !Array.isArray(v.cases) || !Array.isArray(v.policies) || !Array.isArray(v.restrictions) || !Array.isArray(v.audit)) return false;
  try { for (const policy of v.policies) { if (!obj(policy)) return false; validatePolicy(policy as unknown as RiskState["policies"][number]); } } catch { return false; }
  return v.policies.length === 3 && new Set(v.policies.map(p => p.domain)).size === 3
    && v.cases.every(c => obj(c) && str(c.id) && RISK_DOMAINS.includes(c.domain as never) && str(c.category) && str(c.subject) && email(c.email) && str(c.reference) && typeof c.amountUsd === "number" && Number.isFinite(c.amountUsd) && c.amountUsd > 0 && typeof c.score === "number" && Number.isFinite(c.score) && c.score >= 0 && c.score <= 100 && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(String(c.severity)) && ["OPEN", "INVESTIGATING", "ESCALATED", "RESOLVED"].includes(String(c.status)) && (c.owner === null || email(c.owner)) && date(c.createdAt) && date(c.dueAt) && Array.isArray(c.evidence) && c.evidence.every(str) && Array.isArray(c.notes) && c.notes.every(n => obj(n) && email(n.actor) && str(n.text) && date(n.timestamp)) && (c.status === "RESOLVED" ? ["CONFIRMED", "FALSE_POSITIVE"].includes(String(c.resolution)) : c.resolution === null))
    && new Set(v.cases.map(c => c.id)).size === v.cases.length
    && v.restrictions.every(r => obj(r) && email(r.email) && r.email === String(r.email).toLowerCase() && str(r.reason) && email(r.actor) && date(r.timestamp) && (r.releaseRequestedBy === null || email(r.releaseRequestedBy)))
    && new Set(v.restrictions.map(r => r.email)).size === v.restrictions.length
    && v.audit.every(a => obj(a) && str(a.id) && email(a.actor) && str(a.action) && str(a.target) && str(a.reason) && date(a.timestamp));
}
export function readRiskForExecution(): RiskState {
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
export function executeRiskCommand(command: RiskCommand, actor: RiskActor) {
  const next = applyRiskCommand(readRiskForExecution(), command, actor, new Date().toISOString(), `RSK-${crypto.randomUUID()}`);
  if (!validRiskState(next)) throw new Error("Invalid risk result. No changes were saved.");
  try { localStorage.setItem(RISK_STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("Browser storage is unavailable or full. No changes were saved."); }
  cached = next; warning = null; listeners.forEach(fn => fn()); return next;
}
