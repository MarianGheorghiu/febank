import type { SettingsSnapshot } from "./contracts";
/** Explicit allowlist; never export cookies, session tokens, passwords or challenge secrets. */
export function settingsReport(s: SettingsSnapshot) {
  return JSON.stringify({ report: "Account settings", schema_version: 1, as_of: s.as_of, mode: s.mode, identity: s.identity, display_name: s.display_name, preferences: s.preferences, communications: s.communications, security: { mfa: s.security.mfa, passkey_count: s.security.passkey_count, password_updated_at: s.security.password_updated_at }, requests: s.requests, activity: s.audit }, null, 2);
}
