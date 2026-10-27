import { DOMAINS, type ControlSnapshot } from "./contracts";
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const count = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
const money = (value: unknown) => typeof value === "string" && /^(0|[1-9]\d{0,15})\.\d{2}$/.test(value);
const date = (value: unknown) => typeof value === "string" && value.endsWith("Z") && Number.isFinite(Date.parse(value));
const text = (value: unknown) => typeof value === "string" && value.length > 0;
const domain = (value: unknown) => DOMAINS.includes(value as never);
export function parseControlSnapshot(value: unknown): ControlSnapshot {
  if (!object(value) || value.schema_version !== 1 || !["demo", "live"].includes(String(value.mode)) || !date(value.as_of) || !count(value.risk_revision) || !count(value.customer_count) || !count(value.restricted_customers)
    || !Array.isArray(value.domains) || value.domains.length !== 3 || new Set(value.domains.map(item => object(item) && item.domain)).size !== 3
    || !value.domains.every(item => object(item) && domain(item.domain) && [item.available_usd, item.reserved_usd, item.volume_24h_usd].every(money) && [item.pending_count, item.open_cases].every(count) && ["ACTIVE", "SELL_ONLY", "HALTED"].includes(String(item.routing_status)) && object(item.policy) && item.policy.domain === item.domain && typeof item.policy.paused === "boolean" && money(item.policy.max_transaction_usd) && Number(item.policy.max_transaction_usd) > 0 && money(item.policy.exposure_limit_usd) && Number(item.policy.exposure_limit_usd) >= Number(item.policy.max_transaction_usd) && count(item.policy.review_score) && count(item.policy.block_score) && Number(item.policy.review_score) >= 1 && Number(item.policy.review_score) < Number(item.policy.block_score) && Number(item.policy.block_score) <= 100)
    || !Array.isArray(value.cases) || !value.cases.every(item => object(item) && text(item.id) && domain(item.domain) && text(item.subject) && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(String(item.severity)) && ["OPEN", "INVESTIGATING", "ESCALATED"].includes(String(item.status)) && money(item.amount_usd) && date(item.due_at))
    || !Array.isArray(value.activity) || !value.activity.every(item => object(item) && text(item.id) && (domain(item.domain) || item.domain === "PLATFORM") && [item.action, item.target, item.actor, item.reason].every(text) && date(item.occurred_at))
    || !Array.isArray(value.telemetry) || !value.telemetry.every(item => object(item) && date(item.at) && count(item.successful_requests) && count(item.failed_requests) && [item.fiat_usd, item.crypto_usd, item.stock_usd].every(money))
    || !Array.isArray(value.system_logs) || !value.system_logs.every(item => object(item) && text(item.id) && date(item.occurred_at) && (domain(item.domain) || item.domain === "PLATFORM") && ["INFO", "WARNING", "CRITICAL"].includes(String(item.severity)) && [item.event, item.target, item.message].every(text))) throw new Error("Invalid Admin Control service response.");
  return value as unknown as ControlSnapshot;
}
