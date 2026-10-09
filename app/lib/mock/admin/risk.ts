import type { RiskCase, RiskState } from "@/app/lib/types/admin/risk";
const sample = (id: string, domain: RiskCase["domain"], subject: string, email: string, category: string, amountUsd: number, score: number, evidence: string[], hours: number): RiskCase => ({
  id, domain, subject, email, category, amountUsd, score, evidence,
  reference: `DEMO-${id}`, severity: score >= 85 ? "CRITICAL" : score >= 65 ? "HIGH" : "MEDIUM",
  status: "OPEN", owner: null, createdAt: "2026-10-09T06:00:00Z",
  dueAt: `2026-10-09T${String(hours).padStart(2, "0")}:00:00Z`, notes: [], resolution: null,
});
export const MOCK_RISK_STATE: RiskState = {
  revision: 0,
  policies: [
    { domain: "FIAT", paused: false, maxTransactionUsd: 50000, exposureLimitUsd: 15000000, reviewScore: 60, blockScore: 90 },
    { domain: "CRYPTO", paused: false, maxTransactionUsd: 25000, exposureLimitUsd: 12000000, reviewScore: 60, blockScore: 85 },
    { domain: "STOCK", paused: false, maxTransactionUsd: 25000, exposureLimitUsd: 20000000, reviewScore: 65, blockScore: 90 },
  ],
  cases: [
    sample("RSK-1042", "CRYPTO", "Andrei Ionescu", "andrei.ionescu@example.com", "Wallet screening", 42412.7, 96, ["Simulated wallet association with a restricted counterparty.", "Withdrawal exceeds the demo crypto transaction limit.", "Source of funds requires enhanced due diligence."], 8),
    sample("RSK-1041", "FIAT", "Ioana Marinescu", "ioana.marinescu@example.com", "Transfer structuring", 28600, 79, ["Six outbound payments to new beneficiaries within 20 minutes.", "Aggregate volume is 4.8× the historical daily baseline."], 10),
    sample("RSK-1040", "STOCK", "Radu Stan", "radu.stan@example.com", "Trading surveillance", 18400, 72, ["Repeated opposing orders in a short observation window.", "Pattern requires manual review; market abuse is not established."], 14),
    sample("RSK-1039", "FIAT", "Demo customer", "customer@example.test", "Account takeover", 6200, 88, ["New device followed by a new beneficiary payment.", "Simulated impossible-travel signal and failed step-up authentication."], 9),
    sample("RSK-1038", "CRYPTO", "Ioana Marinescu", "ioana.marinescu@example.com", "Source of funds", 12700, 67, ["Crypto deposit inconsistent with the declared activity profile.", "Supporting source-of-funds documents requested."], 16),
    { ...sample("RSK-1037", "STOCK", "Andrei Ionescu", "andrei.ionescu@example.com", "Concentration review", 9400, 48, ["Single issuer position above the internal customer review threshold."], 18), status: "RESOLVED", owner: "risk@admin.com", resolution: "FALSE_POSITIVE", notes: [{ actor: "risk@admin.com", text: "Reviewed the demo portfolio; documented customer investment mandate.", timestamp: "2026-10-09T07:00:00Z" }] },
  ], restrictions: [], audit: [],
};
// Treasury fixture only; these are not reconciled bank balances.
export const MOCK_FIAT_EXPOSURES = [
  { symbol: "EUR", name: "EUR settlement treasury", valueUsd: 6200000, reserveUsd: 6800000 },
  { symbol: "USD", name: "USD settlement treasury", valueUsd: 3850000, reserveUsd: 4100000 },
  { symbol: "RON", name: "RON settlement treasury", valueUsd: 960000, reserveUsd: 1050000 },
];
