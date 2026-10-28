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
const {initialWallet,projectOverview} = require('../app/lib/wallet/engine.ts');
const {transferSeed} = require('../app/lib/transfers/seed.ts');
const {buildQuote,refreshLimits,units} = require('../app/lib/transfers/engine.ts');
const draft = {source_account_id:'account-USD',route_id:'route-USD',amount:'100.10',recipient_name:'Shared recipient',destination:'DE89370400440532013000',reference:'Shared ledger'};
function browser() {
  const storage=new Map(); const events=[];
  global.window={dispatchEvent:event=>events.push(event.type)};
  global.localStorage={getItem:key=>storage.get(`local:${key}`)??null,setItem:(key,value)=>storage.set(`local:${key}`,value)};
  global.sessionStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),key:i=>[...storage.keys()][i],get length(){return storage.size;}};
  return {storage,events,close(){delete global.window;delete global.sessionStorage;delete global.localStorage;}};
}
function usd(snapshot) {return snapshot.accounts.find(a=>a.asset==='USD');}
test('both modules see exact reservations, aggregate daily allowance, and cancellation refunds without reload',async()=>{
  const env=browser();try{
    const transfers=createDemoTransferRepository('shared-user');const overview=createOverviewRepository('shared-user');
    const q=await transfers.quote(draft);const sent=await transfers.submit(q.id,'shared-request-1');
    assert.equal(usd(sent).available,'142249.59');assert.equal(sent.limits.used,'101.21');
    const report=await overview.getSnapshot();assert.equal(report.summary.liquidity,usd(sent).available);
    assert.equal(report.accounts.find(a=>a.code==='USD').balance,usd(sent).available);
    assert.equal(report.transactions.find(t=>t.id===sent.transfers[0].id).status,'PENDING');
    const q2=await transfers.quote({...draft,amount:'22222'});const second=await transfers.submit(q2.id,'shared-request-2');
    assert.equal(second.limits.used,'22346.44');assert.equal((await overview.getSnapshot()).summary.liquidity,usd(second).available);
    const restored=await transfers.cancel(sent.transfers[0].id,'shared-cancel-1');
    assert.equal(restored.limits.used,'22245.23');
    assert.equal((await overview.getSnapshot()).summary.liquidity,usd(restored).available);
    assert.equal((await overview.getSnapshot()).transactions.find(t=>t.id===sent.transfers[0].id).status,'CANCELLED');
    assert.ok(env.events.includes('mbank:wallet-updated'));
  }finally{env.close();}
});
test('overview deposit, withdrawal and transfer use the same wallet, fees and daily limits',async()=>{
  const env=browser();try{
    const overview=createOverviewRepository('cash-user');const transfers=createDemoTransferRepository('cash-user');
    await overview.submitOperation({id:'cash-deposit',type:'deposit',amount:'100.00'});
    assert.equal(usd(await transfers.getSnapshot()).available,'142450.80');
    await overview.submitOperation({id:'cash-withdraw',type:'withdraw',amount:'20.00'});
    const operation={id:'overview-transfer',type:'transfer',amount:'100.10',recipient_kind:'iban',recipient_name:'Shared recipient',recipient:draft.destination};
    const report=await overview.submitOperation(operation);const wallet=await transfers.getSnapshot();
    assert.equal(report.summary.liquidity,'142329.59');assert.equal(usd(wallet).reserved,'101.21');assert.equal(wallet.limits.used,'101.21');
    await createOverviewRepository('cash-user').submitOperation(operation);
    assert.equal(usd(await transfers.getSnapshot()).available,'142329.59');
    await assert.rejects(overview.submitOperation({...operation,amount:'101.10'}),/already used/);
    const before=JSON.stringify(await transfers.getSnapshot());
    await assert.rejects(overview.submitOperation({...operation,id:'limit-failure',amount:'50000'}),/daily limit/);
    const after=await transfers.getSnapshot();assert.equal(after.limits.used,'101.21');assert.equal(usd(after).available,'142329.59');
    assert.ok(before.includes('142329.59'));
  }finally{env.close();}
});
test('all available crypto and stock values derive from transfer accounts; USD custody fees also reach overview',async()=>{
  const env=browser();try{
    const transfers=createDemoTransferRepository('assets-user');const overview=createOverviewRepository('assets-user');
    const initial=await overview.getSnapshot();
    const btc=await transfers.quote({...draft,source_account_id:'account-BTC',route_id:'route-BTC',amount:'0.1',destination:'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'});
    await transfers.submit(btc.id,'btc-request');
    const next=await overview.getSnapshot();assert.equal(btc.fee_asset,'USD');assert.equal(next.summary.crypto_quantity,'2.30500000');assert.ok(units(next.summary.crypto_value,2)<units(initial.summary.crypto_value,2));
    const stock=await transfers.quote({...draft,source_account_id:'account-NVDA',route_id:'route-NVDA',amount:'10',destination:'DTC-9902'});
    const sent=await transfers.submit(stock.id,'stock-request');const report=await overview.getSnapshot();
    assert.equal(report.summary.liquidity,usd(sent).available);assert.equal(report.summary.liquidity,(Number(initial.summary.liquidity)-Number(btc.fee)-Number(stock.fee)).toFixed(2));
    assert.equal(units(initial.summary.investments,2)-units(report.summary.investments,2),BigInt(1230000));
    assert.equal(report.histories.stocks['1M'].points.at(-1).value,report.summary.investments);
    assert.equal(report.histories.crypto['1M'].points.at(-1).value,report.summary.crypto_quantity);
    await transfers.cancel(sent.transfers[0].id,'stock-refund');assert.equal((await overview.getSnapshot()).summary.investments,initial.summary.investments);
  }finally{env.close();}
});
test('legacy journals merge once in chronological order preserving existing debit, cash and history',async()=>{
  const env=browser();try{
    const at='2026-10-19T10:00:00.000Z';const snapshot=refreshLimits(transferSeed(),at);
    const quote=buildQuote(snapshot,draft,'legacy-quote',at);
    env.storage.set('mbank_transfers_v1:migrated',JSON.stringify([{kind:'submit',key:'legacy-request',quote,at}]));
    env.storage.set('mbank_overview_v1:migrated',JSON.stringify([{operation:{id:'legacy-deposit',type:'deposit',amount:'10.00'},at:'2026-10-19T09:00:00.000Z'}]));
    const transfers=createDemoTransferRepository('migrated');const overview=createOverviewRepository('migrated');
    assert.equal(usd(await transfers.getSnapshot()).available,'142259.59');assert.equal((await overview.getSnapshot()).summary.liquidity,'142259.59');
    assert.equal(readWallet('migrated').events.length,2);assert.equal(readWallet('migrated').events[0].key,'legacy-deposit');
    assert.ok(env.storage.has('mbank_wallet_v1:migrated'));assert.ok(env.storage.has('mbank_transfers_v1:migrated'));
    assert.equal((await createOverviewRepository('migrated').getSnapshot()).summary.liquidity,'142259.59');
  }finally{env.close();}
});
test('insufficient shared balance and storage failure cannot partially update either module',async()=>{
  const env=browser();try{
    const transfers=createDemoTransferRepository('fail-user');const overview=createOverviewRepository('fail-user');
    // This scenario exercises insufficient funds after a previously valid quote.
    const risk=structuredClone(require('../app/lib/mock/admin/risk.ts').MOCK_RISK_STATE);
    risk.policies.find(p=>p.domain==='FIAT').maxTransactionUsd=200000;
    localStorage.setItem('mbank_risk_v1',JSON.stringify(risk));
    const stale=await transfers.quote(draft);
    await overview.submitOperation({id:'drain-funds',type:'withdraw',amount:'142300.00'});
    await assert.rejects(transfers.submit(stale.id,'stale-reservation'),/Insufficient/);
    await assert.rejects(transfers.quote(draft),/Insufficient/);
    const q=await transfers.quote({...draft,amount:'10'});
    const original=sessionStorage.setItem;sessionStorage.setItem=()=>{throw new Error('Storage unavailable');};
    await assert.rejects(transfers.submit(q.id,'failed-reservation'),/Storage unavailable/);sessionStorage.setItem=original;
    assert.equal((await overview.getSnapshot()).summary.liquidity,'50.80');assert.equal(usd(await transfers.getSnapshot()).reserved,'0');
    const read=readWallet('fail-user');assert.equal(read.events.length,1);
    env.storage.set('mbank_wallet_v1:fail-user','{broken');await assert.rejects(overview.getSnapshot(),/No balances were reset/);
  }finally{env.close();}
});
test('UTC limit rollover resets usage without releasing existing reservations',()=>{
  const state=initialWallet();const at='2026-10-19T23:59:00.000Z';
  const q=buildQuote(state.transfers,draft,'midnight-quote',at);
  const {applyWalletEvent}=require('../app/lib/wallet/engine.ts');
  const submitted=applyWalletEvent(state,{kind:'submit',key:'midnight-request',at,quote:q});
  const next=refreshLimits(submitted.transfers,'2026-10-20T00:00:00.000Z');
  assert.equal(next.limits.used,'0.00');assert.equal(usd(next).reserved,'101.21');assert.equal(usd(next).available,'142249.59');
  assert.equal(projectOverview(submitted,'2026-10-20T00:00:00.000Z').summary.liquidity,'142249.59');
});

