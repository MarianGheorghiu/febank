import type { AnalyticsSnapshot } from "./contracts";
import { periodStart, signedUnits } from "./engine";
import { units } from "../transfers/engine";
const fail = (): never => { throw new Error("Invalid analytics response. No account data was replaced."); };
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : fail();
const text = (v: unknown) => typeof v === "string" && v.length > 0 && v.length <= 1000;
const date = (v: unknown) => typeof v === "string" && Number.isFinite(Date.parse(v));
const amount = (v: unknown, signed = false): boolean => typeof v === "string" && v.length <= 32 && (signed ? /^-?\d+\.\d{2}$/ : /^\d+\.\d{2}$/).test(v);
const integer = (v: unknown, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
const array = (v: unknown, max = 20000): Record<string, unknown>[] => Array.isArray(v) && v.length <= max ? v.map(object) : fail();
const hasMoney = (v: Record<string, unknown>, keys: string[], signed = false) => keys.every(k => amount(v[k], signed));
export function parseAnalyticsSnapshot(value: unknown): AnalyticsSnapshot {
  const d = object(value), s = object(d.summary), c = object(d.cashflow), r = object(d.rewards), cards = object(d.cards);
  if (d.schema_version !== 1 || !["demo", "http"].includes(String(d.mode)) || d.currency !== "USD" || !date(d.as_of) || !["30D", "90D", "1Y", "ALL"].includes(String(d.period)) || (d.from !== null && !date(d.from))) fail();
  if (d.from !== periodStart(d.period as AnalyticsSnapshot["period"], d.as_of as string)) fail();
  if (!hasMoney(s, ["assets_usd", "debt_usd", "available_cash_usd", "reserved_usd", "investment_usd", "known_cost_usd", "known_value_usd"]) || !amount(s.net_worth_usd, true) || (s.unrealized_usd !== null && !amount(s.unrealized_usd, true)) || !integer(s.basis_coverage_bps, 10000)) fail();
  const positions = array(d.positions, 1000);
  for (const p of positions) {
    if (!["fiat", "crypto", "stock"].includes(String(p.kind)) || ![p.id, p.name, p.symbol].every(text) || !integer(p.decimals, 18) || !hasMoney(p, ["value_usd", "available_usd", "reserved_usd"]) || !integer(p.allocation_bps, 10000) || (p.cost_usd !== null && !amount(p.cost_usd)) || (p.unrealized_usd !== null && !amount(p.unrealized_usd, true)) || (p.cost_usd === null) !== (p.unrealized_usd === null)) fail();
    for (const point of array(p.price_history, 500)) { if (!date(point.at) || typeof point.price_usd !== "string") fail(); try { if (units(point.price_usd as string, 8) <= BigInt(0)) fail(); } catch { fail(); } }
    try {
      if (units(p.quantity as string, Number(p.decimals)) !== units(p.available as string, Number(p.decimals)) + units(p.reserved as string, Number(p.decimals)) || units(p.price_usd as string, 8) <= BigInt(0) || signedUnits(p.value_usd as string) !== signedUnits(p.available_usd as string) + signedUnits(p.reserved_usd as string)) fail();
    } catch { fail(); }
  }
  const total = (key: string) => positions.reduce((sum, p) => sum + signedUnits(p[key] as string), BigInt(0));
  if (new Set(positions.map(p => p.id)).size !== positions.length || total("value_usd") !== signedUnits(s.assets_usd as string) || total("reserved_usd") !== signedUnits(s.reserved_usd as string) || signedUnits(s.assets_usd as string) - signedUnits(s.debt_usd as string) !== signedUnits(s.net_worth_usd as string)) fail();
  const allocations = array(d.allocation, 3);
  if (allocations.length !== 3 || new Set(allocations.map(a => a.kind)).size !== 3) fail();
  for (const a of allocations) if (!["fiat", "crypto", "stock"].includes(String(a.kind)) || !amount(a.value_usd) || !integer(a.weight_bps, 10000) || positions.filter(p => p.kind === a.kind).reduce((sum, p) => sum + signedUnits(p.value_usd as string), BigInt(0)) !== signedUnits(a.value_usd as string)) fail();
  const demo = array(d.demo_history, 400);
  if (d.mode === "http" && demo.length) fail();
  for (const point of demo) if (!date(point.at) || !hasMoney(point, ["assets_usd", "debt_usd"]) || !amount(point.net_worth_usd, true)) fail();
  const history = array(d.history, 400);
  if (!history.length) fail();
  for (const h of history) if (!date(h.at) || !hasMoney(h, ["assets_usd", "debt_usd"]) || !amount(h.net_worth_usd, true) || signedUnits(h.assets_usd as string) - signedUnits(h.debt_usd as string) !== signedUnits(h.net_worth_usd as string)) fail();
  if (history.at(-1)?.net_worth_usd !== s.net_worth_usd || history.at(-1)?.at !== d.as_of) fail();
  for (const f of array(d.flows, 1000)) if (!date(f.at) || !hasMoney(f, ["incoming_usd", "outgoing_usd"])) fail();
  if (!hasMoney(c, ["incoming_usd", "outgoing_usd", "fees_usd", "financing_in_usd", "financing_out_usd", "rewards_usd"]) || !amount(c.net_usd, true) || signedUnits(c.incoming_usd as string) - signedUnits(c.outgoing_usd as string) !== signedUnits(c.net_usd as string)) fail();
  const movements = array(d.movements);
  if (new Set(movements.map(m => m.id)).size !== movements.length) fail();
  for (const m of movements) if (![m.id, m.description, m.currency].every(text) || !date(m.at) || !["Cash movement", "Asset transfer", "Financing", "Rewards", "Investment", "Exchange"].includes(String(m.category)) || !["incoming", "outgoing"].includes(String(m.direction)) || !["completed", "pending", "cancelled", "rejected"].includes(String(m.status)) || !hasMoney(m, ["value_usd", "fee_usd"]) || typeof m.amount !== "string" || !/^\d+(\.\d+)?$/.test(m.amount)) fail();
  for (const l of array(d.debts, 1000)) if (![l.id, l.name].every(text) || !["Loan", "Credit line"].includes(String(l.type)) || !amount(l.principal_usd) || (l.limit_usd !== null && !amount(l.limit_usd)) || (l.next_due !== null && !date(l.next_due)) || (l.payment_usd !== null && !amount(l.payment_usd))) fail();
  for (const b of array(d.businesses, 1000)) if (![b.id, b.name].every(text) || !hasMoney(b, ["cash_usd", "debt_usd"])) fail();
  if (![r.available_points, r.expiring_points, r.pending_requests].every(v => integer(v)) || !hasMoney(r, ["redeemed_usd", "cashback_usd"]) || !integer(cards.count) || !integer(cards.active) || Number(cards.active) > Number(cards.count) || !date(cards.as_of)) fail();
  for (const row of array(cards.spending, 30)) { if (!text(row.currency) || !hasMoney(row, ["completed", "pending"]) || !integer(row.transactions)) fail(); for (const category of array(row.categories, 200)) if (!text(category.name) || !amount(category.amount)) fail(); }
  return value as AnalyticsSnapshot;
}
