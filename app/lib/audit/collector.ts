import type { AuditActor, AuditEvent, AuditSource } from '../types/admin/audit';
import { AUDIT_SOURCES } from '../types/admin/audit';
import { mergeAudit } from './engine';
import { cardAuditEvents, marketAuditEvents, marketOrderEvents, riskAuditEvents, userAuditEvent } from './adapters';
import { MOCK_AUDIT_EVENTS } from '../mock/admin/audit';
import { initialLogs } from '../mock/admin/users';
import { AUDIT_RECENT_EVENTS, AUDIT_RECENT_NOTES } from './demo';
import type { AuditSnapshot } from './contracts';
/** Read source authorities independently. Opening audit never seeds wallets or business fixtures. */
export async function collectDemoAudit(actor:AuditActor):Promise<AuditSnapshot>{
 const readers:{source:AuditSource;read:()=>Promise<AuditEvent[]>;message:string}[]=[
  {source:'USERS',read:async()=>{const {readManagedUsers}=await import('../user-management/store');return [...readManagedUsers().audit,...initialLogs.map(e=>userAuditEvent(e))];},message:'Shared user-management decisions and separately marked legacy samples.'},
  {source:'RATES',read:async()=>{const {createRatesRepository}=await import('../rates/repository');const s=await createRatesRepository(actor).getSnapshot();return s.audit;},message:'Shared pricing proposals, releases and approvals.'},
  {source:'CARDS',read:async()=>{const {createIssuingRepository}=await import('../card-issuing/repository');const s=await createIssuingRepository({...actor,name:actor.email}).getSnapshot();return cardAuditEvents(s.audit).map(e=>s.mode==='live'?{...e,origin:'SERVER'}:e);},message:'Shared issuing and customer card control history.'},
  {source:'MARKETS',read:async()=>{const mode=process.env.NEXT_PUBLIC_TRANSFERS_MODE??'demo';if(mode!=='demo'){const {createMarketOperationsRepository}=await import('../markets/repository');const s=await createMarketOperationsRepository(actor).getSnapshot();return [...marketAuditEvents(s.state.audit),...marketOrderEvents(s.state.orders)].map(e=>({...e,origin:'SERVER'}));}const store=await import('../markets/store');const s=store.readBaseMarketCatalog();const {walletCustomers,readWalletForAudit}=await import('../wallet/store');const views=walletCustomers().map(email=>readWalletForAudit(email).state.trading);return [...marketAuditEvents([...s.audit,...views.flatMap(v=>v.audit)]),...marketOrderEvents([...s.orders,...views.flatMap(v=>v.orders)])];},message:'Administrative history and latest order snapshots; snapshots are not a complete lifecycle.'},
  {source:'RISK',read:async()=>{const mode=process.env.NEXT_PUBLIC_RISK_MODE??process.env.NEXT_PUBLIC_TRANSFERS_MODE??'demo';if(mode!=='demo'){const {createRiskRepository}=await import('../risk/repository');const s=await createRiskRepository(actor).getSnapshot();return riskAuditEvents(s.state.audit).map(e=>({...e,origin:'SERVER'}));}const {readRiskForExecution}=await import('../risk/store');return riskAuditEvents(readRiskForExecution().audit);},message:'Shared risk policies, investigation decisions, restrictions and release approvals.'},
  {source:'TRANSACTIONS',read:async()=>{if((process.env.NEXT_PUBLIC_TRANSFERS_MODE??'demo')!=='demo')throw new Error('Use the central audit service for server transfer evidence.');const {readTransactionAudit}=await import('../transactions/audit');return readTransactionAudit();},message:'Observed shared-wallet transfer overrides; full provider and transfer lifecycle feeds are not connected.'},
  {source:'SUBSCRIPTIONS',read:async()=>{const {mockSubscriptionsRepository}=await import('../subscriptions/store');return (await mockSubscriptionsRepository.list()).audit;},message:'Shared subscription decisions and related journal exports.'},
  {source:'SYSTEM',read:async()=>{const {mockConfigRepository}=await import('../flags-config/repository');const {configAuditEvents}=await import('../flags-config/audit');return configAuditEvents(await mockConfigRepository.getSnapshot());},message:'Shared configuration releases and local health acknowledgements; no provider telemetry.'},
  {source:'AUDIT',read:async()=>{const {readAuditJournal}=await import('./store');return readAuditJournal().events;},message:'Console access, evidence exports and append-only investigation annotations.'},
 ];
 const results=await Promise.allSettled(readers.map(r=>r.read()));
 const warnings:string[]=[],collected:AuditEvent[][]=[MOCK_AUDIT_EVENTS,AUDIT_RECENT_EVENTS];
 results.forEach((result,index)=>{if(result.status==='fulfilled')collected.push(result.value);else warnings.push(`${readers[index].source}: ${result.reason instanceof Error?result.reason.message:'Source unavailable.'}`);});
 const events=mergeAudit(...collected);
 const health=AUDIT_SOURCES.map(source=>{const index=readers.findIndex(r=>r.source===source),result=results[index];const error=result?.status==='rejected';const sourceEvents=events.filter(e=>e.source===source);const times=sourceEvents.map(e=>e.timestamp).sort((a,b)=>Date.parse(b)-Date.parse(a));return {source,status:error?'ERROR' as const:index<0?'DEMO_ONLY' as const:'CONNECTED' as const,localCount:sourceEvents.filter(e=>e.origin==='LOCAL').length,totalCount:sourceEvents.length,latestAt:times[0]??null,message:error?`${source} data could not be collected. Samples remain labelled DEMO.`:index<0?'Sample events only; no identity provider or dedicated collector connected.':readers[index].message};});
 let revision=0,notes=[...AUDIT_RECENT_NOTES];
 if(results[readers.findIndex(r=>r.source==='AUDIT')].status==='fulfilled'){const {readAuditJournal}=await import('./store');const journal=readAuditJournal();revision=journal.revision;notes=[...notes,...journal.notes];}
 return {schema_version:1,mode:'demo',as_of:new Date().toISOString(),complete:true,revision,events,notes,health,warnings};
}