test('HTTP overview uses the same service origin, authentication and idempotency without mock fallback',async()=>{
  const oldMode=process.env.NEXT_PUBLIC_TRANSFERS_MODE;const oldBase=process.env.NEXT_PUBLIC_TRANSFERS_API_URL;const oldFetch=global.fetch;const calls=[];
  process.env.NEXT_PUBLIC_TRANSFERS_MODE='http';process.env.NEXT_PUBLIC_TRANSFERS_API_URL='https://wallet.example/';
  global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>projectOverview(initialWallet(),new Date().toISOString())};};
  try{
    const repo=createOverviewRepository('never-send-customer-id');await repo.getSnapshot();
    await repo.submitOperation({id:'service-operation',type:'deposit',amount:'10.00'});
    assert.equal(calls[0].url,'https://wallet.example/v1/me/overview');assert.equal(calls[1].url,'https://wallet.example/v1/me/overview/operations');
    assert.equal(calls[1].init.headers['Idempotency-Key'],'service-operation');assert.equal(calls[1].init.credentials,'include');assert.equal(calls[1].init.cache,'no-store');
    assert.ok(!calls[1].init.body.includes('never-send-customer-id'));
    global.fetch=async()=>({ok:false,status:401,json:async()=>({error:{message:'Authentication required'}})});
    await assert.rejects(repo.getSnapshot(),/Authentication required/);
  }finally{
    global.fetch=oldFetch;if(oldMode===undefined)delete process.env.NEXT_PUBLIC_TRANSFERS_MODE;else process.env.NEXT_PUBLIC_TRANSFERS_MODE=oldMode;if(oldBase===undefined)delete process.env.NEXT_PUBLIC_TRANSFERS_API_URL;else process.env.NEXT_PUBLIC_TRANSFERS_API_URL=oldBase;
  }
});

