/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain test harness. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request,...args) { return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args); };
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const { MOCK_RISK_STATE: seed } = require('../app/lib/mock/admin/risk.ts');
const { MOCK_MARKETS_STATE: marketSeed } = require('../app/lib/mock/admin/markets.ts');
const { applyRiskCommand: apply, screenOperation: screen, enforceMarketRisk: guard, csvRows } = require('../app/lib/risk/engine.ts');
const { submitTrade, applyMarketAdminCommand, exchangeAssets } = require('../app/lib/markets/engine.ts');
const { validRiskState, executeRiskCommand, RISK_STORAGE_KEY } = require('../app/lib/risk/store.ts');
const admin = { email: 'risk@admin.com', role: 'admin' };
const second = { email: 'reviewer@admin.com', role: 'admin' };
const client = { email: 'customer@example.test', role: 'client' };
const now = '2026-10-09T10:00:00Z'; const reason = 'Evidence reviewed under operational ticket RISK-101.';
let seq = 0;
const mutate = (state, command, actor=admin) => apply(state,{ expectedRevision:state.revision,reason,...command },actor,now,`risk-${++seq}`);
const input = { domain:'CRYPTO',email:client.email,amountUsd:1000,score:0,sanctionsMatch:false,kycVerified:true };
const trade = (state, extra={}) => submitTrade(state,{symbol:'AAPL',side:'BUY',quantity:1,type:'MARKET',expectedVersion:1,expectedRoutingVersion:1,...extra},client,now,`order-${++seq}`);

