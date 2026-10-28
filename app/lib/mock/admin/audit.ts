import type { AuditEvent } from "@/app/lib/types/admin/audit";
export const AUDIT_DEMO_NOW = "2026-10-09T12:00:00Z";
const templates: Pick<AuditEvent, "source" | "domain" | "category" | "action" | "severity" | "outcome" | "actor" | "actorRole" | "target" | "reason" | "before" | "after">[] = [
  { source:"IDENTITY",domain:"PLATFORM",category:"ACCESS",action:"SIGN_IN",severity:"INFO",outcome:"SUCCESS",actor:"operations@admin.com",actorRole:"ADMIN",target:"admin-console",reason:"Demo administrator sign-in with step-up verification.",before:null,after:{mfa:"verified",method:"TOTP"} },
  { source:"IDENTITY",domain:"PLATFORM",category:"SECURITY",action:"SIGN_IN_DENIED",severity:"CRITICAL",outcome:"DENIED",actor:"unknown principal",actorRole:"UNKNOWN",target:"admin-console",reason:"Demo repeated failed credentials; account protection policy applied.",before:null,after:{attempts:5,challenge:"required"} },
  { source:"USERS",domain:"PLATFORM",category:"SECURITY",action:"SESSIONS_REVOKED",severity:"WARNING",outcome:"SUCCESS",actor:"security@admin.com",actorRole:"ADMIN",target:"USR-3426",reason:"Demo session revocation following a device compromise report.",before:{activeSessions:3},after:{activeSessions:0} },
  { source:"TRANSACTIONS",domain:"FIAT",category:"FINANCIAL",action:"TRANSFER_REVIEWED",severity:"INFO",outcome:"SUCCESS",actor:"compliance@admin.com",actorRole:"ADMIN",target:"TXN-FIAT-2041",reason:"Demo source-of-funds evidence reviewed.",before:{status:"FLAGGED"},after:{status:"APPROVED",amountUsd:6400} },
  { source:"RISK",domain:"CRYPTO",category:"COMPLIANCE",action:"SANCTIONS_SCREEN_BLOCK",severity:"CRITICAL",outcome:"DENIED",actor:"demo-screening-service",actorRole:"SYSTEM",target:"DEMO-WALLET-42",reason:"Simulated wallet watchlist match; no real sanctions screening was performed.",before:{decision:"PENDING"},after:{decision:"BLOCK",riskScore:96} },
  { source:"MARKETS",domain:"STOCK",category:"FINANCIAL",action:"ORDER_REJECTED",severity:"WARNING",outcome:"DENIED",actor:"customer@example.test",actorRole:"CLIENT",target:"DEMO-ORDER-8104",reason:"Demo order rejected by instrument transaction cap.",before:null,after:{symbol:"AAPL",side:"BUY",amountUsd:32000} },
  { source:"RATES",domain:"FIAT",category:"CONFIGURATION",action:"FEE_RULE_UPDATED",severity:"WARNING",outcome:"SUCCESS",actor:"operations@admin.com",actorRole:"ADMIN",target:"DEMO-SEPA-OUT",reason:"Demo fee rule proposal pending a second administrator's review.",before:{feeBps:12},after:{feeBps:15,status:"PENDING_APPROVAL"} },
  { source:"CARDS",domain:"FIAT",category:"SECURITY",action:"CARD_FROZEN",severity:"WARNING",outcome:"SUCCESS",actor:"security@admin.com",actorRole:"ADMIN",target:"DEMO-CARD-1042",reason:"Demo card frozen following a customer fraud report.",before:{status:"ACTIVE",last4:"1042"},after:{status:"FROZEN",last4:"1042"} },
  { source:"SYSTEM",domain:"PLATFORM",category:"SYSTEM",action:"PROVIDER_TIMEOUT",severity:"CRITICAL",outcome:"FAILED",actor:"demo-settlement-worker",actorRole:"SYSTEM",target:"demo-fiat-provider",reason:"Simulated upstream timeout. No live provider is connected.",before:null,after:{attempt:2,retryScheduled:true} },
  { source:"SYSTEM",domain:"PLATFORM",category:"SYSTEM",action:"BACKUP_CHECK_COMPLETED",severity:"INFO",outcome:"SUCCESS",actor:"demo-platform-worker",actorRole:"SYSTEM",target:"demo-archive",reason:"Illustrative backup check; this browser app has no external audit archive.",before:null,after:{demo:true} },
  { source:"MARKETS",domain:"CRYPTO",category:"CONFIGURATION",action:"POOL_LIMIT_UPDATED",severity:"WARNING",outcome:"SUCCESS",actor:"operations@admin.com",actorRole:"ADMIN",target:"BTC",reason:"Demo execution inventory threshold updated.",before:{lowLiquidityUsd:40000},after:{lowLiquidityUsd:50000} },
  { source:"AUDIT",domain:"PLATFORM",category:"DATA_ACCESS",action:"EXPORT_REQUESTED",severity:"WARNING",outcome:"SUCCESS",actor:"compliance@admin.com",actorRole:"ADMIN",target:"demo-evidence-report",reason:"Illustrative evidence export for an internal case review.",before:null,after:{format:"JSON",records:42} },
];
// Deterministic fixtures, never presented as ingested server telemetry.
export const MOCK_AUDIT_EVENTS: AuditEvent[] = Array.from({length:126},(_,index) => {
  const template = templates[index % templates.length];
  const timestamp = new Date(Date.parse(AUDIT_DEMO_NOW) - index * 75 * 60000 - (index % 5) * 7000).toISOString();
  return { ...template, id:`demo:audit:${String(index+1).padStart(4,"0")}`, timestamp,
    target: template.target, correlationId:`DEMO-TRACE-${index+1}`,
    requestId:`DEMO-REQ-${index+1}`, sessionId:template.actorRole === "ADMIN" ? `DEMO-SESSION-${index%3+1}` : null,
    ip: template.actorRole === "SYSTEM" ? null : index%2 ? "203.0.113.42" : "192.0.2.10",
    durationMs: 12+(index*37)%920, origin:"DEMO" };
});
