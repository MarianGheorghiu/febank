/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain integration harness. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '..', request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { initialWallet, applyWalletEvent } = require('../app/lib/wallet/engine.ts');
const { units, usdValue, decimal, buildQuote } = require('../app/lib/transfers/engine.ts');
const { projectAnalytics, signedUnits, periodStart } = require('../app/lib/analytics/engine.ts');
const { parseAnalyticsSnapshot } = require('../app/lib/analytics/response.ts');
const { createAnalyticsRepository } = require('../app/lib/analytics/repository.ts');
const { analyticsReport } = require('../app/lib/analytics/report.ts');
const { DEMO_OFFER_CATALOG } = require('../app/lib/offers/catalog.ts');
const now = '2026-10-23T12:00:00.000Z';
const cards = () => ({ as_of: now, cards: [{ id: 'card', status: 'ACTIVE' }], activity: [] });
const view = (state = initialWallet(), events = [], period = '30D', card = cards()) => projectAnalytics(state, events, card, period, now);
const deposit = (id, at, amount = '100.00') => ({ kind: 'overview', key: id, at, operation: { id, type: 'deposit', amount } });

test('personal assets count available and reserved exactly, exclude business balances and undrawn limits', () => {
  const state = initialWallet(), s = view(state);
  const expected = state.transfers.accounts.reduce((total,a) => total + usdValue(units(a.available,a.decimals),a.decimals,a.usd_price,'nearest'), 0n);
  assert.equal(units(s.summary.assets_usd,2), expected);
  assert.equal(s.summary.debt_usd, '12500.00');
  assert.equal(signedUnits(s.summary.net_worth_usd), expected-1250000n);
  assert.equal(s.businesses[0].cash_usd, '85000.00');
  assert.equal(s.rewards.available_points, 345200);
  assert.equal(s.summary.unrealized_usd,null);
  assert.deepEqual(parseAnalyticsSnapshot(s),s);
  const usd = state.transfers.accounts.find(a => a.asset==='USD'); usd.available='142250.80'; usd.reserved='100.00';
  const reserved = view(state);
  assert.equal(reserved.summary.assets_usd,s.summary.assets_usd);
  assert.equal(reserved.summary.reserved_usd,'100.00');
  assert.equal(reserved.summary.available_cash_usd,decimal(units(s.summary.available_cash_usd,2)-10000n,2));
});

test('negative net worth remains signed instead of overflowing or being clamped', () => {
  const state = initialWallet(); for (const a of state.transfers.accounts) a.available='0';
  const s=view(state); assert.equal(s.summary.assets_usd,'0.00'); assert.equal(s.summary.net_worth_usd,'-12500.00');
  assert.equal(parseAnalyticsSnapshot(s).summary.net_worth_usd,'-12500.00');
});

test('basis coverage and unrealized gain only include holdings with recorded cost', () => {
  const state=initialWallet(); state.trading.cost_basis.AAPL=100;
  const s=view(state), p=s.positions.find(a=>a.symbol==='AAPL');
  assert.equal(p.cost_usd,'2500.00'); assert.equal(p.unrealized_usd,decimal(units(p.value_usd,2)-250000n,2));
  assert.equal(s.summary.known_value_usd,p.value_usd); assert.equal(s.summary.known_cost_usd,'2500.00');
  assert.equal(s.positions.find(a=>a.symbol==='BTC').unrealized_usd,null);
  assert.ok(s.summary.basis_coverage_bps>0 && s.summary.basis_coverage_bps<10000);
});

