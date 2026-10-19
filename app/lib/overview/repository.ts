import type { OverviewOperation, OverviewSnapshot } from "../types/dashboard";
import { buildQuote } from "../transfers/engine";
import { projectOverview } from "../wallet/engine";
import { commitWallet, readWallet, WALLET_EVENT } from "../wallet/store";
export interface OverviewRepository {
  getSnapshot(): Promise<OverviewSnapshot>;
  submitOperation(operation: OverviewOperation): Promise<OverviewSnapshot>;
}
export function createOverviewRepository(clientId: string): OverviewRepository {
  const mode = process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (!["demo", "http"].includes(mode)) throw new Error("Unknown wallet mode.");
  if (mode === "http") {
    const base = (process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "").replace(/\/$/, "");
    async function request(operation?: OverviewOperation): Promise<OverviewSnapshot> {
      const response = await fetch(`${base}/v1/me/overview${operation ? "/operations" : ""}`, { method: operation ? "POST" : "GET", credentials: "include", cache: "no-store", headers: { Accept: "application/json", ...(operation ? { "Content-Type": "application/json", "Idempotency-Key": operation.id } : {}) }, ...(operation ? { body: JSON.stringify(operation) } : {}) });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error?.message ?? "Unable to load the shared wallet.");
      }
      const snapshot: OverviewSnapshot = await response.json();
      if (snapshot.schema_version !== 1 || !snapshot.summary || !Array.isArray(snapshot.accounts)) throw new Error("Invalid overview service response.");
      if (operation && typeof window !== "undefined") window.dispatchEvent(new Event(WALLET_EVENT));
      return snapshot;
    }
    return { getSnapshot: () => request(), submitOperation: request };
  }
  return {
    async getSnapshot() { return projectOverview(readWallet(clientId).state, new Date().toISOString()); },
    async submitOperation(operation) {
      const { events, state } = readWallet(clientId);
      const previous = events.find(event => event.key === operation.id);
      if (previous) {
        const original = previous.kind === "overview" ? previous.operation : previous.kind === "submit" ? previous.overview_operation : undefined;
        if (JSON.stringify(original) !== JSON.stringify(operation)) throw new Error("Idempotency key already used for another request.");
        return projectOverview(state, new Date().toISOString());
      }
      const at = new Date().toISOString();
      if (operation.type === "transfer") {
        const quote = buildQuote(state.transfers, { source_account_id: "account-USD", route_id: operation.recipient_kind === "phone" ? "phone-USD" : operation.recipient_kind === "iban" ? "route-USD" : "", amount: operation.amount, recipient_name: operation.recipient_name ?? "", destination: operation.recipient ?? "", reference: "Overview transfer" }, `quote-${operation.id}`, at);
        return projectOverview(commitWallet(clientId, { kind: "submit", key: operation.id, at, quote, overview_operation: operation }), at);
      }
      return projectOverview(commitWallet(clientId, { kind: "overview", key: operation.id, at, operation }), at);
    },
  };
}
