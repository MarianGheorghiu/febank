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
  const { executeTrade, executeMarketAdmin }=require('../app/lib/markets/store.ts');
  const request={symbol:'AAPL',side:'BUY',quantity:1,type:'MARKET',expectedVersion:1,expectedRoutingVersion:1};
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
