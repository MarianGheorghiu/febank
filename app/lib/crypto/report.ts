import type { CryptoOrder } from "./contracts";
export function cryptoOrdersCsv(orders: CryptoOrder[]) {
  const rows = [["Order ID", "Created at", "Symbol", "Side", "Status", "Quantity", "Price USD", "Fee USD", "Total USD", "Settlement currency"], ...orders.map(order => [order.id, order.created_at, order.symbol, order.side, order.status, order.quantity, order.price_usd, order.fee_usd, order.total_usd, order.settlement_currency])];
  return "\uFEFF" + rows.map(row => row.map(value => `"${value.replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"', '""')}"`).join(",")).join("\r\n");
}
export function downloadCryptoOrders(orders: CryptoOrder[]) {
  const url = URL.createObjectURL(new Blob([cryptoOrdersCsv(orders)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "crypto-transactions.csv"; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
