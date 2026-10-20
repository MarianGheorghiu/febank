import { createCurrencyRepository } from "../currencies/repository";
import { parseCryptoSnapshot } from "./response";
import type { CryptoRepository } from "./contracts";
export function createCryptoRepository(customer: string): CryptoRepository {
  const exchange = createCurrencyRepository(customer);
  const mode = process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (mode === "demo") {
    const reader = import("./demo").then(module => module.createLocalCryptoReader(customer));
    return { exchange, getSnapshot: async () => (await reader)() };
  }
  if (mode !== "http") throw new Error("Unknown wallet mode.");
  const baseUrl = (process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "").replace(/\/$/, "");
  return { exchange, async getSnapshot(signal) {
    const response = await fetch(`${baseUrl}/v1/me/crypto`, { credentials: "include", cache: "no-store", signal, headers: { Accept: "application/json" } });
    if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.error?.message ?? `Crypto service request failed (${response.status}).`); }
    return parseCryptoSnapshot(await response.json());
  } };
}