const {MOCK_MARKETS_STATE: catalog, MOCK_TRADING_WALLET: legacyOpening} = require('../app/lib/mock/admin/markets.ts');
const {projectTrading} = require('../app/lib/wallet/trading.ts');
const {executeCustomerCommand,readMarketCatalog} = require('../app/lib/markets/store.ts');
const {availableCash, availableUnits, quoteTrade, submitTrade} = require('../app/lib/markets/engine.ts');
function tradeFor(customer, symbol, side, quantity, extra={}) {
  const view = projectTrading(readWallet(customer).state, readMarketCatalog(customer), customer);
  const item = view.instruments.find(i=>i.symbol===symbol);
  return {type:'trade', request:{symbol,side,quantity,type:'MARKET',expectedVersion:item.version,expectedRoutingVersion:view.routing[item.domain].version,...extra}};
}
function execute(customer, command, key) { return executeCustomerCommand(command,{email:customer,role:'client'},key); }
test('buy and sell settle against the bank USD account and fractional custody position, isolated by customer', async()=>{
 const env=browser();try {
  const customer='trader@example.test'; const opening=await createOverviewRepository(customer).getSnapshot();
  const command=tradeFor(customer,'AAPL','BUY',0.5); const expected=quoteTrade(readMarketCatalog(customer).instruments.find(i=>i.symbol==='AAPL'),'BUY',0.5);
  const bought=execute(customer,command,'buy-shared');
  assert.equal(availableCash(bought,customer).toFixed(2),(Number(opening.summary.liquidity)-expected.cashAmount).toFixed(2));
  assert.equal((await createOverviewRepository(customer).getSnapshot()).summary.liquidity,availableCash(bought,customer).toFixed(2));
  assert.equal((await createDemoTransferRepository(customer).getSnapshot()).accounts.find(a=>a.asset==='AAPL').available,'25.50000000');
  const journal=env.storage.get('mbank_wallet_v1:'+encodeURIComponent(customer));
  execute(customer,command,'buy-shared'); assert.equal(env.storage.get('mbank_wallet_v1:'+encodeURIComponent(customer)),journal);
  assert.throws(()=>execute(customer,{...command,request:{...command.request,quantity:1}},'buy-shared'),/already used/);
  const sold=execute(customer,tradeFor(customer,'AAPL','SELL',0.5),'sell-shared');
  assert.equal(availableUnits(sold,customer,'AAPL'),25);
  assert.equal((await createOverviewRepository('other@example.test').getSnapshot()).summary.liquidity,opening.summary.liquidity);
  assert.equal(env.storage.has('local:mbank_markets_v1'),false,'customer mutations never save a second balance');
 }finally{env.close();}
});
test('pending buy and sell orders reserve the same funds/assets as transfers and cancellation releases only its own hold',async()=>{
 const env=browser();try {
  const customer='reserved@example.test';const repository=createDemoTransferRepository(customer);
  const quote=await repository.quote(draft);const sent=await repository.submit(quote.id,'reserved-transfer');
  const order=execute(customer,tradeFor(customer,'AAPL','BUY',2,{type:'LIMIT',targetPrice:100}),'pending-buy');
  const pending=readWallet(customer).state;const pendingUsd=usd(pending.transfers);
  assert.equal(pendingUsd.available,(Number(usd(sent).available)-order.orders[0].reservedCash).toFixed(2));
  assert.equal(pendingUsd.reserved,(Number(usd(sent).reserved)+order.orders[0].reservedCash).toFixed(2));
  const risk=structuredClone(require('../app/lib/mock/admin/risk.ts').MOCK_RISK_STATE);
  risk.policies.find(p=>p.domain==='FIAT').maxTransactionUsd=200000;
  localStorage.setItem('mbank_risk_v1',JSON.stringify(risk));
  await createOverviewRepository(customer).submitOperation({id:'spend-rest',type:'withdraw',amount:pendingUsd.available});
  assert.throws(()=>execute(customer,tradeFor(customer,'BTC','BUY',0.001),'no-cash'),/Insufficient/);
  execute(customer,{type:'cancel_order',order_id:'pending-buy'},'release-buy');
  assert.equal(usd(readWallet(customer).state.transfers).reserved,usd(sent).reserved);
  const sell=execute(customer,tradeFor(customer,'AAPL','SELL',20,{type:'LIMIT',targetPrice:300}),'pending-sell');
  assert.equal(availableUnits(sell,customer,'AAPL'),5);
  await assert.rejects(repository.quote({...draft,source_account_id:'account-AAPL',route_id:'route-AAPL',amount:'6',destination:'DTC-9902'}),/Insufficient/);
  execute(customer,{type:'cancel_order',order_id:'pending-sell'},'release-sell');
  assert.equal(readWallet(customer).state.transfers.accounts.find(a=>a.asset==='AAPL').available,'25.00000000');
 }finally{env.close();}
});
test('fiat and two-leg crypto exchanges commit once and roll back both legs on failure or storage quota',async()=>{
 const env=browser();try {
  const customer='exchange@example.test';
  const fxView=projectTrading(readWallet(customer).state,readMarketCatalog(customer),customer);
  const fxPreview=require('../app/lib/markets/engine.ts').previewExchange(fxView,'EUR','RON',108);
  execute(customer,{type:'exchange',source:'EUR',target:'RON',amount:108,revision:fxView.revision},'fx-shared');
  let state=readWallet(customer).state;
  assert.equal(state.transfers.accounts.find(a=>a.asset==='EUR').available,'24392.00');
  assert.equal(state.transfers.accounts.find(a=>a.asset==='RON').available,(38000+fxPreview.received).toFixed(2));
  const view=projectTrading(state,readMarketCatalog(customer),customer);
  execute(customer,{type:'exchange',source:'BTC',target:'ETH',amount:0.001,revision:view.revision},'crypto-swap');
  state=readWallet(customer).state;
  assert.equal(state.transfers.accounts.find(a=>a.asset==='BTC').available,'2.40400000');
  assert.ok(Number(state.transfers.accounts.find(a=>a.asset==='ETH').available)>12.4);
  const financial = state => JSON.stringify({...state, transfers:{...state.transfers,as_of:""}});
  const before=financial(state);
  assert.throws(()=>execute(customer,{type:'exchange',source:'BTC',target:'ETH',amount:5,revision:projectTrading(state,readMarketCatalog(customer),customer).revision},'failed-swap'),/Insufficient|Order value/);
  assert.equal(financial(readWallet(customer).state),before);
  const save=sessionStorage.setItem;sessionStorage.setItem=()=>{throw new Error('quota');};
  assert.throws(()=>execute(customer,tradeFor(customer,'AAPL','BUY',1),'quota-buy'),/quota/);
  sessionStorage.setItem=save;assert.equal(financial(readWallet(customer).state),before);
 }finally{env.close();}
});
test('legacy trading migrates execution deltas once without adding a second opening cash balance',async()=>{
 const env=browser();try {
  const customer='legacy-trader@example.test'; const actor={email:customer,role:'client'};
  const item=catalog.instruments.find(i=>i.symbol==='AAPL');
  const request={symbol:'AAPL',side:'BUY',quantity:1,type:'MARKET',expectedVersion:item.version,expectedRoutingVersion:1};
  const legacy=submitTrade(catalog,request,actor,'2026-10-15T12:00:00Z','legacy-order');
  localStorage.setItem('mbank_markets_v1',JSON.stringify(legacy));
  const state=readWallet(customer).state;
  assert.equal(usd(state.transfers).available,(142350.8-(legacyOpening.cash.USD-legacy.wallets[customer].cash.USD)).toFixed(2));
  assert.equal(state.transfers.accounts.find(a=>a.asset==='AAPL').available,'26.00000000');
  assert.equal(state.trading.orders[0].id,'legacy-order');
  assert.equal(readWallet(customer).events.filter(e=>e.kind==='trading_migration').length,1);
  assert.deepEqual(readWallet(customer).state.transfers.accounts,state.transfers.accounts);
  assert.deepEqual(readWallet(customer).state.trading,state.trading);
 }finally{env.close();}
});
test('shared mark prices survive refresh and historical transfer quotes replay at their original price',async()=>{
 const env=browser();try {
  const customer='marks@example.test'; const updated=structuredClone(catalog);updated.instruments.find(i=>i.symbol==='BTC').priceUsd=70000;
  localStorage.setItem('mbank_markets_v1',JSON.stringify(updated));
  const repository=createDemoTransferRepository(customer);
  const q=await repository.quote({...draft,source_account_id:'account-BTC',route_id:'route-BTC',amount:'0.001',destination:'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'});
  await repository.submit(q.id,'priced-transfer');
  updated.instruments.find(i=>i.symbol==='BTC').priceUsd=71000;localStorage.setItem('mbank_markets_v1',JSON.stringify(updated));
  const state=readWallet(customer).state;
  assert.equal(state.transfers.accounts.find(a=>a.asset==='BTC').usd_price,'71000.00');
  assert.equal(state.transfers.transfers[0].value_usd,q.value_usd);
  const overview=await createOverviewRepository(customer).getSnapshot();
  assert.equal(overview.assets.find(a=>a.ticker==='BTC').price,'71000.00');
 }finally{env.close();}
});

