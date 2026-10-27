import type { ControlActivity, ControlLog, ControlSample, ControlSnapshot } from "./contracts";
import { decimal, units } from "../transfers/engine";

/** Illustrative platform portfolio; never written into customer wallets or execution policies. */
const DEMO_HOLDINGS = {
  FIAT: { available_usd: "6400000.00", reserved_usd: "650000.00" },
  CRYPTO: { available_usd: "7800000.00", reserved_usd: "450000.00" },
  STOCK: { available_usd: "6200000.00", reserved_usd: "180000.00" },
} as const;

/** Deterministic illustrative bank telemetry; separate from editable customer journals. */
export function withDemoMonitoring(snapshot: ControlSnapshot): ControlSnapshot {
  const end = Date.parse(snapshot.as_of);
  const telemetry: ControlSample[] = Array.from({ length: 24 }, (_, index) => ({
    at: new Date(end - (23 - index) * 3600000).toISOString(),
    successful_requests: 8400 + (index * 7919 + 104729) % 5200,
    failed_requests: 12 + (index * 31 + 17) % 110,
    fiat_usd: decimal(BigInt(148000 + (index * 3191) % 120000) * BigInt(100) + units(snapshot.telemetry[index]?.fiat_usd ?? "0.00", 2), 2),
    crypto_usd: decimal(BigInt(38000 + (index * 1777) % 84000) * BigInt(100) + units(snapshot.telemetry[index]?.crypto_usd ?? "0.00", 2), 2),
    stock_usd: decimal(BigInt(68000 + (index * 2953) % 110000) * BigInt(100) + units(snapshot.telemetry[index]?.stock_usd ?? "0.00", 2), 2),
  }));
  const logs: Omit<ControlLog, "id" | "occurred_at">[] = [
    { domain: "PLATFORM", severity: "CRITICAL", event: "AUTH_RATE_LIMIT", target: "Identity gateway", message: "Repeated sign-in failures detected; source temporarily rate-limited." },
    { domain: "FIAT", severity: "INFO", event: "LEDGER_RECONCILED", target: "EUR settlement", message: "Reconciliation batch completed with no unmatched entries." },
    { domain: "CRYPTO", severity: "WARNING", event: "CUSTODY_CONFIRMATIONS", target: "BTC custody", message: "Three deposits awaiting network confirmation; no balance credited early." },
    { domain: "STOCK", severity: "INFO", event: "BROKER_ACKNOWLEDGED", target: "Equity routing", message: "Broker acknowledged the latest settlement batch." },
    { domain: "FIAT", severity: "WARNING", event: "TRANSFER_REVIEW", target: "Payment screening", message: "Two outbound payments retained in the manual review queue." },
    { domain: "PLATFORM", severity: "INFO", event: "BACKUP_COMPLETED", target: "Core ledger", message: "Scheduled encrypted backup completed; restore verification pending." },
    { domain: "STOCK", severity: "WARNING", event: "QUOTE_DELAY", target: "Secondary quote feed", message: "Secondary feed exceeded its freshness threshold; primary feed remains available." },
    { domain: "CRYPTO", severity: "INFO", event: "RESERVE_CHECK", target: "Custody monitoring", message: "Illustrative reserve monitoring check completed." },
  ];
  const keys = { FIAT: "fiat_usd", CRYPTO: "crypto_usd", STOCK: "stock_usd" } as const;
  const audit: Omit<ControlActivity, "id" | "occurred_at">[] = [
    { domain: "FIAT", action: "POLICY_UPDATED", target: "FIAT transaction cap", actor: "risk.lead@admin.com", reason: "Adjusted the payment cap after the scheduled treasury risk review. Ticket OPS-2418." },
    { domain: "CRYPTO", action: "ROUTING_RESUMED", target: "CRYPTO routing", actor: "markets.ops@admin.com", reason: "Custody provider recovered and passed connectivity checks. Incident INC-1804 closed." },
    { domain: "STOCK", action: "LIQUIDITY_ADJUSTED", target: "AAPL liquidity pool", actor: "treasury@admin.com", reason: "Rebalanced the demonstration equity pool ahead of the market opening. Ticket TRS-0921." },
    { domain: "FIAT", action: "CASE_ASSIGNED", target: "RSK-1041", actor: "risk.lead@admin.com", reason: "Assigned the transfer-structuring review to the payments investigation team." },
    { domain: "CRYPTO", action: "ROUTING_PAUSED", target: "CRYPTO routing", actor: "markets.ops@admin.com", reason: "Temporarily paused new routing while the custody provider completed maintenance." },
    { domain: "PLATFORM", action: "AUDIT_EXPORTED", target: "Daily operational report", actor: "compliance@admin.com", reason: "Prepared the daily control evidence package for internal review. Ticket CMP-1042." },
    { domain: "STOCK", action: "INSTRUMENT_UPDATED", target: "NVDA trading limits", actor: "markets.ops@admin.com", reason: "Reviewed order limits against the available demonstration market liquidity." },
    { domain: "FIAT", action: "RELEASE_APPROVED", target: "Demo customer restriction", actor: "compliance@admin.com", reason: "Second administrator approved release after identity verification review." },
  ];
  return { ...snapshot, telemetry,
    activity: [...snapshot.activity, ...audit.map((item, index) => ({ ...item, id: `demo-audit-${index}`, occurred_at: new Date(end - (index * 19 + 4) * 60000).toISOString() }))].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    domains: snapshot.domains.map(item => ({ ...item,
      available_usd: decimal(units(item.available_usd, 2) + units(DEMO_HOLDINGS[item.domain].available_usd, 2), 2),
      reserved_usd: decimal(units(item.reserved_usd, 2) + units(DEMO_HOLDINGS[item.domain].reserved_usd, 2), 2),
      volume_24h_usd: decimal(telemetry.reduce((sum, point) => sum + units(point[keys[item.domain]], 2), BigInt(0)), 2) })),
    system_logs: logs.map((item, index) => ({ ...item, id: `demo-system-${index}`, occurred_at: new Date(end - (index * 7 + 1) * 60000).toISOString() })),
  };
}
