import { AUDIT_OUTCOMES, AUDIT_SEVERITIES, AUDIT_SOURCES } from "@/app/lib/types/admin/audit";
import type { AuditEvent, AuditFilters, AuditJournal } from "@/app/lib/types/admin/audit";
const secret = /password|secret|token|authorization|cookie|private.?key|seed.?phrase|cvv|cvc|card.?number|full.?pan|security.?code|one.?time.?password|recovery.?codes|backup.?codes|access.?key|(^|_)pan($|_)|delivery.?address|phone/i;
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 12) return "[DEPTH LIMIT]";
  if (value === null || value === undefined) return value ?? null;
  if (Array.isArray(value)) return value.map(v => redact(v,depth+1));
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key,v]) => [key,secret.test(key) ? "[REDACTED]" : redact(v,depth+1)]));
  return value;
}
export const emptyFilters = (): AuditFilters => ({query:"",source:"ALL",severity:"ALL",outcome:"ALL",domain:"ALL",actor:"ALL",category:"ALL",origin:"ALL",from:"",to:"",correlationId:""});
export function filterAudit(events: AuditEvent[], filters: AuditFilters): AuditEvent[] {
  const query = filters.query.trim().toLowerCase();
  const from = filters.from ? Date.parse(filters.from) : -Infinity;
  const to = filters.to ? Date.parse(filters.to) : Infinity;
  if (Number.isNaN(from) || Number.isNaN(to) || from > to) return [];
  return events.filter(event => {
    if (Date.parse(event.timestamp)<from || Date.parse(event.timestamp)>to) return false;
    for (const key of ["source","severity","outcome","domain","actor","category","origin"] as const) if (filters[key]!=="ALL" && event[key]!==filters[key]) return false;
    if (filters.correlationId && event.correlationId!==filters.correlationId) return false;
    return !query || [event.id,event.action,event.actor,event.target,event.reason,event.ip ?? "",event.correlationId ?? "",event.requestId ?? "",event.sessionId ?? ""].join(" ").toLowerCase().includes(query);
  }).sort((a,b) => b.timestamp.localeCompare(a.timestamp) || a.id.localeCompare(b.id));
}
export function groupAudit(events: AuditEvent[], key: "source" | "actor" | "outcome" | "severity") {
  const map = new Map<string,number>();
  events.forEach(event => map.set(event[key],(map.get(event[key])??0)+1));
  return [...map].map(([name,count]) => ({name,count})).sort((a,b) => b.count-a.count || a.name.localeCompare(b.name));
}
export function auditTimeline(events: AuditEvent[], from: number, to: number) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from>to) return [];
  const step = to-from<=86400000 ? 3600000 : Math.max(86400000,Math.ceil((to-from)/86400000/30)*86400000);
  const first = Math.floor(from/step)*step; const length = Math.floor((to-first)/step)+1;
  const buckets = Array.from({length:Math.min(length,750)},(_,index) => ({start:first+index*step,end:first+(index+1)*step,success:0,denied:0,failed:0,total:0}));
  for (const event of events) {
    const time = Date.parse(event.timestamp); if (time<from || time>to) continue;
    const bucket = buckets[Math.floor((time-first)/step)];
    if (bucket) { bucket.total++; if (event.outcome==="SUCCESS") bucket.success++; else if (event.outcome==="DENIED") bucket.denied++; else bucket.failed++; }
  }
  return buckets;
}
export function eventChanges(before: unknown, after: unknown): {field:string;before:string;after:string}[] {
  const flat = (value: unknown, prefix=""): Record<string,string> => {
    if (value && typeof value==="object" && !Array.isArray(value) && Object.keys(value).length) return Object.fromEntries(Object.entries(value).flatMap(([key,v]) => Object.entries(flat(v,prefix ? `${prefix}.${key}` : key))));
    return {[prefix || "$record"]:JSON.stringify(value) ?? "null"};
  };
  const a = flat(redact(before)); const b = flat(redact(after));
  return [...new Set([...Object.keys(a),...Object.keys(b)])].sort().filter(key => a[key]!==b[key]).map(key => ({field:key,before:a[key]??"[not present]",after:b[key]??"[not present]"}));
}
export function auditCsv(events: AuditEvent[], notes: AuditJournal["notes"], manifest: Record<string,unknown> = {}) {
  const rows: (string|number)[][] = [["Event ID","Timestamp UTC","Source","Domain","Category","Action","Severity","Outcome","Actor","Role","Target","Reason","Correlation ID","Request ID","Session ID","IP","Duration ms","Origin","Before (redacted)","After (redacted)","Investigation notes","Report manifest"],...events.map(e => [e.id,e.timestamp,e.source,e.domain,e.category,e.action,e.severity,e.outcome,e.actor,e.actorRole,e.target,e.reason,e.correlationId??"",e.requestId??"",e.sessionId??"",e.ip??"",e.durationMs??"",e.origin,JSON.stringify(redact(e.before)),JSON.stringify(redact(e.after)),notes.filter(n => n.eventId===e.id).map(n => `${n.timestamp} ${n.actor}: ${n.text}`).join("\n"),JSON.stringify(manifest)])];
  return "\uFEFF"+rows.map(row => row.map(value => `"${String(value).replace(/^[\s]*[=+\-@]/,"'$&").replaceAll('"','""')}"`).join(",")).join("\r\n");
}
const object = (v: unknown): v is Record<string,unknown> => typeof v==="object" && v!==null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v==="string";
const date = (v: unknown) => text(v) && Number.isFinite(Date.parse(v));
export function validEvent(v: unknown): v is AuditEvent {
  return object(v) && [v.id,v.action,v.actor,v.target,v.reason].every(text) && date(v.timestamp)
    && AUDIT_SOURCES.includes(v.source as never) && AUDIT_SEVERITIES.includes(v.severity as never) && AUDIT_OUTCOMES.includes(v.outcome as never)
    && ["PLATFORM","FIAT","CRYPTO","STOCK"].includes(String(v.domain)) && ["ACCESS","SECURITY","FINANCIAL","CONFIGURATION","COMPLIANCE","SYSTEM","DATA_ACCESS"].includes(String(v.category))
    && ["ADMIN","CLIENT","SYSTEM","UNKNOWN"].includes(String(v.actorRole)) && ["DEMO","LOCAL"].includes(String(v.origin))
    && [v.correlationId,v.requestId,v.sessionId,v.ip].every(item => item===null || text(item)) && (v.durationMs===null || typeof v.durationMs==="number" && Number.isFinite(v.durationMs) && v.durationMs>=0)
    && "before" in v && "after" in v;
}
export function validJournal(v: unknown): v is AuditJournal {
  return object(v) && Number.isInteger(v.revision) && Number(v.revision)>=0 && Array.isArray(v.events) && v.events.every(validEvent)
    && new Set(v.events.map(e => e.id)).size===v.events.length && Array.isArray(v.notes) && v.notes.every(n => object(n) && [n.id,n.eventId,n.actor,n.text].every(text) && date(n.timestamp))
    && new Set(v.notes.map(n => n.id)).size===v.notes.length;
}
export function mergeAudit(...sources: AuditEvent[][]): AuditEvent[] {
  const map = new Map<string,AuditEvent>();
  for (const events of sources) for (const event of events) if (validEvent(event)) map.set(event.id,{...event,before:redact(event.before),after:redact(event.after)});
  return [...map.values()].sort((a,b) => b.timestamp.localeCompare(a.timestamp) || a.id.localeCompare(b.id));
}
