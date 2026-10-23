import type { CreditCommand, CreditRepository, CreditSnapshot } from "./contracts";
import { commitWallet, readWallet, WALLET_EVENT } from "../wallet/store";
import { projectCredit } from "./engine";
import { demoFunds } from "./seed";
import { validateCreditSnapshot } from "./response";

export function createCreditRepository(customer: string): CreditRepository {
  if (!customer.trim()) throw new Error("A customer session is required.");
  const mode = process.env.NEXT_PUBLIC_LOANS_MODE ?? "demo";
  if (mode !== "demo" && mode !== "http") throw new Error("Unknown credit service mode.");
  // Mixed remote and local money journals cannot provide an atomic credit transaction.
  const walletMode = process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (walletMode !== mode) throw new Error("Loans and the shared wallet must use the same service mode.");
  if (mode === "http") {
    const base = (process.env.NEXT_PUBLIC_LOANS_API_URL ?? "").replace(/\/$/, "");
    async function request(command?: CreditCommand, key?: string, signal?: AbortSignal): Promise<CreditSnapshot> {
      const response = await fetch(`${base}/v1/me/credit${command ? "/commands" : ""}`, {
        method: command ? "POST" : "GET", credentials: "include", cache: "no-store", signal,
        headers: { Accept: "application/json", ...(command ? { "Content-Type": "application/json", "Idempotency-Key": key! } : {}) },
        ...(command ? { body: JSON.stringify(command) } : {}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.error?.message === "string" ? body.error.message : `Credit service failed (${response.status}).`);
      }
      const snapshot = validateCreditSnapshot(await response.json());
      if (command && typeof window !== "undefined") window.dispatchEvent(new Event(WALLET_EVENT));
      return snapshot;
    }
    return { getSnapshot: signal => request(undefined, undefined, signal), execute: (command, key) => request(command, key) };
  }
  return {
    async getSnapshot() { const { state } = readWallet(customer); return projectCredit(state.credit, state.transfers.accounts, new Date().toISOString(), demoFunds); },
    async execute(command, key) {
      if (!/^[a-zA-Z0-9_-]{8,120}$/.test(key)) throw new Error("A valid idempotency key is required.");
      const at = new Date().toISOString();
      const state = commitWallet(customer, { kind: "credit", key, at, command });
      return projectCredit(state.credit, state.transfers.accounts, at, demoFunds);
    },
  };
}
