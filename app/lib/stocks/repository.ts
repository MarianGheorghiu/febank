import type { StocksRepository } from "./contracts";
import { parseStockQuote, parseStocksSnapshot } from "./response";
import { WALLET_EVENT } from "../wallet/store";
export const STOCKS_EVENT = "mbank:stocks-updated";
export function createStocksRepository(customer: string): StocksRepository {
  const mode = process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (mode === "demo") {
    const local = import("./demo").then(module => module.createLocalStocksRepository(customer));
    return { getSnapshot: async () => (await local).getSnapshot(), quote: async draft => (await local).quote(draft), submit: async (id, key) => (await local).submit(id, key), cancel: async (id, key) => (await local).cancel(id, key), execute: async (command, key) => (await local).execute(command, key) };
  }
  if (mode !== "http") throw new Error("Unknown wallet mode.");
  const base = (process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "").replace(/\/$/, "");
  async function request(path: string, method = "GET", body?: unknown, key?: string, signal?: AbortSignal) {
    const response = await fetch(`${base}/v1/me/stocks${path}`, { method, credentials: "include", cache: "no-store", signal, headers: { Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.error?.message ?? `Stocks request failed (${response.status}).`); } return response.json();
  }
  async function mutate(path: string, body: unknown, key: string, method = "POST") { const snapshot = parseStocksSnapshot(await request(path, method, body, key)); window.dispatchEvent(new Event(WALLET_EVENT)); window.dispatchEvent(new Event(STOCKS_EVENT)); return snapshot; }
  return { getSnapshot: async signal => parseStocksSnapshot(await request("", "GET", undefined, undefined, signal)), quote: async draft => {
    const quote = parseStockQuote(await request("/quotes", "POST", draft));
    if (quote.draft.symbol !== draft.symbol || quote.draft.side !== draft.side || quote.draft.type !== draft.type || quote.draft.currency !== draft.currency || Number(quote.draft.quantity) !== Number(draft.quantity) || (draft.type !== "MARKET" && Number(quote.draft.target_price_usd) !== Number(draft.target_price_usd))) throw new Error("The service returned a quote for a different order.");
    return quote;
  }, submit: (id, key) => mutate("/orders", { quote_id: id }, key), cancel: (id, key) => mutate(`/orders/${encodeURIComponent(id)}/cancel`, {}, key), execute: (command, key) => command.type === "create_plan" ? mutate("/plans", command.draft, key) : command.type === "update_plan" ? mutate(`/plans/${encodeURIComponent(command.id)}`, { ...command.draft, expected_version: command.expected_version }, key, "PATCH") : mutate(`/plans/${encodeURIComponent(command.id)}/status`, { status: command.status, expected_version: command.expected_version }, key) };
}
