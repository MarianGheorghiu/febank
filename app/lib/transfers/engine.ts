import type { TransferDraft, TransferSnapshot, TransferQuote, CustomerTransfer, TransferAccount, TransferRoute } from "./contracts";

const ZERO = BigInt(0);
export function units(value: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18 || typeof value !== "string" || value.length > 40 || !/^\d+(\.\d+)?$/.test(value)) throw new Error("Enter a plain positive decimal amount.");
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals) throw new Error(`This asset supports at most ${decimals} decimal places.`);
  return BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0");
}
export function decimal(value: bigint, decimals: number): string {
  if (value < ZERO) throw new Error("Insufficient available balance.");
  if (!decimals) return value.toString();
  const scale = BigInt(10) ** BigInt(decimals);
  return `${value / scale}.${(value % scale).toString().padStart(decimals, "0")}`;
}
/** USD cents at an up-to-eight-place unit price, without floating point. */
export function usdValue(quantity: bigint, decimals: number, price: string, rounding: "ceil" | "nearest" = "ceil"): bigint {
  const numerator = quantity * units(price, 8) * BigInt(100);
  const divisor = BigInt(10) ** BigInt(decimals + 8);
  return (numerator + (rounding === "ceil" ? divisor - BigInt(1) : divisor / BigInt(2))) / divisor;
}
export function priceString(value: number): string {
  if (!Number.isFinite(value) || value <= 0) throw new Error("Invalid shared market price.");
  const [whole, fraction] = value.toFixed(8).split(".");
  return `${whole}.${fraction.replace(/0+$/, "").padEnd(2, "0")}`;
}
export function amountLabel(value: string, asset: string) {
  const [whole, fraction] = value.split(".");
  const trimmed = ["USD", "EUR", "RON"].includes(asset) ? (fraction ?? "").padEnd(2, "0") : fraction?.replace(/0+$/, "");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${trimmed ? `.${trimmed}` : ""} ${asset}`;
}
export function dayUsage(snapshot: TransferSnapshot, now: string): bigint {
  return snapshot.transfers.filter(t => t.direction === "outgoing" && !["cancelled", "rejected"].includes(t.status) && t.created_at.slice(0, 10) === now.slice(0, 10)).reduce((sum, t) => sum + units(t.value_usd, 2), ZERO);
}
export function refreshLimits(snapshot: TransferSnapshot, now: string): TransferSnapshot {
  const next = structuredClone(snapshot);
  next.as_of = now;
  next.limits.used = decimal(dayUsage(next, now), 2);
  const midnight = new Date(now); midnight.setUTCHours(24, 0, 0, 0);
  next.limits.resets_at = midnight.toISOString();
  return next;
}
function destination(value: string, kind: string, network?: string): string {
  const compact = value.replace(/\s/g, "");
  if (kind === "iban") {
    const iban = compact.toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) throw new Error("Enter a valid IBAN.");
    const lengths: Record<string, number> = { RO:24, DE:22, FR:27, GB:22, NL:18, ES:24, IT:27, BE:16, CH:21, AT:20, IE:22, PT:25 };
    if (lengths[iban.slice(0,2)] && iban.length !== lengths[iban.slice(0,2)]) throw new Error("IBAN length is invalid for this country.");
    const digits = (iban.slice(4) + iban.slice(0,4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
    if (BigInt(digits) % BigInt(97) !== BigInt(1)) throw new Error("IBAN checksum is invalid.");
    return iban;
  }
  if (kind === "phone" && !/^\+[1-9]\d{7,14}$/.test(compact)) throw new Error("Use an international phone number, e.g. +40712345678.");
  // Syntax only: the Go service must validate network checksum, ownership and sanctions.
  if (kind === "wallet") {
    const valid = network === "ethereum" ? /^0x[a-fA-F0-9]{40}$/.test(compact) : network === "bitcoin" ? /^(bc1[ac-hj-np-z02-9]{39,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(compact) : network === "solana" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(compact);
    if (!valid) throw new Error(`Enter an address for the ${network} network.`);
  }
  if (kind === "custody" && !/^[A-Za-z0-9][A-Za-z0-9_-]{4,63}$/.test(compact)) throw new Error("Enter a custody account ID (5–64 letters, digits, hyphens or underscores).");
  return compact;
}
function ceilDivide(value: bigint, divisor: bigint) {
  return (value + divisor - BigInt(1)) / divisor;
}
/** Exact preview using the server-supplied route policy; the quote remains authoritative. */
export function estimateFee(snapshot: TransferSnapshot, account: TransferAccount, route: TransferRoute, amount: string) {
  if (!route.enabled || route.asset !== account.asset) throw new Error("Select a compatible route.");
  const quantity = units(amount, account.decimals);
  if (quantity <= ZERO) throw new Error("Amount must be greater than zero.");
  const policy = route.fee_policy;
  if (!policy) return { amount: decimal(units(route.fee, account.decimals), account.decimals), asset: account.asset, account_id: account.id };
  const feeAccount = snapshot.accounts.find(a => a.id === policy.debit_account_id);
  if (!feeAccount || !Number.isInteger(policy.rate_bps) || policy.rate_bps < 0 || policy.rate_bps > 10000) throw new Error("Invalid transfer fee policy.");
  let base: bigint;
  if (feeAccount.id === account.id) base = quantity;
  else if (feeAccount.asset === "USD" && feeAccount.decimals === 2) base = usdValue(quantity, account.decimals, account.usd_price);
  else throw new Error("Unsupported fee debit account.");
  const minimum = units(policy.minimum, feeAccount.decimals);
  const maximum = policy.maximum === undefined ? undefined : units(policy.maximum, feeAccount.decimals);
  if (maximum !== undefined && maximum < minimum) throw new Error("Invalid fee range.");
  let fee = units(policy.fixed, feeAccount.decimals) + ceilDivide(base * BigInt(policy.rate_bps), BigInt(10000));
  if (fee < minimum) fee = minimum;
  if (maximum !== undefined && fee > maximum) fee = maximum;
  return { amount: decimal(fee, feeAccount.decimals), asset: feeAccount.asset, account_id: feeAccount.id };
}
export function buildQuote(snapshot: TransferSnapshot, input: TransferDraft, id: string, now: string): TransferQuote {
  const account = snapshot.accounts.find(a => a.id === input.source_account_id);
  const route = snapshot.routes.find(r => r.id === input.route_id && r.enabled);
  if (!account || !route || route.asset !== account.asset) throw new Error("Select an available account and compatible route.");
  if (!input.recipient_name.trim() || input.recipient_name.trim().length > 120) throw new Error("Enter a recipient name of 1–120 characters.");
  if (input.reference.length > 140) throw new Error("Reference must be at most 140 characters.");
  const quantity = units(input.amount, account.decimals);
  const estimate = estimateFee(snapshot, account, route, input.amount);
  const feeAccount = snapshot.accounts.find(a => a.id === estimate.account_id)!;
  const fee = units(estimate.amount, feeAccount.decimals);
  const sameAccount = feeAccount.id === account.id;
  const total = quantity + (sameAccount ? fee : ZERO);
  if (total > units(account.available, account.decimals)) throw new Error("Insufficient available balance, including the fee.");
  if (!sameAccount && fee > units(feeAccount.available, feeAccount.decimals)) throw new Error(`Insufficient ${feeAccount.asset} balance to cover the transfer fee.`);
  let value = usdValue(total, account.decimals, account.usd_price);
  if (!sameAccount) value += usdValue(fee, feeAccount.decimals, feeAccount.usd_price);
  if (dayUsage(snapshot, now) + value > units(snapshot.limits.daily_limit, 2)) throw new Error("This transfer would exceed your daily limit, including fees.");
  return { id, draft: { ...input, amount: decimal(quantity, account.decimals), recipient_name: input.recipient_name.trim(), destination: destination(input.destination, route.destination_kind, route.network), reference: input.reference.trim() }, asset: account.asset, fee: estimate.amount, fee_asset: estimate.asset, fee_account_id: feeAccount.id, total: decimal(total, account.decimals), value_usd: decimal(value, 2), expires_at: new Date(Date.parse(now) + 10 * 60 * 1000).toISOString(), eta: route.eta };
}
export function applyTransfer(snapshot: TransferSnapshot, quote: TransferQuote, id: string, now: string): TransferSnapshot {
  if (Date.parse(quote.expires_at) <= Date.parse(now)) throw new Error("Your quote expired. Review a new quote.");
  // Existing v1 demo events retain their original fixed fee when replayed.
  const validationSnapshot = quote.fee_asset ? snapshot : { ...snapshot, routes: snapshot.routes.map(r => ({ ...r, fee_policy: undefined })) };
  const checked = buildQuote(validationSnapshot, quote.draft, quote.id, now);
  if (checked.total !== quote.total || checked.value_usd !== quote.value_usd || checked.asset !== quote.asset || checked.fee !== quote.fee || checked.draft.amount !== quote.draft.amount || checked.draft.destination !== quote.draft.destination || (quote.fee_asset !== undefined && (checked.fee_asset !== quote.fee_asset || checked.fee_account_id !== quote.fee_account_id))) throw new Error("The quote changed. Review a new quote.");
  const next = structuredClone(snapshot);
  const account = next.accounts.find(a => a.id === quote.draft.source_account_id)!;
  account.available = decimal(units(account.available, account.decimals) - units(quote.total, account.decimals), account.decimals);
  account.reserved = decimal(units(account.reserved, account.decimals) + units(quote.total, account.decimals), account.decimals);
  if (quote.fee_account_id && quote.fee_account_id !== account.id) {
    const feeAccount = next.accounts.find(a => a.id === quote.fee_account_id)!;
    const fee = units(quote.fee, feeAccount.decimals);
    feeAccount.available = decimal(units(feeAccount.available, feeAccount.decimals) - fee, feeAccount.decimals);
    feeAccount.reserved = decimal(units(feeAccount.reserved, feeAccount.decimals) + fee, feeAccount.decimals);
  }
  const transfer: CustomerTransfer = { id, account_id: account.id, kind: account.kind, asset: account.asset, amount: quote.draft.amount, fee: quote.fee, ...(quote.fee_asset ? { fee_asset: quote.fee_asset, fee_account_id: quote.fee_account_id } : {}), value_usd: quote.value_usd, direction: "outgoing", recipient_name: quote.draft.recipient_name, destination: quote.draft.destination, route_id: quote.draft.route_id, reference: quote.draft.reference, status: "pending", created_at: now, updated_at: now, can_cancel: true };
  next.transfers.unshift(transfer);
  return refreshLimits(next, now);
}
export function cancelTransfer(snapshot: TransferSnapshot, id: string, now: string): TransferSnapshot {
  const existing = snapshot.transfers.find(t => t.id === id);
  if (!existing || existing.direction !== "outgoing" || existing.status !== "pending" || !existing.can_cancel) throw new Error("This transfer can no longer be cancelled. Refresh its status.");
  const next = structuredClone(snapshot);
  const transfer = next.transfers.find(t => t.id === id)!;
  const account = next.accounts.find(a => a.id === transfer.account_id)!;
  const feeAccount = next.accounts.find(a => a.id === (transfer.fee_account_id ?? transfer.account_id))!;
  const fee = units(transfer.fee, feeAccount.decimals);
  const total = units(transfer.amount, account.decimals) + (feeAccount.id === account.id ? fee : ZERO);
  account.available = decimal(units(account.available, account.decimals) + total, account.decimals);
  account.reserved = decimal(units(account.reserved, account.decimals) - total, account.decimals);
  if (feeAccount.id !== account.id) {
    feeAccount.available = decimal(units(feeAccount.available, feeAccount.decimals) + fee, feeAccount.decimals);
    feeAccount.reserved = decimal(units(feeAccount.reserved, feeAccount.decimals) - fee, feeAccount.decimals);
  }
  transfer.status = "cancelled"; transfer.can_cancel = false; transfer.updated_at = now;
  return refreshLimits(next, now);
}