test('operations processing and cancellation settle canonical pending orders in the owner wallet', async()=>{
 const env=browser();try {
  const {executeMarketAdmin,projectAllCustomers}=require('../app/lib/markets/store.ts');
  const customer='queue@example.test';const admin={email:'operations@admin.com',role:'admin'};
  execute(customer,tradeFor(customer,'AAPL','BUY',1,{type:'LIMIT',targetPrice:200}),'process-order');
  const held=usd(readWallet(customer).state.transfers).reserved;
  assert.ok(Number(held)>0);
  assert.ok(projectAllCustomers(catalog).orders.some(o=>o.id==='process-order'));
  executeMarketAdmin({action:'PROCESS',domain:'STOCK',reason:'Process the customer eligible order queue.'},admin);
  let state=readWallet(customer).state;
  assert.equal(state.trading.orders[0].status,'FILLED');
  assert.equal(usd(state.transfers).reserved,'0.00');
  assert.equal(state.transfers.accounts.find(a=>a.asset==='AAPL').available,'26.00000000');
  execute(customer,tradeFor(customer,'AAPL','SELL',2,{type:'LIMIT',targetPrice:500}),'admin-cancel-order');
  executeMarketAdmin({action:'CANCEL',orderId:'admin-cancel-order',reason:'Cancel the customer pending custody order.'},admin);
  state=readWallet(customer).state;
  assert.equal(state.trading.orders[0].status,'CANCELLED');
  assert.equal(state.transfers.accounts.find(a=>a.asset==='AAPL').available,'26.00000000');
  assert.equal((await createOverviewRepository(customer).getSnapshot()).summary.liquidity,usd(state.transfers).available);
  assert.ok(state.trading.audit.length>=2);
 }finally{env.close();}
});

