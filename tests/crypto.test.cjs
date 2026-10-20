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
const {createCryptoRepository}=require('../app/lib/crypto/repository.ts');
const {parseCryptoSnapshot}=require('../app/lib/crypto/response.ts');
const {executeMarketAdmin,projectAllCustomers}=require('../app/lib/markets/store.ts');
const {MOCK_MARKETS_STATE}=require('../app/lib/markets/seed.ts');
const {cryptoOrdersCsv}=require('../app/lib/crypto/report.ts');
const customer='crypto-terminal@example.test';
const account=(snapshot,symbol)=>snapshot.accounts.find(a=>a.asset===symbol);

test('crypto buy, sell and swap use the same quote engine, wallet, chart, transfers, overview and admin orders',async()=>{
 const env=browser();try {
  const repo=createCryptoRepository(customer);const before=await repo.getSnapshot();parseCryptoSnapshot(before);
  assert.ok(before.wallet.history.length>=30);assert.equal(before.orders.length,0);
  const buy=await repo.exchange.quote({source:'USD',target:'BTC',amount:'100.00'});
  assert.ok(Date.parse(buy.expires_at)-Date.now()>299000);
  await repo.exchange.submit(buy.id,'crypto-buy-shared');
  let after=await repo.getSnapshot();
  assert.equal((Number(account(before.wallet,'USD').available)-Number(account(after.wallet,'USD').available)).toFixed(2),buy.debited);
  assert.equal((await createOverviewRepository(customer).getSnapshot()).summary.liquidity,account(after.wallet,'USD').available);
  assert.equal(account(await createDemoTransferRepository(customer).getSnapshot(),'BTC').available,account(after.wallet,'BTC').available);
  assert.equal(after.wallet.history.at(-1).crypto,(await createOverviewRepository(customer).getSnapshot()).summary.crypto_value);
  assert.equal(after.orders.length,1);assert.equal(after.orders[0].id,'crypto-buy-shared-BUY');
  assert.ok(projectAllCustomers(MOCK_MARKETS_STATE).orders.some(o=>o.id==='crypto-buy-shared-BUY'));
  await repo.exchange.submit(buy.id,'crypto-buy-shared');assert.equal((await repo.getSnapshot()).orders.length,1);
  const sell=await repo.exchange.quote({source:'BTC',target:'EUR',amount:'0.001'});await repo.exchange.submit(sell.id,'crypto-sell-eur');
  after=await repo.getSnapshot();assert.ok(Number(account(after.wallet,'EUR').available)>Number(account(before.wallet,'EUR').available));
  const swap=await repo.exchange.quote({source:'BTC',target:'ETH',amount:'0.001'});await repo.exchange.submit(swap.id,'crypto-swap-shared');
  after=await repo.getSnapshot();assert.equal(after.orders.length,4);assert.ok(Number(account(after.wallet,'ETH').available)>Number(account(before.wallet,'ETH').available));
  assert.equal(readWallet(customer).events.filter(e=>e.kind==='trading').length,3);
  assert.equal((await createCryptoRepository('other-customer@example.test').getSnapshot()).orders.length,0);
 }finally{env.close();}
});
test('admin prices, restrictions and liquidity are reflected in the crypto terminal and cannot be bypassed',async()=>{
 const env=browser();try {
  const repo=createCryptoRepository(customer);const admin={role:'admin',email:'operations@admin.com'};
  const btc=MOCK_MARKETS_STATE.instruments.find(i=>i.symbol==='BTC');
  executeMarketAdmin({action:'UPDATE',symbol:'BTC',expectedVersion:btc.version,reason:'Reprice BTC and restrict purchases during review.',values:{...btc,priceUsd:70000,status:'SELL_ONLY'}},admin);
  const snapshot=await repo.getSnapshot();const item=snapshot.market.find(i=>i.symbol==='BTC');
  assert.equal(item.price_usd,'70000.00000000');assert.equal(item.sparkline.at(-1),'70000.00000000');assert.equal(account(snapshot.wallet,'BTC').usd_price,'70000.00');
  assert.equal(item.can_buy,false);assert.equal(item.can_sell,true);assert.match(item.buy_restriction,/sell-only/);
  await assert.rejects(repo.exchange.quote({source:'USD',target:'BTC',amount:'100.00'}),/sell-only/);
  executeMarketAdmin({action:'ROUTING',domain:'CRYPTO',expectedVersion:1,status:'HALTED',reason:'Suspend crypto routing for scheduled maintenance.'},admin);
  const halted=await repo.getSnapshot();assert.ok(halted.market.every(i=>!i.can_buy&&!i.can_sell));
  await assert.rejects(repo.exchange.quote({source:'BTC',target:'USD',amount:'0.001'}),/suspended/);
  assert.equal(readWallet(customer).events.length,0);
 }finally{env.close();}
});
test('HTTP crypto data uses the Go service and shared exchange contract without customer identity or local fallback',async()=>{
 const env=browser();const oldFetch=global.fetch;const oldMode=process.env.NEXT_PUBLIC_TRANSFERS_MODE;const oldUrl=process.env.NEXT_PUBLIC_TRANSFERS_API_URL;
 try {
  const fixture=await createCryptoRepository(customer).getSnapshot();const calls=[];
  process.env.NEXT_PUBLIC_TRANSFERS_MODE='http';process.env.NEXT_PUBLIC_TRANSFERS_API_URL='https://go-bank.example/';
  global.fetch=async(url,init)=>{calls.push({url,init});return{ok:true,json:async()=>fixture};};
  const repo=createCryptoRepository('never-send-this-customer');await repo.getSnapshot();
  assert.equal(calls[0].url,'https://go-bank.example/v1/me/crypto');assert.equal(calls[0].init.credentials,'include');assert.equal(calls[0].init.cache,'no-store');assert.ok(!JSON.stringify(calls).includes('never-send-this-customer'));
  global.fetch=async()=>({ok:false,status:401,json:async()=>({error:{code:'unauthorized',message:'Authentication required'}})});
  await assert.rejects(repo.getSnapshot(),/Authentication required/);
  const bad=structuredClone(fixture);bad.market[0].price_usd=100;assert.throws(()=>parseCryptoSnapshot(bad),/field/);
  const duplicate=structuredClone(fixture);duplicate.market.push(duplicate.market[0]);assert.throws(()=>parseCryptoSnapshot(duplicate),/catalog/);
  const permission=structuredClone(fixture);permission.market[0].can_buy=false;permission.market[0].buy_restriction=null;assert.throws(()=>parseCryptoSnapshot(permission),/restriction/);
  const corrupt=structuredClone(fixture);corrupt.market[0].change_24h='NaN';assert.throws(()=>parseCryptoSnapshot(corrupt),/decimal/);
 }finally{global.fetch=oldFetch;if(oldMode===undefined)delete process.env.NEXT_PUBLIC_TRANSFERS_MODE;else process.env.NEXT_PUBLIC_TRANSFERS_MODE=oldMode;if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_TRANSFERS_API_URL;else process.env.NEXT_PUBLIC_TRANSFERS_API_URL=oldUrl;env.close();}
});
test('crypto reports preserve exact decimal amounts and escape formula injection',()=>{
 const csv=cryptoOrdersCsv([{id:'=SUM(1,2)',created_at:'2026-10-20T10:00:00.000Z',symbol:'BTC',side:'BUY',status:'FILLED',quantity:'0.00000001',price_usd:'94250.45000000',fee_usd:'0.01',total_usd:'1.00',settlement_currency:'USD'}]);
 assert.ok(csv.includes("'=SUM(1,2)"));assert.ok(csv.includes('0.00000001'));assert.ok(csv.includes('94250.45000000'));
});
