import { AUDIT_SOURCES } from '../types/admin/audit';
import type { AuditNote } from '../types/admin/audit';
import type { AuditReceipt, AuditSnapshot } from './contracts';
import { redact, validEvent } from './engine';
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export const auditTimestamp=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v));
export function parseAuditNote(v:unknown):AuditNote{if(!obj(v)||!['id','eventId','actor','text'].every(k=>typeof v[k]==='string'&&!!v[k])||!auditTimestamp(v.timestamp)||String(v.text).length>500)throw new Error('Invalid audit annotation.');return v as unknown as AuditNote;}
export function parseAuditSnapshot(value:unknown):AuditSnapshot{
 if(!obj(value)||value.schema_version!==1||!['demo','live'].includes(String(value.mode))||value.complete!==true||!auditTimestamp(value.as_of)||!Number.isSafeInteger(value.revision)||Number(value.revision)<0||!Array.isArray(value.events)||!value.events.every(validEvent)||!Array.isArray(value.notes)||!Array.isArray(value.health)||!Array.isArray(value.warnings)||!value.warnings.every(w=>typeof w==='string'))throw new Error('Invalid or incomplete audit snapshot.');
 const s=value as unknown as AuditSnapshot;
 if(new Set(s.events.map(e=>e.id)).size!==s.events.length||new Set(s.notes.map(n=>n.id)).size!==s.notes.length)throw new Error('Duplicate audit evidence identifiers.');
 s.notes.forEach(parseAuditNote);
 if(s.health.length!==AUDIT_SOURCES.length||new Set(s.health.map(h=>h?.source)).size!==AUDIT_SOURCES.length||!s.health.every(h=>h&&AUDIT_SOURCES.includes(h.source)&&['CONNECTED','DEMO_ONLY','ERROR'].includes(h.status)&&Number.isSafeInteger(h.localCount)&&h.localCount>=0&&typeof h.message==='string'&&(h.totalCount===undefined||Number.isSafeInteger(h.totalCount)&&h.totalCount>=h.localCount)&&(h.latestAt==null||auditTimestamp(h.latestAt))))throw new Error('Invalid audit source coverage.');
 if(s.mode==='live'&&(s.events.some(e=>e.origin!=='SERVER')||s.health.some(h=>h.status==='DEMO_ONLY')))throw new Error('Live audit service cannot return local or demo evidence.');
 return {...s,events:s.events.map(e=>({...e,before:redact(e.before),after:redact(e.after)}))};
}
export function parseAuditReceipt(value:unknown):AuditReceipt{
 if(!obj(value)||typeof value.id!=='string'||!value.id||!auditTimestamp(value.timestamp)||!Array.isArray(value.event_ids)||!value.event_ids.length||!value.event_ids.every(id=>typeof id==='string')||new Set(value.event_ids).size!==value.event_ids.length||typeof value.sha256!=='string'||! /^[a-f0-9]{64}$/.test(value.sha256))throw new Error('Invalid export audit receipt.');return value as unknown as AuditReceipt;
}
