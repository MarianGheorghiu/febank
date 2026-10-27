import type { RiskActor } from "../types/admin/risk";
import type { TransactionRepository } from "./contracts";
import { readWallet, walletCustomers, commitWallet, WALLET_EVENT } from "../wallet/store";
import { readMarketCatalog, projectAllCustomers } from "../markets/store";
import { readRiskForExecution } from "../risk/store";
import { determineRole } from "../mock/auth";
import { seedTransactionDemo } from "./demo";
import { buildTransactionSnapshot, transactionCsv } from "./engine";
import { parseTransactionSnapshot } from "./response";
import { appendAuditEvent } from "../audit/store";
export function createTransactionRepository(actor: RiskActor): TransactionRepository {
  const mode = process.env.NEXT_PUBLIC_ADMIN_TRANSACTIONS_MODE ?? process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo";
  const check = () => { if (actor.role !== "admin" || !actor.email.trim()) throw new Error("Administrator access required."); };
  if (!["demo", "http"].includes(mode) || mode !== (process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo")) throw new Error("Admin Transactions and the customer wallet must use the same service mode.");
  if (mode === "http") {
    const base = (process.env.NEXT_PUBLIC_ADMIN_TRANSACTIONS_API_URL ?? process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? "").replace(/\/$/, "");
    const request: typeof fetch = async (url, options) => {
      check();
      const response = await fetch(url, { ...options, credentials: "include", cache: "no-store" });
      if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(typeof error?.error?.message === "string" ? error.error.message : `Transaction operation failed (${response.status}). Refresh before retrying.`); }
      return response;
    };
    return {
      async getSnapshot(signal) { const response = await request(`${base}/v1/admin/transactions`, { signal, headers: { Accept: "application/json" } }); const value = parseTransactionSnapshot(await response.json()); if (value.mode !== "live") throw new Error("The service must return live transaction data."); return value; },
      async execute(customerId, command, key) { await request(`${base}/v1/admin/customers/${encodeURIComponent(customerId)}/transfers/${encodeURIComponent(command.transfer_id)}/decisions`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(command) }); if (typeof window !== "undefined") window.dispatchEvent(new Event(WALLET_EVENT)); },
      async exportTransactions(ids, key) { const response = await request(`${base}/v1/admin/transactions/exports`, { method: "POST", headers: { Accept: "text/csv", "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify({ transaction_ids: ids }) }); if (!response.headers.get("Content-Type")?.includes("text/csv")) throw new Error("Unexpected transaction export response."); return response.blob(); },
    };
  }
  const repository: TransactionRepository = {
    async getSnapshot() {
      check(); const now = new Date().toISOString();
      // Validate shared sources before creating dedicated sample journals.
      const risk = readRiskForExecution(), catalog = readMarketCatalog();
      if (seedTransactionDemo(now) && typeof window !== "undefined") window.dispatchEvent?.(new Event(WALLET_EVENT));
      const markets = projectAllCustomers(catalog);
      const customers = walletCustomers().filter(customer => determineRole(customer) === "client").map(customer_id => ({ customer_id, ...readWallet(customer_id) }));
      return parseTransactionSnapshot(buildTransactionSnapshot(customers, markets, risk, now));
    },
    async execute(customer, command, key) {
      check(); if (!/^[a-zA-Z0-9-]{8,100}$/.test(key)) throw new Error("Invalid idempotency key.");
      commitWallet(customer, { kind: "transfer_admin", key, at: new Date().toISOString(), customer: customer.trim().toLowerCase(), actor, command });
    },
    async exportTransactions(ids) {
      check(); const snapshot = await repository.getSnapshot();
      const unique = new Set(ids); const rows = snapshot.transactions.filter(row => unique.has(row.id));
      if (!rows.length || rows.length !== unique.size) throw new Error("Some export records are unavailable. Refresh the registry.");
      appendAuditEvent({ source: "TRANSACTIONS", domain: "PLATFORM", category: "DATA_ACCESS", action: "TRANSACTIONS_EXPORTED", target: "global-transaction-registry", reason: `Administrator exported ${rows.length} selected transaction records.`, before: null, after: { count: rows.length, transaction_ids: rows.map(row => row.id), as_of: snapshot.as_of } }, actor);
      return new Blob([transactionCsv(rows)], { type: "text/csv;charset=utf-8" });
    },
  };
  return repository;
}
