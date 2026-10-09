import { RISK_DOMAINS } from "@/app/lib/types/admin/risk";
import type { RiskActor, RiskCommand, RiskPolicy, RiskState, ScreeningInput, ScreeningResult } from "@/app/lib/types/admin/risk";
import type { MarketsState } from "@/app/lib/types/admin/markets";
export function validatePolicy(policy: RiskPolicy) {
  if (!RISK_DOMAINS.includes(policy.domain) || typeof policy.paused !== "boolean" || ![policy.maxTransactionUsd, policy.exposureLimitUsd, policy.reviewScore, policy.blockScore].every(Number.isFinite) || policy.maxTransactionUsd <= 0 || policy.maxTransactionUsd > 1e9 || policy.exposureLimitUsd < policy.maxTransactionUsd || policy.exposureLimitUsd > 1e12 || policy.reviewScore < 1 || policy.reviewScore >= policy.blockScore || policy.blockScore > 100) throw new Error("Invalid policy: positive limits, exposure ≥ transaction limit and 1 ≤ review score < block score ≤ 100 are required.");
}
export function screenOperation(state: RiskState, input: ScreeningInput): ScreeningResult {
  if (!RISK_DOMAINS.includes(input.domain) || !Number.isFinite(input.amountUsd) || input.amountUsd <= 0 || !Number.isFinite(input.score) || input.score < 0 || input.score > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error("Provide a valid customer email, positive USD amount and score from 0 to 100.");
  const policy = state.policies.find(p => p.domain === input.domain);
  if (!policy) throw new Error("Risk policy unavailable.");
  const signals: string[] = [];
  if (policy.paused) signals.push(`${input.domain} emergency stop is active`);
  if (state.restrictions.some(r => r.email === input.email.trim().toLowerCase())) signals.push("Account is restricted by Risk Control");
  if (input.sanctionsMatch) signals.push("Simulated sanctions match requires investigation");
  if (!input.kycVerified) signals.push("Verified KYC is required");
  if (input.amountUsd > policy.maxTransactionUsd) signals.push("Amount exceeds the transaction limit");
  if (input.score >= policy.blockScore) signals.push("Risk score meets the block threshold");
  if (signals.length) return { decision: "BLOCK", signals };
  if (input.score >= policy.reviewScore) return { decision: "REVIEW", signals: ["Risk score meets the manual review threshold"] };
  return { decision: "ALLOW", signals: ["Demo checks passed; external screening is not connected"] };
}
export function applyRiskCommand(state: RiskState, command: RiskCommand, actor: RiskActor, now: string, id: string): RiskState {
  if (actor.role !== "admin") throw new Error("Administrator access required.");
  if (command.expectedRevision !== state.revision) throw new Error("Risk data changed. Close this dialog and review the latest state.");
  const reason = command.reason.trim();
  if (reason.length < 10 || reason.length > 500) throw new Error("An audit reason of 10–500 characters is required.");
  const next = structuredClone(state); let before: unknown = null; let after: unknown = null; let target = "";
  if (command.action === "POLICY") {
    validatePolicy(command.policy); target = command.policy.domain;
    before = state.policies.find(p => p.domain === target); after = { ...command.policy };
    next.policies = next.policies.map(p => p.domain === target ? { ...command.policy } : p);
  } else if (command.action === "FREEZE" || command.action === "REQUEST_RELEASE" || command.action === "APPROVE_RELEASE") {
    target = command.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) throw new Error("Enter a valid customer email.");
    const existing = next.restrictions.find(r => r.email === target); before = existing ? { ...existing } : null;
    if (command.action === "FREEZE") {
      if (existing) throw new Error("This account is already restricted.");
      next.restrictions.push({ email: target, reason, actor: actor.email, timestamp: now, releaseRequestedBy: null });
    } else {
      if (!existing) throw new Error("Account is not restricted.");
      if (command.action === "REQUEST_RELEASE") {
        if (existing.releaseRequestedBy) throw new Error("Release approval is already pending.");
        existing.releaseRequestedBy = actor.email;
      } else {
        if (!existing.releaseRequestedBy || existing.releaseRequestedBy.toLowerCase() === actor.email.toLowerCase()) throw new Error("A different administrator must approve a pending release request.");
        next.restrictions = next.restrictions.filter(r => r.email !== target);
      }
    }
    after = next.restrictions.find(r => r.email === target) ?? null;
  } else if (command.action === "CREATE_CASE") {
    screenOperation(state, { ...command, sanctionsMatch: false, kycVerified: true });
    if (command.reference.trim().length < 3 || command.reference.length > 100) throw new Error("A reference of 3–100 characters is required.");
    target = id;
    if (next.cases.some(c => c.reference === command.reference.trim() && c.domain === command.domain && c.status !== "RESOLVED")) throw new Error("An active case already exists for this reference.");
    const email = command.email.trim().toLowerCase();
    const item = { id, domain: command.domain, subject: email, email, category: "Manual review", reference: command.reference.trim(), amountUsd: command.amountUsd, score: command.score, severity: command.score >= 85 ? "CRITICAL" as const : command.score >= 65 ? "HIGH" as const : command.score >= 40 ? "MEDIUM" as const : "LOW" as const, status: "OPEN" as const, owner: null, createdAt: now, dueAt: new Date(Date.parse(now) + (command.score >= 85 ? 2 : 24) * 3600000).toISOString(), evidence: command.signals.length ? command.signals : ["Manually opened by an administrator."], notes: [{ actor: actor.email, text: reason, timestamp: now }], resolution: null };
    next.cases.unshift(item); after = item;
  } else {
    if (!("caseId" in command)) throw new Error("Unknown risk command.");
    const item = next.cases.find(c => c.id === command.caseId);
    if (!item) throw new Error("Case unavailable.");
    target = item.id; before = structuredClone(item);
    if (item.status === "RESOLVED") throw new Error("Resolved cases are read-only.");
    if (command.action === "ASSIGN") { item.owner = actor.email; if (item.status === "OPEN") item.status = "INVESTIGATING"; }
    if (command.action === "ESCALATE") { item.status = "ESCALATED"; item.owner ??= actor.email; }
    if (command.action === "RESOLVE") {
      if (!item.owner || item.status === "OPEN") throw new Error("Assign and investigate this case before resolving it.");
      if (!["CONFIRMED", "FALSE_POSITIVE"].includes(command.resolution)) throw new Error("Choose a valid resolution.");
      item.status = "RESOLVED"; item.resolution = command.resolution;
    }
    item.notes.push({ actor: actor.email, text: reason, timestamp: now }); after = item;
  }
  next.revision++;
  next.audit.unshift({ id, actor: actor.email, action: command.action, target, reason, timestamp: now, before: structuredClone(before), after: structuredClone(after) });
  return next;
}
// Guards both new submissions and queued orders becoming filled. No market write occurs if a guard fails.
export function enforceMarketRisk(risk: RiskState, previous: MarketsState, next: MarketsState) {
  for (const order of next.orders) {
    const prior = previous.orders.find(o => o.id === order.id);
    if ((order.status !== "FILLED" && order.status !== "PENDING") || (prior && (prior.status === "FILLED" || prior.status === order.status))) continue;
    const result = screenOperation(risk, { domain: order.domain, email: order.userEmail, amountUsd: order.totalUsd, score: 0, sanctionsMatch: false, kycVerified: true });
    if (result.decision === "BLOCK") throw new Error(`Risk Control: ${result.signals.join("; ")}. No changes were applied.`);
  }
}
export function csvRows(rows: (string | number)[][]) {
  return "\uFEFF" + rows.map(row => row.map(value => `"${String(value).replace(/^[\s]*[=+\-@]/, "'$&").replaceAll('"', '""')}"`).join(",")).join("\r\n");
}
