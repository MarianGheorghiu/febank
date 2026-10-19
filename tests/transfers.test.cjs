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
const { transferSeed } = require('../app/lib/transfers/seed.ts');
const { units, decimal, buildQuote, applyTransfer, cancelTransfer, refreshLimits, estimateFee } = require('../app/lib/transfers/engine.ts');
const { createDemoTransferRepository, createHttpTransferRepository, getDemoAdminTransfers } = require('../app/lib/transfers/repository.ts');
const now = '2026-10-19T12:00:00Z';
const draft = { source_account_id:'account-USD', route_id:'route-USD', amount:'100.10', recipient_name:'Demo Recipient', destination:'DE89 3704 0044 0532 0130 00', reference:'Invoice' };
const seed = () => refreshLimits(transferSeed(), now);
test('JSON DTOs contain exact decimals; fees and 18-digit quantities never use float arithmetic', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(seed())), seed());
  assert.equal(decimal(units('0.000000000000000001',18) + units('0.000100000000000000',18),18), '0.000100000000000001');
  for (const value of ['1e3', '-1', 'NaN', 'Infinity', '1,000', '', '0.001']) assert.throws(() => units(value,2));
  const q = buildQuote(seed(), draft, 'quote', now);
  assert.equal(q.total, '101.21'); assert.equal(q.value_usd, '101.21');
  assert.equal(q.draft.destination, 'DE89370400440532013000');
});
test('quote validates balances including fees, routes, IBAN, phone, network, custody and precision', () => {
  for (const change of [{amount:'0'}, {amount:'142350.80'}, {amount:'0.001'}, {recipient_name:'  '}, {destination:'DE00370400440532013000'}, {route_id:'route-BTC'}, {reference:'x'.repeat(141)}]) assert.throws(() => buildQuote(seed(), {...draft,...change}, 'q',now));
  const phone = {...draft,route_id:'phone-USD',destination:'+40712345678'};
  assert.equal(buildQuote(seed(),phone,'q',now).fee, '0.10');
  assert.throws(() => buildQuote(seed(),{...phone,destination:'0712'},'q',now));
  const eth = {...draft,source_account_id:'account-ETH', route_id:'route-ETH', amount:'0.000000000000000001',destination:'0x'+'a'.repeat(40)};
  const q = buildQuote(seed(),eth,'q',now); assert.equal(q.total, '0.000100000000000002'); assert.equal(q.value_usd, '0.39');
  assert.throws(() => buildQuote(seed(),{...eth,destination:'bc1-wrong-chain'},'q',now));
  assert.throws(() => buildQuote(seed(),{...draft,source_account_id:'account-TSLA',route_id:'route-TSLA',amount:'1.5',destination:'DTC-9902'},'q',now));
});
test('submission reserves amount and fee, cancellation refunds exactly once, no source mutation', () => {
  const base = seed(); const quote = buildQuote(base,draft,'q',now);
  const next = applyTransfer(base,quote,'new-transfer',now);
  assert.equal(next.accounts[0].available,'142249.59'); assert.equal(next.accounts[0].reserved,'101.21');
  assert.equal(next.limits.used,'101.21'); assert.equal(next.transfers[0].status,'pending');
  assert.equal(base.accounts[0].available,'142350.80');
  const cancelled = cancelTransfer(next,'new-transfer',now);
  assert.equal(cancelled.accounts[0].available,'142350.80'); assert.equal(cancelled.accounts[0].reserved,'0.00'); assert.equal(cancelled.limits.used,'0.00');
  assert.equal(cancelled.transfers[0].status,'cancelled');
  assert.throws(() => cancelTransfer(cancelled,'new-transfer',now));
  assert.throws(() => cancelTransfer(base,base.transfers[0].id,now));
});
test('daily limits are enforced atomically; rollover, quote expiry and altered fees are rejected', () => {
  const base = seed(); base.limits.daily_limit='101.21';
  const q=buildQuote(base,draft,'q',now); const next=applyTransfer(base,q,'new',now);
  assert.throws(() => buildQuote(next,draft,'q2',now), /daily limit/);
  assert.equal(refreshLimits(next,'2026-10-20T00:00:00Z').limits.used,'0.00');
  assert.equal(q.expires_at, '2026-10-19T12:10:00.000Z');
  assert.equal(applyTransfer(base,q,'new','2026-10-19T12:09:59Z').transfers[0].status, 'pending');
  assert.throws(() => applyTransfer(base,q,'new','2026-10-19T12:10:00Z'), /expired/);
  assert.throws(() => applyTransfer(base,{...q,fee:'0'},'new',now), /changed/);
});
test('repository preserves customer isolation, replay, idempotency, admin projection and persistence failure', async () => {
  const data=new Map(); const events=[];
  global.window={ dispatchEvent:event => events.push(event.type) };
  global.sessionStorage={ getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),key:i=>[...data.keys()][i],get length(){return data.size;} };
  try {
    const repo=createDemoTransferRepository('customer-a'); const q=await repo.quote(draft);
    const first=await repo.submit(q.id,'operation-123'); const duplicate=await repo.submit(q.id,'operation-123');
    assert.equal(first.transfers.length, duplicate.transfers.length);
    assert.equal((await createDemoTransferRepository('customer-a').getSnapshot()).accounts[0].reserved,'101.21');
    assert.equal((await createDemoTransferRepository('customer-b').getSnapshot()).accounts[0].reserved,'0');
    const monitor=await getDemoAdminTransfers(); assert.equal(monitor[0].snapshot.transfers[0].id,first.transfers[0].id);
    const q2=await repo.quote(draft); await assert.rejects(repo.submit(q2.id,'operation-123'), /already used/);
    await repo.cancel(first.transfers[0].id,'cancel-123'); await repo.cancel(first.transfers[0].id,'cancel-123');
    assert.equal((await repo.getSnapshot()).accounts[0].available,'142350.80');
    const original=sessionStorage.setItem; sessionStorage.setItem=()=>{throw new Error('Storage unavailable');};
    await assert.rejects(repo.submit(q2.id,'operation-456'),/Storage unavailable/);
    sessionStorage.setItem=original; assert.equal((await repo.getSnapshot()).transfers.length,4);
    data.set('mbank_transfers_v1:broken','{corrupt'); await assert.rejects(createDemoTransferRepository('broken').getSnapshot());
    assert.ok(events.length>=2);
  } finally {delete global.window;delete global.sessionStorage;}
});
test('HTTP adapter uses authenticated endpoints, idempotency, abort and error envelope without mock fallback', async () => {
  const original=global.fetch; const calls=[];
  global.fetch=async (url,init)=>{ calls.push({url,init});return {ok:true,json:async()=>url.endsWith('/quotes') ? buildQuote(seed(),draft,'http-quote',now) : seed()};};
  try {
    const repo=createHttpTransferRepository('https://api.example/'); const controller=new AbortController();
    await repo.getSnapshot(controller.signal); await repo.quote(draft); await repo.submit('quote-123','idempotent-123'); await repo.cancel('transfer/123','cancel-123');
    assert.equal(calls[0].url,'https://api.example/v1/me/transfers'); assert.equal(calls[0].init.signal,controller.signal);
    assert.ok(calls.every(c=>c.init.credentials==='include'&&c.init.cache==='no-store'));
    assert.equal(calls[2].init.headers['Idempotency-Key'],'idempotent-123'); assert.deepEqual(JSON.parse(calls[2].init.body),{quote_id:'quote-123'});
    assert.equal(calls[3].url,'https://api.example/v1/me/transfers/transfer%2F123/cancel');
    global.fetch=async()=>({ok:false,status:409,json:async()=>({error:{code:'state_conflict',message:'Already processing'}})});
    await assert.rejects(repo.cancel('id','key'),/Already processing/);
    global.fetch=async()=>({ok:true,json:async()=>({...seed(),schema_version:2})});
    await assert.rejects(repo.getSnapshot(),/Unsupported/);
  } finally {global.fetch=original;}
});

