import type { HealthControl, HealthDomain, HealthService, HealthResource, ServiceStatus, SystemHealthReport } from "@/app/lib/types/admin/system-health";
export function effectiveStatus(status: ServiceStatus, checkedAt: string, asOf: string): ServiceStatus {
  const age = Date.parse(asOf) - Date.parse(checkedAt);
  return !Number.isFinite(age) || age < 0 || age > 120000 ? "UNKNOWN" : status;
}
export function aggregateStatus(statuses: ServiceStatus[]): ServiceStatus {
  return statuses.includes("OUTAGE") ? "OUTAGE" : !statuses.length || statuses.includes("UNKNOWN") ? "UNKNOWN" : statuses.includes("DEGRADED") ? "DEGRADED" : "OPERATIONAL";
}
export function controlStatus(control: HealthControl, asOf: string): ServiceStatus {
  if (control.value === null || !Number.isFinite(control.value) || !Number.isFinite(control.threshold)) return "UNKNOWN";
  const breached = control.direction === "MAX" ? control.value > control.threshold : control.value < control.threshold;
  return effectiveStatus(breached ? "DEGRADED" : "OPERATIONAL", control.checked_at, asOf);
}
export function serviceHealthStatus(report: SystemHealthReport, service: HealthService): ServiceStatus {
  return aggregateStatus([effectiveStatus(service.status, service.checked_at, report.as_of), effectiveStatus(service.queue_depth > 0 && service.oldest_job_seconds > service.queue_target_seconds ? "DEGRADED" : "OPERATIONAL", service.checked_at, report.as_of), ...report.controls.filter(c => c.service_id === service.id).map(c => controlStatus(c, report.as_of))]);
}
export function healthSummary(report: SystemHealthReport) {
  const statuses = report.services.map(s => serviceHealthStatus(report, s));
  const status = aggregateStatus([...(statuses.length ? statuses : ["UNKNOWN" as ServiceStatus]), ...report.controls.map(c => controlStatus(c, report.as_of)), ...report.resources.map(r => resourceStatus(r, report.as_of))]);
  const requests = report.samples.reduce((n,s) => n+s.requests,0), errors = report.samples.reduce((n,s) => n+s.server_errors,0);
  const completeSamples = report.samples.length === 86400 / report.window.sample_interval_seconds && report.samples.every((sample, index) => Date.parse(sample.timestamp) === Date.parse(report.window.starts_at) + (index + 1) * report.window.sample_interval_seconds * 1000);
  const allowedFailedProbes = report.probe_total_24h * (1 - report.availability_target_pct / 100);
  const failedProbes = report.probe_total_24h - report.probe_successes_24h;
  return { status, healthy: statuses.filter(s => s === "OPERATIONAL").length, total: statuses.length, availability: report.probe_total_24h > 0 ? report.probe_successes_24h / report.probe_total_24h * 100 : null, errorRate: completeSamples && requests > 0 ? errors / requests * 100 : null, requests, errors,
    budgetRemainingPct: allowedFailedProbes > 0 ? Math.max(0, Math.min(100, (allowedFailedProbes - failedProbes) / allowedFailedProbes * 100)) : null,
    queued: report.services.reduce((n, s) => n + s.queue_depth, 0),
    breachedQueues: report.services.filter(s => s.queue_depth > 0 && s.oldest_job_seconds > s.queue_target_seconds).length,
  };
}
export function healthServices(report: SystemHealthReport, domain: HealthDomain | "ALL") { return report.services.filter(s => domain === "ALL" || s.domain === domain); }
export function domainHealth(report: SystemHealthReport, domain: HealthDomain) {
  const services = healthServices(report, domain), controls = report.controls.filter(c => c.domain === domain);
  return { services, controls, status: aggregateStatus([...services.map(s => serviceHealthStatus(report, s)), ...controls.map(c => controlStatus(c, report.as_of)), ...(domain === "PLATFORM" ? report.resources.map(r => resourceStatus(r, report.as_of)) : [])]),
    healthy: services.filter(s => serviceHealthStatus(report, s) === "OPERATIONAL").length,
    incidents: report.incidents.filter(i => services.some(s => s.id === i.service_id)).length,
    queued: services.reduce((n, s) => n + s.queue_depth, 0),
  };
}

export function resourceStatus(resource: HealthResource, asOf: string): ServiceStatus {
  return aggregateStatus([effectiveStatus(resource.status, resource.checked_at, asOf), ...resource.metrics.map(metric => controlStatus({...metric, id: resource.id, service_id: '', domain: 'PLATFORM', checked_at: resource.checked_at, detail: ''}, asOf))]);
}

export type IncidentGrouping = 'STATE' | 'SEVERITY' | 'DOMAIN' | 'OWNER';
export interface IncidentFilters { query: string; state: string; severity: string; group: IncidentGrouping }
export function incidentGroups(report: SystemHealthReport, filters: IncidentFilters) {
  const services = new Map(report.services.map(service => [service.id, service]));
  const incidents = report.incidents.filter(i => {
    const service = services.get(i.service_id);
    return (filters.state === 'ALL' || i.state === filters.state) && (filters.severity === 'ALL' || i.severity === filters.severity) &&
      [i.id, i.title, i.impact, i.state, i.severity, service?.name, service?.owner, service?.domain].join(' ').toLowerCase().includes(filters.query.trim().toLowerCase());
  }).sort((a, b) => Number(b.severity === 'CRITICAL') - Number(a.severity === 'CRITICAL') || Number(b.state === 'INVESTIGATING') - Number(a.state === 'INVESTIGATING') || Date.parse(a.started_at) - Date.parse(b.started_at));
  const groups = new Map<string, typeof incidents>();
  for (const incident of incidents) {
    const service = services.get(incident.service_id);
    const key = filters.group === 'STATE' ? incident.state : filters.group === 'SEVERITY' ? incident.severity : filters.group === 'DOMAIN' ? service?.domain ?? 'Unassigned' : service?.owner ?? 'Unassigned';
    groups.set(key, [...(groups.get(key) ?? []), incident]);
  }
  const priority: Record<string, number> = {CRITICAL: 0, WARNING: 1, INVESTIGATING: 0, MONITORING: 1};
  return [...groups.entries()].sort(([a], [b]) => (priority[a] ?? 2) - (priority[b] ?? 2) || a.localeCompare(b)).map(([key, items]) => ({key, incidents: items}));
}

export function healthSnapshotStale(report: SystemHealthReport, now: number) {
  const age = now - Date.parse(report.as_of);
  return report.mode === 'live' && (!Number.isFinite(age) || age > 120000 || age < -30000);
}
