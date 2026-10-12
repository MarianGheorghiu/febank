"use client";
import { useSyncExternalStore } from "react";
import { MOCK_FLAGS_CONFIG } from "@/app/lib/mock/admin/flags-config";
import type { ConfigState, ConfigRepository } from "@/app/lib/types/admin/flags-config";
import { publishConfig, validConfigState } from "./engine";

export const CONFIG_STORAGE_KEY="mbank_flags_config_v1";
let cached:ConfigState | null=null;
let warning:string | null=null;
const listeners=new Set<()=>void>();
function read():ConfigState {
  const raw=localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!raw) return structuredClone(MOCK_FLAGS_CONFIG);
  const parsed:unknown=JSON.parse(raw);
  if (!validConfigState(parsed)) throw new Error("Saved configuration is invalid. Preserve browser storage for recovery; publishing is blocked.");
  return parsed;
}
function refresh() {
  try { cached=read(); warning=null; }
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
  async getSnapshot() { refresh(); if (warning) throw new Error(warning); return structuredClone(snapshot()); },
  async publish(request) {
    // Read just before committing to catch edits from another open tab.
    const next=publishConfig(read(),request,crypto.randomUUID(),new Date().toISOString());
    try { localStorage.setItem(CONFIG_STORAGE_KEY,JSON.stringify(next)); }
    catch { throw new Error("Browser storage is unavailable or full. Configuration was not published."); }
    cached=next; warning=null; listeners.forEach(fn=>fn()); return structuredClone(next);
  },
};
