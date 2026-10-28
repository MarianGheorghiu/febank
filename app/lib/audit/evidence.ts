import type { AuditEvent, AuditFilters, AuditNote } from '../types/admin/audit';
import { auditCsv, redact } from './engine';
export interface AuditExportScope { events:AuditEvent[];notes:AuditNote[];filters:AuditFilters;sort:string;displayTimeZone:string;warnings:string[];as_of:string;mode:'demo'|'live';generatedAt:string;key:string }
export async function buildAuditEvidence(scope:AuditExportScope,format:'CSV'|'JSON',reason:string,actor:string){
 if(!scope.events.length||reason.trim().length<10||reason.trim().length>500)throw new Error('Export requires matching evidence and a reason of 10–500 characters.');
 const manifest={schemaVersion:1,generatedAt:scope.generatedAt,sourceSnapshotAt:scope.as_of,generatedBy:actor,reason:reason.trim(),records:scope.events.length,localRecords:scope.events.filter(e=>e.origin==='LOCAL').length,serverRecords:scope.events.filter(e=>e.origin==='SERVER').length,demoRecords:scope.events.filter(e=>e.origin==='DEMO').length,eventIds:scope.events.map(e=>e.id),filters:scope.filters,sort:scope.sort,displayTimeZone:scope.displayTimeZone,sourceWarnings:scope.warnings,scope:scope.mode==='demo'?'Shared browser demo evidence; mutable source snapshots are labelled.':'Central audit service evidence.',payloadRedaction:'Sensitive keys masked; free text must not contain secrets.'};
 const ids=new Set(scope.events.map(e=>e.id)),notes=scope.notes.filter(n=>ids.has(n.eventId));
 const content=format==='CSV'?auditCsv(scope.events,notes,manifest):JSON.stringify({manifest,events:scope.events.map(e=>redact(e)),notes},null,2);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(content)))).map(b=>b.toString(16).padStart(2,'0')).join('');
 return {content,digest,name:`mbank-audit-${scope.generatedAt.replace(/[:.]/g,'-')}.${format.toLowerCase()}`};
}
