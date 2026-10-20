import type { StocksSnapshot } from "./contracts";
export function stocksCsv(snapshot: StocksSnapshot) {
  const rows: string[][] = [
    ["POSITIONS"], ["Symbol", "Name", "Sector", "Shares", "Reserved", "Average USD", "Price USD", "Value USD", "Cost USD", "Unrealized USD", "Unrealized %"],
    ...snapshot.holdings.map(p => [p.symbol, p.name, p.sector, p.quantity, p.reserved, p.average_cost_usd, p.price_usd, p.value_usd, p.cost_usd, p.unrealized_usd, p.unrealized_percent]), [],
    ["ORDERS"], ["ID", "Created at", "Symbol", "Side", "Type", "Status", "Quantity", "Price USD", "Target USD", "Fee USD", "Total USD", "Currency", "Reserved cash", "Note"],
    ...snapshot.orders.map(o => [o.id, o.created_at, o.symbol, o.side, o.type, o.status, o.quantity, o.price_usd, o.target_price_usd ?? "", o.fee_usd, o.total_usd, o.currency, o.reserved_cash, o.note]), [],
    ["INVESTMENT PLANS"], ["ID", "Symbol", "Name", "Amount USD", "Frequency", "Starts on", "Next run", "Day", "Status", "Version"],
    ...snapshot.plans.map(p => [p.id, p.symbol, p.name, p.amount_usd, p.frequency, p.starts_on, p.next_run, p.day, p.status, String(p.version)]), [],
    ["DIVIDENDS"], ["ID", "Symbol", "Company", "Ex date", "Pay date", "USD per share", "Eligible shares", "Estimate USD", "Paid USD", "Issuer status"],
    ...snapshot.dividends.map(d => [d.id, d.symbol, d.company, d.ex_date, d.pay_date, d.amount_per_share_usd, d.eligible_quantity, d.estimated_payout_usd, d.paid_amount_usd, d.status]),
  ];
  return "\uFEFF" + rows.map(row => row.map(value => `"${value.replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"', '""')}"`).join(",")).join("\r\n");
}
export function downloadStocksReport(snapshot: StocksSnapshot) { const url = URL.createObjectURL(new Blob([stocksCsv(snapshot)], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "stocks-and-trading.csv"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
