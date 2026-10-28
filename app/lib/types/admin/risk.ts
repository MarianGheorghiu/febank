export const RISK_DOMAINS = ["FIAT", "CRYPTO", "STOCK"] as const;
export type RiskDomain = typeof RISK_DOMAINS[number];
export type RiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type CaseStatus = "OPEN" | "INVESTIGATING" | "ESCALATED" | "RESOLVED";
export interface RiskCase {
  id: string; domain: RiskDomain; category: string; subject: string; email: string;
  reference: string; amountUsd: number; score: number; severity: RiskSeverity;
  status: CaseStatus; owner: string | null; createdAt: string; dueAt: string;
  evidence: string[]; notes: { actor: string; text: string; timestamp: string }[];
  resolution: "CONFIRMED" | "FALSE_POSITIVE" | null;
}
export interface RiskPolicy { domain: RiskDomain; paused: boolean; maxTransactionUsd: number; exposureLimitUsd: number; reviewScore: number; blockScore: number }
export interface AccountRestriction { email: string; reason: string; actor: string; timestamp: string; releaseRequestedBy: string | null }
export interface RiskAudit { id: string; actor: string; action: string; target: string; reason: string; timestamp: string; before: unknown; after: unknown }
export interface RiskState { demoFixtureVersion?: number; processedRequests?: { key: string; payload: string }[]; revision: number; cases: RiskCase[]; policies: RiskPolicy[]; restrictions: AccountRestriction[]; audit: RiskAudit[] }
export type RiskActor = { email: string; role: "admin" | "client" };
export type RiskCommand = { expectedRevision: number; reason: string } & (
  | { action: "ASSIGN" | "ESCALATE" | "NOTE"; caseId: string }
  | { action: "RESOLVE"; caseId: string; resolution: "CONFIRMED" | "FALSE_POSITIVE" }
  | { action: "FREEZE" | "REQUEST_RELEASE" | "APPROVE_RELEASE" | "REJECT_RELEASE"; email: string }
  | { action: "EXPORT"; kind: "cases" | "audit"; recordIds: string[] }
  | { action: "POLICY"; policy: RiskPolicy }
  | { action: "CREATE_CASE"; domain: RiskDomain; email: string; reference: string; amountUsd: number; score: number; signals: string[] }
);
export interface ScreeningInput { domain: RiskDomain; email: string; amountUsd: number; score: number; sanctionsMatch: boolean; kycVerified: boolean }
export interface ScreeningResult { decision: "ALLOW" | "REVIEW" | "BLOCK"; signals: string[] }
