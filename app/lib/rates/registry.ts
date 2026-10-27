import type { RateRelease } from './contracts';
import type { AuditEvent } from '../types/admin/audit';
export function searchReleases(rows:RateRelease[],query:string,status:string){
  const q=query.trim().toLowerCase();
  return rows.filter(r=>(status==='ALL'||r.status===status)&&(!q||[r.id,`v${r.version}`,r.reason,r.maker,r.checker??'',r.origin].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id));
}
export function searchRateAudit(rows:AuditEvent[],query:string,action:string){
  const q=query.trim().toLowerCase();
  return rows.filter(r=>(action==='ALL'||r.action===action)&&(!q||[r.id,r.action,r.target,r.reason,r.actor,r.origin,r.correlationId??''].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.timestamp.localeCompare(a.timestamp)||b.id.localeCompare(a.id));
}
export function ratePage<T>(rows:T[],requested:number,size=8){
  const pages=Math.max(1,Math.ceil(rows.length/size)),page=Math.max(0,Math.min(Number.isInteger(requested)?requested:0,pages-1));
  return {rows:rows.slice(page*size,(page+1)*size),page,pages,total:rows.length,from:rows.length?page*size+1:0,to:Math.min((page+1)*size,rows.length)};
}