test('valid fixtures and policy invariants reject corrupt browser state',()=>{
  assert.ok(validRiskState(seed));
  for(const value of [null,{}, {...seed,revision:-1},{...seed,policies:[seed.policies[0],seed.policies[0],seed.policies[0]]},{...seed, cases:[{...seed.cases[0],score:Infinity}]},{...seed, restrictions:[{email:'broken'}]}]) assert.equal(validRiskState(value),false);
  assert.throws(()=>mutate(seed,{action:'POLICY',policy:{...seed.policies[0],reviewScore:95,blockScore:90}}),/Invalid policy/);
  assert.throws(()=>mutate(seed,{action:'POLICY',policy:{...seed.policies[0],maxTransactionUsd:NaN}}),/Invalid policy/);
});
test('role, audit reason and revision protect all mutations',()=>{
  const command={action:'ASSIGN',caseId:seed.cases[0].id};
  assert.throws(()=>mutate(seed,command,client),/Administrator/);
  assert.throws(()=>mutate(seed,{...command,reason:'x'}),/audit reason/);
  assert.throws(()=>mutate(seed,{...command,expectedRevision:99}),/data changed/);
});
test('investigation lifecycle retains evidence and audit without mutating the input',()=>{
  const original=structuredClone(seed); const caseId=seed.cases[0].id;
  assert.throws(()=>mutate(seed,{action:'RESOLVE',caseId,resolution:'FALSE_POSITIVE'}),/Assign/);
  let state=mutate(seed,{action:'ASSIGN',caseId});
  assert.equal(state.cases[0].status,'INVESTIGATING'); assert.equal(state.cases[0].owner,admin.email);
  state=mutate(state,{action:'ESCALATE',caseId});
  state=mutate(state,{action:'NOTE',caseId});
  state=mutate(state,{action:'RESOLVE',caseId,resolution:'CONFIRMED'});
  assert.equal(state.cases[0].status,'RESOLVED'); assert.equal(state.cases[0].notes.length,4);
  assert.equal(state.audit[3].after.status,'INVESTIGATING'); assert.equal(state.audit[3].after.notes.length,1);
  assert.equal(state.audit[0].before.status,'ESCALATED'); assert.equal(state.audit[0].after.status,'RESOLVED');
  assert.deepEqual(seed,original); assert.throws(()=>mutate(state,{action:'NOTE',caseId}),/read-only/);
  assert.ok(validRiskState(state));
});
test('email restrictions and release enforce two distinct administrators',()=>{
  let state=mutate(seed,{action:'FREEZE',email:'CUSTOMER@example.test'});
  assert.equal(screen(state,input).decision,'BLOCK');
  assert.throws(()=>mutate(state,{action:'FREEZE',email:client.email}),/already restricted/);
  assert.throws(()=>mutate(state,{action:'APPROVE_RELEASE',email:client.email},second),/different administrator/);
  state=mutate(state,{action:'REQUEST_RELEASE',email:client.email});
  assert.throws(()=>mutate(state,{action:'APPROVE_RELEASE',email:client.email}),/different administrator/);
  state=mutate(state,{action:'APPROVE_RELEASE',email:client.email},second);
  assert.equal(state.restrictions.length,0); assert.equal(screen(state,input).decision,'ALLOW');
});
test('case resolution never releases an account restriction',()=>{
  const item=seed.cases[0]; let state=mutate(seed,{action:'FREEZE',email:item.email});
  state=mutate(state,{action:'ASSIGN',caseId:item.id});
  state=mutate(state,{action:'RESOLVE',caseId:item.id,resolution:'FALSE_POSITIVE'});
  assert.equal(state.restrictions[0].email,item.email);
});
test('screening decisions cover scores, KYC, sanctions, domain stop and amount boundaries',()=>{
  assert.equal(screen(seed,input).decision,'ALLOW');
  assert.equal(screen(seed,{...input,score:60}).decision,'REVIEW');
  assert.equal(screen(seed,{...input,score:85}).decision,'BLOCK');
  assert.equal(screen(seed,{...input,kycVerified:false}).decision,'BLOCK');
  assert.equal(screen(seed,{...input,sanctionsMatch:true}).decision,'BLOCK');
  assert.equal(screen(seed,{...input,amountUsd:25000}).decision,'ALLOW');
  assert.equal(screen(seed,{...input,amountUsd:25000.01}).decision,'BLOCK');
  for(const amountUsd of [0,-1,NaN,Infinity]) assert.throws(()=>screen(seed,{...input,amountUsd}),/valid customer/);
  const policy=seed.policies[0];const state=mutate(seed,{action:'POLICY',policy:{...policy,paused:true}});
  assert.equal(screen(state,{...input,domain:'FIAT'}).decision,'BLOCK');
  assert.equal(screen(state,input).decision,'ALLOW');
});
test('manual cases deduplicate active references and preserve screening evidence',()=>{
  const command={action:'CREATE_CASE',domain:'FIAT',email:client.email,reference:'TX-RISK-1',amountUsd:6000,score:90,signals:['Simulated identity mismatch']};
  const state=mutate(seed,command);assert.equal(state.cases[0].severity,'CRITICAL');assert.equal(state.cases[0].dueAt,'2026-10-09T12:00:00.000Z');
  assert.deepEqual(state.cases[0].evidence,command.signals);assert.throws(()=>mutate(state,command),/already exists/);
});
test('market guards block new and queued orders while leaving cancellation available',()=>{
  const risk=mutate(seed,{action:'FREEZE',email:client.email});
  const next=trade(marketSeed);assert.throws(()=>guard(risk,marketSeed,next),/Account is restricted/);
  const pending=trade(marketSeed,{type:'LIMIT',targetPrice:200});assert.throws(()=>guard(risk,marketSeed,pending),/restricted/);
  const filled=applyMarketAdminCommand(pending,{action:'PROCESS',domain:'STOCK',reason},admin,now,'process');
  assert.throws(()=>guard(risk,pending,filled),/restricted/);
  const cancelled=applyMarketAdminCommand(pending,{action:'CANCEL',orderId:pending.orders[0].id,reason},admin,now,'cancel');
  assert.doesNotThrow(()=>guard(risk,pending,cancelled));
  const policy=seed.policies.find(p=>p.domain==='STOCK');
  const capped=mutate(seed,{action:'POLICY',policy:{...policy,maxTransactionUsd:100}});
  assert.throws(()=>guard(capped,marketSeed,next),/transaction limit/);
});
test('cross-domain swaps cannot bypass a destination emergency stop',()=>{
  const policy=seed.policies.find(p=>p.domain==='STOCK');const risk=mutate(seed,{action:'POLICY',policy:{...policy,paused:true}});
  const next=exchangeAssets(marketSeed,'BTC','AAPL',0.001,0,client,now,'swap');
  assert.throws(()=>guard(risk,marketSeed,next),/emergency stop/);
});
test('shared stores block execution before persistence and fail closed on corrupt risk storage',()=>{
  const values=new Map();global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  executeRiskCommand({action:'FREEZE',email:client.email,expectedRevision:0,reason},admin);
  const { executeTrade, executeMarketAdmin, readMarketCatalog }=require('../app/lib/markets/store.ts');
  // Customer reviews include the published pricing context in instrument versions.
  const catalog=readMarketCatalog(client.email),item=catalog.instruments.find(i=>i.symbol==='AAPL');
  const request={symbol:'AAPL',side:'BUY',quantity:1,type:'MARKET',expectedVersion:item.version,expectedRoutingVersion:catalog.routing.STOCK.version};
  assert.throws(()=>executeTrade(request,client),/Risk Control/);assert.equal(values.has('mbank_markets_v1'),false);
  values.set(RISK_STORAGE_KEY,'{broken');assert.throws(()=>executeTrade(request,client));assert.equal(values.has('mbank_markets_v1'),false);
  assert.throws(()=>executeRiskCommand({action:'FREEZE',email:'other@example.test',expectedRevision:0,reason},admin));
  values.delete(RISK_STORAGE_KEY);const saved=executeTrade({...request,type:'LIMIT',targetPrice:200},client);
  executeRiskCommand({action:'FREEZE',email:client.email,expectedRevision:0,reason},admin);
  const before=values.get('mbank_markets_v1');assert.throws(()=>executeMarketAdmin({action:'PROCESS',domain:'STOCK',reason},admin),/Risk Control/);assert.equal(values.get('mbank_markets_v1'),before);
  assert.equal(saved.orders[0].status,'PENDING');
  values.delete(RISK_STORAGE_KEY);global.localStorage.setItem=()=>{throw new Error('quota')};
  assert.throws(()=>executeRiskCommand({action:'FREEZE',email:client.email,expectedRevision:0,reason},admin),/No changes/);
});
test('CSV quotes values and neutralizes spreadsheet formulas',()=>{
  const csv=csvRows([['=1+1','  @SUM(A1)','quoted "value"','line\nbreak']]);
  assert.ok(csv.includes("'=1+1"));assert.ok(csv.includes("'  @SUM(A1)"));assert.ok(csv.includes('"quoted ""value"""'));
});

