import type { MarketsState } from "../types/admin/markets";
import type { RiskState } from "../types/admin/risk";
import type { WalletState, WalletEvent } from "../wallet/engine";
import type { TransferAdminAudit } from "../transfers/contracts";
import { amountLabel, decimal, units, usdValue } from "../transfers/engine";
import { transferActions } from "./transfer-engine";
import { csvRows } from "../risk/engine";
import { displayTransferStatus, type GlobalTransaction, type TransactionSnapshot, type TransactionSummary, type TransactionFilters, type TransactionDomain } from "./contracts";
export type CustomerWallet = { customer_id: string; state: WalletState; events: WalletEvent[] };
const domainOf = (kind: string): TransactionDomain => kind === "fiat" ? "FIAT" : kind === "crypto" ? "CRYPTO" : "STOCK";
export function buildTransactionSnapshot(customers: CustomerWallet[], markets: MarketsState, risk: RiskState, now: string): TransactionSnapshot {
  const rows: GlobalTransaction[] = [];
  function add(row: Omit<GlobalTransaction, "risk" | "risk_case_ids">) {
    const cases = risk.cases.filter(item => item.status !== "RESOLVED" && item.domain === row.domain && (item.reference === row.source_id || item.email.toLowerCase() === row.customer_id));
    rows.push({ ...row, risk: cases.some(item => item.score >= 65) ? "HIGH" : cases.length ? "MEDIUM" : "UNASSESSED", risk_case_ids: cases.map(item => item.id) });
  }
  for (const { customer_id, state, events } of customers) {
    const base = { customer_id, version: 0, destination: null, route: null, fee: "0.00", fee_asset: "USD", fee_usd: "0.00", available_actions: [], history: [] };
    for (const transfer of state.transfers.transfers.filter(item => item.id.startsWith("trf-"))) {
      const submit = events.find(event => event.kind === "submit" && `trf-${event.key}` === transfer.id);
      const feeAccount = state.transfers.accounts.find(item => item.id === (transfer.fee_account_id ?? transfer.account_id));
      const feePrice = submit?.prices?.[feeAccount?.asset ?? ""] ?? feeAccount?.usd_price;
      const feeUsd = feeAccount && feePrice ? decimal(usdValue(units(transfer.fee, feeAccount.decimals), feeAccount.decimals, feePrice, "nearest"), 2) : "0.00";
      add({ ...base, id: `transfer:${encodeURIComponent(customer_id)}:${transfer.id}`, source_id: transfer.id, source: "TRANSFER", domain: domainOf(transfer.kind), asset: transfer.asset, amount: transfer.amount, value_usd: transfer.value_usd, fee: transfer.fee, fee_asset: transfer.fee_asset ?? transfer.asset, fee_usd: feeUsd, direction: transfer.direction, status: displayTransferStatus(transfer.status, transfer.review_hold), version: transfer.version ?? 0, created_at: transfer.created_at, updated_at: transfer.updated_at, counterparty: transfer.recipient_name, destination: transfer.destination, reference: transfer.reference, route: transfer.route_id, available_actions: submit ? transferActions(transfer) : [], history: transfer.admin_history ?? [] });
    }
    for (const { operation, at } of state.cash_operations) add({ ...base, id: `cash:${encodeURIComponent(customer_id)}:${operation.id}`, source_id: operation.id, source: "CASH", domain: "FIAT", asset: "USD", amount: operation.amount, value_usd: decimal(units(operation.amount, 2), 2), direction: operation.type === "deposit" ? "incoming" : "outgoing", status: "COMPLETED", created_at: at, updated_at: at, counterparty: operation.type === "deposit" ? "Account funding" : "Cash withdrawal", reference: operation.type });
    for (const item of state.credit.activity.filter(item => item.amount !== null && ["draw", "repay_loan", "repay_facility"].includes(item.action))) add({ ...base, id: `credit:${encodeURIComponent(customer_id)}:${item.id}`, source_id: item.id, source: "CREDIT", domain: "FIAT", asset: "USD", amount: item.amount!, value_usd: item.amount!, direction: item.action === "draw" ? "incoming" : "outgoing", status: "COMPLETED", created_at: item.at, updated_at: item.at, counterparty: `Credit · ${item.scope}`, reference: item.description });
    for (const item of state.rewards.entries.filter(item => item.kind === "spent" && item.cash !== null)) add({ ...base, id: `reward:${encodeURIComponent(customer_id)}:${item.id}`, source_id: item.id, source: "REWARD", domain: "FIAT", asset: "USD", amount: item.cash!, value_usd: item.cash!, direction: "incoming", status: "COMPLETED", created_at: item.at, updated_at: item.at, counterparty: "Rewards redemption", reference: item.description });
  }
  const observed = new Set(customers.map(item => item.customer_id));
  for (const order of markets.orders.filter(item => observed.has(item.userEmail))) add({ id: `order:${encodeURIComponent(order.userEmail)}:${order.id}`, source_id: order.id, source: "ORDER", customer_id: order.userEmail, domain: order.domain, asset: order.symbol, amount: order.quantity.toFixed(8), value_usd: order.totalUsd.toFixed(2), fee: order.feeUsd.toFixed(2), fee_asset: "USD", fee_usd: order.feeUsd.toFixed(2), direction: order.side === "BUY" ? "incoming" : "outgoing", status: order.status === "FILLED" ? "COMPLETED" : order.status === "REJECTED" ? "REJECTED" : order.status, version: 0, created_at: order.createdAt, updated_at: order.updatedAt, counterparty: `${order.side} ${order.symbol} · ${order.type}`, destination: null, reference: order.note || `${order.side} ${order.symbol}`, route: "Market routing", available_actions: [], history: [] });
  return { schema_version: 1, mode: "demo", as_of: now, customer_count: customers.length, transactions: rows.sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id)) };
}
export function summarizeTransactions(rows: GlobalTransaction[], asOf: string): TransactionSummary {
  const since = Date.parse(asOf) - 86400000, end = Date.parse(asOf);
  const completed = rows.filter(item => item.status === "COMPLETED" && Date.parse(item.updated_at) > since && Date.parse(item.updated_at) <= end);
  const count = (status: string) => rows.filter(item => item.status === status).length;
  const total = (items: GlobalTransaction[], key: "value_usd" | "fee_usd") => decimal(items.reduce((sum, item) => sum + units(item[key], 2), BigInt(0)), 2);
  return { total_count: rows.length, pending_count: count("PENDING"), held_count: count("HELD"), processing_count: count("PROCESSING"), completed_count: count("COMPLETED"), rejected_count: count("REJECTED"), cancelled_count: count("CANCELLED"), completed_24h_usd: total(completed, "value_usd"), fees_24h_usd: total(completed, "fee_usd"), queued_usd: total(rows.filter(item => ["PENDING", "HELD", "PROCESSING"].includes(item.status)), "value_usd") };
}
export const defaultTransactionFilters: TransactionFilters = { query: "", domain: "ALL", status: "ALL", source: "ALL", period: "ALL", sort: "NEWEST" };
const normalized = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
const searchDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", dateStyle: "medium", timeStyle: "short" });
export function transactionSearchText(row: GlobalTransaction, history = row.history) {
  const displayDate = (at: string) => searchDate.format(new Date(at));
  return normalized([
    ...Object.values(row).filter(value => typeof value === "string"),
    row.status === "HELD" ? "under review held" : "",
    amountLabel(row.amount, row.asset), amountLabel(row.fee, row.fee_asset),
    amountLabel(row.value_usd, "USD"), amountLabel(row.fee_usd, "USD"),
    displayDate(row.created_at), displayDate(row.updated_at), ...row.risk_case_ids,
    ...history.flatMap(item => [item.id, item.actor, item.action, item.reason, item.occurred_at, displayDate(item.occurred_at), item.before_status, item.after_status]),
  ].join(" "));
}
export function matchesTransactionQuery(row: GlobalTransaction, query: string, history?: TransferAdminAudit[]) {
  const terms = normalized(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const text = transactionSearchText(row, history);
  return terms.every(term => text.includes(term));
}
export function filterTransactions(rows: GlobalTransaction[], filters: TransactionFilters, asOf: string) {
  const end = Date.parse(asOf), days = filters.period === "24H" ? 1 : filters.period === "7D" ? 7 : 30;
  const terms = normalized(filters.query).trim().split(/\s+/).filter(Boolean);
  return rows.filter(item => { const scope = (filters.domain === "ALL" || item.domain === filters.domain) && (filters.status === "ALL" || item.status === filters.status) && (filters.source === "ALL" || item.source === filters.source) && Date.parse(item.created_at) <= end && (filters.period === "ALL" || Date.parse(item.created_at) > end - days * 86400000); if (!scope || !terms.length) return scope; const text = transactionSearchText(item); return terms.every(term => text.includes(term)); })
    .sort((a, b) => filters.sort === "VALUE" ? (units(a.value_usd, 2) === units(b.value_usd, 2) ? a.id.localeCompare(b.id) : units(a.value_usd, 2) > units(b.value_usd, 2) ? -1 : 1) : (filters.sort === "OLDEST" ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at)) || a.id.localeCompare(b.id));
}
export function transactionBuckets(rows: GlobalTransaction[], asOf: string) {
  const day = asOf.slice(0, 10);
  return Array.from({ length: 7 }, (_, index) => {
    const at = new Date(Date.parse(`${day}T00:00:00Z`) - (6 - index) * 86400000).toISOString().slice(0, 10);
    const matches = rows.filter(item => item.updated_at.startsWith(at) && item.updated_at <= asOf);
    const volume = (domain: TransactionDomain) => Number(decimal(matches.filter(item => item.domain === domain && item.status === "COMPLETED").reduce((sum, item) => sum + units(item.value_usd, 2), BigInt(0)), 2));
    return { at, fiat: volume("FIAT"), crypto: volume("CRYPTO"), stock: volume("STOCK"), completed: matches.filter(item => item.status === "COMPLETED").length, rejected: matches.filter(item => item.status === "REJECTED").length };
  });
}
export function transactionCsv(rows: GlobalTransaction[]) {
  return csvRows([["reference", "customer", "source", "domain", "counterparty", "direction", "asset", "amount", "value_usd", "fee", "fee_asset", "fee_usd", "status", "risk", "created_at", "updated_at"], ...rows.map(row => [row.source_id, row.customer_id, row.source, row.domain, row.counterparty, row.direction, row.asset, row.amount, row.value_usd, row.fee, row.fee_asset, row.fee_usd, row.status, row.risk, row.created_at, row.updated_at])]);
}
