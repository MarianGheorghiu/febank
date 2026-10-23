import type { SettingsCommand, SettingsState } from "./contracts";
import { applySettings, settingsSeed, validateSettingsState } from "./engine";
import { SETTINGS_EVENT } from "./defaults";
import { getDemoSession } from "../session/demo";
const prefix = "mbank_settings_v1:";
interface StoredSettings { state: SettingsState; receipts: { key: string; fingerprint: string }[] }
function read(email: string, name: string): StoredSettings {
  const current = getDemoSession(email), key = prefix + encodeURIComponent(email.trim().toLowerCase());
  const raw = localStorage.getItem(key);
  let saved: StoredSettings;
  try { saved = raw ? JSON.parse(raw) : { state: settingsSeed(name, current), receipts: [] }; validateSettingsState(saved.state); if (!Array.isArray(saved.receipts) || saved.receipts.length > 500 || saved.receipts.some(r => !r || typeof r.key !== "string" || typeof r.fingerprint !== "string") || new Set(saved.receipts.map(r => r.key)).size !== saved.receipts.length) throw new Error(); }
  catch { throw new Error("Saved account settings could not be read. Your data was preserved."); }
  saved.state.sessions = saved.state.sessions.map(s => ({ ...s, current: s.id === current.id }));
  if (!saved.state.sessions.some(s => s.id === current.id)) {
    if (saved.state.sessions.length >= 100) throw new Error("Too many demo sessions. Sign out older devices before continuing.");
    saved.state.sessions.unshift({ id: current.id, device: "Current browser", current: true, ip: null, location: null, started_at: current.started_at, last_seen_at: current.started_at, revoked_at: null, source: "demo" });
  }
  const session = saved.state.sessions.find(s => s.current)!;
  if (session.revoked_at) throw new Error("This demo session has been signed out. Sign out and sign in again.");
  session.last_seen_at = new Date().toISOString();
  return saved;
}
export function readSettings(email: string, name: string) { return read(email, name).state; }
export function commitSettings(email: string, name: string, command: SettingsCommand, key: string) {
  const saved = read(email, name), fingerprint = JSON.stringify(command), previous = saved.receipts.find(receipt => receipt.key === key);
  if (previous) { if (previous.fingerprint !== fingerprint) throw new Error("This request key was already used for a different action."); return saved.state; }
  const state = applySettings(saved.state, command, key, new Date().toISOString()); validateSettingsState(state);
  try { localStorage.setItem(prefix + encodeURIComponent(email.trim().toLowerCase()), JSON.stringify({ state, receipts: [...saved.receipts, { key, fingerprint }].slice(-500) })); }
  catch { throw new Error("Settings could not be saved. Browser storage may be unavailable or full; no changes were applied."); }
  window.dispatchEvent(new Event(SETTINGS_EVENT)); return state;
}
