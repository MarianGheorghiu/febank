import type { MarketDomain, MarketsState } from "@/app/lib/types/admin/markets";

// Escape spreadsheet formulas as well as CSV delimiters in customer-controlled fields.
export function marketOrdersCsv(state: MarketsState, email: string, domain: MarketDomain) {
  const rows = [
    ["Order ID", "Created at", "Symbol", "Side", "Type", "Status", "Quantity", "Execution/estimate USD", "Fee USD", "Total USD", "Settlement currency", "Note"],
    ...state.orders.filter(order => order.userEmail === email.toLowerCase() && order.domain === domain).map(order => [order.id, order.createdAt, order.symbol, order.side, order.type, order.status, order.quantity, order.price, order.feeUsd, order.totalUsd, order.currency, order.note]),
  ];
  return "\uFEFF" + rows.map(row => row.map(value => `"${String(value).replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"', '""')}"`).join(",")).join("\r\n");
}

export function downloadMarketOrders(state: MarketsState, email: string, domain: MarketDomain) {
  const url = URL.createObjectURL(new Blob([marketOrdersCsv(state, email, domain)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${domain.toLowerCase()}-demo-orders.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
