"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { USERS_EVENT } from "@/app/lib/user-management/store";
import { useUser } from "./UserContext";
import { PreferencesContext } from "./PreferencesContext";
import type { SettingsSnapshot } from "@/app/lib/settings/contracts";
import { createSettingsRepository } from "@/app/lib/settings/repository";
import { DEFAULT_PREFERENCES, SETTINGS_EVENT } from "@/app/lib/settings/defaults";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import { CARDS_EVENT } from "@/app/lib/cards/repository";
export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const email = user?.email ?? "", name = user?.name ?? "", code = user?.clientCode ?? "", role = user?.role;
  const configuration = useMemo(() => { try { return { repository: role === "client" ? createSettingsRepository(email, name, code) : null, error: "" }; } catch (cause) { return { repository: null, error: cause instanceof Error ? cause.message : "Settings service is unavailable." }; } }, [email, name, code, role]);
  const [snapshot, setSnapshot] = useState<SettingsSnapshot | null>(null), [error, setError] = useState(""), [loaded, setLoaded] = useState(false), [refreshing, setRefreshing] = useState(false), [reload, setReload] = useState(0);
  const revision = useRef(0), latest = useRef<SettingsSnapshot | null>(null); const subject = user?.email.trim().toLowerCase();
  useEffect(() => {
    const controller = new AbortController(); let cancelled = false;
    const load = () => { const request = ++revision.current; if (!configuration.repository) { setLoaded(true); return; } setRefreshing(true); configuration.repository.getSnapshot(controller.signal).then(next => { if (!cancelled && request === revision.current && (!latest.current || latest.current.identity.email !== next.identity.email || next.version >= latest.current.version)) { latest.current = next; setSnapshot(next); setError(""); } }).catch(cause => { if (!cancelled && request === revision.current) setError(cause instanceof Error ? cause.message : "Unable to load settings."); }).finally(() => { if (!cancelled && request === revision.current) { setLoaded(true); setRefreshing(false); } }); };
    load(); window.addEventListener(SETTINGS_EVENT, load); window.addEventListener(USERS_EVENT, load); window.addEventListener(WALLET_EVENT, load); window.addEventListener(CARDS_EVENT, load); window.addEventListener("storage", load); window.addEventListener("focus", load);
    return () => { cancelled = true; controller.abort(); window.removeEventListener(SETTINGS_EVENT, load); window.removeEventListener(USERS_EVENT, load); window.removeEventListener(WALLET_EVENT, load); window.removeEventListener(CARDS_EVENT, load); window.removeEventListener("storage", load); window.removeEventListener("focus", load); };
  }, [configuration, reload]);
  const accept = useCallback((next: SettingsSnapshot) => { if (next.identity.email.trim().toLowerCase() !== subject || (latest.current?.identity.email === next.identity.email && latest.current.version > next.version)) return; revision.current++; latest.current = next; setSnapshot(previous => previous && previous.identity.email === next.identity.email && previous.version > next.version ? previous : next); setError(""); setLoaded(true); setRefreshing(false); }, [subject]);
  const scoped = snapshot?.identity.email.trim().toLowerCase() === subject ? snapshot : null;
  return <PreferencesContext.Provider value={{ preferences: scoped?.preferences ?? DEFAULT_PREFERENCES, snapshot: scoped, repository: configuration.repository, loaded, refreshing, error: configuration.error || error, refresh: () => setReload(value => value + 1), accept }}>{children}</PreferencesContext.Provider>;
}
