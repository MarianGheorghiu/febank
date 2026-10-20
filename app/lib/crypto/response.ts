import { parseCurrencySnapshot } from "../currencies/response";
import type { CryptoSnapshot } from "./contracts";
function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid crypto service response."); return value as Record<string, unknown>; }
function text(value: unknown): asserts value is string { if (typeof value !== "string" || !value.trim()) throw new Error("Invalid crypto service field."); }
function amount(value: unknown, signed = false) { text(value); if (!(signed ? /^-?\d+(\.\d{1,18})?$/ : /^\d+(\.\d{1,18})?$/).test(value) || !Number.isFinite(Number(value))) throw new Error("Invalid crypto decimal amount."); }
function date(value: unknown) { text(value); if (!value.endsWith("Z") || !Number.isFinite(Date.parse(value))) throw new Error("Invalid crypto timestamp."); }
export function parseCryptoSnapshot(value: unknown): CryptoSnapshot {
  const snapshot = object(value);
  if (snapshot.schema_version !== 1 || !Array.isArray(snapshot.market) || !Array.isArray(snapshot.orders)) throw new Error("Unsupported crypto service response.");
  date(snapshot.as_of); const wallet = parseCurrencySnapshot(snapshot.wallet);
  const symbols = new Set<string>();
  for (const row of snapshot.market) {
    const item = object(row); for (const key of ["symbol", "name", "volume_24h", "market_cap"]) text(item[key]);
    if (symbols.has(String(item.symbol)) || !wallet.assets.some(asset => asset.kind === "crypto" && asset.symbol === item.symbol)) throw new Error("Invalid crypto catalog symbol.");
    amount(item.price_usd); if (Number(item.price_usd) <= 0) throw new Error("Invalid crypto price.");
    for (const key of ["change_1h", "change_24h", "change_7d"]) if (item[key] !== null) amount(item[key], true);
    if (!Array.isArray(item.sparkline) || item.sparkline.length < 2 || item.sparkline.length > 500) throw new Error("Invalid crypto sparkline.");
    item.sparkline.forEach(point => amount(point));
    for (const side of ["buy", "sell"]) {
      if (typeof item[`can_${side}`] !== "boolean") throw new Error("Invalid crypto trading permission.");
      const reason = item[`${side}_restriction`]; if (reason !== null) text(reason);
      if (!item[`can_${side}`] && reason === null) throw new Error("Missing crypto trading restriction.");
    }
    symbols.add(String(item.symbol));
  }
  const ids = new Set<string>();
  for (const row of snapshot.orders) {
    const order = object(row); for (const key of ["id", "symbol", "settlement_currency"]) text(order[key]);
    if (ids.has(String(order.id)) || !["BUY", "SELL"].includes(String(order.side)) || !["PENDING", "FILLED", "CANCELLED", "REJECTED"].includes(String(order.status))) throw new Error("Invalid crypto order.");
    for (const key of ["quantity", "price_usd", "fee_usd", "total_usd"]) amount(order[key]);
    date(order.created_at); ids.add(String(order.id));
  }
  return value as CryptoSnapshot;
}
