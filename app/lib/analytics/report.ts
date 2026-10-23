import type { AnalyticsSnapshot } from "./contracts";
const cell = (value: string | number) => { const raw = String(value); const safe = /^[\s]*[=+@\t\r-]/.test(raw) && !/^-\d+(\.\d+)?$/.test(raw) ? `'${raw}` : raw; return `"${safe.replaceAll('"', '""')}"`; };
export function analyticsReport(s: AnalyticsSnapshot): string {
  const rows: (string | number)[][] = [["Analytics", s.mode, s.as_of, s.period, "USD"], ["Personal assets", s.summary.assets_usd], ["Personal principal", s.summary.debt_usd], ["Net worth", s.summary.net_worth_usd], ["Available cash", s.summary.available_cash_usd], ["Reserved assets (included in assets)", s.summary.reserved_usd], [], ["Holdings", "Asset", "Type", "Available", "Reserved", "Owned", "USD value", "Known cost USD", "Unrealized USD"]];
  for (const p of s.positions) rows.push([p.name, p.symbol, p.kind, p.available, p.reserved, p.quantity, p.value_usd, p.cost_usd ?? "Unknown", p.unrealized_usd ?? "Unknown"]);
  rows.push([], ["Activity in period", "Date UTC", "Category", "Direction", "Amount", "Asset", "USD value", "Status"]);
  for (const m of s.movements) rows.push([m.description, m.at, m.category, m.direction, m.amount, m.currency, m.value_usd, m.status]);
  rows.push([], ["Observed history UTC", "Personal assets USD", "Principal USD", "Net worth USD"]);
  for (const p of s.history) rows.push([p.at, p.assets_usd, p.debt_usd, p.net_worth_usd]);
  if (s.demo_history.length) { rows.push([], ["Illustrative demo trend (current holdings, not actual past balances)", "Assets USD", "Principal USD", "Net worth USD"]); for (const p of s.demo_history) rows.push([p.at, p.assets_usd, p.debt_usd, p.net_worth_usd]); }
  rows.push([], ["Business (excluded from personal net worth)", "Cash USD", "Principal USD"]);
  for (const b of s.businesses) rows.push([b.name, b.cash_usd, b.debt_usd]);
  rows.push([], ["Card spending (separate activity view)", "Currency", "Completed", "Pending"]);
  for (const c of s.cards.spending) rows.push(["Cards", c.currency, c.completed, c.pending]);
  rows.push([], ["Method", "Assets include available and reserved balances. Personal debt is principal only. Recorded cash movements are not classified as income. Card activity is not added again to wallet flows. Demo price trends are illustrative and are not actual historical account balances or investment returns. Business accounts and points excluded from personal assets."]);
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n");
}
