/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain test harness. */
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {MOCK_AUDIT_EVENTS:events}=require('../app/lib/mock/admin/audit.ts');
const {emptyFilters,filterAudit,groupAudit,auditTimeline,eventChanges,auditCsv,redact,mergeAudit,validJournal}=require('../app/lib/audit/engine.ts');
const {cardAuditEvents,marketOrderEvents,riskAuditEvents,userAuditEvent}=require('../app/lib/audit/adapters.ts');
const {MOCK_CARD_ISSUING_STATE:cards}=require('../app/lib/mock/admin/card-issuing.ts');
const {initialLogs}=require('../app/lib/mock/admin/users.ts');
const {appendAuditEvent,appendAuditNote,AUDIT_STORAGE_KEY}=require('../app/lib/audit/store.ts');
const actor={email:'audit@admin.com',role:'admin'};
const draft={source:'USERS',category:'SECURITY',action:'TEST_CHANGE',target:'USR-123',reason:'Administrator confirmed a test operation.',before:{password:'dont-keep-this'},after:{status:'BLOCKED'}};

test('fixtures have valid unique IDs and deterministic UTC timestamps',()=>{
  assert.ok(validJournal({revision:0,events,notes:[]}));assert.equal(new Set(events.map(e=>e.id)).size,events.length);assert.equal(events[0].timestamp,'2026-10-09T12:00:00.000Z');
  assert.ok(events.every(e=>e.origin==='DEMO'));
});
test('combined filters and exact inclusive UTC boundaries match only selected events',()=>{
  const e=events[0];const base=emptyFilters();
  assert.equal(filterAudit(events,{...base,from:e.timestamp,to:e.timestamp}).length,1);
  const filtered=filterAudit(events,{...base,source:'IDENTITY',outcome:'DENIED',origin:'DEMO',actor:'unknown principal'});
  assert.ok(filtered.length>1);assert.ok(filtered.every(e=>e.source==='IDENTITY'&&e.outcome==='DENIED'));
  assert.equal(filterAudit(events,{...base,query:'DEMO-REQ-1 '}).length>0,true);
  assert.equal(filterAudit(events,{...base,query:'no matching phrase'}).length,0);
  assert.equal(filterAudit(events,{...base,from:'2026-10-10T00:00:00Z',to:'2026-10-01T00:00:00Z'}).length,0);
  assert.equal(filterAudit(events,{...base,from:'invalid date'}).length,0);
  assert.equal(filterAudit(events,{...base,correlationId:events[0].correlationId}).length,1);
});
test('statistics and chart buckets use the same filtered dataset and include zero intervals',()=>{
  const filtered=filterAudit(events,{...emptyFilters(),source:'RISK'});
  const groups=groupAudit(filtered,'outcome');assert.equal(groups.reduce((n,g)=>n+g.count,0),filtered.length);
  const from=Date.parse('2026-10-09T00:00:00Z');const to=Date.parse('2026-10-09T23:59:59Z');
  const buckets=auditTimeline(events,from,to);assert.equal(buckets.length,24);assert.ok(buckets.some(b=>b.total===0));
  assert.equal(buckets.reduce((n,b)=>n+b.total,0),filterAudit(events,{...emptyFilters(),from:new Date(from).toISOString(),to:new Date(to).toISOString()}).length);
  assert.deepEqual(auditTimeline(events,to,from),[]);
  assert.ok(auditTimeline(events,Date.parse('2020-01-01'),to).length<=32);
});
test('recursive redaction protects payload, nested arrays, card data and input immutability',()=>{
  const original={access_token:'secret-token',password:'secret-password',cardNumber:'4111111111111111',cvv:'123',nested:[{authorization:'bearer xyz',status:'ACTIVE'}],profile:{phone:'555',deliveryAddress:'private address'},last4:'1111'};
  const clean=redact(original);const json=JSON.stringify(clean);
  for(const secret of ['secret-token','secret-password','4111111111111111','bearer xyz','private address'])assert.ok(!json.includes(secret));
  assert.equal(clean.last4,'1111');assert.equal(clean.nested[0].status,'ACTIVE');assert.equal(original.password,'secret-password');
});
test('differences distinguish null, missing and real nested changes without revealing secrets',()=>{
  const differences=eventChanges({status:'ACTIVE',nested:{threshold:10},password:'old',removed:null},{status:'BLOCKED',nested:{threshold:12},password:'new',added:0});
  assert.ok(differences.some(d=>d.field==='nested.threshold'&&d.before==='10'&&d.after==='12'));
  assert.ok(differences.some(d=>d.field==='removed'&&d.before==='null'&&d.after==='[not present]'));
  assert.ok(!differences.some(d=>d.field==='password'));assert.deepEqual(eventChanges(null,null),[]);
});
test('adapters preserve provenance, absent metadata and risk domain without invented trace IDs',()=>{
  assert.ok(cardAuditEvents(cards.audit).every(e=>e.origin==='DEMO'));
  const local=cardAuditEvents([{...cards.audit[0],id:'CAU-random-uuid'}])[0];assert.equal(local.origin,'LOCAL');assert.equal(local.ip,null);assert.equal(local.correlationId,null);
  const legacy=userAuditEvent(initialLogs[0]);assert.ok(legacy.timestamp.endsWith('Z'));assert.equal(legacy.origin,'DEMO');
  const risk=riskAuditEvents([{id:'1',action:'POLICY',target:'CRYPTO',actor:actor.email,reason:'Test',timestamp:events[0].timestamp,before:null,after:{domain:'CRYPTO'}}])[0];assert.equal(risk.domain,'CRYPTO');
  const order=marketOrderEvents([{id:'swap-42-BUY',updatedAt:events[0].timestamp,domain:'CRYPTO',status:'FILLED',userEmail:'client@example.test',symbol:'BTC',side:'BUY',type:'MARKET',quantity:1,price:10,totalUsd:10,currency:'USD',note:'Filled'}])[0];assert.equal(order.correlationId,'swap-42');assert.equal(order.actorRole,'CLIENT');
});
test('merge deduplicates by namespaced event ID and sanitizes source payloads',()=>{
  const merged=mergeAudit(events,[{...events[0],after:{secret:'do-not-show'}}],[{...events[0],id:'source:other'}]);
  assert.equal(merged.length,events.length+1);assert.ok(!JSON.stringify(merged).includes('do-not-show'));
  assert.equal(mergeAudit([{...events[0],timestamp:'invalid'}]).length,0);
});
test('CSV exports supplied rows only, preserves quoted multiline text and neutralizes formulas',()=>{
  const e={...events[0],reason:'=SUM(1,2)',target:'  @formula',before:{password:'never-export'},after:{text:'quoted "value"\nnext'}};
  const csv=auditCsv([e],[{id:'note-1',eventId:e.id,actor:actor.email,timestamp:e.timestamp,text:'reviewed case'}],{sourceWarnings:['Incomplete provider feed']});
  assert.ok(csv.includes('Incomplete provider feed'));assert.ok(csv.includes("'=SUM(1,2)"));assert.ok(csv.includes("'  @formula"));assert.ok(!csv.includes('never-export'));assert.ok(csv.includes('reviewed case'));assert.ok(!csv.includes(events[1].id));
});
test('journal atomically saves notes with their own audit record and enforces administrator access',()=>{
  const values=new Map();global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  assert.throws(()=>appendAuditEvent(draft,{...actor,role:'client'}),/Administrator/);
  const event=appendAuditEvent(draft,actor);assert.ok(!values.get(AUDIT_STORAGE_KEY).includes('dont-keep-this'));
  const note=appendAuditNote(event.id,'Reviewed under case AUD-TEST-42.',actor);
  const state=JSON.parse(values.get(AUDIT_STORAGE_KEY));assert.equal(state.events.length,2);assert.equal(state.notes[0].id,note.id);assert.equal(state.events[0].action,'INVESTIGATION_NOTE_ADDED');assert.equal(state.revision,2);
  const saved=values.get(AUDIT_STORAGE_KEY);global.localStorage.setItem=()=>{throw new Error('quota')};
  assert.throws(()=>appendAuditNote(event.id,'Another valid review note.',actor),/No audit changes/);assert.equal(values.get(AUDIT_STORAGE_KEY),saved);
  values.set(AUDIT_STORAGE_KEY,'{broken');assert.throws(()=>appendAuditEvent(draft,actor));assert.equal(values.get(AUDIT_STORAGE_KEY),'{broken');
});
test('malformed journals and duplicate IDs are rejected',()=>{
  for(const value of [null,{}, {revision:-1,events:[],notes:[]},{revision:0,events:[events[0],events[0]],notes:[]},{revision:0,events:[],notes:[{id:'x'}]}])assert.equal(validJournal(value),false);
});

