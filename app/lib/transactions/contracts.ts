import type { TransferAdminCommand, TransferAdminAudit, TransferState } from "../transfers/contracts";
export const TRANSACTION_DOMAINS = ["FIAT", "CRYPTO", "STOCK"] as const;
export const TRANSACTION_STATUSES = ["PENDING", "HELD", "PROCESSING", "COMPLETED", "REJECTED", "CANCELLED"] as const;
export type TransactionStatus = typeof TRANSACTION_STATUSES[number];
export type TransactionSource = "TRANSFER" | "ORDER" | "CASH" | "CREDIT" | "REWARD";
export type TransactionDomain = typeof TRANSACTION_DOMAINS[number];
export interface GlobalTransaction {
  id: string; source_id: string; source: TransactionSource; customer_id: string;
  domain: TransactionDomain; asset: string; amount: string; value_usd: string;
  fee: string; fee_asset: string; fee_usd: string; direction: "incoming" | "outgoing";
  status: TransactionStatus; version: number; created_at: string; updated_at: string;
  counterparty: string; destination: string | null; reference: string; route: string | null;
  risk: "LOW" | "MEDIUM" | "HIGH" | "UNASSESSED"; risk_case_ids: string[];
  available_actions: TransferAdminCommand["action"][];
  history: TransferAdminAudit[];
}
export interface TransactionSummary {
  total_count: number; pending_count: number; held_count: number; processing_count: number;
  completed_count: number; rejected_count: number; cancelled_count: number;
  completed_24h_usd: string; fees_24h_usd: string; queued_usd: string;
}
export interface TransactionSnapshot {
  schema_version: 1; mode: "demo" | "live"; as_of: string;
  customer_count: number; transactions: GlobalTransaction[];
}
export interface TransactionFilters { query: string; domain: string; status: string; source: string; period: "24H" | "7D" | "30D" | "ALL"; sort: "NEWEST" | "OLDEST" | "VALUE" }
export interface TransactionRepository {
  getSnapshot(signal?: AbortSignal): Promise<TransactionSnapshot>;
  execute(customerId: string, command: TransferAdminCommand, key: string): Promise<void>;
  exportTransactions(ids: string[], key: string): Promise<Blob>;
}
export function displayTransferStatus(status: TransferState, hold = false): TransactionStatus {
  return hold && status === "pending" ? "HELD" : status.toUpperCase() as TransactionStatus;
}
