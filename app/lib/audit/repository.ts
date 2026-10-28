import type { AuditActor, AuditExportRequest, AuditRepository } from './contracts';
import { auditTimestamp, parseAuditNote, parseAuditReceipt, parseAuditSnapshot } from './response';
function exportRequest(request:AuditExportRequest){
 if(!['CSV','JSON'].includes(request.format)||typeof request.reason!=='string'||request.reason.trim().length<10||request.reason.trim().length>500||!auditTimestamp(request.generated_at)||!Array.isArray(request.event_ids)||!request.event_ids.length||request.event_ids.some(id=>typeof id!=='string'||!id)||new Set(request.event_ids).size!==request.event_ids.length||! /^[a-f0-9]{64}$/.test(request.sha256)||!/^mbank-audit-[\w.-]+\.(csv|json)$/.test(request.name)||!['NEWEST','OLDEST','SEVERITY'].includes(request.sort)||!['UTC','Europe/Bucharest'].includes(request.display_time_zone))throw new Error('Invalid audit evidence export request.');
}
export function createAuditRepository(actor:AuditActor):AuditRepository{
 if(actor.role!=='admin'||!actor.email.trim())throw new Error('Administrator access required.');
 const mode=process.env.NEXT_PUBLIC_AUDIT_MODE??process.env.NEXT_PUBLIC_TRANSFERS_MODE??'demo';
 if(mode==='demo')return {
  async getSnapshot(){const {collectDemoAudit}=await import('./collector');return parseAuditSnapshot(await collectDemoAudit(actor));},
  async recordAccess(key){const {appendAuditEvent}=await import('./store');appendAuditEvent({source:'AUDIT',category:'DATA_ACCESS',action:'AUDIT_CONSOLE_OPENED',target:'audit-registry',reason:'Administrator opened the audit evidence workspace.',before:null,after:null},actor,key);},
  async addNote(command,key){const snapshot=await this.getSnapshot();if(!snapshot.events.some(e=>e.id===command.event_id))throw new Error('Source event is unavailable. Refresh before annotating.');const {appendAuditNote}=await import('./store');return appendAuditNote(command.event_id,command.text,actor,{key,expectedRevision:command.expected_revision});},
  async recordExport(request,key){exportRequest(request);const snapshot=await this.getSnapshot();if(snapshot.health.some(h=>h.source==='AUDIT'&&h.status==='ERROR'))throw new Error('Audit journal unavailable. Export blocked.');const ids=new Set(snapshot.events.map(e=>e.id));if(request.event_ids.some(id=>!ids.has(id)))throw new Error('Evidence changed or is no longer available. Refresh and review the export scope.');const {appendAuditEvent}=await import('./store');const event=appendAuditEvent({source:'AUDIT',category:'DATA_ACCESS',action:'EXPORT_REQUESTED',severity:'WARNING',target:request.name,reason:request.reason,before:null,after:{...request,source_warnings:snapshot.warnings}},actor,key);return {id:event.id,timestamp:event.timestamp,event_ids:request.event_ids,sha256:request.sha256};},
 };
 if(mode!=='http')throw new Error('Unknown audit service mode.');
 const base=(process.env.NEXT_PUBLIC_AUDIT_API_URL??process.env.NEXT_PUBLIC_TRANSFERS_API_URL??'').replace(/\/$/,'');
 async function request(path:string,body?:unknown,key?:string,signal?:AbortSignal){
  if(body!==undefined&&!key?.trim())throw new Error('Idempotency key required.');
  const response=await fetch(`${base}/v1/admin/audit${path}`,{method:body===undefined?'GET':'POST',credentials:'include',cache:'no-store',signal,headers:{Accept:'application/json',...(body!==undefined?{'Content-Type':'application/json','Idempotency-Key':key!}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(error?.error?.message??`Audit service unavailable (${response.status}).`);}
  return response.status===204?null:response.json();
 }
 return {
  async getSnapshot(signal){const snapshot=parseAuditSnapshot(await request('',undefined,undefined,signal));if(snapshot.mode!=='live')throw new Error('Audit service must return live evidence.');return snapshot;},
  async recordAccess(key){await request('/access',{schema_version:1},key);},
  async addNote(command,key){return parseAuditNote(await request('/notes',{schema_version:1,...command},key));},
  async recordExport(body,key){exportRequest(body);const receipt=parseAuditReceipt(await request('/exports',{schema_version:1,...body},key));if(receipt.sha256!==body.sha256||receipt.event_ids.length!==body.event_ids.length||receipt.event_ids.some(id=>!body.event_ids.includes(id)))throw new Error('Export receipt does not match the reviewed evidence.');return receipt;},
 };
}