test('sub-cent shared prices retain exact marks and rounded portfolio values',async()=>{
 const env=browser();try {
  const updated=structuredClone(catalog);updated.instruments.find(i=>i.symbol==='BTC').priceUsd=0.00012345;
  localStorage.setItem('mbank_markets_v1',JSON.stringify(updated));
  const state=readWallet('subcent@example.test').state;
  assert.equal(state.transfers.accounts.find(a=>a.asset==='BTC').usd_price,'0.00012345');
  const {usdValue}=require('../app/lib/transfers/engine.ts');
  assert.equal(usdValue(units('100000',8),8,'0.00012345','nearest'),1235n);
  assert.equal((await createOverviewRepository('subcent@example.test').getSnapshot()).assets.find(a=>a.ticker==='BTC').price,'0.00012345');
 }finally{env.close();}
});

test('bank pool inventory is shared across customers, admin adjustments do not double settlements',()=>{
 const env=browser();try {
  const {projectAllCustomers,readBaseMarketCatalog,executeMarketAdmin}=require('../app/lib/markets/store.ts');
  const admin={role:'admin',email:'pool@admin.com'};
  const a='pool-a@example.test',b='pool-b@example.test';
  const initial=readBaseMarketCatalog().instruments.find(i=>i.symbol==='BTC');
  execute(a,tradeFor(a,'BTC','BUY',0.001),'global-a');
  const stale=tradeFor(b,'BTC','BUY',0.001);
  execute(a,tradeFor(a,'BTC','BUY',0.001),'global-a-2');
  assert.throws(()=>execute(b,stale,'global-stale'),/conditions changed/);
  execute(b,tradeFor(b,'BTC','BUY',0.001),'global-b');
  const global=projectAllCustomers(readBaseMarketCatalog());
  const btc=global.instruments.find(i=>i.symbol==='BTC');
  assert.equal(btc.reserveUnits.toFixed(8),(initial.reserveUnits-0.003).toFixed(8));
  for(const email of [a,b]) assert.equal(projectTrading(readWallet(email).state,readMarketCatalog(email),email).instruments.find(i=>i.symbol==='BTC').reserveUnits.toFixed(8),btc.reserveUnits.toFixed(8));
  executeMarketAdmin({action:'LIQUIDITY',symbol:'BTC',expectedVersion:btc.version,unitsDelta:1,usdDelta:100,reason:'Replenish the globally shared pool inventory.'},admin);
  const after=projectAllCustomers(readBaseMarketCatalog()).instruments.find(i=>i.symbol==='BTC');
  assert.equal(after.reserveUnits.toFixed(8),(btc.reserveUnits+1).toFixed(8));
  assert.equal(after.reserveUsd.toFixed(2),(btc.reserveUsd+100).toFixed(2));
  assert.equal(after.version,btc.version+1);
 }finally{env.close();}
});
test('global pool depletion prevents a second customer from consuming the same units',()=>{
 const env=browser();try {
  const {executeMarketAdmin,readBaseMarketCatalog,projectAllCustomers}=require('../app/lib/markets/store.ts');
  const btc=readBaseMarketCatalog().instruments.find(i=>i.symbol==='BTC');
  executeMarketAdmin({action:'LIQUIDITY',symbol:'BTC',expectedVersion:btc.version,unitsDelta:0.001-btc.reserveUnits,usdDelta:0,reason:'Limit execution inventory for depletion scenario.'},{role:'admin',email:'pool@admin.com'});
  execute('deplete-a@example.test',tradeFor('deplete-a@example.test','BTC','BUY',0.001),'deplete-a');
  assert.throws(()=>execute('deplete-b@example.test',tradeFor('deplete-b@example.test','BTC','BUY',0.001),'deplete-b'),/base-asset liquidity/);
  assert.equal(projectAllCustomers(readBaseMarketCatalog()).instruments.find(i=>i.symbol==='BTC').reserveUnits,0);
 }finally{env.close();}
});

