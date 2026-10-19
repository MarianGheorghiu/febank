import type { TransferRepository, TransferQuote, TransferSnapshot } from "./contracts";
import { buildQuote } from "./engine";
import { parseQuote, parseSnapshot } from "./response";
import { commitWallet, readWallet, walletCustomers, WALLET_EVENT } from "../wallet/store";

export const TRANSFER_EVENT = "mbank:transfers-updated";
export function createDemoTransferRepository(clientId: string): TransferRepository {
  const quotes = new Map<string, TransferQuote>();
  function validKey(key: string) { if (!/^[A-Za-z0-9-]{8,100}$/.test(key)) throw new Error("Invalid idempotency key."); }
  return {
    async getSnapshot() { return readWallet(clientId).state.transfers; },
    async quote(draft) {
      const quote = buildQuote(readWallet(clientId).state.transfers, draft, crypto.randomUUID(), new Date().toISOString());
      quotes.set(quote.id, quote);
      return structuredClone(quote);
    },
    async submit(quoteId, key) {
      validKey(key);
      const { events, state } = readWallet(clientId);
      const snapshot = state.transfers;
      const previous = events.find(e => e.key === key);
      if (previous) {
        if (previous.kind !== "submit" || previous.quote.id !== quoteId) throw new Error("Idempotency key already used for another request.");
        return snapshot;
      }
      const quote = quotes.get(quoteId);
      if (!quote) throw new Error("Quote unavailable. Review a new quote.");
      const at = new Date().toISOString();
      return commitWallet(clientId, { kind: "submit", quote, key, at }).transfers;
    },
    async cancel(transfer_id, key) {
      validKey(key);
      const { events, state } = readWallet(clientId);
      const snapshot = state.transfers;
      const previous = events.find(e => e.key === key);
      if (previous) {
        if (previous.kind !== "cancel" || previous.transfer_id !== transfer_id) throw new Error("Idempotency key already used for another request.");
        return snapshot;
      }
      const at = new Date().toISOString();
      return commitWallet(clientId, { kind: "cancel", transfer_id, key, at }).transfers;
    },
  };
}
/** Demo admin read model: only operations submitted in this browser session. */
export async function getDemoAdminTransfers() {
  const result: { customer: string; snapshot: TransferSnapshot }[] = [];
  for (const customer of walletCustomers()) {
    const snapshot = await createDemoTransferRepository(customer).getSnapshot();
    result.push({ customer, snapshot: { ...snapshot, transfers: snapshot.transfers.filter(t => t.id.startsWith("trf-")) } });
  }
  return result;
}
export function createHttpTransferRepository(baseUrl: string): TransferRepository {
  async function request<T>(path: string, body?: object, key?: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/me/transfers${path}`, { method: body ? "POST" : "GET", credentials: "include", cache: "no-store", signal, headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error?.message ?? `Transfer request failed (${response.status}).`);
    }
    return response.json() as Promise<T>;
  }
  async function mutate(path: string, body: object, key: string) {
    const snapshot = parseSnapshot(await request<unknown>(path, body, key));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(WALLET_EVENT));
      window.dispatchEvent(new Event(TRANSFER_EVENT));
    }
    return snapshot;
  }
  return { getSnapshot: async signal => parseSnapshot(await request<unknown>("", undefined, undefined, signal)), quote: async draft => parseQuote(await request<unknown>("/quotes", draft)), submit: (quote_id, key) => mutate("", { quote_id }, key), cancel: (id, key) => mutate(`/${encodeURIComponent(id)}/cancel`, {}, key) };
}
export function createTransferRepository(clientId: string): TransferRepository {
  const mode = process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (mode === "demo") return createDemoTransferRepository(clientId);
  if (mode !== "http") throw new Error("Unknown transfers mode. Use demo or http.");
  return createHttpTransferRepository(process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "");
}
