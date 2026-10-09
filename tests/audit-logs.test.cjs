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
  assert.equal(filterAudit(events,{...base,correlationId:events[0].correlationId}).length,3);
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
