/* eslint-disable @typescript-eslint/no-require-imports -- Shared wallet integration harness. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '..', request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const {createDemoTransferRepository} = require('../app/lib/transfers/repository.ts');
const {createOverviewRepository} = require('../app/lib/overview/repository.ts');
const {readWallet} = require('../app/lib/wallet/store.ts');
function browser() {
  const storage=new Map(); const events=[];
  global.window={dispatchEvent:event=>events.push(event.type)};
  global.localStorage={getItem:key=>storage.get(`local:${key}`)??null,setItem:(key,value)=>storage.set(`local:${key}`,value)};
  global.sessionStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),key:i=>[...storage.keys()][i],get length(){return storage.size;}};
  return {storage,events,close(){delete global.window;delete global.sessionStorage;delete global.localStorage;}};
}
const {createDemoCurrencyRepository}=require('../app/lib/currencies/demo.ts');
const {createHttpCurrencyRepository}=require('../app/lib/currencies/repository.ts');
const {parseCurrencySnapshot,parseCurrencyQuote}=require('../app/lib/currencies/response.ts');
const {MOCK_MARKETS_STATE}=require('../app/lib/markets/seed.ts');
const {executeMarketAdmin,projectAllCustomers}=require('../app/lib/markets/store.ts');
const customer='currencies@example.test';
const account=(snapshot,symbol)=>snapshot.accounts.find(a=>a.asset===symbol);

test('currency exchange updates overview, transfers, chart and admin from one journal; retry debits once',async()=>{
 const env=browser();try {
  const repo=createDemoCurrencyRepository(customer);
  const before=await repo.getSnapshot();assert.equal(before.history.length,30);parseCurrencySnapshot(before);
  const quote=await repo.quote({source:'USD',target:'AAPL',amount:'100'});parseCurrencyQuote(quote);
  const result=await repo.submit(quote.id,'currency-exchange-1');
  assert.equal((Number(account(before,'USD').available)-Number(account(result,'USD').available)).toFixed(2),quote.debited);
  assert.equal((Number(account(result,'AAPL').available)-Number(account(before,'AAPL').available)).toFixed(8),quote.received);
  assert.equal((await createOverviewRepository(customer).getSnapshot()).summary.liquidity,account(result,'USD').available);
  assert.equal(account(await createDemoTransferRepository(customer).getSnapshot(),'AAPL').available,account(result,'AAPL').available);
  assert.equal(result.history.length,31);assert.equal(result.history.at(-1).stock,(await createOverviewRepository(customer).getSnapshot()).summary.investments);
  assert.ok(projectAllCustomers(MOCK_MARKETS_STATE).orders.some(o=>o.id==='currency-exchange-1-BUY'));
  const saved=env.storage.get('mbank_wallet_v1:'+encodeURIComponent(customer));
  await repo.submit(quote.id,'currency-exchange-1');assert.equal(env.storage.get('mbank_wallet_v1:'+encodeURIComponent(customer)),saved);
 }finally{env.close();}
});
test('stale wallet, expired quote, insufficient funds and unsupported precision cannot mutate currencies',async()=>{
 const env=browser();try {
  const repo=createDemoCurrencyRepository(customer);
  const quote=await repo.quote({source:'EUR',target:'RON',amount:'108'});
  await createOverviewRepository(customer).submitOperation({id:'change-wallet',type:'deposit',amount:'1.00'});
  await assert.rejects(repo.submit(quote.id,'stale-currency-request'),/wallet changed/);
  const before=JSON.stringify(readWallet(customer).events);
  await assert.rejects(repo.quote({source:'USD',target:'EUR',amount:'999999999'}),/Insufficient/);
  for (const amount of ['-1','NaN','Infinity','1e2','1.001']) await assert.rejects(repo.quote({source:'EUR',target:'RON',amount}));
  assert.equal(JSON.stringify(readWallet(customer).events),before);
  const valid=await repo.quote({source:'USD',target:'EUR',amount:'100'});
  const now=Date.now;Date.now=()=>now()+299000;
  try {await repo.submit(valid.id,'within-five-minute-window');}finally{Date.now=now;}
  const expiring=await repo.quote({source:'USD',target:'EUR',amount:'100'});
  Date.now=()=>now()+300001;
  try {await assert.rejects(repo.submit(expiring.id,'expired-currency-request'),/expired/);}finally{Date.now=now;}
 }finally{env.close();}
});
test('whole-unit stocks show the actual debit and bank controls invalidate reviews',async()=>{
 const env=browser();try {
  const admin={role:'admin',email:'operations@admin.com'};
  const item=MOCK_MARKETS_STATE.instruments.find(i=>i.symbol==='AAPL');
  executeMarketAdmin({action:'UPDATE',symbol:'AAPL',expectedVersion:item.version,reason:'Require whole units for this instrument.',values:{...item,fractional:false}},admin);
  const repo=createDemoCurrencyRepository(customer);
  const quote=await repo.quote({source:'USD',target:'AAPL',amount:'1000'});
  assert.equal(Number(quote.received)%1,0);assert.ok(Number(quote.debited)<=1000);assert.ok(Number(quote.debited)>0);
  const result=await repo.submit(quote.id,'whole-stock-exchange');assert.equal(Number(account(result,'AAPL').available)%1,0);
  const next=await repo.quote({source:'BTC',target:'ETH',amount:'0.001'});
  executeMarketAdmin({action:'ROUTING',domain:'CRYPTO',expectedVersion:1,status:'HALTED',reason:'Suspend the crypto routing for maintenance.'},admin);
  await assert.rejects(repo.submit(next.id,'halted-exchange-request'),/changed/);
  await assert.rejects(repo.quote({source:'BTC',target:'ETH',amount:'0.001'}),/suspended/);
 }finally{env.close();}
});
test('two-leg quote matches execution including bridge remainder; failed storage is atomic',async()=>{
 const env=browser();try {
  const repo=createDemoCurrencyRepository(customer);const before=await repo.getSnapshot();
  const quote=await repo.quote({source:'BTC',target:'ETH',amount:'0.001'});
  const save=sessionStorage.setItem;sessionStorage.setItem=()=>{throw new Error('quota');};
  await assert.rejects(repo.submit(quote.id,'atomic-exchange-request'),/quota/);sessionStorage.setItem=save;
  assert.equal(readWallet(customer).events.length,0);
  const after=await repo.submit(quote.id,'atomic-exchange-request');
  assert.equal((Number(account(after,'ETH').available)-Number(account(before,'ETH').available)).toFixed(8),quote.received);
  assert.equal((Number(account(after,'USD').available)-Number(account(before,'USD').available)).toFixed(2),quote.remainder_usd);
 }finally{env.close();}
});
test('Go HTTP boundary preserves decimal strings, credentials and idempotency; rejects invalid payloads and auth failures',async()=>{
 const env=browser();const oldFetch=global.fetch;try {
  const demo=createDemoCurrencyRepository(customer);const snapshot=await demo.getSnapshot();const quote=await demo.quote({source:'EUR',target:'RON',amount:'108.00'});const calls=[];
  global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>url.endsWith('/quotes')?quote:snapshot};};
  const repo=createHttpCurrencyRepository('https://go-wallet.example/');
  await repo.getSnapshot();await repo.quote({source:'EUR',target:'RON',amount:'108.00'});await repo.submit(quote.id,'go-idempotency-request');
  assert.equal(calls[0].url,'https://go-wallet.example/v1/me/currencies');assert.equal(calls[0].init.credentials,'include');assert.equal(calls[0].init.cache,'no-store');
  assert.equal(JSON.parse(calls[1].init.body).amount,'108.00');assert.equal(calls[2].init.headers['Idempotency-Key'],'go-idempotency-request');assert.deepEqual(JSON.parse(calls[2].init.body),{quote_id:quote.id});assert.ok(!JSON.stringify(calls).includes(customer));
  for (const invalid of [{...snapshot,schema_version:2},{...snapshot,accounts:[{...snapshot.accounts[0],available:12}]},{...snapshot,assets:[{...snapshot.assets[0],status:'UNKNOWN'}]}]) assert.throws(()=>parseCurrencySnapshot(invalid));
  assert.throws(()=>parseCurrencyQuote({...quote,received:'NaN'}));
  global.fetch=async()=>({ok:false,status:401,json:async()=>({error:{code:'unauthorized',message:'Authentication required'}})});
  await assert.rejects(repo.getSnapshot(),/Authentication required/);
 }finally{global.fetch=oldFetch;env.close();}
});
test('rounded budget pricing is versioned so historical exchange events preserve their original replay',()=>{
 const {quantityForBudget,quoteTrade}=require('../app/lib/markets/engine.ts');
 const item={...MOCK_MARKETS_STATE.instruments.find(i=>i.symbol==='AAPL'),fractional:true,priceUsd:1.003,spreadBps:0,feeBps:50,minOrderUsd:0.01,maxOrderUsd:100000};
 let demonstrated=false;
 for(let cents=100;cents<500;cents++) {
  const budget=cents/100;
  const old=quantityForBudget(item,budget);
  const strict=quantityForBudget(item,budget,'USD',true);
  assert.ok(quoteTrade(item,'BUY',strict).cashAmount<=budget);
  if(quoteTrade(item,'BUY',old).cashAmount>budget) demonstrated=true;
 }
 assert.ok(demonstrated,'rounding regression must exercise a budget that previously overspent');
 assert.equal(quantityForBudget(item,Infinity,'USD',true),0);
});
