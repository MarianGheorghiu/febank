import type { TransferSnapshot, TransferAccount, TransferRoute } from "./contracts";
import { OPENING_ASSETS as assets } from "../wallet/seed";

export function transferSeed(): TransferSnapshot {
  const accounts: TransferAccount[] = assets.map(([asset, kind, name, decimals, available, usd_price]) => ({ id: `account-${asset}`, asset, kind, name, decimals, available, reserved: "0", usd_price }));
  const routes: TransferRoute[] = assets.flatMap(([asset, kind, , , , , fee]) => {
    const network = asset === "BTC" ? "bitcoin" : asset === "ETH" ? "ethereum" : "solana";
    return [{ id: `route-${asset}`, asset, name: kind === "fiat" ? "Bank transfer" : kind === "crypto" ? `${network[0].toUpperCase()}${network.slice(1)}` : "Broker custody", destination_kind: kind === "fiat" ? "iban" : kind === "crypto" ? "wallet" : "custody", ...(kind === "crypto" ? { network } : {}), fee,
      fee_policy: { fixed: kind === "stock" ? "2.50" : fee, rate_bps: kind === "crypto" ? 5 : 10, minimum: kind === "stock" ? "2.50" : fee, ...(kind === "fiat" ? { maximum: asset === "RON" ? "250.00" : "50.00" } : kind === "stock" ? { maximum: "100.00" } : {}), debit_account_id: kind === "stock" ? "account-USD" : `account-${asset}` }, eta: kind === "fiat" ? "1–2 business days" : kind === "crypto" ? "After network confirmation" : "2–5 business days", enabled: true } as TransferRoute,
      ...(kind === "fiat" ? [{ id: `phone-${asset}`, asset, name: "Internal phone transfer", destination_kind: "phone" as const, fee: "0.00", fee_policy: { fixed: "0.00", rate_bps: 5, minimum: asset === "RON" ? "0.50" : "0.10", maximum: asset === "RON" ? "50.00" : "10.00", debit_account_id: `account-${asset}` }, eta: "After recipient verification", enabled: true }] : [])];
  });
  return { schema_version: 1, mode: "demo", as_of: "2026-10-14T12:00:00Z", accounts, routes, limits: { currency: "USD", daily_limit: "50000.00", used: "0.00", resets_at: "2026-10-15T00:00:00Z", verification_label: "Tier 3 · Demo verification" }, transfers: [
    { id: "transfer-demo-1", account_id: "account-USD", kind: "fiat", asset: "USD", amount: "1250.00", fee: "1.00", value_usd: "1251.00", direction: "outgoing", recipient_name: "Alex Morgan", destination: "DE89370400440532013000", route_id: "route-USD", reference: "Invoice 204", status: "completed", created_at: "2026-10-14T10:22:00Z", updated_at: "2026-10-14T11:00:00Z", can_cancel: false },
    { id: "transfer-demo-2", account_id: "account-BTC", kind: "crypto", asset: "BTC", amount: "0.08500000", fee: "0", value_usd: "5816.58", direction: "incoming", recipient_name: "Personal wallet", destination: "Custody account", route_id: "route-BTC", reference: "Wallet funding", status: "completed", created_at: "2026-10-13T08:14:00Z", updated_at: "2026-10-13T08:14:00Z", can_cancel: false },
    { id: "transfer-demo-3", account_id: "account-TSLA", kind: "stock", asset: "TSLA", amount: "10", fee: "0", value_usd: "1774.60", direction: "outgoing", recipient_name: "Broker custody", destination: "DTC-1109", route_id: "route-TSLA", reference: "Custody request", status: "rejected", created_at: "2026-10-12T14:22:00Z", updated_at: "2026-10-12T15:00:00Z", can_cancel: false },
  ] };
}
