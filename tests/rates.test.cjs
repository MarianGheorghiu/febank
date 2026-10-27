/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain integration harness. */
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {RATES_SEED}=require('../app/lib/rates/seed.ts');
const {calculateRate,validatePolicies,validRates,applyRatesCommand}=require('../app/lib/rates/engine.ts');
const {createRatesRepository,RATES_KEY}=require('../app/lib/rates/repository.ts');
const {createOverviewRepository}=require('../app/lib/overview/repository.ts');
const {createDemoTransferRepository}=require('../app/lib/transfers/repository.ts');
const {createDemoCurrencyRepository}=require('../app/lib/currencies/demo.ts');
const {readWallet}=require('../app/lib/wallet/store.ts');
const {readMarketCatalog,executeCustomerCommand,executeMarketAdmin}=require('../app/lib/markets/store.ts');
const {projectTrading}=require('../app/lib/wallet/trading.ts');
const {quoteTrade}=require('../app/lib/markets/engine.ts');
const {MOCK_SUBSCRIPTIONS,SUBSCRIPTION_CUSTOMERS}=require('../app/lib/mock/admin/subscriptions.ts');
const {priceMarkets,customerRateTier}=require('../app/lib/rates/execution.ts');
const financial=state=>JSON.stringify({accounts:state.transfers.accounts,trading:state.trading});
const maker={email:'maker@admin.test',role:'admin'},checker={email:'checker@admin.test',role:'admin'},at='2026-10-27T12:00:00.000Z';
function browser(){const local=new Map(),session=new Map(),events=[];global.window={dispatchEvent:e=>events.push(e.type)};global.localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v)};global.sessionStorage={getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),key:i=>[...session.keys()][i],get length(){return session.size;}};return {local,session,events,close(){delete global.window;delete global.localStorage;delete global.sessionStorage;}};}
const change=(op,fields)=>RATES_SEED.active.policies.map(p=>p.operation===op?{...structuredClone(p),...fields}:structuredClone(p));
async function publish(policies,key='release-request-1'){const a=createRatesRepository(maker),b=createRatesRepository(checker);const s=await a.getSnapshot();const pending=await a.execute({action:'PROPOSE',policies,reason:'Reprice after provider cost review.',expected_revision:s.revision},key);return b.execute({action:'APPROVE',release_id:pending.releases[0].id,reason:'Independent review of pricing impact.',expected_revision:pending.revision},`${key}-approve`);}
test('integer calculator handles progressive brackets, discounts, weekend, bounds, zero and invalid inputs',()=>{
 const p=change('CRYPTO_TRADE',{rate_bps:100,fixed_minor:100,minimum_minor:50,maximum_minor:10000,spread_bps:10,weekend_bps:100,brackets:[{up_to_minor:10000,rate_bps:100},{up_to_minor:null,rate_bps:50}]}).find(p=>p.operation==='CRYPTO_TRADE');
 assert.equal(calculateRate(p,20000,'PREMIUM',true).fee_minor,150+100-62+20+200);
 assert.equal(calculateRate(p,1).fee_minor,101+1); // percentage and spread each round up, fixed = 100.
 assert.equal(calculateRate(p,0).fee_minor,0);
 assert.equal(calculateRate({...p,minimum_minor:500},1).cap,'MINIMUM');
 assert.equal(calculateRate({...p,maximum_minor:150},20000).cap,'MAXIMUM');
 assert.throws(()=>calculateRate({...p,enabled:false},100),/paused/);
 for(const value of [-1,NaN,Infinity,1.5,1e12+1])assert.throws(()=>calculateRate(p,value));
 assert.equal(calculateRate({...p,brackets:[],fixed_minor:1e12,maximum_minor:null,tier_discount_bps:{STANDARD:9999,PREMIUM:0,METAL:0}},1).discount_minor,Number(BigInt(1000000000001)*BigInt(9999)/BigInt(10000)));
});
test('policy validation rejects ambiguous scopes, invalid caps, discounts and bracket gaps',()=>{
 assert.equal(validRates(RATES_SEED),true);
 for(const fields of [{rate_bps:501},{minimum_minor:100,maximum_minor:99},{brackets:[{up_to_minor:1000,rate_bps:1}]},{brackets:[{up_to_minor:1000,rate_bps:1},{up_to_minor:500,rate_bps:1},{up_to_minor:null,rate_bps:1}]},{tier_discount_bps:{STANDARD:0,PREMIUM:10001,METAL:0}}])assert.throws(()=>validatePolicies(change('CRYPTO_TRADE',fields)));
 assert.throws(()=>validatePolicies([...RATES_SEED.active.policies.slice(1),RATES_SEED.active.policies[1]]));
 assert.equal(validRates({...RATES_SEED,audit:[{}]}),false);
});
test('maker-checker, optimistic revision, rejection, idempotency and history are enforced',()=>{
 const command={action:'PROPOSE',policies:change('FX_EXCHANGE',{spread_bps:50}),expected_revision:0,reason:'Review updated provider currency cost.'};
 const proposed=applyRatesCommand(RATES_SEED,command,maker,'proposal-key-1',at);assert.equal(proposed.active.version,1);assert.equal(validRates(proposed),true);
 assert.deepEqual(applyRatesCommand(proposed,command,maker,'proposal-key-1',at),proposed);
 assert.throws(()=>applyRatesCommand(proposed,{...command,reason:'Another reason here'},maker,'proposal-key-1',at),/already used/);
 assert.throws(()=>applyRatesCommand(proposed,{...command,expected_revision:0},checker,'proposal-key-2',at),/changed/);
 const approve={action:'APPROVE',expected_revision:1,reason:'Pricing verified independently.',release_id:proposed.releases[0].id};
 assert.throws(()=>applyRatesCommand(proposed,approve,maker,'approve-key-1',at),/different administrator/);
 assert.throws(()=>applyRatesCommand(proposed,approve,{...checker,role:'client'},'approve-key-1',at),/Administrator/);
 const published=applyRatesCommand(proposed,approve,checker,'approve-key-1',at);assert.equal(published.active.version,2);assert.equal(published.audit.length,RATES_SEED.audit.length+2);assert.equal(validRates(published),true);
 const rejected=applyRatesCommand(proposed,{...approve,action:'REJECT'},checker,'reject-key-1',at);assert.deepEqual(rejected.active,RATES_SEED.active);
});
test('published transfer pricing invalidates old quotes; committed fees and refunds remain frozen',async()=>{
 const env=browser();try{
  const repo=createDemoTransferRepository('pricing-customer@example.test');const draft={source_account_id:'account-USD',route_id:'route-USD',amount:'100.00',recipient_name:'Alex Morgan',destination:'DE89370400440532013000',reference:'Pricing integration'};
  const old=await repo.quote(draft);const booked=await repo.submit(old.id,'transfer-request-1');const amount=booked.accounts.find(a=>a.asset==='USD').reserved;
  const stale=await repo.quote(draft);await publish(change('FIAT_TRANSFER',{fixed_minor:500}));
  assert.equal(readWallet('pricing-customer@example.test').state.transfers.accounts.find(a=>a.asset==='USD').reserved,amount);
  await assert.rejects(repo.submit(stale.id,'transfer-request-2'),/Fee policy changed/);
  const priorCount=readWallet('pricing-customer@example.test').events.length;
  await assert.rejects(createOverviewRepository('pricing-customer@example.test').submitOperation({id:'stale-overview-transfer',type:'transfer',amount:'100.00',recipient_kind:'iban',recipient_name:'Alex Morgan',recipient:draft.destination,pricing_version:old.pricing.version,quoted_fee:old.fee}),/Fee policy changed/);
  assert.equal(readWallet('pricing-customer@example.test').events.length,priorCount);
  assert.equal((await repo.quote(draft)).fee,'5.10');
  await repo.cancel(booked.transfers[0].id,'transfer-cancel-1');assert.equal(readWallet('pricing-customer@example.test').state.transfers.accounts.find(a=>a.asset==='USD').available,'142350.80');
  assert.ok(env.events.includes('mbank:rates-updated'));
 }finally{env.close();}
});
test('FX and trading use published pricing; proposal alone has no impact and historical journals never reprice',async()=>{
 const env=browser();try{
  const customer='rate-market@example.test',repo=createDemoCurrencyRepository(customer),draft={source:'USD',target:'EUR',amount:'1000'};
  const old=await repo.quote(draft);const before=await repo.submit(old.id,'fx-request-1');const walletBefore=financial(readWallet(customer).state);
  const stale=await repo.quote(draft);const policies=change('FX_EXCHANGE',{spread_bps:100});const a=createRatesRepository(maker),b=createRatesRepository(checker);
  const pending=await a.execute({action:'PROPOSE',expected_revision:0,reason:'Increase FX spread after provider review.',policies},'fx-proposal-1');assert.equal((await repo.quote(draft)).fee_usd,old.fee_usd);
  await b.execute({action:'APPROVE',release_id:pending.releases[0].id,expected_revision:1,reason:'Validated quote impact across all tiers.'},'fx-approve-1');
  assert.equal(financial(readWallet(customer).state),walletBefore);await assert.rejects(repo.submit(stale.id,'fx-request-2'),/changed/);assert.equal((await repo.quote(draft)).fee_usd,'10.00');
  const catalog=readMarketCatalog(customer),state=projectTrading(readWallet(customer).state,catalog,customer),item=state.instruments.find(i=>i.domain==='CRYPTO');
  const expected=calculateRate(item.pricing.policy,Math.round(item.priceUsd*.01*100),item.pricing.tier,item.pricing.weekend).fee_minor/100;
  const request={symbol:item.symbol,side:'BUY',quantity:.01,type:'MARKET',currency:'USD',expectedVersion:item.version,expectedRoutingVersion:state.routing.CRYPTO.version};
  const result=executeCustomerCommand({type:'trade',request},{email:customer,role:'client'},'crypto-request-1');assert.equal(result.orders[0].feeUsd,expected);
  const frozen=financial(readWallet(customer).state);await publish(RATES_SEED.active.policies.map(p=>({...structuredClone(p),rate_bps:p.operation==='CRYPTO_TRADE'?200:p.rate_bps,brackets:[]})),'crypto-reprice-1');assert.equal(financial(readWallet(customer).state),frozen);
  assert.ok(before.accounts.length>0);
 }finally{env.close();}
});
test('pausing a product blocks customer quotes and corrupt / full storage cannot mutate pricing',async()=>{
 const env=browser();try{
  const repo=createDemoCurrencyRepository('pause@example.test');await publish(change('FX_EXCHANGE',{enabled:false}));await assert.rejects(repo.quote({source:'USD',target:'EUR',amount:'100'}),/paused/);
  const a=createRatesRepository(maker),saved=env.local.get(RATES_KEY);env.local.set(RATES_KEY,'{corrupt');await assert.rejects(a.getSnapshot());assert.throws(()=>readMarketCatalog('pause@example.test'));env.local.set(RATES_KEY,saved);
  const original=localStorage.setItem;localStorage.setItem=()=>{throw new Error('Storage full');};await assert.rejects(a.execute({action:'PROPOSE',policies:RATES_SEED.active.policies,reason:'Restore original product policies.',expected_revision:2},'restore-request-1'),/Storage full/);assert.equal(env.local.get(RATES_KEY),saved);localStorage.setItem=original;
 }finally{env.close();}
});
test('subscription tier and weekend are part of the review fingerprint',()=>{
 const env=browser();try{
  const membership=structuredClone(MOCK_SUBSCRIPTIONS),person=SUBSCRIPTION_CUSTOMERS[0];membership.subscriptions[0].status='ACTIVE';membership.subscriptions[0].plan_id='METAL';env.local.set('mbank_subscriptions_v1',JSON.stringify(membership));
  assert.equal(customerRateTier(person.email),'METAL');const base=readMarketCatalog(),priced=priceMarkets(base,person.email),p=priced.instruments[0];assert.equal(p.pricing.tier,'METAL');
  assert.equal(quoteTrade(p,'BUY',.01).feeUsd,calculateRate(p.pricing.policy,Math.round(p.priceUsd*.01*100),'METAL',p.pricing.weekend).fee_minor/100);
  membership.subscriptions[0].status='SUSPENDED';env.local.set('mbank_subscriptions_v1',JSON.stringify(membership));assert.equal(customerRateTier(person.email),'STANDARD');assert.notEqual(priceMarkets(base,person.email).instruments[0].version,p.version);
 }finally{env.close();}
});
test('queued stocks use current published fees and processing is frozen in the wallet journal',async()=>{
 const env=browser();try{
  const customer='queue-pricing@example.test',catalog=readMarketCatalog(customer),state=projectTrading(readWallet(customer).state,catalog,customer),item=state.instruments.find(i=>i.symbol==='NVDA');
  const request={symbol:item.symbol,side:'BUY',quantity:1,type:'LIMIT',currency:'USD',targetPrice:item.priceUsd+50,expectedVersion:item.version,expectedRoutingVersion:state.routing.STOCK.version};
  executeCustomerCommand({type:'trade',request},{email:customer,role:'client'},'queued-stock-request');
  await publish(change('STOCK_TRADE',{rate_bps:40,spread_bps:0}),'queue-reprice-1');
  const priced=readMarketCatalog(customer),expected=calculateRate(priced.instruments.find(i=>i.symbol==='NVDA').pricing.policy,Math.round(item.priceUsd*100)).fee_minor/100;
  executeMarketAdmin({action:'PROCESS',domain:'STOCK',reason:'Process queue after approved pricing release.'},checker);
  const order=readWallet(customer).state.trading.orders.find(o=>o.id==='queued-stock-request');assert.equal(order.status,'FILLED');assert.equal(order.feeUsd,expected);
  const frozen=financial(readWallet(customer).state);await publish(change('STOCK_TRADE',{rate_bps:100,spread_bps:0}),'queue-reprice-2');assert.equal(financial(readWallet(customer).state),frozen);
 }finally{env.close();}
});
test('large release and audit registries stay paginated and search covers reasons, actors and decisions',()=>{
 const {ratePage,searchReleases,searchRateAudit}=require('../app/lib/rates/registry.ts');
 const releases=Array.from({length:127},(_,i)=>({...RATES_SEED.releases[i%2],id:`history-${i}`,maker:i===126?'find-me@admin.test':'maker@admin.test'}));
 const events=Array.from({length:127},(_,i)=>({...RATES_SEED.audit[i%4],id:`audit-${i}`,reason:i===126?'Unique investigation reference':'Pricing decision'}));
 assert.equal(ratePage(releases,0).rows.length,8);assert.equal(ratePage(releases,999).rows.length,7);assert.equal(ratePage(releases,999).page,15);
 assert.equal(searchReleases(releases,'find-me','ALL').length,1);assert.equal(searchReleases(releases,'','REJECTED').length,64);
 assert.equal(searchRateAudit(events,'unique investigation','ALL').length,1);assert.equal(ratePage(searchRateAudit(events,'','ALL'),0).rows.length,8);assert.equal(ratePage([],-1).from,0);
});
test('Go adapter sends authenticated versioned commands, validates responses, never falls back on failure',async()=>{
 const fetchBefore=global.fetch,mode=process.env.NEXT_PUBLIC_RATES_MODE,url=process.env.NEXT_PUBLIC_RATES_API_URL;const calls=[];
 try{process.env.NEXT_PUBLIC_RATES_MODE='http';process.env.NEXT_PUBLIC_RATES_API_URL='https://bank.test';global.fetch=async(...args)=>{calls.push(args);return {ok:true,json:async()=>({...RATES_SEED,mode:'live'})};};const repo=createRatesRepository(maker);await repo.getSnapshot();await repo.execute({action:'PROPOSE',expected_revision:0,reason:'HTTP pricing integration example.',policies:change('FX_EXCHANGE',{spread_bps:70})},'http-request-1');assert.equal(calls[0][0],'https://bank.test/v1/admin/rates');assert.equal(calls[1][1].credentials,'include');assert.equal(calls[1][1].headers['Idempotency-Key'],'http-request-1');assert.equal(JSON.parse(calls[1][1].body).expected_revision,0);
 global.fetch=async()=>({ok:true,json:async()=>({})});await assert.rejects(repo.getSnapshot(),/Invalid/);global.fetch=async()=>({ok:false,status:403,json:async()=>({error:{message:'Forbidden'}})});await assert.rejects(repo.getSnapshot(),/Forbidden/);
 }finally{global.fetch=fetchBefore;if(mode===undefined)delete process.env.NEXT_PUBLIC_RATES_MODE;else process.env.NEXT_PUBLIC_RATES_MODE=mode;if(url===undefined)delete process.env.NEXT_PUBLIC_RATES_API_URL;else process.env.NEXT_PUBLIC_RATES_API_URL=url;}
});
