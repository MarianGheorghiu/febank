import type { Decimal, OverviewOperation, OverviewSnapshot, TransferPeriod, TransferTransaction } from "../types/dashboard";
export function formatMoney(value: Decimal | number, currency = "USD", digits?: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, ...(digits === undefined ? {} : { minimumFractionDigits: digits, maximumFractionDigits: digits }) }).format(Number(value));
}
export function formatPercent(value: Decimal | number) {
  return new Intl.NumberFormat("en-US", { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 2 }).format(Number(value) / 100);
}
export function formatDate(at: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(new Date(at));
}
export function minorUnits(value: string): bigint {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Enter an amount with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const minor = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Amount is too large.");
  return minor;
}
function decimal(minor: bigint) { return `${minor / BigInt(100)}.${(minor % BigInt(100)).toString().padStart(2, "0")}`; }
export function filterTransactions(rows: TransferTransaction[], period: TransferPeriod, asOf: string) {
  const days: Record<TransferPeriod, number> = { "1D": 1, "3D": 3, "1W": 7, "2W": 14, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
  const end = Date.parse(asOf);
  return rows.filter(row => Date.parse(row.occurred_at) <= end && Date.parse(row.occurred_at) >= end - days[period] * 86400000).sort((a,b) => b.occurred_at.localeCompare(a.occurred_at));
}
export function applyOperation(snapshot: OverviewSnapshot, operation: OverviewOperation, at: string): OverviewSnapshot {
  if (!operation.id?.trim() || !Number.isFinite(Date.parse(at))) throw new Error("Invalid operation identifier or timestamp.");
  if (snapshot.transactions.some(row => row.id === operation.id)) return snapshot;
  if (!["deposit", "withdraw", "transfer"].includes(operation.type)) throw new Error("Unsupported operation.");
  const amount = minorUnits(operation.amount);
  if (amount <= BigInt(0)) throw new Error("Enter an amount greater than zero.");
  const balance = minorUnits(snapshot.summary.liquidity);
  if (operation.type !== "deposit" && amount > balance) throw new Error("Insufficient available balance.");
  if (operation.type === "transfer") {
    if (!operation.recipient_name?.trim()) throw new Error("Enter the recipient name.");
    const recipient = operation.recipient?.replace(/\s/g, "") ?? "";
    if (operation.recipient_kind === "phone") {
      if (!/^\+[1-9]\d{7,14}$/.test(recipient)) throw new Error("Enter a phone number in international format.");
    } else if (operation.recipient_kind === "iban") {
      const iban = recipient.toUpperCase();
      if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) throw new Error("Enter a valid IBAN.");
      const rearranged = (iban.slice(4) + iban.slice(0,4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
      if (BigInt(rearranged) % BigInt(97) !== BigInt(1)) throw new Error("IBAN checksum is invalid.");
    } else throw new Error("Select a transfer method.");
  }
  const liquidity = decimal(balance + (operation.type === "deposit" ? amount : -amount));
  minorUnits(liquidity);
  const next = structuredClone(snapshot);
  next.as_of = new Date(Math.max(Date.parse(snapshot.as_of), Date.parse(at))).toISOString();
  next.summary.liquidity = liquidity;
  next.accounts = next.accounts.map(account => account.code === "USD" ? { ...account, balance: liquidity } : account);
  next.transactions.unshift({ id: operation.id, reference: operation.type === "transfer" ? `Transfer to ${operation.recipient_name?.trim()}` : operation.type === "deposit" ? "Mock deposit" : "Mock withdrawal", type: operation.type === "deposit" ? "DEPOSIT" : operation.type === "withdraw" ? "WITHDRAW" : "TRANSFER", amount: decimal(amount), currency: "USD", status: "COMPLETED", occurred_at: next.as_of });
  return next;
}
