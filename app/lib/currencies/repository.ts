import type { CurrencyRepository } from "./contracts";
import { parseCurrencyQuote, parseCurrencySnapshot } from "./response";
import { WALLET_EVENT } from "../wallet/store";
export function createHttpCurrencyRepository(baseUrl: string): CurrencyRepository {
  async function request(path: string, body?: object, key?: string, signal?: AbortSignal) {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/me/currencies${path}`, { method: body ? "POST" : "GET", credentials: "include", cache: "no-store", signal, headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.error?.message ?? `Currency service request failed (${response.status}).`); }
    return response.json() as Promise<unknown>;
  }
  return {
    getSnapshot: async signal => parseCurrencySnapshot(await request("", undefined, undefined, signal)),
    quote: async draft => parseCurrencyQuote(await request("/quotes", draft)),
    submit: async (quote_id, key) => {
      const snapshot = parseCurrencySnapshot(await request("/exchanges", { quote_id }, key));
      if (typeof window !== "undefined") { window.dispatchEvent(new Event(WALLET_EVENT)); window.dispatchEvent(new Event("mbank:transfers-updated")); }
      return snapshot;
    },
  };
}
export function createCurrencyRepository(customer: string): CurrencyRepository {
  const mode = process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (mode === "http") return createHttpCurrencyRepository(process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "");
  if (mode !== "demo") throw new Error("Unknown wallet mode. Use demo or http.");
  // Load the local execution adapter only when demo mode is explicitly selected.
  const demo = import("./demo").then(module => module.createDemoCurrencyRepository(customer));
  return { getSnapshot: async signal => (await demo).getSnapshot(signal), quote: async draft => (await demo).quote(draft), submit: async (id, key) => (await demo).submit(id, key) };
}
