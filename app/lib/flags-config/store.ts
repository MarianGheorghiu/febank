"use client";
import { useSyncExternalStore } from "react";
import { MOCK_FLAGS_CONFIG } from "@/app/lib/mock/admin/flags-config";
import type { ConfigState, ConfigRepository } from "@/app/lib/types/admin/flags-config";
import { publishConfig, validConfigState, canonicalConfig } from "./engine";

export const CONFIG_STORAGE_KEY="mbank_flags_config_v1";
let cached:ConfigState | null=null;
let warning:string | null=null;
const listeners=new Set<()=>void>();
export function readConfigForExecution():ConfigState {
  if ((process.env.NEXT_PUBLIC_FLAGS_CONFIG_MODE ?? "demo") !== "demo") throw new Error("Live configuration must be enforced by the Go service; local operations are unavailable.");
  if (typeof localStorage === "undefined") return structuredClone(MOCK_FLAGS_CONFIG);
  const raw=localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!raw) return structuredClone(MOCK_FLAGS_CONFIG);
  const parsed:unknown=JSON.parse(raw);
  if (!validConfigState(parsed)) throw new Error("Saved configuration is invalid. Preserve browser storage for recovery; publishing is blocked.");
  // Enrich only untouched legacy baselines with labelled examples, preserving all published values.
  for (const environment of ['production', 'staging', 'sandbox'] as const) {
    const current=parsed.environments[environment], sample=MOCK_FLAGS_CONFIG.environments[environment];
    if (current.revision===1 && current.releases.length===0 && sample.releases.length>0 && canonicalConfig(current.published)===canonicalConfig(sample.published)) parsed.environments[environment]=structuredClone(sample);
  }
  return parsed;
}
function refresh() {
  try { cached=readConfigForExecution(); warning=null; }
  catch { cached=MOCK_FLAGS_CONFIG; warning="Saved configuration is unavailable or invalid. Showing defaults; publishing is blocked. Preserve browser storage for recovery."; }
  listeners.forEach(fn=>fn());
}
function snapshot() { if (typeof window==="undefined") return MOCK_FLAGS_CONFIG; if (!cached) refresh(); return cached!; }
function subscribe(listener:()=>void) {
  listeners.add(listener);
  const changed=(event:StorageEvent)=>{ if (event.key===CONFIG_STORAGE_KEY || event.key===null) refresh(); };
  window.addEventListener("storage",changed);
  return ()=>{listeners.delete(listener);window.removeEventListener("storage",changed);};
}
export function useFlagsConfig() { return useSyncExternalStore(subscribe,snapshot,()=>MOCK_FLAGS_CONFIG); }
export function configStorageWarning() { return warning; }
export const mockConfigRepository:ConfigRepository={
  async getSnapshot() { refresh(); if (warning) throw new Error(warning); return structuredClone(cached!); },
  async publish(request) {
    if (request.actor.role!=="admin" || !request.actor.email.trim()) throw new Error("Administrator access required.");
    // Read just before committing to catch edits from another open tab.
    const current=readConfigForExecution();
    const fingerprint=canonicalConfig({...request,actor:request.actor.email.toLowerCase()});
    const receipt=request.request_id ? current.receipts?.find(r=>r.request_id===request.request_id) : undefined;
    if (receipt) {if (receipt.fingerprint!==fingerprint) throw new Error("Idempotency key reused for a different release."); return structuredClone(current);}
    const releaseId=crypto.randomUUID();
    const next=publishConfig(current,request,releaseId,new Date().toISOString());
    if (request.request_id) next.receipts=[...(current.receipts??[]),{request_id:request.request_id,fingerprint,release_id:releaseId}];
    if (!validConfigState(next)) throw new Error("Invalid configuration release. No changes were published.");
    try { localStorage.setItem(CONFIG_STORAGE_KEY,JSON.stringify(next)); }
    catch { throw new Error("Browser storage is unavailable or full. Configuration was not published."); }
    cached=next; warning=null; listeners.forEach(fn=>fn());
    if (typeof window!=="undefined") window.dispatchEvent(new Event("mbank:config-updated"));
    return structuredClone(next);
  },
};
