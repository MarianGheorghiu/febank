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
const {createStocksRepository}=require('../app/lib/stocks/repository.ts');
const {parseStocksSnapshot,parseStockQuote}=require('../app/lib/stocks/response.ts');
const {executeMarketAdmin,projectAllCustomers}=require('../app/lib/markets/store.ts');
const {MOCK_MARKETS_STATE}=require('../app/lib/markets/seed.ts');
const {nextOccurrence,validDay}=require('../app/lib/stocks/plans.ts');
const {stocksCsv}=require('../app/lib/stocks/report.ts');
const {createDemoCurrencyRepository}=require('../app/lib/currencies/demo.ts');
const {commitWallet}=require('../app/lib/wallet/store.ts');
const customer='stocks-terminal@example.test';
const acc=(snapshot,symbol)=>snapshot.wallet.accounts.find(a=>a.asset===symbol);
const draft=(overrides={})=>({symbol:'NVDA',side:'BUY',type:'MARKET',quantity:'1',currency:'USD',target_price_usd:null,...overrides});
test('stock snapshots preserve all listings, periods, research, plans and announcements, with global quantities and cost basis',async()=>{
 const env=browser();try{
  const before=readWallet(customer).state;const repo=createStocksRepository(customer), snapshot=await repo.getSnapshot();parseStocksSnapshot(snapshot);
  assert.equal(snapshot.market.length,MOCK_MARKETS_STATE.instruments.filter(a=>a.domain==='STOCK').length);
  assert.deepEqual(snapshot.wallet.accounts,before.transfers.accounts);
  assert.equal(snapshot.holdings.find(a=>a.symbol==='NVDA').quantity,'30.00000000');
  assert.equal(snapshot.holdings.find(a=>a.symbol==='NVDA').average_cost_usd,'420.00000000');
  const state=readWallet(customer).state;assert.deepEqual(state.transfers.accounts,before.transfers.accounts);
  assert.equal(state.trading.cost_basis.NVDA,420);assert.equal(state.trading.orders.length,0);
  await repo.getSnapshot();assert.equal(readWallet(customer).events.filter(e=>e.kind==='cost_basis').length,1);
  for(const item of snapshot.market) for(const period of ['1D','1W','1M','1Y','ALL']){assert.equal(item.charts[period].at(-1).close,item.price_usd);assert.ok(item.charts[period].length>=2);}
  assert.equal(snapshot.market.find(i=>i.symbol==='NVDA').stats.length,6);assert.equal(snapshot.market.find(i=>i.symbol==='NVDA').news.length,3);
  assert.ok(snapshot.plans.some(p=>p.symbol==='BTC'&&p.frequency==='Bi-Weekly'));
  assert.equal(snapshot.dividends.length,4);assert.equal(snapshot.dividends.find(d=>d.symbol==='AAPL').eligible_quantity,'25.00000000');assert.ok(snapshot.dividends.every(d=>d.paid_amount_usd==='0.00'));
  assert.equal(snapshot.portfolio_history['ALL'].at(-1).value_usd,snapshot.holdings.reduce((sum,p)=>sum+Number(p.value_usd),0).toFixed(2));
 }finally{env.close();}
});
test('buy and sell settle once across stocks, currencies, overview, transfers and admin; EUR settlement remains global',async()=>{
 const env=browser();try{
  const repo=createStocksRepository(customer), before=await repo.getSnapshot(), quote=await repo.quote(draft());parseStockQuote(quote);
  assert.ok(Date.parse(quote.expires_at)-Date.now()>299000);
  const after=await repo.submit(quote.id,'stock-market-buy');assert.equal(after.orders.length,1);assert.equal(after.orders[0].status,'FILLED');
  assert.equal((Number(acc(before,'USD').available)-Number(acc(after,'USD').available)).toFixed(2),quote.settlement_amount);
  assert.equal(Number(acc(after,'NVDA').available),31);
  assert.equal((await createOverviewRepository(customer).getSnapshot()).summary.investments,after.holdings.reduce((sum,p)=>sum+Number(p.value_usd),0).toFixed(2));
  assert.equal((await createDemoTransferRepository(customer).getSnapshot()).accounts.find(a=>a.asset==='USD').available,acc(after,'USD').available);
  assert.equal((await createDemoCurrencyRepository(customer).getSnapshot()).accounts.find(a=>a.asset==='NVDA').available,acc(after,'NVDA').available);
  assert.ok(projectAllCustomers(MOCK_MARKETS_STATE).orders.some(o=>o.id==='stock-market-buy'));
  await repo.submit(quote.id,'stock-market-buy');assert.equal((await repo.getSnapshot()).orders.length,1);
  const sell=await repo.quote(draft({side:'SELL',currency:'EUR',quantity:'0.5'}));const sold=await repo.submit(sell.id,'stock-eur-sell');
  assert.equal((Number(acc(sold,'EUR').available)-Number(acc(after,'EUR').available)).toFixed(2),sell.settlement_amount);
  assert.equal(Number(acc(sold,'NVDA').available),30.5);
  assert.equal(sold.dividends.find(d=>d.symbol==='AAPL').eligible_quantity,'25.00000000');
  assert.equal((await createStocksRepository('another@example.test').getSnapshot()).orders.length,0);
 }finally{env.close();}
});
test('limit and stop orders reserve globally, cancellations release once, and admin can fill the same customer journal',async()=>{
 const env=browser();try{
  const repo=createStocksRepository(customer), before=await repo.getSnapshot();
  const quote=await repo.quote(draft({type:'LIMIT',target_price_usd:'800'}));let after=await repo.submit(quote.id,'stock-limit-buy');
  assert.equal(after.orders[0].status,'PENDING');assert.equal(acc(after,'USD').reserved,quote.settlement_amount);assert.equal(Number(acc(after,'NVDA').available),Number(acc(before,'NVDA').available));
  assert.equal(after.portfolio_history['ALL'].at(-1).value_usd,before.portfolio_history['ALL'].at(-1).value_usd);
  after=await repo.cancel('stock-limit-buy','stock-cancel-once');assert.equal(acc(after,'USD').reserved,'0.00');assert.equal(acc(after,'USD').available,acc(before,'USD').available);await repo.cancel('stock-limit-buy','stock-cancel-once');
  const sell=await repo.quote(draft({side:'SELL',type:'STOP',target_price_usd:'800',quantity:'2'}));after=await repo.submit(sell.id,'stock-stop-sell');assert.equal(acc(after,'NVDA').reserved,'2.00000000');assert.equal(acc(after,'NVDA').available,'28.00000000');
  const item=MOCK_MARKETS_STATE.instruments.find(i=>i.symbol==='NVDA');const actor={role:'admin',email:'operations@example.test'};
  executeMarketAdmin({action:'UPDATE',symbol:'NVDA',expectedVersion:item.version,reason:'Update execution price to trigger the stop order.',values:{...item,priceUsd:790}},actor);
  executeMarketAdmin({action:'PROCESS',domain:'STOCK',reason:'Process eligible stock orders after market update.'},actor);
  after=await repo.getSnapshot();assert.equal(after.orders.find(o=>o.id==='stock-stop-sell').status,'FILLED');assert.equal(acc(after,'NVDA').reserved,'0.00000000');assert.equal(acc(after,'NVDA').available,'28.00000000');
  assert.equal(after.market.find(i=>i.symbol==='NVDA').price_usd,'790.00000000');
 }finally{env.close();}
});
test('quotes reject stale balances, admin restrictions, bad precision and insufficient funds; existing average costs are never reset',async()=>{
 const env=browser();try{
  const repo=createStocksRepository(customer);await repo.getSnapshot();const quote=await repo.quote(draft());
  await createOverviewRepository(customer).submitOperation({id:'deposit-to-stale-stock',type:'deposit',amount:'10.00'});
  await assert.rejects(repo.submit(quote.id,'stock-stale-quote'),/changed/);
  await assert.rejects(repo.quote(draft({quantity:'0.000000001'})),/decimal places/);
  await assert.rejects(repo.quote(draft({quantity:'1000000000'})),/between|cash/);
  await assert.rejects(repo.quote(draft({symbol:'AAPL',side:'SELL',quantity:'26'})),/units/);
  const item=MOCK_MARKETS_STATE.instruments.find(i=>i.symbol==='NVDA');executeMarketAdmin({action:'UPDATE',symbol:'NVDA',expectedVersion:item.version,reason:'Restrict new purchases during instrument review.',values:{...item,status:'SELL_ONLY'}},{role:'admin',email:'ops@example.test'});
  assert.equal((await repo.getSnapshot()).market.find(i=>i.symbol==='NVDA').can_buy,false);await assert.rejects(repo.quote(draft()),/sell-only/);
  commitWallet(customer,{kind:'cost_basis',key:'preserve-cost-metadata',at:new Date().toISOString(),actor:{role:'client',email:customer},basis:{NVDA:'999.00'}});
  assert.equal(readWallet(customer).state.trading.cost_basis.NVDA,420);
 }finally{env.close();}
});
test('recurring investments persist per customer with optimistic versions and idempotency, without debiting cash on configuration',async()=>{
 const env=browser();try{
  const repo=createStocksRepository(customer), before=await repo.getSnapshot();const today=new Date().toISOString().slice(0,10);
  const command={type:'create_plan',draft:{symbol:'AAPL',amount_usd:'50.00',frequency:'Weekly',starts_on:today}};
  const created=await repo.execute(command,'stock-plan-create');assert.equal(created.plans.length,before.plans.length+1);assert.deepEqual(created.wallet.accounts,before.wallet.accounts);
  await repo.execute(command,'stock-plan-create');assert.equal((await createStocksRepository(customer).getSnapshot()).plans.length,4);
  const paused=await repo.execute({type:'set_plan_status',id:'stock-plan-create',expected_version:1,status:'PAUSED'},'stock-plan-pause');assert.equal(paused.plans[0].version,2);assert.equal(paused.plans[0].status,'PAUSED');
  await assert.rejects(repo.execute({type:'set_plan_status',id:'stock-plan-create',expected_version:1,status:'ACTIVE'},'stock-plan-conflict'),/changed/);
  const updated=await repo.execute({type:'update_plan',id:'stock-plan-create',expected_version:2,draft:{...command.draft,amount_usd:'75.00',frequency:'Monthly'}},'stock-plan-edit');assert.equal(updated.plans[0].amount_usd,'75.00');assert.equal(updated.plans[0].status,'PAUSED');
  assert.equal((await createStocksRepository('other-plans@example.test').getSnapshot()).plans.length,3);
  const corruptKey=`mbank_stock_plans_v1:${encodeURIComponent(customer)}`;env.storage.set(corruptKey,'broken');await assert.rejects(repo.getSnapshot(),/preserved/);assert.equal(env.storage.get(corruptKey),'broken');
 }finally{env.close();}
});
test('monthly schedules clamp the day without drifting, and date validation rejects impossible values',()=>{
 assert.equal(validDay('2026-99-99'),false);assert.equal(validDay('2026-02-30'),false);
 assert.equal(nextOccurrence('2026-01-31','Monthly','2026-02-01'),'2026-02-28');assert.equal(nextOccurrence('2026-01-31','Monthly','2026-03-01'),'2026-03-31');assert.equal(nextOccurrence('2026-10-01','Bi-Weekly','2026-10-20'),'2026-10-29');
});
test('HTTP adapter uses authenticated Go endpoints, decimal strings, versions and idempotency without local fallback',async()=>{
 const env=browser(), oldFetch=global.fetch, oldMode=process.env.NEXT_PUBLIC_TRANSFERS_MODE, oldUrl=process.env.NEXT_PUBLIC_TRANSFERS_API_URL;
 try{
  const local=createStocksRepository(customer), fixture=await local.getSnapshot(), quote=await local.quote(draft()),calls=[];
  process.env.NEXT_PUBLIC_TRANSFERS_MODE='http';process.env.NEXT_PUBLIC_TRANSFERS_API_URL='https://go-bank.example/';
  global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>url.endsWith('/quotes')?quote:fixture};};
  const repo=createStocksRepository('never-transmit-customer');await repo.getSnapshot();await repo.quote(draft());await repo.submit(quote.id,'go-order-submit');await repo.cancel('order/1','go-cancel-key');await repo.execute({type:'set_plan_status',id:'plan/1',expected_version:2,status:'PAUSED'},'go-plan-pause');
  assert.equal(calls[0].url,'https://go-bank.example/v1/me/stocks');assert.equal(calls[1].init.body,JSON.stringify(draft()));assert.equal(calls[2].init.headers['Idempotency-Key'],'go-order-submit');assert.ok(calls[3].url.endsWith('/orders/order%2F1/cancel'));assert.equal(calls[4].init.body,JSON.stringify({status:'PAUSED',expected_version:2}));assert.ok(calls.every(c=>c.init.credentials==='include'));assert.ok(!JSON.stringify(calls).includes('never-transmit-customer'));
  global.fetch=async()=>({ok:false,status:401,json:async()=>({error:{message:'Authentication required'}})});await assert.rejects(repo.getSnapshot(),/Authentication required/);
  for(const patch of [s=>s.market[0].price_usd=12,s=>s.market.push(s.market[0]),s=>s.market[0].charts['1D'][0].high='0',s=>s.holdings[0].reserved='99999',s=>s.plans[0].starts_on='2026-99-99']){const invalid=structuredClone(fixture);patch(invalid);assert.throws(()=>parseStocksSnapshot(invalid));}
 }finally{global.fetch=oldFetch;if(oldMode===undefined)delete process.env.NEXT_PUBLIC_TRANSFERS_MODE;else process.env.NEXT_PUBLIC_TRANSFERS_MODE=oldMode;if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_TRANSFERS_API_URL;else process.env.NEXT_PUBLIC_TRANSFERS_API_URL=oldUrl;env.close();}
});
test('stock report includes all financial records, preserves precision and neutralizes spreadsheet formulas',async()=>{
 const env=browser();try{const snapshot=await createStocksRepository(customer).getSnapshot();snapshot.holdings[0].name='=SUM(1,2)';snapshot.holdings[0].quantity='0.00000001';const report=stocksCsv(snapshot);assert.ok(report.includes("'=SUM(1,2)"));for(const section of ['POSITIONS','ORDERS','INVESTMENT PLANS','DIVIDENDS','0.00000001'])assert.ok(report.includes(section));}finally{env.close();}
});
