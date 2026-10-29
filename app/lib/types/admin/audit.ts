export const AUDIT_SOURCES = ["IDENTITY", "USERS", "TRANSACTIONS", "RATES", "CARDS", "MARKETS", "RISK", "SYSTEM", "AUDIT", "SUBSCRIPTIONS", "REFERRALS", "ANALYTICS"] as const;
export const AUDIT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;
export const AUDIT_OUTCOMES = ["SUCCESS", "DENIED", "FAILED"] as const;
export type AuditSource = typeof AUDIT_SOURCES[number];
export type AuditSeverity = typeof AUDIT_SEVERITIES[number];
export type AuditOutcome = typeof AUDIT_OUTCOMES[number];
export interface AuditEvent {
  id: string;
  timestamp: string;
  source: AuditSource;
  domain: "PLATFORM" | "FIAT" | "CRYPTO" | "STOCK";
  category: "ACCESS" | "SECURITY" | "FINANCIAL" | "CONFIGURATION" | "COMPLIANCE" | "SYSTEM" | "DATA_ACCESS";
  action: string;
  severity: AuditSeverity;
  outcome: AuditOutcome;
  actor: string;
  actorRole: "ADMIN" | "CLIENT" | "SYSTEM" | "UNKNOWN";
  target: string;
  reason: string;
  correlationId: string | null;
  requestId: string | null;
  sessionId: string | null;
  ip: string | null;
  durationMs: number | null;
  before: unknown;
  after: unknown;
  origin: "DEMO" | "LOCAL" | "SERVER";
  evidenceKind?: "HISTORY" | "SNAPSHOT";
}
export interface AuditNote { id: string; eventId: string; actor: string; timestamp: string; text: string }
export interface AuditJournal { receipts?: { key: string; payload: string; resultId: string }[]; revision: number; events: AuditEvent[]; notes: AuditNote[] }
export interface AuditFilters {
  query: string; source: string; severity: string; outcome: string;
  domain: string; actor: string; category: string; origin: string;
  from: string; to: string; correlationId: string;
}
export interface AuditActor { email: string; role: "admin" | "client" }
export interface AuditSourceHealth { source: AuditSource; status: "CONNECTED" | "DEMO_ONLY" | "ERROR"; localCount: number; totalCount?: number; latestAt?: string | null; message: string }
export type AuditDraft = Pick<AuditEvent, "source" | "category" | "action" | "target" | "reason" | "before" | "after"> & Partial<Pick<AuditEvent, "domain" | "severity" | "outcome" | "correlationId" | "ip">>;
