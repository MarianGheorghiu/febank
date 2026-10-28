import { RISK_DOMAINS, type RiskState } from "../types/admin/risk";
import { validatePolicy } from "./engine";
const obj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === "string";
const date = (v: unknown) => str(v) && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));
const email = (v: unknown) => str(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export function validRiskState(v: unknown): v is RiskState {
  if (!obj(v) || !Number.isInteger(v.revision) || Number(v.revision) < 0 || !Array.isArray(v.cases) || !Array.isArray(v.policies) || !Array.isArray(v.restrictions) || !Array.isArray(v.audit)) return false;
  if (v.demoFixtureVersion !== undefined && (!Number.isInteger(v.demoFixtureVersion) || Number(v.demoFixtureVersion) < 0)) return false;
  if (v.processedRequests !== undefined && (!Array.isArray(v.processedRequests) || !v.processedRequests.every(r => obj(r) && str(r.key) && r.key.length > 0 && str(r.payload)) || new Set(v.processedRequests.map(r => r.key)).size !== v.processedRequests.length)) return false;
  try { for (const policy of v.policies) { if (!obj(policy)) return false; validatePolicy(policy as unknown as RiskState["policies"][number]); } } catch { return false; }
  return v.policies.length === 3 && new Set(v.policies.map(p => p.domain)).size === 3
    && v.cases.every(c => obj(c) && str(c.id) && RISK_DOMAINS.includes(c.domain as never) && str(c.category) && str(c.subject) && email(c.email) && str(c.reference) && typeof c.amountUsd === "number" && Number.isFinite(c.amountUsd) && c.amountUsd > 0 && c.amountUsd <= 1e9 && Math.abs(c.amountUsd * 100 - Math.round(c.amountUsd * 100)) < 0.0001 && typeof c.score === "number" && Number.isFinite(c.score) && c.score >= 0 && c.score <= 100 && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(String(c.severity)) && ["OPEN", "INVESTIGATING", "ESCALATED", "RESOLVED"].includes(String(c.status)) && (c.owner === null || email(c.owner)) && date(c.createdAt) && date(c.dueAt) && Array.isArray(c.evidence) && c.evidence.every(str) && Array.isArray(c.notes) && c.notes.every(n => obj(n) && email(n.actor) && str(n.text) && date(n.timestamp)) && (c.status === "RESOLVED" ? ["CONFIRMED", "FALSE_POSITIVE"].includes(String(c.resolution)) : c.resolution === null))
    && new Set(v.cases.map(c => c.id)).size === v.cases.length
    && v.restrictions.every(r => obj(r) && email(r.email) && r.email === String(r.email).toLowerCase() && str(r.reason) && email(r.actor) && date(r.timestamp) && (r.releaseRequestedBy === null || email(r.releaseRequestedBy)))
    && new Set(v.restrictions.map(r => r.email)).size === v.restrictions.length
    && new Set(v.audit.map(a => obj(a) ? a.id : null)).size === v.audit.length
    && v.audit.every(a => obj(a) && str(a.id) && email(a.actor) && str(a.action) && str(a.target) && str(a.reason) && date(a.timestamp));
}