test('pending reservations and cancellation never count as completed cash outflow or destroy owned wealth', () => {
  const original=initialWallet(); const quote=buildQuote(original.transfers,{source_account_id:'account-USD',route_id:'route-USD',recipient_name:'Test Person',destination:'DE89370400440532013000',amount:'100.00',reference:'Test'},'quote-test',now);
  const event={kind:'submit',key:'reserve-0001',at:now,quote};
  const state=applyWalletEvent(original,event), s=view(state,[event]);
  assert.equal(s.summary.assets_usd,view(original).summary.assets_usd);
  assert.equal(s.cashflow.outgoing_usd,'1251.00');
  assert.equal(s.movements.find(m=>m.id==='transfer:trf-reserve-0001').status,'pending');
  const cancel={kind:'cancel',key:'cancel-0001',at:now,transfer_id:'trf-reserve-0001'};
  const next=view(applyWalletEvent(state,cancel),[event,cancel]);
  assert.equal(next.summary.reserved_usd,'0.00'); assert.equal(next.cashflow.outgoing_usd,s.cashflow.outgoing_usd);
});

test('financing and rewards credits update cash but remain outside external cash movement totals', () => {
  let state=initialWallet(); const events=[];
  const credit={kind:'credit',key:'analytics-draw',at:now,command:{scope:'personal',expected_version:0,action:'draw',facility_id:'buffer',amount:'100.00'}};
  state=applyWalletEvent(state,credit);events.push(credit);
  const reward={kind:'rewards',key:'analytics-reward',at:now,context:{catalog:DEMO_OFFER_CATALOG,membership:{plan:'METAL',active:true,source:'demo',subscription_id:null},cards:[]},command:{action:'redeem_cash',expected_version:0,catalog_version:1,points:1000}};
  state=applyWalletEvent(state,reward);events.push(reward);
  const s=view(state,events), base=view();
  assert.equal(s.cashflow.incoming_usd,'0.00'); assert.equal(s.cashflow.financing_in_usd,'100.00');
  assert.equal(s.rewards.redeemed_usd,'10.00');assert.equal(s.cashflow.rewards_usd,'139.50');
  assert.equal(signedUnits(s.summary.net_worth_usd)-signedUnits(base.summary.net_worth_usd),1000n);
  assert.equal(s.summary.debt_usd,'12600.00');
});

test('period boundaries exclude future data and unrelated historical fixtures, replay remains actual journal observations', () => {
  const events=[deposit('old','2026-09-23T23:59:59Z'),deposit('boundary','2026-09-24T00:00:00Z'),deposit('recent','2026-10-20T10:00:00Z')];
  const state=events.reduce(applyWalletEvent,initialWallet());
  state.cash_operations.push({operation:{id:'future',type:'deposit',amount:'999.00'},at:'2026-10-24T00:00:00Z'});
  const s=view(state,events);
  assert.equal(periodStart('30D',now),'2026-09-24T00:00:00.000Z');
  assert.equal(s.cashflow.incoming_usd,'200.00');assert.equal(s.movements.some(m=>m.id==='cash:future'),false);
  assert.equal(s.history.length,3);assert.equal(s.history.at(-1).net_worth_usd,s.summary.net_worth_usd);
  assert.equal(s.movements.some(m=>m.description==='Salary'),false);
});

test('demo charts have deterministic populated quotes per currency, current mark endpoints and no negative prices', () => {
  const s=view(), again=view(); assert.deepEqual(s.demo_history,again.demo_history);assert.equal(s.demo_history.length,30);
  assert.equal(s.history.length,1);assert.equal(s.demo_history.at(-1).net_worth_usd,s.summary.net_worth_usd);
  for(const p of s.positions){ assert.equal(p.price_history.length,366);assert.equal(Number(p.price_history.at(-1).price_usd),Number(p.price_usd));assert.ok(p.price_history.every(q=>Number(q.price_usd)>0)); }
  const usd=s.positions.find(p=>p.symbol==='USD');assert.ok(usd.price_history.every(q=>Number(q.price_usd)===1));
  const eur=s.positions.find(p=>p.symbol==='EUR');assert.ok(new Set(eur.price_history.map(q=>q.price_usd)).size>10);
});

