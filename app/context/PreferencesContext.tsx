"use client";
import { createContext, useContext } from "react";
import type { CustomerPreferences, SettingsRepository, SettingsSnapshot } from "@/app/lib/settings/contracts";
import { DEFAULT_PREFERENCES } from "@/app/lib/settings/defaults";
interface PreferencesContextValue {
  preferences: CustomerPreferences; snapshot: SettingsSnapshot | null; repository: SettingsRepository | null;
  loaded: boolean; refreshing: boolean; error: string; refresh: () => void; accept: (snapshot: SettingsSnapshot) => void;
}
export const PreferencesContext = createContext<PreferencesContextValue>({ preferences: DEFAULT_PREFERENCES, snapshot: null, repository: null, loaded: false, refreshing: false, error: "", refresh: () => {}, accept: () => {} });
export const usePreferences = () => useContext(PreferencesContext);
