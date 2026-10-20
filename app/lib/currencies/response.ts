import type { CurrencyQuote, CurrencySnapshot } from "./contracts";
function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid currency service response."); return value as Record<string, unknown>; }
function string(value: unknown): asserts value is string { if (typeof value !== "string" || !value.length) throw new Error("Invalid currency service field."); }
function amount(value: unknown) { string(value); if (!/^\d+(\.\d{1,18})?$/.test(value) || !Number.isFinite(Number(value))) throw new Error("Invalid currency amount."); }
function date(value: unknown) { string(value); if (!value.endsWith("Z") || !Number.isFinite(Date.parse(value))) throw new Error("Invalid currency timestamp."); }
export function parseCurrencySnapshot(value: unknown): CurrencySnapshot {
  const data = object(value);
  if (data.schema_version !== 1 || !["demo", "live"].includes(String(data.mode)) || !Array.isArray(data.accounts) || !Array.isArray(data.assets) || !Array.isArray(data.history)) throw new Error("Unsupported currency service response.");
  date(data.as_of);
  const ids = new Set<string>();
  for (const row of data.accounts) {
    const a = object(row); for (const key of ["id", "asset", "name"]) string(a[key]);
    if (ids.has(String(a.id)) || !["fiat", "crypto", "stock"].includes(String(a.kind)) || !Number.isInteger(a.decimals) || Number(a.decimals) < 0 || Number(a.decimals) > 18) throw new Error("Invalid currency account.");
    for (const key of ["available", "reserved", "usd_price"]) amount(a[key]);
    for (const key of ["available", "reserved"]) if (String(a[key]).split(".")[1]?.length > Number(a.decimals)) throw new Error("Invalid account precision.");
    ids.add(String(a.id));
  }
  const symbols = new Set<string>();
  for (const row of data.assets) {
    const a = object(row); string(a.symbol); string(a.name);
    if (symbols.has(a.symbol) || !["fiat", "crypto", "stock"].includes(String(a.kind)) || !["ACTIVE", "SELL_ONLY", "HALTED"].includes(String(a.status)) || !Number.isInteger(a.decimals) || Number(a.decimals) < 0 || Number(a.decimals) > 18) throw new Error("Invalid exchange asset.");
    symbols.add(a.symbol);
  }
  for (const row of data.history) { const p = object(row); string(p.id); if (p.at !== null) date(p.at); for (const key of ["fiat", "crypto", "stock"]) amount(p[key]); }
  return value as CurrencySnapshot;
}
export function parseCurrencyQuote(value: unknown): CurrencyQuote {
  const q = object(value); for (const key of ["id", "source", "target"]) string(q[key]);
  for (const key of ["requested", "debited", "received", "fee_usd", "remainder_usd"]) amount(q[key]);
  if (q.source === q.target || Number(q.received) <= 0 || Number(q.debited) <= 0) throw new Error("Invalid exchange quote.");
  date(q.expires_at); return value as CurrencyQuote;
}