test('recent fixtures form coherent traces and multiword search is accent insensitive',()=>{
  const {AUDIT_RECENT_EVENTS:recent,AUDIT_RECENT_NOTES:notes}=require('../app/lib/audit/demo.ts');
  assert.ok(validJournal({revision:0,events:recent,notes}));assert.equal(recent.length,60);
  const trace=filterAudit(recent,{...emptyFilters(),correlationId:recent[0].correlationId});
  assert.equal(trace.length,4);assert.equal(new Set(trace.map(e=>e.target)).size,1);
  assert.equal(filterAudit([{...recent[0],actor:'Ștefan Dumitru'}],{...emptyFilters(),query:'stefan transfer dumitru'}).length,1);
  assert.equal(filterAudit([{...recent[0],timestamp:'2026-10-28T10:00:00+02:00'},{...recent[1],timestamp:'2026-10-28T08:30:00Z'}],emptyFilters())[0].id,recent[1].id);
});
test('annotation retries are atomic, revision protected and bound to their original author and text',()=>{
  const values=new Map();global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const event=appendAuditEvent(draft,actor,'access-idempotency');
  assert.ok(!values.get(AUDIT_STORAGE_KEY).includes('dont-keep-this'));
  assert.deepEqual(appendAuditEvent(draft,actor,'access-idempotency'),event);
  const first=appendAuditNote(event.id,'Reviewed evidence under CASE-2026-42.',actor,{key:'note-once',expectedRevision:1});
  assert.deepEqual(appendAuditNote(event.id,'Reviewed evidence under CASE-2026-42.',actor,{key:'note-once',expectedRevision:1}),first);
  assert.equal(JSON.parse(values.get(AUDIT_STORAGE_KEY)).notes.length,1);
  assert.throws(()=>appendAuditNote(event.id,'A changed note cannot reuse that key.',actor,{key:'note-once',expectedRevision:1}),/Idempotency/);
  assert.throws(()=>appendAuditNote(event.id,'A different note must use current revision.',actor,{key:'note-new',expectedRevision:1}),/changed/);
  assert.throws(()=>appendAuditEvent({...draft,reason:'Different audit reason'},actor,'access-idempotency'),/Idempotency/);
});
test('audit collection reads shared sources without migrating business journals and isolates corrupt sources',async()=>{
  const {collectDemoAudit}=require('../app/lib/audit/collector.ts');const local=new Map(),session=new Map([['mbank_transfers_v1:audit-observed%40example.test','[]']]);
  const oldWindow=global.window,oldSession=global.sessionStorage;
  global.window={dispatchEvent:()=>{}};global.localStorage={getItem:key=>local.get(key)??null,setItem:(key,value)=>local.set(key,value)};global.sessionStorage={getItem:key=>session.get(key)??null,setItem:(key,value)=>session.set(key,value),get length(){return session.size},key:i=>[...session.keys()][i]??null};
  try{
    const before=[...session.entries()],snapshot=await collectDemoAudit(actor);
    assert.ok(snapshot.events.length>100);assert.deepEqual([...session.entries()],before);assert.equal(local.size,0);
    local.set('mbank_risk_v1','{broken');const partial=await collectDemoAudit(actor);
    assert.equal(partial.health.find(h=>h.source==='RISK').status,'ERROR');assert.ok(partial.warnings.some(w=>w.startsWith('RISK:')));
    assert.ok(partial.events.filter(e=>e.source==='RISK').every(e=>e.origin==='DEMO'));assert.ok(partial.events.some(e=>e.source==='CARDS'));
    assert.equal(local.get('mbank_risk_v1'),'{broken');
  }finally{global.window=oldWindow;global.sessionStorage=oldSession;}
});
test('evidence exports keep the reviewed snapshot, exact checksum, provenance and redacted payloads',async()=>{
  const {buildAuditEvidence}=require('../app/lib/audit/evidence.ts'),{createHash}=require('node:crypto');
  const scope={events:[{...events[0],after:{password:'never-in-export',status:'ACTIVE'}}],notes:[],filters:emptyFilters(),sort:'NEWEST',displayTimeZone:'UTC',warnings:['Source feed incomplete'],as_of:'2026-10-28T07:00:00Z',mode:'demo',generatedAt:'2026-10-28T07:01:00Z',key:'report-once'};
  const report=await buildAuditEvidence(scope,'JSON','Compliance review CASE-1001.',actor.email),retry=await buildAuditEvidence(scope,'JSON','Compliance review CASE-1001.',actor.email);
  assert.deepEqual(retry,report);assert.equal(report.digest,createHash('sha256').update(report.content).digest('hex'));assert.ok(!report.content.includes('never-in-export'));
  const body=JSON.parse(report.content);assert.deepEqual(body.manifest.eventIds,[events[0].id]);assert.equal(body.manifest.demoRecords,1);assert.equal(body.manifest.sourceWarnings[0],scope.warnings[0]);
  assert.ok(!report.content.includes(events[1].id));
});
test('HTTP audit adapter never reads local sources and validates server evidence and export receipts',async()=>{
 const {createAuditRepository}=require('../app/lib/audit/repository.ts'),{parseAuditSnapshot}=require('../app/lib/audit/response.ts'),{AUDIT_SOURCES}=require('../app/lib/types/admin/audit.ts');
 const oldMode=process.env.NEXT_PUBLIC_AUDIT_MODE,oldFetch=global.fetch,oldLocal=global.localStorage;
 try{
  process.env.NEXT_PUBLIC_AUDIT_MODE='http';global.localStorage={getItem:()=>{throw new Error('must not read local')} };
  const snapshot={schema_version:1,mode:'live',complete:true,as_of:'2026-10-28T07:00:00Z',revision:4,events:[{...events[0],origin:'SERVER'}],notes:[],warnings:[],health:AUDIT_SOURCES.map(source=>({source,status:'CONNECTED',localCount:0,message:'Server source'}))};
  const calls=[];global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,status:200,json:async()=>snapshot};};
  const repo=createAuditRepository(actor),controller=new AbortController();assert.deepEqual(await repo.getSnapshot(controller.signal),snapshot);assert.equal(calls[0].init.signal,controller.signal);assert.equal(calls[0].init.credentials,'include');assert.equal(calls[0].init.cache,'no-store');
  global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,status:204};};await repo.recordAccess('access-http');assert.equal(JSON.parse(calls[1].init.body).actor,undefined);assert.equal(calls[1].init.headers['Idempotency-Key'],'access-http');
  const note={id:'note-server',eventId:events[0].id,actor:actor.email,text:'Reviewed source evidence CASE-100.',timestamp:snapshot.as_of};global.fetch=async()=>({ok:true,status:200,json:async()=>note});assert.deepEqual(await repo.addNote({event_id:events[0].id,text:note.text,expected_revision:4},'note-http'),note);
  assert.throws(()=>parseAuditSnapshot({...snapshot,events:[events[0]]}),/local or demo/);assert.throws(()=>parseAuditSnapshot({...snapshot,complete:false}),/incomplete/);assert.throws(()=>parseAuditSnapshot({...snapshot,events:[snapshot.events[0],snapshot.events[0]]}),/Duplicate/);
  const request={format:'JSON',reason:'Compliance evidence review.',generated_at:snapshot.as_of,name:'mbank-audit-2026-10-28.json',event_ids:[events[0].id],sha256:'a'.repeat(64),filters:emptyFilters(),sort:'NEWEST',display_time_zone:'UTC'};
  global.fetch=async()=>({ok:true,status:200,json:async()=>({id:'receipt-1',timestamp:snapshot.as_of,event_ids:request.event_ids,sha256:'b'.repeat(64)})});await assert.rejects(()=>repo.recordExport(request,'export-http'),/does not match/);
  global.fetch=async()=>{throw new Error('service offline')};await assert.rejects(()=>repo.getSnapshot(),/offline/);
 }finally{global.fetch=oldFetch;global.localStorage=oldLocal;if(oldMode===undefined)delete process.env.NEXT_PUBLIC_AUDIT_MODE;else process.env.NEXT_PUBLIC_AUDIT_MODE=oldMode;}
});