test('fiat exchanges appear as internal activity and never inflate received or sent cash totals', () => {
  const { MOCK_MARKETS_STATE } = require('../app/lib/markets/seed.ts');
  const event = { kind: 'trading', key: 'analytics-exchange', at: now, actor: { role: 'client', email: 'analytics@test' }, catalog: structuredClone(MOCK_MARKETS_STATE), command: { type: 'exchange', source: 'EUR', target: 'USD', amount: 100, revision: MOCK_MARKETS_STATE.revision, pricing_version: 2 } };
  const state = applyWalletEvent(initialWallet(), event), s = view(state, [event]);
  assert.equal(s.movements.find(m => m.category === 'Exchange').description, 'EUR → USD exchange');
  assert.equal(s.cashflow.incoming_usd, '0.00'); assert.equal(s.cashflow.outgoing_usd, '1251.00');
});

test('card spending stays in native currencies; reversed and future payments never enter totals', () => {
  const card=cards();card.activity=[['a','USD','10.10','COMPLETED'],['b','EUR','20.20','COMPLETED'],['c','USD','7.00','PENDING'],['d','USD','80.00','REVERSED']].map(([id,currency,amount,status])=>({id,card_id:'card',merchant:'Test',category:'Shopping',amount,currency,status,occurred_at:now}));
  const s=view(initialWallet(),[],'30D',card);
  assert.equal(s.cards.spending.find(c=>c.currency==='USD').completed,'10.10');assert.equal(s.cards.spending.find(c=>c.currency==='USD').pending,'7.00');assert.equal(s.cards.spending.find(c=>c.currency==='EUR').completed,'20.20');
  assert.equal(s.cashflow.outgoing_usd,'1251.00');
});

test('strict transport rejects corrupt quantities, missing charts, mismatched totals and synthetic live history', () => {
  for (const alter of [s=>s.summary.net_worth_usd='0.00',s=>s.positions[0].quantity='NaN',s=>s.positions[0].price_history=undefined,s=>s.positions.push(s.positions[0]),s=>s.mode='http',s=>s.cashflow.incoming_usd='0.001',s=>s.history=[]]) {
    const s=view();alter(s);assert.throws(()=>parseAnalyticsSnapshot(s),/Invalid analytics/);
  }
});

test('authenticated HTTP repository uses the requested period, validates response and never falls back to demo', async () => {
  const keys=['NEXT_PUBLIC_ANALYTICS_MODE','NEXT_PUBLIC_TRANSFERS_MODE','NEXT_PUBLIC_CARDS_MODE','NEXT_PUBLIC_ANALYTICS_API_URL']; const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]])), oldFetch=global.fetch;
  try {
    Object.assign(process.env,{NEXT_PUBLIC_ANALYTICS_MODE:'http',NEXT_PUBLIC_TRANSFERS_MODE:'http',NEXT_PUBLIC_CARDS_MODE:'http',NEXT_PUBLIC_ANALYTICS_API_URL:'https://api.example.test'});
    const data=view();data.mode='http';data.demo_history=[];
    global.fetch=async(url,options)=>{assert.equal(url,'https://api.example.test/v1/me/analytics?period=30D');assert.equal(options.credentials,'include');assert.equal(options.cache,'no-store');return {ok:true,json:async()=>data};};
    const repo=createAnalyticsRepository('user@test');assert.equal((await repo.getSnapshot('30D')).mode,'http');
    global.fetch=async()=>({ok:false,status:503,json:async()=>({error:{message:'Service unavailable'}})});await assert.rejects(()=>repo.getSnapshot('30D'),/Service unavailable/);
    process.env.NEXT_PUBLIC_ANALYTICS_MODE='demo';assert.throws(()=>createAnalyticsRepository('user@test'),/same service mode/);
  }finally{for(const k of keys) if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];global.fetch=oldFetch;}
});

test('CSV export escapes formulas and clearly separates demo trends, actual observations, native cards and businesses', () => {
  const s=view();s.positions[0].name='=HYPERLINK("evil")';s.businesses[0].name='-1+2';const csv=analyticsReport(s);
  assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes("'-1+2"));assert.ok(csv.includes('Observed history UTC'));assert.ok(csv.includes('Illustrative demo trend'));assert.ok(csv.includes('excluded from personal net worth'));
});