test('admin can withdraw globally replenished units while preserving effective reserves and customer holdings',()=>{
 const env=browser();try {
  const {executeMarketAdmin,readBaseMarketCatalog,projectAllCustomers}=require('../app/lib/markets/store.ts');
  const admin={role:'admin',email:'pool@admin.com'},email='replenish@example.test';
  let btc=readBaseMarketCatalog().instruments.find(i=>i.symbol==='BTC');
  executeMarketAdmin({action:'LIQUIDITY',symbol:'BTC',expectedVersion:btc.version,unitsDelta:0.001-btc.reserveUnits,usdDelta:0,reason:'Prepare replenishment and withdrawal scenario.'},admin);
  execute(email,tradeFor(email,'BTC','SELL',0.01),'sell-replenish');
  btc=projectAllCustomers(readBaseMarketCatalog()).instruments.find(i=>i.symbol==='BTC');
  const holdings=readWallet(email).state.transfers.accounts.find(a=>a.asset==='BTC').available;
  executeMarketAdmin({action:'LIQUIDITY',symbol:'BTC',expectedVersion:btc.version,unitsDelta:-0.01,usdDelta:0,reason:'Treasury withdrawal from customer-replenished inventory.'},admin);
  assert.equal(projectAllCustomers(readBaseMarketCatalog()).instruments.find(i=>i.symbol==='BTC').reserveUnits,0.001);
  assert.equal(readWallet(email).state.transfers.accounts.find(a=>a.asset==='BTC').available,holdings);
  execute(email,tradeFor(email,'BTC','BUY',0.001),'buy-replenish');
  assert.equal(projectAllCustomers(readBaseMarketCatalog()).instruments.find(i=>i.symbol==='BTC').reserveUnits,0);
 }finally{env.close();}
});

