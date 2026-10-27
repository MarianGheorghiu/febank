/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain test harness. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '..', request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const {buildControlSnapshot} = require('../app/lib/admin-control/engine.ts');
const {withDemoMonitoring} = require('../app/lib/admin-control/demo.ts');
const {parseControlSnapshot} = require('../app/lib/admin-control/response.ts');
const {createControlRepository} = require('../app/lib/admin-control/repository.ts');
const {initialWallet} = require('../app/lib/wallet/engine.ts');
const {MOCK_RISK_STATE} = require('../app/lib/mock/admin/risk.ts');
const {MOCK_MARKETS_STATE} = require('../app/lib/markets/seed.ts');
const {executeRiskCommand} = require('../app/lib/risk/store.ts');
const {createDemoTransferRepository} = require('../app/lib/transfers/repository.ts');
const {createOverviewRepository} = require('../app/lib/overview/repository.ts');
const {units} = require('../app/lib/transfers/engine.ts');
const now='2026-10-27T12:00:00.000Z';
const actor={email:'ops@admin.com',role:'admin'};
function report() {return buildControlSnapshot(structuredClone(MOCK_RISK_STATE), {...structuredClone(MOCK_MARKETS_STATE),orders:[]}, [initialWallet()], now);}
function browser() {
  const local=new Map(), session=new Map(), events=[];
  global.window={dispatchEvent:event=>events.push(event.type)};
  global.localStorage={getItem:key=>local.get(key)??null,setItem:(key,value)=>local.set(key,value)};
  global.sessionStorage={getItem:key=>session.get(key)??null,setItem:(key,value)=>session.set(key,value),key:i=>[...session.keys()][i],get length(){return session.size;}};
  return {local,session,events,close(){delete global.window;delete global.localStorage;delete global.sessionStorage;}};
}
test('global report uses exact holdings, open cases and exclusive 24h start; seed transfer history is excluded',()=>{
  const wallet=initialWallet(), base=wallet.transfers.transfers[0];
  wallet.transfers.transfers=[{...base,id:'trf-settled',kind:'fiat',status:'completed',value_usd:'0.10',updated_at:now},{...base,id:'trf-boundary',kind:'fiat',status:'completed',value_usd:'100.00',updated_at:'2026-10-26T12:00:00.000Z'},{...base,id:'trf-future',kind:'fiat',status:'completed',value_usd:'100.00',updated_at:'2026-10-27T12:00:00.001Z'},{...base,id:'seed-only',kind:'fiat',status:'completed',value_usd:'100.00',updated_at:now},{...base,id:'trf-pending',kind:'fiat',status:'pending',value_usd:'10.00',updated_at:now}];
  const value=buildControlSnapshot(MOCK_RISK_STATE,{...MOCK_MARKETS_STATE,orders:[]},[wallet],now);
  assert.equal(value.domains[0].volume_24h_usd,'0.10'); assert.equal(value.domains[0].pending_count,1);
  assert.equal(value.cases.length,5); assert.equal(value.cases[0].severity,'CRITICAL');
  assert.equal(value.customer_count,1); assert.deepEqual(parseControlSnapshot(JSON.parse(JSON.stringify(value))),value);
});
test('illustrative monitoring has stable nonempty charts and logs with totals matching the domain metrics',()=>{
  const value=withDemoMonitoring(report());
  assert.equal(value.telemetry.length,24); assert.equal(value.system_logs.length,8);
  assert.deepEqual(withDemoMonitoring(report()),value);
  for(const [domain,key] of [['FIAT','fiat_usd'],['CRYPTO','crypto_usd'],['STOCK','stock_usd']]) {
    const total=value.telemetry.reduce((sum,row)=>sum+units(row[key],2),0n);
    assert.equal(units(value.domains.find(d=>d.domain===domain).volume_24h_usd,2),total);
  }
  assert.equal(parseControlSnapshot(value).mode,'demo');
  for(const change of [v=>v.domains.pop(),v=>v.domains[0].available_usd='NaN',v=>v.telemetry[0].failed_requests=-1,v=>v.system_logs[0].occurred_at='broken',v=>v.cases[0].severity='unknown']) {
    const bad=structuredClone(value);change(bad);assert.throws(()=>parseControlSnapshot(bad),/Invalid/);
  }
});
test('policy stop blocks pre-existing transfer quotes and withdrawals before persistence; refunds and replay remain possible',async()=>{
  const env=browser();try {
    const customer='controls@example.test', transfers=createDemoTransferRepository(customer), overview=createOverviewRepository(customer);
    const draft={source_account_id:'account-USD',route_id:'route-USD',amount:'100',recipient_name:'Demo Recipient',destination:'DE89370400440532013000',reference:'Control test'};
    const quote=await transfers.quote(draft);
    const sent=await transfers.submit(quote.id,'control-transfer-1');
    const second=await transfers.quote(draft);
    executeRiskCommand({action:'POLICY',expectedRevision:0,reason:'Pause payments for incident review',policy:{...MOCK_RISK_STATE.policies[0],paused:true}},actor);
    const before=JSON.stringify([...env.session]);
    await assert.rejects(transfers.submit(second.id,'control-transfer-2'),/emergency stop/);
    await assert.rejects(overview.submitOperation({id:'blocked-withdraw',type:'withdraw',amount:'10.00'}),/emergency stop/);
    assert.equal(JSON.stringify([...env.session]),before);
    assert.deepEqual((await transfers.submit(quote.id,'control-transfer-1')).accounts,sent.accounts);
    await transfers.cancel(sent.transfers[0].id,'control-cancel-1');
    assert.equal((await overview.getSnapshot()).summary.liquidity,'142350.80');
    assert.ok(env.events.includes('mbank:risk-updated'));
    await createOverviewRepository('admin@admin.com').getSnapshot();
    const repo=createControlRepository(actor), state=await repo.getSnapshot();
    assert.equal(state.customer_count,1); // Administrator preference wallets are not customer holdings.
    assert.equal(state.domains[0].policy.paused,true);assert.ok(state.activity.some(a=>a.action==='POLICY'));
    await assert.rejects(repo.updatePolicy({expected_revision:0,reason:'A concurrent stale policy update',policy:state.domains[0].policy},'stale-key'),/changed/);
    env.local.set('mbank_risk_v1','{broken');
    await assert.rejects(repo.getSnapshot());await assert.rejects(transfers.submit(second.id,'blocked-corrupt'));
    assert.equal(env.local.get('mbank_risk_v1'),'{broken');
  }finally{env.close();}
});
test('caps and restrictions apply to canonical customer operations and leave journal unchanged on failure',async()=>{
  const env=browser();try{
    const customer='restricted@example.test', overview=createOverviewRepository(customer);
    await overview.getSnapshot();
    const risk=structuredClone(MOCK_RISK_STATE);risk.policies[0].maxTransactionUsd=5;
    env.local.set('mbank_risk_v1',JSON.stringify(risk));
    await assert.rejects(overview.submitOperation({id:'cap-denied',type:'withdraw',amount:'5.01'}),/transaction limit/);
    await overview.submitOperation({id:'cap-allowed',type:'withdraw',amount:'5.00'});
    executeRiskCommand({action:'FREEZE',email:customer,expectedRevision:0,reason:'Review account takeover evidence'},actor);
    await assert.rejects(overview.submitOperation({id:'freeze-denied',type:'withdraw',amount:'1.00'}),/restricted/);
    assert.equal((await overview.getSnapshot()).summary.liquidity,'142345.80');
  }finally{env.close();}
});
test('Go adapter uses authenticated transport, revision and idempotency; rejects malformed live data without fallback',async()=>{
  const original=global.fetch, previous=process.env.NEXT_PUBLIC_ADMIN_CONTROL_MODE, calls=[];
  process.env.NEXT_PUBLIC_ADMIN_CONTROL_MODE='http';
  const live={...withDemoMonitoring(report()),mode:'live'};
  global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>live};};
  try{
    const repo=createControlRepository(actor);assert.equal((await repo.getSnapshot()).mode,'live');
    const command={expected_revision:2,reason:'Document incident response controls',policy:live.domains[0].policy};
    await repo.updatePolicy(command,'policy-key-123');
    assert.equal(calls[1].url,'/v1/admin/control/policies/fiat');assert.equal(calls[1].init.method,'PUT');
    assert.equal(calls[1].init.headers['Idempotency-Key'],'policy-key-123');assert.equal(calls[1].init.credentials,'include');
    assert.deepEqual(JSON.parse(calls[1].init.body),command);
    global.fetch=async()=>({ok:true,json:async()=>({schema_version:2})});await assert.rejects(repo.getSnapshot(),/Invalid/);
    global.fetch=async()=>({ok:false,status:403});await assert.rejects(repo.getSnapshot(),/403/);
    await assert.rejects(createControlRepository({email:'client@example.test',role:'client'}).getSnapshot(),/Administrator/);
  }finally{global.fetch=original;if(previous===undefined)delete process.env.NEXT_PUBLIC_ADMIN_CONTROL_MODE;else process.env.NEXT_PUBLIC_ADMIN_CONTROL_MODE=previous;}
});
