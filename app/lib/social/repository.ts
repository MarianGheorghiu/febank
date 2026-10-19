import type { SocialCommand, SocialRepository, SocialSnapshot } from "./contracts";
import { applySocialCommand } from "./engine";
import { parseSocialSnapshot } from "./response";
import { socialSeed } from "./seed";
export const SOCIAL_EVENT = "mbank:social-updated";
function emit() { if (typeof window !== "undefined") window.dispatchEvent(new Event(SOCIAL_EVENT)); }
function validKey(key: string) { if (!/^[a-zA-Z0-9-]{8,100}$/.test(key)) throw new Error("Invalid idempotency key."); }
interface StoredSocial { snapshot: SocialSnapshot; commands: { key: string; payload: string }[] }
export function createDemoSocialRepository(clientId: string): SocialRepository {
  const storageKey = `mbank_social_v1:${clientId}`;
  let memory: StoredSocial = { snapshot: socialSeed(), commands: [] };
  function read(): StoredSocial {
    if (typeof window === "undefined") return structuredClone(memory);
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return structuredClone(memory);
    try {
      const stored = JSON.parse(raw);
      const snapshot = parseSocialSnapshot(stored.snapshot);
      if (!Array.isArray(stored.commands) || stored.commands.some((c: { key?: unknown; payload?: unknown }) => !c || typeof c.key !== "string" || typeof c.payload !== "string")) throw new Error();
      return { snapshot, commands: stored.commands };
    } catch { throw new Error("Saved social data is unreadable. It has been preserved; please contact support."); }
  }
  return {
    async getSnapshot() { return read().snapshot; },
    async execute(command, key) {
      validKey(key);
      const stored = read(), payload = JSON.stringify(command);
      const previous = stored.commands.find(c => c.key === key);
      if (previous) {
        if (previous.payload !== payload) throw new Error("Idempotency key already used for another request.");
        return stored.snapshot;
      }
      const snapshot = applySocialCommand(stored.snapshot, command, key, new Date().toISOString());
      // Persist before reporting success; storage failures must remain visible.
      const next = { snapshot, commands: [...stored.commands, { key, payload }] };
      if (typeof window !== "undefined") sessionStorage.setItem(storageKey, JSON.stringify(next));
      memory = next; emit();
      return structuredClone(snapshot);
    },
  };
}
export function createHttpSocialRepository(baseUrl: string): SocialRepository {
  async function request(command?: SocialCommand, key?: string, signal?: AbortSignal) {
    if (key) validKey(key);
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/me/social${command ? "/commands" : ""}`, {
      method: command ? "POST" : "GET", credentials: "include", cache: "no-store", signal,
      headers: { Accept: "application/json", ...(command ? { "Content-Type": "application/json", "Idempotency-Key": key! } : {}) },
      ...(command ? { body: JSON.stringify(command) } : {}),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(typeof error?.error?.message === "string" ? error.error.message : `Social request failed (${response.status}).`);
    }
    const snapshot = parseSocialSnapshot(await response.json());
    if (command) emit();
    return snapshot;
  }
  return { getSnapshot: signal => request(undefined, undefined, signal), execute: (command, key) => request(command, key) };
}
export function createSocialRepository(clientId: string): SocialRepository {
  const mode = process.env.NEXT_PUBLIC_SOCIAL_MODE ?? process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (mode === "demo") return createDemoSocialRepository(clientId);
  if (mode !== "http") throw new Error("Unknown social mode. Use demo or http.");
  return createHttpSocialRepository(process.env.NEXT_PUBLIC_SOCIAL_API_URL ?? process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "");
}