test('live preview recalculates for every route, exact rounding, minimum and maximum', () => {
  const snapshot = seed();
  const preview = (asset, amount, phone=false) => estimateFee(snapshot, snapshot.accounts.find(a=>a.asset===asset), snapshot.routes.find(r=>r.id===`${phone?'phone':'route'}-${asset}`), amount);
  assert.equal(preview('USD','22222').amount,'23.23');
  assert.equal(preview('USD','22222',true).amount,'10.00');
  assert.equal(preview('USD','0.01',true).amount,'0.10');
  assert.equal(preview('EUR','1000').amount,'2.00');
  assert.equal(preview('RON','1000').amount,'6.00');
  assert.equal(preview('BTC','0.1').amount,'0.00007000');
  assert.equal(preview('ETH','2').amount,'0.001100000000000000');
  assert.equal(preview('SOL','2').amount,'0.001005000');
  assert.equal(preview('NVDA','10').amount,'14.80');
  assert.equal(preview('NVDA','22222').amount,'100.00');
  assert.equal(preview('TSLA','10').amount,'4.28');
  for (const route of snapshot.routes) {
    const account=snapshot.accounts.find(a=>a.asset===route.asset);
    const small=estimateFee(snapshot,account,route,'1');
    const large=estimateFee(snapshot,account,route,'10000');
    const feeAccount=snapshot.accounts.find(a=>a.id===large.account_id);
    assert.ok(units(large.amount,feeAccount.decimals)>units(small.amount,feeAccount.decimals),route.id);
    assert.ok(units(small.amount,feeAccount.decimals)>BigInt(0),route.id);
    assert.throws(()=>estimateFee(snapshot,account,route,'0'));
  }
});
test('stock fees reserve and refund USD independently of whole shares, including insufficient cash', () => {
  const base=seed();
  const input={...draft,source_account_id:'account-NVDA',route_id:'route-NVDA',amount:'10',destination:'DTC-9902'};
  const q=buildQuote(base,input,'stock-quote',now);
  assert.equal(q.fee,'14.80');assert.equal(q.fee_asset,'USD');assert.equal(q.fee_account_id,'account-USD');
  assert.equal(q.total,'10');assert.equal(q.value_usd,'12314.80');
  const submitted=applyTransfer(base,q,'stock-transfer',now);
  assert.equal(submitted.accounts.find(a=>a.asset==='NVDA').available,'20');
  assert.equal(submitted.accounts[0].available,'142336.00');assert.equal(submitted.accounts[0].reserved,'14.80');
  const refunded=cancelTransfer(submitted,'stock-transfer',now);
  assert.equal(refunded.accounts.find(a=>a.asset==='NVDA').available,'30');assert.equal(refunded.accounts[0].available,'142350.80');
  const poor=seed();poor.accounts[0].available='14.79';assert.throws(()=>buildQuote(poor,input,'q',now),/Insufficient USD/);
  const changed=seed();changed.routes.find(r=>r.id==='route-NVDA').fee_policy.rate_bps=20;
  assert.throws(()=>applyTransfer(changed,q,'new',now),/changed/);
});
test('legacy fixed-fee demo events replay without being repriced or erased', async () => {
  const legacy=seed();legacy.routes=legacy.routes.map(route=>({...route,fee_policy:undefined}));
  const old=buildQuote(legacy,draft,'old-quote',now);delete old.fee_asset;delete old.fee_account_id;
  assert.equal(old.fee,'1.00');assert.equal(old.total,'101.10');
  const replayed=applyTransfer(seed(),old,'legacy-transfer',now);
  assert.equal(replayed.accounts[0].available,'142249.70');
  assert.equal(cancelTransfer(replayed,'legacy-transfer',now).accounts[0].available,'142350.80');
});