test('Crypto Pools examples persist once in dedicated wallets; pending orders cancel and process through the common ledger',async()=>{
 const env=browser();try {
  const {createMarketOperationsRepository}=require('../app/lib/markets/repository.ts');
  const repository=createMarketOperationsRepository({email:'pool@admin.com',role:'admin'});
  const snapshot=await repository.getSnapshot();
  const orders=snapshot.state.orders.filter(o=>o.domain==='CRYPTO'&&o.userEmail.startsWith('markets-demo-'));
  assert.equal(orders.length,44);
  for(const status of ['FILLED','PENDING','CANCELLED','REJECTED'])assert.ok(orders.some(o=>o.status===status));
  assert.equal(snapshot.state.audit.filter(e=>e.domain==='CRYPTO'&&e.id.startsWith('markets-demo-')).length,12);
  const pending=orders.find(o=>o.status==='PENDING'),before=readWallet(pending.userEmail).state.transfers.accounts.find(a=>a.asset==='USD');
  assert.ok(Number(before.reserved)>0);
  const cancelled=await repository.execute({action:'CANCEL',orderId:pending.id,reason:'Verify demo cancellation releases canonical reservation.'},'demo-cancel-review');
  assert.equal(cancelled.state.orders.find(o=>o.id===pending.id).status,'CANCELLED');
  assert.equal(Number(readWallet(pending.userEmail).state.transfers.accounts.find(a=>a.asset==='USD').reserved),0);
  assert.equal((await repository.getSnapshot()).state.orders.filter(o=>o.domain==='CRYPTO').length,44,'refresh does not reseed existing examples');
  const processed=await repository.execute({action:'PROCESS',domain:'CRYPTO',reason:'Process the remaining demo venue orders through shared execution.'},'demo-process-review');
  assert.equal(processed.state.orders.filter(o=>o.domain==='CRYPTO'&&o.status==='PENDING').length,0);
  assert.equal(processed.state.orders.filter(o=>o.domain==='CRYPTO'&&o.status==='FILLED').length,27);
 }finally{env.close();}
});

