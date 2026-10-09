import type { HealthDomain, ServiceStatus, SystemHealthReport } from "@/app/lib/types/admin/system-health";
export function effectiveStatus(status: ServiceStatus, checkedAt: string, asOf: string): ServiceStatus {
  const age = Date.parse(asOf) - Date.parse(checkedAt);
  return !Number.isFinite(age) || age < 0 || age > 120000 ? "UNKNOWN" : status;
}
export function healthSummary(report: SystemHealthReport) {
  const statuses = report.services.map(s => effectiveStatus(s.status, s.checked_at, report.as_of));
  const status: ServiceStatus = statuses.includes("OUTAGE") ? "OUTAGE" : !statuses.length || statuses.includes("UNKNOWN") ? "UNKNOWN" : statuses.includes("DEGRADED") ? "DEGRADED" : "OPERATIONAL";
  const requests = report.samples.reduce((n,s) => n+s.requests,0), errors = report.samples.reduce((n,s) => n+s.server_errors,0);
  return { status, healthy: statuses.filter(s => s === "OPERATIONAL").length, total: statuses.length, availability: report.probe_total_24h > 0 ? report.probe_successes_24h / report.probe_total_24h * 100 : null, errorRate: requests > 0 ? errors / requests * 100 : null, requests, errors };
}
export function healthServices(report: SystemHealthReport, domain: HealthDomain | "ALL") { return report.services.filter(s => domain === "ALL" || s.domain === domain); }
