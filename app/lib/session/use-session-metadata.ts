"use client";
import { useEffect, useState } from "react";
const entryTimes = new Map<string, string>();
/** Fixed demo login/entry time shared across dashboard routes; refresh starts a new entry. */
export function useSessionMetadata(clientId: string) {
  const [session, setSession] = useState({ id: "…", lastLogin: "…" });
  useEffect(() => {
    const key = `mbank_overview_session:${clientId}`;
    let id: string;
    try {
      id = sessionStorage.getItem(key) ?? `MB-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
      sessionStorage.setItem(key, id);
    } catch { id = `MB-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`; }
    const at = entryTimes.get(clientId) ?? new Date().toISOString();
    entryTimes.set(clientId, at);
    const initial = window.setTimeout(() => setSession({ id, lastLogin: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Bucharest", hour12: false }).format(new Date(at)) }), 0);
    return () => window.clearTimeout(initial);
  }, [clientId]);
  return session;
}