test('risk command receipts replay once, bind the actor/payload and persist atomically',()=>{
  const values=new Map();global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const command={action:'FREEZE',email:client.email,expectedRevision:0,reason};
  const first=executeRiskCommand(command,admin,{key:'risk-once'});
  assert.deepEqual(executeRiskCommand(command,admin,{key:'risk-once'}),first);
  assert.equal(first.audit.length,1);assert.equal(first.restrictions.length,1);
  assert.throws(()=>executeRiskCommand({...command,email:'other@example.test'},admin,{key:'risk-once'}),/Idempotency/);
  assert.throws(()=>executeRiskCommand(command,second,{key:'risk-once'}),/Idempotency/);
  assert.throws(()=>executeRiskCommand(command,client,{key:'risk-once'}),/Administrator/);
  const raw=values.get(RISK_STORAGE_KEY);global.localStorage.setItem=()=>{throw new Error('quota')};
  assert.throws(()=>executeRiskCommand({action:'NOTE',caseId:seed.cases[0].id,reason,expectedRevision:first.revision},admin,{key:'risk-failed'}),/No changes/);
  assert.equal(values.get(RISK_STORAGE_KEY),raw);
});
test('additive risk fixtures preserve operator edits and never resurrect released restrictions',()=>{
  const {enrichRiskDemo}=require('../app/lib/risk/demo.ts');
  const source=structuredClone(seed);source.cases[0].notes.push({actor:admin.email,text:reason,timestamp:now});
  const enriched=enrichRiskDemo(source);assert.ok(validRiskState(enriched));
  assert.equal(enriched.cases.length,source.cases.length+12);assert.equal(enriched.restrictions.length,3);
  assert.equal(enriched.cases[0].notes[0].text,reason);assert.equal(source.restrictions.length,0);
  let released=mutate(enriched,{action:'APPROVE_RELEASE',email:'risk-demo-5@example.test'},admin);
  assert.equal(released.restrictions.length,2);assert.strictEqual(enrichRiskDemo(released),released);
  assert.ok(released.audit.some(a=>a.action==='RESOLVE'&&a.id.startsWith('RISK-SEED-')));
});
test('rejecting release preserves the restriction; exports capture exact scope and stale revisions fail',()=>{
  let state=mutate(seed,{action:'FREEZE',email:client.email});
  state=mutate(state,{action:'REQUEST_RELEASE',email:client.email});
  state=mutate(state,{action:'REJECT_RELEASE',email:client.email},second);
  assert.equal(state.restrictions[0].releaseRequestedBy,null);assert.equal(screen(state,input).decision,'BLOCK');
  assert.throws(()=>mutate(state,{action:'APPROVE_RELEASE',email:client.email},second),/different administrator/);
  assert.throws(()=>mutate(state,{action:'REJECT_RELEASE',email:client.email}),/No release/);
  const exportState=mutate(state,{action:'EXPORT',kind:'cases',recordIds:[seed.cases[0].id]});
  assert.deepEqual(exportState.audit[0].after.recordIds,[seed.cases[0].id]);
  assert.deepEqual(exportState.cases,state.cases);assert.deepEqual(exportState.restrictions,state.restrictions);
  assert.throws(()=>mutate(exportState,{action:'EXPORT',kind:'cases',recordIds:['missing']}),/scope/);
  assert.throws(()=>mutate(exportState,{action:'EXPORT',kind:'audit',recordIds:[state.audit[0].id,state.audit[0].id]}),/scope/);
  assert.throws(()=>mutate(exportState,{action:'NOTE',caseId:seed.cases[0].id,expectedRevision:state.revision}),/data changed/);
});
test('malformed operations and corrupt receipts cannot produce partial decisions',()=>{
  assert.throws(()=>mutate(seed,{action:'BOGUS',caseId:seed.cases[0].id}),/Unknown/);
  assert.throws(()=>mutate(seed,{action:'CREATE_CASE',domain:'FIAT',email:client.email,reference:'CHECK',amountUsd:1.001,score:70,signals:[]}),/valid customer/);
  assert.throws(()=>mutate(seed,{action:'CREATE_CASE',domain:'FIAT',email:client.email,reference:'CHECK',amountUsd:1,score:70,signals:[null]}),/signals/);
  assert.throws(()=>mutate(seed,{action:'POLICY',policy:{...seed.policies[0],reviewScore:60.5}}),/Invalid policy/);
  assert.throws(()=>screen(seed,{...input,kycVerified:'yes'}),/valid customer/);
  assert.equal(validRiskState({...seed,processedRequests:[{key:'x',payload:'a'},{key:'x',payload:'b'}]}),false);
  assert.equal(validRiskState({...seed,audit:[{id:'x',actor:admin.email,action:'NOTE',target:'case',reason,timestamp:'2026-10-28T10:00:00' }]}),false);
});
test('risk HTTP adapter uses decimal contracts, session credentials, revisions and no local fallback',async()=>{
  const {createRiskRepository}=require('../app/lib/risk/repository.ts');
  const {riskWire,decodeRiskSnapshot}=require('../app/lib/risk/response.ts');
  const oldMode=process.env.NEXT_PUBLIC_RISK_MODE,oldFetch=global.fetch;
  try{
    process.env.NEXT_PUBLIC_RISK_MODE='http';const calls=[];
    const snapshot={schema_version:1,mode:'live',as_of:now,state:structuredClone(seed),customers:[],exposures:[]};
    global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>riskWire(snapshot)};};
    const repo=createRiskRepository(admin),abort=new AbortController();
    const response=await repo.getSnapshot(abort.signal);assert.deepEqual(response,snapshot);
    assert.equal(calls[0].init.signal,abort.signal);assert.equal(calls[0].init.credentials,'include');assert.equal(calls[0].init.cache,'no-store');
    await repo.execute({action:'POLICY',policy:seed.policies[0],reason,expectedRevision:0},'risk-http');
    const request=calls[1],payload=JSON.parse(request.init.body);
    assert.equal(request.init.headers['Idempotency-Key'],'risk-http');assert.equal(payload.command.policy.maxTransactionUsd,'50000.00');assert.equal(payload.command.expectedRevision,0);assert.equal(payload.actor,undefined);
    assert.throws(()=>decodeRiskSnapshot({...riskWire(snapshot),state:seed}),/decimal strings/);
    assert.throws(()=>decodeRiskSnapshot({...riskWire(snapshot),state:{...riskWire(seed),processedRequests:[]}}),/local state/);
    global.fetch=async()=>({ok:true,json:async()=>({...riskWire(snapshot),mode:'demo'})});await assert.rejects(()=>repo.getSnapshot(),/live/);
    global.fetch=async()=>{throw new Error('offline')};await assert.rejects(()=>repo.getSnapshot(),/offline/);
    const {readRiskForExecution}=require('../app/lib/risk/store.ts');assert.throws(()=>readRiskForExecution(),/server-side/);
  }finally{global.fetch=oldFetch;if(oldMode===undefined)delete process.env.NEXT_PUBLIC_RISK_MODE;else process.env.NEXT_PUBLIC_RISK_MODE=oldMode;}
});

