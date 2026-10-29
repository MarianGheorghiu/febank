import type { HealthAcknowledgement, HealthExportReceipt, HealthExportRequest, SystemHealthReport } from '../types/admin/system-health';

type Row = Record<string, unknown>;
function fail(): never { throw new Error('Invalid System Health response. Refresh or contact the monitoring team.'); }
function row(value: unknown): Row { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(); return value as Row; }
function text(value: unknown) { if (typeof value !== 'string' || !value.trim()) fail(); }
function number(value: unknown, min = 0, max = Infinity) { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(); }
function integer(value: unknown, min = 0) { number(value, min); if (!Number.isSafeInteger(value)) fail(); }
function nullable(value: unknown, max = Infinity) { if (value !== null) number(value, 0, max); }
function timestamp(value: unknown) { text(value); if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value as string) || !Number.isFinite(Date.parse(value as string))) fail(); }
function choice(value: unknown, choices: readonly string[]) { if (!choices.includes(value as string)) fail(); }
function rows(value: unknown): Row[] { if (!Array.isArray(value)) fail(); return value.map(row); }
function unique(items: Row[]) { const ids = new Set(); for (const item of items) { text(item.id); if (ids.has(item.id)) fail(); ids.add(item.id); } }
const statuses = ['OPERATIONAL', 'DEGRADED', 'OUTAGE', 'UNKNOWN'];
const domains = ['PLATFORM', 'FIAT', 'CRYPTO', 'STOCK'];
export function parseAcknowledgement(value: unknown): HealthAcknowledgement {
  const a = row(value); text(a.actor); timestamp(a.acknowledged_at); text(a.note); text(a.audit_event_id);
  if ((a.note as string).trim().length < 10 || (a.note as string).length > 500) fail();
  return a as unknown as HealthAcknowledgement;
}
export function parseHealthSnapshot(value: unknown): SystemHealthReport {
  const r = row(value);
  if (r.schema_version !== 3 || r.scope !== 'GLOBAL') fail();
  choice(r.mode, ['demo', 'live']); choice(r.environment, ['STAGING', 'PRODUCTION']);
  text(r.snapshot_id); timestamp(r.as_of); text(r.region);
  const window = row(r.window); timestamp(window.starts_at); timestamp(window.ends_at); integer(window.sample_interval_seconds, 1);
  if (86400 % (window.sample_interval_seconds as number) !== 0) fail();
  const start = Date.parse(window.starts_at as string), end = Date.parse(window.ends_at as string);
  if (end !== Date.parse(r.as_of as string) || end - start !== 86400000) fail();
  integer(r.probe_total_24h); integer(r.probe_successes_24h); if ((r.probe_successes_24h as number) > (r.probe_total_24h as number)) fail();
  number(r.availability_target_pct, 0, 100); number(r.latency_target_ms, 1); nullable(r.api_p95_ms);
  const services = rows(r.services), controls = rows(r.controls), incidents = rows(r.incidents), resources = rows(r.resources);
  [services, controls, incidents, resources].forEach(unique);
  const ids = new Map(services.map(s => [s.id, s]));
  for (const s of services) {
    text(s.name); text(s.owner); text(s.detail); choice(s.domain, domains); choice(s.status, statuses); timestamp(s.checked_at);
    nullable(s.availability_24h_pct, 100); nullable(s.latency_p95_ms); integer(s.queue_depth); number(s.oldest_job_seconds); number(s.queue_target_seconds, 1);
    if (!Array.isArray(s.dependencies) || new Set(s.dependencies).size !== s.dependencies.length || s.dependencies.some(id => id === s.id || !ids.has(id))) fail();
  }
  // A dependency graph must be acyclic, even though we display measured statuses independently.
  const visiting = new Set(), visited = new Set();
  function visit(id: unknown) { if (visiting.has(id)) fail(); if (visited.has(id)) return; visiting.add(id); for (const dependency of ids.get(id)!.dependencies as string[]) visit(dependency); visiting.delete(id); visited.add(id); }
  for (const id of ids.keys()) visit(id);
  for (const c of controls) {
    text(c.name); text(c.unit); text(c.detail); choice(c.domain, domains); choice(c.direction, ['MAX', 'MIN']); timestamp(c.checked_at);
    nullable(c.value); number(c.threshold); if (!ids.has(c.service_id) || ids.get(c.service_id)!.domain !== c.domain) fail();
  }
  let previous = start;
  for (const s of rows(r.samples)) {
    timestamp(s.timestamp); const time = Date.parse(s.timestamp as string);
    if (time <= previous || time > end || (time - start) % ((window.sample_interval_seconds as number) * 1000) !== 0) fail(); previous = time;
    integer(s.requests); integer(s.server_errors); if ((s.server_errors as number) > (s.requests as number)) fail();
    ['fiat_p95_ms', 'crypto_p95_ms', 'stock_p95_ms'].forEach(key => nullable(s[key]));
  }
  for (const i of incidents) {
    if (!ids.has(i.service_id)) fail(); integer(i.revision, 1); text(i.title); text(i.impact); text(i.update); text(i.next_step);
    choice(i.severity, ['WARNING', 'CRITICAL']); choice(i.state, ['INVESTIGATING', 'MONITORING']); timestamp(i.started_at); timestamp(i.updated_at);
    if (Date.parse(i.started_at as string) > Date.parse(i.updated_at as string) || Date.parse(i.updated_at as string) > end) fail();
    if (i.acknowledgement !== null) parseAcknowledgement(i.acknowledgement);
  }
  for (const resource of resources) {
    choice(resource.category, ["DATASTORE", "COMPUTE", "RECOVERY", "SECURITY"]);
    if (resource.trend !== null) {const trend = row(resource.trend); text(trend.name); text(trend.unit); let previous = start; for (const sample of rows(trend.samples)) {timestamp(sample.timestamp); nullable(sample.value); const time = Date.parse(sample.timestamp as string); if (time <= previous || time > end) fail(); previous = time;}}
    text(resource.name); text(resource.detail); choice(resource.status, statuses); timestamp(resource.checked_at);
    for (const metric of rows(resource.metrics)) { text(metric.name); text(metric.unit); nullable(metric.value); number(metric.threshold); choice(metric.direction, ['MAX', 'MIN']); }
  }
  if (r.maintenance !== null) { const m = row(r.maintenance); text(m.title); text(m.impact); timestamp(m.starts_at); timestamp(m.ends_at); if (Date.parse(m.starts_at as string) >= Date.parse(m.ends_at as string)) fail(); }
  return r as unknown as SystemHealthReport;
}
export function parseExportReceipt(value: unknown, request: HealthExportRequest): HealthExportReceipt {
  const r = row(value); text(r.audit_event_id); timestamp(r.recorded_at);
  if (r.request_id !== request.request_id || r.snapshot_id !== request.snapshot_id || r.content_sha256 !== request.content_sha256) fail();
  return r as unknown as HealthExportReceipt;
}
