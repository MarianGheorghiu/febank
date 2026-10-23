import type { AnalyticsPeriod, AnalyticsRepository } from "./contracts";
import { projectAnalytics } from "./engine";
import { parseAnalyticsSnapshot } from "./response";
import { readWallet } from "../wallet/store";
import { createCardsRepository } from "../cards/repository";
export function createAnalyticsRepository(email: string, name = ""): AnalyticsRepository {
  if (!email.trim()) throw new Error("A customer session is required.");
  const mode = process.env.NEXT_PUBLIC_ANALYTICS_MODE ?? process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  const walletMode = process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  if (!["demo", "http"].includes(mode) || mode !== walletMode || (process.env.NEXT_PUBLIC_CARDS_MODE ?? walletMode) !== mode) throw new Error("Analytics, Cards Vault and the wallet must use the same service mode.");
  if (mode === "http") return { async getSnapshot(period: AnalyticsPeriod, signal?: AbortSignal) {
    if (!["30D", "90D", "1Y", "ALL"].includes(period)) throw new Error("Invalid analytics period.");
    const base = (process.env.NEXT_PUBLIC_ANALYTICS_API_URL ?? process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "").replace(/\/$/, "");
    const response = await fetch(`${base}/v1/me/analytics?period=${period}`, { credentials: "include", cache: "no-store", signal, headers: { Accept: "application/json" } });
    if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(typeof error?.error?.message === "string" ? error.error.message : `Analytics service failed (${response.status}).`); }
    const snapshot = parseAnalyticsSnapshot(await response.json());
    if (snapshot.mode !== "http" || snapshot.period !== period) throw new Error("Analytics service returned an unexpected scope.");
    return snapshot;
  } };
  const cards = createCardsRepository(email, name);
  return { async getSnapshot(period, signal) { const cardSnapshot = await cards.getSnapshot(signal); if (signal?.aborted) throw new DOMException("Aborted", "AbortError"); const { state, events } = readWallet(email); return parseAnalyticsSnapshot(projectAnalytics(state, events, cardSnapshot, period, new Date().toISOString())); } };
}