test('demo export audits exact IDs once and unknown annotations or altered receipts are rejected',async()=>{
 const {createAuditRepository}=require('../app/lib/audit/repository.ts');const values=new Map();global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const repo=createAuditRepository(actor);await repo.recordAccess('demo-console-access');await repo.recordAccess('demo-console-access');
 assert.equal(JSON.parse(values.get(AUDIT_STORAGE_KEY)).events.length,1);
 await assert.rejects(()=>repo.addNote({event_id:'unknown-event',text:'Unknown evidence must not be annotated.',expected_revision:1},'unknown-note'),/unavailable/);
 const request={format:'JSON',reason:'Compliance evidence review CASE-100.',generated_at:'2026-10-28T07:00:00Z',name:'mbank-audit-2026-10-28.json',event_ids:[events[0].id],sha256:'c'.repeat(64),filters:emptyFilters(),sort:'NEWEST',display_time_zone:'UTC'};
 const first=await repo.recordExport(request,'demo-export-once');assert.deepEqual(await repo.recordExport(request,'demo-export-once'),first);
 const state=JSON.parse(values.get(AUDIT_STORAGE_KEY));assert.equal(state.events.filter(e=>e.action==='EXPORT_REQUESTED').length,1);assert.deepEqual(state.events[0].after.event_ids,request.event_ids);
 await assert.rejects(()=>repo.recordExport({...request,event_ids:[events[1].id]},'demo-export-once'),/Idempotency/);
});
