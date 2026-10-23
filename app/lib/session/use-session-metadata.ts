"use client";
import { useEffect, useState } from "react";
import { usePreferences } from "@/app/context/PreferencesContext";
import { getDemoSession } from "./demo";
/** A fixed login observation, formatted using the customer's saved date preferences. */
export function useSessionMetadata(clientId: string) {
  const { preferences, snapshot } = usePreferences();
  const current = snapshot?.mode === "http" ? snapshot.sessions.find(s => s.current && !s.revoked_at) : null;
  const currentId = current?.id, currentStart = current?.started_at;
  const [session, setSession] = useState({ id: "…", lastLogin: "…" });
  useEffect(() => {
    const entry = currentId && currentStart ? { id: currentId, started_at: currentStart } : getDemoSession(clientId);
    const initial = window.setTimeout(() => setSession({ id: entry.id, lastLogin: new Intl.DateTimeFormat(preferences.date_locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: preferences.timezone, hour12: false }).format(new Date(entry.started_at)) }), 0);
    return () => window.clearTimeout(initial);
  }, [clientId, preferences.timezone, preferences.date_locale, currentId, currentStart]);
  return session;
}