test('equity examples include real limit/stop reservations, retain unmatched orders and do not reseed decisions',async()=>{
 const env=browser();try {
  const {createMarketOperationsRepository}=require('../app/lib/markets/repository.ts');
  const repository=createMarketOperationsRepository({email:'equity@admin.com',role:'admin'});
  const snapshot=await repository.getSnapshot(),orders=snapshot.state.orders.filter(o=>o.domain==='STOCK');
  assert.equal(orders.length,60);
  for(const type of ['MARKET','LIMIT','STOP'])assert.ok(orders.some(o=>o.type===type));
  assert.equal(orders.filter(o=>o.status==='PENDING').length,20);
  const limit=orders.find(o=>o.id.endsWith('limit-eligible'));
  const before=readWallet(limit.userEmail).state.transfers.accounts.find(a=>a.asset==='USD');
  assert.ok(Number(before.reserved)>0);
  const processed=await repository.execute({action:'PROCESS',domain:'STOCK',reason:'Verify eligible equity execution and preserve unmatched triggers.'},'equity-execution');
  const remaining=processed.state.orders.filter(o=>o.domain==='STOCK'&&o.status==='PENDING');
  assert.equal(remaining.length,8);
  assert.ok(remaining.every(o=>o.id.endsWith('stop-waiting')||o.id.endsWith('limit-waiting')));
  assert.ok(remaining.every(o=>/not been reached/.test(o.note)));
  const sell=remaining.find(o=>o.side==='SELL'),unitsBefore=readWallet(sell.userEmail).state.transfers.accounts.find(a=>a.asset===sell.symbol);
  assert.ok(Number(unitsBefore.reserved)>=1);
  await repository.execute({action:'CANCEL',orderId:sell.id,reason:'Cancel remaining demo equity sale and release its own units.'},'equity-cancel');
  const unitsAfter=readWallet(sell.userEmail).state.transfers.accounts.find(a=>a.asset===sell.symbol);
  assert.equal(Number(unitsAfter.reserved),Number(unitsBefore.reserved)-1);
  const refreshed=await repository.getSnapshot();
  assert.equal(refreshed.state.orders.filter(o=>o.domain==='STOCK').length,60);
  assert.equal(refreshed.state.orders.find(o=>o.id===sell.id).status,'CANCELLED');
  assert.equal(refreshed.state.orders.filter(o=>o.domain==='CRYPTO'&&o.status==='PENDING').length,4);
 }finally{env.close();}
});

test('admin processes interleaved customer orders in global FIFO when inventory is scarce',()=>{
 const env=browser();try {
  const {executeMarketAdmin,readBaseMarketCatalog,projectAllCustomers}=require('../app/lib/markets/store.ts');
  const {commitWallet}=require('../app/lib/wallet/store.ts');
  const admin={email:'fifo@admin.com',role:'admin'},item=readBaseMarketCatalog().instruments.find(i=>i.symbol==='AAPL');
  executeMarketAdmin({action:'LIQUIDITY',symbol:'AAPL',expectedVersion:item.version,unitsDelta:2-item.reserveUnits,usdDelta:0,reason:'Constrain shared AAPL inventory for FIFO execution review.'},admin);
  const submit=(email,id,at)=>{const command=tradeFor(email,'AAPL','BUY',1,{type:'LIMIT',targetPrice:Math.round(item.priceUsd*1.05*100)/100});commitWallet(email,{kind:'trading',key:id,at,catalog:readMarketCatalog(email),command,actor:{email,role:'client'}});};
  submit('fifo-a@example.test','fifo-first','2026-10-28T07:00:00Z');
  submit('fifo-b@example.test','fifo-second','2026-10-28T07:01:00Z');
  submit('fifo-a@example.test','fifo-third','2026-10-28T07:02:00Z');
  executeMarketAdmin({action:'PROCESS',domain:'STOCK',reason:'Process interleaved orders by their original submission time.'},admin);
  const view=projectAllCustomers(readBaseMarketCatalog());
  assert.equal(view.orders.find(o=>o.id==='fifo-first').status,'FILLED');
  assert.equal(view.orders.find(o=>o.id==='fifo-second').status,'FILLED');
  assert.equal(view.orders.find(o=>o.id==='fifo-third').status,'PENDING');
  assert.match(view.orders.find(o=>o.id==='fifo-third').note,/liquidity/);
  assert.equal(view.instruments.find(i=>i.symbol==='AAPL').reserveUnits,0);
 }finally{env.close();}
});