test('demo repository reads the global inventory and retains directory names after a manual case',async()=>{
  const {createRiskRepository}=require('../app/lib/risk/repository.ts');
  const values=new Map();global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const repo=createRiskRepository(admin),first=await repo.getSnapshot();
  assert.ok(first.exposures.some(e=>e.domain==='CRYPTO'&&e.source==='SHARED_INVENTORY'));
  assert.ok(first.exposures.some(e=>e.domain==='FIAT'&&e.source==='TREASURY_FIXTURE'));
  const result=await repo.execute({action:'CREATE_CASE',domain:'FIAT',email:'risk-demo-2@example.test',reference:'DEMO-MANUAL-DIRECTORY',amountUsd:1200,score:78,signals:[],reason,expectedRevision:first.state.revision},'directory-case');
  assert.equal(result.customers.find(c=>c.email==='risk-demo-2@example.test').name,'Ștefan Dumitru');
  assert.equal(result.state.cases.find(c=>c.reference==='DEMO-MANUAL-DIRECTORY').subject,'Ștefan Dumitru');
  assert.equal([...values.keys()].some(key=>key.startsWith('mbank_wallet')),false);
});


test('demo evidence and command signals remain immutable after later decisions',()=>{
  const {enrichRiskDemo}=require('../app/lib/risk/demo.ts');const enriched=enrichRiskDemo(seed);
  const sample=enriched.cases.find(c=>c.id==='RSK-DEMO-2002'),prior=structuredClone(enriched.audit);
  const next=mutate(enriched,{action:'NOTE',caseId:sample.id});
  assert.deepEqual(next.audit.slice(1),prior);
  const requested=mutate(enriched,{action:'REQUEST_RELEASE',email:'risk-demo-1@example.test'});
  assert.equal(requested.audit.find(a=>a.id==='RISK-SEED-FREEZE-0').after.releaseRequestedBy,null);
  const signals=['Documented test evidence'];const command={action:'CREATE_CASE',domain:'FIAT',email:client.email,reference:'IMMUTABLE-SIGNALS',amountUsd:120,score:65,signals};
  const created=mutate(seed,command);signals.push('Later external mutation');
  assert.deepEqual(created.cases[0].evidence,['Documented test evidence']);
});
