import type { RiskState } from "../types/admin/risk";
import type { MarketsState } from "../types/admin/markets";
import type { WalletState } from "../wallet/engine";
import { decimal, units, usdValue } from "../transfers/engine";
import { DOMAINS, type ControlSnapshot, type ControlSample, type Domain } from "./contracts";

export function buildControlSnapshot(risk: RiskState, markets: MarketsState, wallets: WalletState[], now: string): ControlSnapshot {
  const end = Date.parse(now);
  if (!Number.isFinite(end)) throw new Error("Invalid snapshot time.");
  const inWindow = (at: string) => Date.parse(at) > end - 86400000 && Date.parse(at) <= end;
  const open = risk.cases.filter(item => item.status !== "RESOLVED");
  const domainOf = (kind: string): Domain => kind === "fiat" ? "FIAT" : kind === "crypto" ? "CRYPTO" : "STOCK";
  const telemetry: ControlSample[] = Array.from({ length: 24 }, (_, index) => ({ at: new Date(end - (23 - index) * 3600000).toISOString(), successful_requests: 0, failed_requests: 0, fiat_usd: "0.00", crypto_usd: "0.00", stock_usd: "0.00" }));
  const addVolume = (domain: Domain, at: string, value: bigint) => {
    const point = telemetry[23 - Math.floor((end - Date.parse(at)) / 3600000)];
    const key = ({ FIAT: "fiat_usd", CRYPTO: "crypto_usd", STOCK: "stock_usd" } as const)[domain];
    point[key] = decimal(units(point[key], 2) + value, 2);
  };
  return {
    schema_version: 1, mode: "demo", as_of: now, risk_revision: risk.revision,
    customer_count: wallets.length, restricted_customers: risk.restrictions.length,
    telemetry, system_logs: [],
    domains: DOMAINS.map(domain => {
      const policy = risk.policies.find(item => item.domain === domain);
      if (!policy) throw new Error(`Missing ${domain} risk policy.`);
      let available = BigInt(0), reserved = BigInt(0), volume = BigInt(0), pending = 0;
      for (const wallet of wallets) {
        for (const account of wallet.transfers.accounts.filter(item => domainOf(item.kind) === domain)) {
          available += usdValue(units(account.available, account.decimals), account.decimals, account.usd_price, "nearest");
          reserved += usdValue(units(account.reserved, account.decimals), account.decimals, account.usd_price, "nearest");
        }
        // Opening-history fixtures are excluded from operational throughput.
        for (const transfer of wallet.transfers.transfers.filter(item => item.id.startsWith("trf-") && domainOf(item.kind) === domain)) {
          if (["pending", "processing"].includes(transfer.status)) pending++;
          if (transfer.status === "completed" && inWindow(transfer.updated_at)) {
            const value = units(transfer.value_usd, 2); volume += value; addVolume(domain, transfer.updated_at, value);
          }
        }
      }
      for (const order of markets.orders.filter(item => item.domain === domain)) {
        if (order.status === "PENDING") pending++;
        if (order.status === "FILLED" && inWindow(order.updatedAt)) {
          const value = units(order.totalUsd.toFixed(2), 2); volume += value; addVolume(domain, order.updatedAt, value);
        }
      }
      return {
        domain, available_usd: decimal(available, 2), reserved_usd: decimal(reserved, 2),
        volume_24h_usd: decimal(volume, 2), pending_count: pending,
        open_cases: open.filter(item => item.domain === domain).length,
        routing_status: domain === "FIAT" ? "ACTIVE" : markets.routing[domain].status,
        policy: { domain, paused: policy.paused, max_transaction_usd: policy.maxTransactionUsd.toFixed(2), exposure_limit_usd: policy.exposureLimitUsd.toFixed(2), review_score: policy.reviewScore, block_score: policy.blockScore },
      };
    }),
    cases: open.map(item => ({ id: item.id, domain: item.domain, subject: item.subject, severity: item.severity, status: item.status as "OPEN" | "INVESTIGATING" | "ESCALATED", amount_usd: item.amountUsd.toFixed(2), due_at: item.dueAt }))
      .sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity] || a.due_at.localeCompare(b.due_at)),
    activity: [
      ...wallets.flatMap((wallet, walletIndex) => wallet.transfers.transfers.flatMap(transfer => (transfer.admin_history ?? []).map(event => ({ id: `transfer:${walletIndex}:${transfer.id}:${event.id}`, domain: transfer.kind === "fiat" ? "FIAT" as const : transfer.kind === "crypto" ? "CRYPTO" as const : "STOCK" as const, action: `TRANSFER_${event.action}`, target: transfer.id, actor: event.actor, reason: event.reason, occurred_at: event.occurred_at })))),
      ...risk.audit.map(item => ({ id: `risk:${item.id}`, domain: DOMAINS.includes(item.target as Domain) ? item.target as Domain : risk.cases.find(c => c.id === item.target)?.domain ?? "PLATFORM" as const, action: item.action, target: item.target, actor: item.actor, reason: item.reason, occurred_at: item.timestamp })),
      ...markets.audit.map(item => ({ id: `market:${item.id}`, domain: item.domain, action: item.action, target: item.target, actor: item.actor, reason: item.reason, occurred_at: item.timestamp })),
    ].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
  };
}
