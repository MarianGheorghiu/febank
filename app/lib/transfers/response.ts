import type { TransferQuote, TransferSnapshot } from "./contracts";
import { units } from "./engine";
type ObjectValue = Record<string, unknown>;
function object(value: unknown): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid transfer service response.");
  return value as ObjectValue;
}
function strings(value: ObjectValue, keys: string[]) {
  for (const key of keys) if (typeof value[key] !== "string") throw new Error(`Invalid transfer service field: ${key}.`);
}
function date(value: unknown) {
  if (typeof value !== "string" || !value.endsWith("Z") || !Number.isFinite(Date.parse(value))) throw new Error("Invalid transfer service timestamp.");
}
function feeFields(value: ObjectValue) {
  if ((value.fee_asset === undefined) !== (value.fee_account_id === undefined)) throw new Error("Incomplete transfer fee account.");
  if (value.fee_asset !== undefined) strings(value, ["fee_asset", "fee_account_id"]);
}
export function parseQuote(value: unknown): TransferQuote {
  const quote = object(value);
  strings(quote, ["id", "asset", "fee", "total", "value_usd", "eta"]);
  for (const key of ["fee", "total", "value_usd"]) units(quote[key] as string, key === "value_usd" ? 2 : 18);
  feeFields(quote);
  const draft = object(quote.draft);
  strings(draft, ["source_account_id", "route_id", "amount", "recipient_name", "destination", "reference"]);
  units(draft.amount as string, 18); date(quote.expires_at);
  return value as TransferQuote;
}
export function parseSnapshot(value: unknown): TransferSnapshot {
  const snapshot = object(value);
  if (snapshot.schema_version !== 1 || !["demo", "live"].includes(snapshot.mode as string) || !Array.isArray(snapshot.accounts) || !Array.isArray(snapshot.routes) || !Array.isArray(snapshot.transfers)) throw new Error("Unsupported transfer service response.");
  date(snapshot.as_of);
  const limits = object(snapshot.limits);
  strings(limits, ["currency", "daily_limit", "used", "verification_label"]);
  if (limits.currency !== "USD") throw new Error("Unsupported limit currency.");
  units(limits.daily_limit as string, 2); units(limits.used as string, 2); date(limits.resets_at);
  const accounts = new Set<string>();
  for (const item of snapshot.accounts) {
    const account = object(item);
    strings(account, ["id", "kind", "asset", "name", "available", "reserved", "usd_price"]);
    if (!["fiat", "crypto", "stock"].includes(account.kind as string) || !Number.isInteger(account.decimals) || accounts.has(account.id as string)) throw new Error("Invalid transfer account.");
    for (const key of ["available", "reserved"]) units(account[key] as string, account.decimals as number);
    units(account.usd_price as string, 8); accounts.add(account.id as string);
  }
  const routeIds = new Set<string>();
  for (const item of snapshot.routes) {
    const route = object(item);
    strings(route, ["id", "asset", "name", "destination_kind", "fee", "eta"]);
    if (typeof route.enabled !== "boolean" || !["iban", "phone", "wallet", "custody"].includes(route.destination_kind as string) || routeIds.has(route.id as string) || (route.network !== undefined && typeof route.network !== "string")) throw new Error("Invalid transfer route.");
    units(route.fee as string, 18);
    if (route.fee_policy !== undefined) {
      const policy = object(route.fee_policy);
      strings(policy, ["fixed", "minimum", "debit_account_id"]);
      const feeAccount = snapshot.accounts.map(object).find(a => a.id === policy.debit_account_id);
      if (!feeAccount || !Number.isInteger(policy.rate_bps) || (policy.rate_bps as number) < 0 || (policy.rate_bps as number) > 10000) throw new Error("Invalid transfer fee policy.");
      units(policy.fixed as string, feeAccount.decimals as number);
      const minimum = units(policy.minimum as string, feeAccount.decimals as number);
      if (policy.maximum !== undefined && units(policy.maximum as string, feeAccount.decimals as number) < minimum) throw new Error("Invalid transfer fee range.");
    }
    routeIds.add(route.id as string);
  }
  const ids = new Set<string>();
  for (const item of snapshot.transfers) {
    const transfer = object(item);
    strings(transfer, ["id", "account_id", "kind", "asset", "amount", "fee", "value_usd", "direction", "recipient_name", "destination", "route_id", "reference", "status"]);
    if (ids.has(transfer.id as string) || !["fiat", "crypto", "stock"].includes(transfer.kind as string) || !["incoming", "outgoing"].includes(transfer.direction as string) || !["pending", "processing", "completed", "rejected", "cancelled"].includes(transfer.status as string) || typeof transfer.can_cancel !== "boolean") throw new Error("Invalid transfer history.");
    for (const key of ["amount", "fee", "value_usd"]) units(transfer[key] as string, key === "value_usd" ? 2 : 18);
    feeFields(transfer);
    date(transfer.created_at); date(transfer.updated_at); ids.add(transfer.id as string);
  }
  return value as TransferSnapshot;
}
