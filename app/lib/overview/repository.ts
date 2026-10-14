import { MOCK_OVERVIEW } from "../mock/dashboard";
import type { OverviewOperation, OverviewSnapshot } from "../types/dashboard";
import { applyOperation } from "./engine";
export interface OverviewRepository {
  getSnapshot(): Promise<OverviewSnapshot>;
  submitOperation(operation: OverviewOperation): Promise<OverviewSnapshot>;
}
/** Browser session-scoped mock. Replace this factory with a Go HTTP adapter. */
export function createOverviewRepository(clientId: string): OverviewRepository {
  let snapshot = structuredClone(MOCK_OVERVIEW);
  const key = `mbank_overview_v1:${clientId}`;
  let loaded = false;
  let operations: { operation: OverviewOperation; at: string }[] = [];
  async function getSnapshot() {
    if (!loaded) {
      loaded = true;
      try {
        const raw = typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
        // Replay validated operations; never trust a stored balance or report shape.
        operations = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(operations)) throw new Error("Invalid mock session");
        for (const entry of operations) {
          if (!Number.isFinite(Date.parse(entry.at))) throw new Error("Invalid timestamp");
          snapshot = applyOperation(snapshot, entry.operation, entry.at);
        }
      } catch { snapshot = structuredClone(MOCK_OVERVIEW); operations = []; }
    }
    return structuredClone(snapshot);
  }
  return {
    getSnapshot,
    async submitOperation(operation) {
      await getSnapshot();
      const at = new Date().toISOString();
      const next = applyOperation(snapshot, operation, at);
      if (next === snapshot) return structuredClone(snapshot);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(key, JSON.stringify([...operations, { operation, at }]));
        } catch { throw new Error("Unable to save the mock operation. Check browser storage and retry."); }
      }
      operations.push({ operation, at });
      snapshot = next;
      return structuredClone(snapshot);
    },
  };
}
