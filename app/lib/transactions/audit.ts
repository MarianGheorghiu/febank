"use client";
import { useMemo, useSyncExternalStore } from "react";
import { readWallet, walletCustomers, WALLET_EVENT } from "../wallet/store";
import type { AuditEvent } from "../types/admin/audit";
let revision = 0;
function subscribe(listener: () => void) {
  const changed = () => { revision++; listener(); };
  window.addEventListener(WALLET_EVENT, changed); window.addEventListener("storage", changed); window.addEventListener("focus", changed);
  return () => { window.removeEventListener(WALLET_EVENT, changed); window.removeEventListener("storage", changed); window.removeEventListener("focus", changed); };
}
export function readTransactionAudit(): AuditEvent[] {
  return walletCustomers().flatMap(customer => readWallet(customer).state.transfers.transfers.flatMap(transfer => (transfer.admin_history ?? []).map(event => ({
    id: `transfers:${encodeURIComponent(customer)}:${event.id}`, timestamp: event.occurred_at,
    source: "TRANSACTIONS" as const, domain: transfer.kind === "fiat" ? "FIAT" as const : transfer.kind === "crypto" ? "CRYPTO" as const : "STOCK" as const,
    category: "FINANCIAL" as const, action: `TRANSFER_${event.action}`, severity: event.action === "REJECT" || event.action === "HOLD" ? "WARNING" as const : "INFO" as const,
    outcome: "SUCCESS" as const, actor: event.actor, actorRole: "ADMIN" as const, target: transfer.id,
    reason: event.reason, correlationId: transfer.id, requestId: event.id, sessionId: null, ip: null, durationMs: null,
    before: { status: event.before_status, review_hold: event.before_hold }, after: { status: event.after_status, review_hold: event.after_hold, customer_id: customer },
    origin: event.actor === "demo.ops@admin.com" ? "DEMO" as const : "LOCAL" as const,
  }))));
}
export function useTransactionAudit() {
  const current = useSyncExternalStore(subscribe, () => revision, () => 0);
  return useMemo(() => {
    void current;
    if (typeof window === "undefined" || (process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo") !== "demo") return { events: [] as AuditEvent[], warning: null };
    try { return { events: readTransactionAudit(), warning: null }; }
    catch { return { events: [] as AuditEvent[], warning: "Customer transfer audit could not be loaded. Source wallet data was preserved." }; }
  }, [current]);
}
