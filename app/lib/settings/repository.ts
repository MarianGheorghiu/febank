import type { SecurityFlow, SettingsCommand, SettingsRepository, SettingsSnapshot } from "./contracts";
import { commitSettings, readSettings } from "./store";
import { parseSettingsSnapshot, validateCommand } from "./engine";
import { readWallet } from "../wallet/store";
import { outstanding } from "../loans/engine";
import { units } from "../transfers/engine";
import { SETTINGS_EVENT } from "./defaults";
export function parseSecurityRedirect(value: unknown, origin: string) {
  const flow = value as { redirect_url?: unknown; expires_at?: unknown };
  if (!flow || typeof flow.redirect_url !== "string" || typeof flow.expires_at !== "string" || !Number.isFinite(Date.parse(flow.expires_at)) || Date.parse(flow.expires_at) <= Date.now() || !flow.redirect_url.startsWith("/auth/secure/") || flow.redirect_url.includes("\\")) throw new Error("Invalid secure authentication flow.");
  const url = new URL(flow.redirect_url, origin);
  if (url.origin !== origin || !url.pathname.startsWith("/auth/secure/")) throw new Error("The authentication flow must stay on the bank's origin.");
  return { kind: "redirect" as const, redirect_url: url.pathname + url.search, expires_at: flow.expires_at };
}
export function createSettingsRepository(email: string, name: string, code: string): SettingsRepository {
  if (!email.trim()) throw new Error("A customer session is required.");
  const mode = process.env.NEXT_PUBLIC_SETTINGS_MODE ?? process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (!["demo", "http"].includes(mode) || mode !== (process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo")) throw new Error("Settings and wallet must use the same service mode.");
  if (mode === "http") {
    const base = (process.env.NEXT_PUBLIC_SETTINGS_API_URL ?? process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "").replace(/\/$/, "");
    async function request(path: string, body?: unknown, key?: string, signal?: AbortSignal) {
      if (key !== undefined && !/^[a-zA-Z0-9_-]{8,120}$/.test(key)) throw new Error("A valid request key is required.");
      const response = await fetch(`${base}/v1/me/settings${path}`, { method: body ? "POST" : "GET", credentials: "include", cache: "no-store", signal, headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json", "Idempotency-Key": key! } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(typeof error?.error?.message === "string" ? error.error.message : `Settings service failed (${response.status}).`); }
      return response.json();
    }
    const snapshot = (value: unknown) => { const s = parseSettingsSnapshot(value); if (s.mode !== "http" || s.identity.email.trim().toLowerCase() !== email.trim().toLowerCase()) throw new Error("Unexpected settings account scope."); return s; };
    return { getSnapshot: async signal => snapshot(await request("", undefined, undefined, signal)), execute: async (command, key) => { validateCommand(command); const next = snapshot(await request("/commands", command, key)); window.dispatchEvent(new Event(SETTINGS_EVENT)); return next; }, startSecurityFlow: async (action, expected_version, key) => { assertFlow(action); return parseSecurityRedirect(await request("/security-flows", { action, expected_version }, key), window.location.origin); } };
  }
  async function project(): Promise<SettingsSnapshot> {
    const state = readSettings(email, name), { state: wallet } = readWallet(email);
    const registry = await import("../admin/mock-card-issuing-store");
    const cards = registry.ensureDemoCardCustomer(email, name), customer = registry.cardCustomers(cards).find(c => c.email.toLowerCase() === email.trim().toLowerCase());
    return parseSettingsSnapshot({ ...state, schema_version: 1, mode: "demo", as_of: new Date().toISOString(), identity: { email, legal_name: customer?.name ?? name, client_code: code, account_status: customer?.accountStatus ?? "UNKNOWN", verification: customer?.kycStatus ?? "UNKNOWN", address: customer?.deliveryAddress ?? null }, security: { mfa: "unknown", passkey_count: 0, password_updated_at: null, available_flows: ["change_password", "setup_mfa", "manage_passkeys"] }, account_review: { has_balances: wallet.transfers.accounts.some(a => units(a.available, a.decimals) + units(a.reserved, a.decimals) > BigInt(0)), has_personal_credit: units(outstanding(wallet.credit, "personal"), 2) > BigInt(0), pending_transfers: wallet.transfers.transfers.filter(t => ["pending", "processing"].includes(t.status)).length, pending_orders: wallet.trading.orders.filter(o => o.status === "PENDING").length, linked_businesses: wallet.credit.businesses.filter(b => b.verified).length } });
  }
  const execute = async (command: SettingsCommand, key: string) => { const before = await project(); const state = commitSettings(email, name, command, key); return parseSettingsSnapshot({ ...before, ...state, as_of: new Date().toISOString() }); };
  return { getSnapshot: project, execute, startSecurityFlow: async (action, expected_version, key) => { assertFlow(action); return { kind: "demo_request", snapshot: await execute({ action: "request", expected_version, kind: action, details: `Requested ${action.replaceAll("_", " ")} in the demo. No authentication credentials were changed.` }, key) }; } };
}
function assertFlow(action: SecurityFlow) { if (!["change_password", "setup_mfa", "manage_mfa", "manage_passkeys"].includes(action)) throw new Error("Unsupported authentication flow."); }
