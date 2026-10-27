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
const {initialWallet} = require('../app/lib/wallet/engine.ts');
const {readWallet} = require('../app/lib/wallet/store.ts');
const {buildQuote,applyTransfer,cancelTransfer,units} = require('../app/lib/transfers/engine.ts');
const {applyTransferAdmin,transferActions} = require('../app/lib/transactions/transfer-engine.ts');
const {createTransactionRepository} = require('../app/lib/transactions/repository.ts');
const {createDemoTransferRepository} = require('../app/lib/transfers/repository.ts');
const {createOverviewRepository} = require('../app/lib/overview/repository.ts');
const {readTransactionAudit} = require('../app/lib/transactions/audit.ts');
const {summarizeTransactions,filterTransactions,defaultTransactionFilters,transactionBuckets,transactionCsv,matchesTransactionQuery} = require('../app/lib/transactions/engine.ts');
const {parseTransactionSnapshot} = require('../app/lib/transactions/response.ts');
const {MOCK_RISK_STATE} = require('../app/lib/mock/admin/risk.ts');
const actor={email:'admin@admin.com',role:'admin'}, now='2026-10-27T10:00:00.000Z';
const draft={source_account_id:'account-USD',route_id:'route-USD',amount:'100.10',recipient_name:'Demo recipient',destination:'DE89370400440532013000',reference:'Admin transfer test'};
const usd=snapshot=>snapshot.accounts.find(a=>a.asset==='USD');
function browser(){
 const local=new Map(),session=new Map(),events=[];
 global.window={dispatchEvent:event=>events.push(event.type)};
 global.localStorage={getItem:key=>local.get(key)??null,setItem:(key,value)=>local.set(key,value)};
 global.sessionStorage={getItem:key=>session.get(key)??null,setItem:(key,value)=>session.set(key,value),key:i=>[...session.keys()][i],get length(){return session.size;}};
 return {local,session,events,close(){delete global.window;delete global.localStorage;delete global.sessionStorage;}};
}
function apply(snapshot,action,version,id='decision',transferId='trf-test') {return applyTransferAdmin(snapshot,{action,transfer_id:transferId,expected_version:version,reason:'Documented operational decision for test incident'},actor,now,id);}
function pending(input=draft,id='trf-test',state=initialWallet().transfers){return applyTransfer(state,buildQuote(state,input,'quote',now),id,now);}
test('hold, release, processing and settlement consume a reservation once and keep other reservations intact',()=>{
 const first=pending(), second=pending({...draft,amount:'200'},'trf-other',first);
 const before=structuredClone(second), held=apply(second,'HOLD',0);
 assert.equal(usd(held).available,usd(second).available);assert.equal(usd(held).reserved,usd(second).reserved);
 assert.equal(held.transfers[0].id,'trf-other');assert.equal(held.transfers.find(t=>t.id==='trf-test').review_hold,true);
 assert.throws(()=>cancelTransfer(held,'trf-test',now),/no longer/);assert.throws(()=>apply(held,'PROCESS',1),/unavailable/);
 const released=apply(held,'RELEASE',1), processing=apply(released,'PROCESS',2), settled=apply(processing,'SETTLE',3);
 assert.equal(settled.transfers.find(t=>t.id==='trf-test').status,'completed');
 assert.equal(usd(settled).available,usd(second).available);assert.equal(usd(settled).reserved,'201.20');
 assert.equal(settled.transfers.find(t=>t.id==='trf-test').admin_history.length,4);
 assert.deepEqual(second,before);assert.throws(()=>apply(settled,'REJECT',4),/unavailable/);
 assert.throws(()=>apply(second,'SETTLE',0),/unavailable/);assert.throws(()=>apply(held,'RELEASE',0),/changed/);
});
test('stock custody settlement and rejection account for a separate USD fee without touching other holds',()=>{
 const input={...draft,source_account_id:'account-AAPL',route_id:'route-AAPL',amount:'2.00000000',destination:'DTC-9902'};
 const value=pending(input), account=value.accounts.find(a=>a.asset==='AAPL');
 assert.equal(account.available,'23.00000000');assert.equal(account.reserved,'2.00000000');
 const rejected=apply(value,'REJECT',0);
 assert.equal(rejected.accounts.find(a=>a.asset==='AAPL').available,'25.00000000');assert.equal(usd(rejected).available,'142350.80');assert.equal(usd(rejected).reserved,'0.00');
 const settled=apply(apply(value,'PROCESS',0),'SETTLE',1);
 assert.equal(settled.accounts.find(a=>a.asset==='AAPL').available,'23.00000000');assert.equal(settled.accounts.find(a=>a.asset==='AAPL').reserved,'0.00000000');assert.equal(usd(settled).reserved,'0.00');assert.equal(usd(settled).available,usd(value).available);
});
test('mutation guards validate roles, reason, version, chronology and sufficient owned reservations',()=>{
 const value=pending(),command={action:'HOLD',transfer_id:'trf-test',expected_version:0,reason:'Document this investigation'};
 assert.throws(()=>applyTransferAdmin(value,command,{email:'client@example.test',role:'client'},now,'x'),/Administrator/);
 assert.throws(()=>applyTransferAdmin(value,{...command,reason:'short'},actor,now,'x'),/reason/);
 assert.throws(()=>applyTransferAdmin(value,{...command,expected_version:-1},actor,now,'x'),/Invalid/);
 assert.throws(()=>applyTransferAdmin(value,command,actor,'2026-10-26T00:00:00Z','x'),/timestamp/);
 const broken=structuredClone(value);usd(broken).reserved='0.00';assert.throws(()=>apply(broken,'REJECT',0),/Insufficient/);
 assert.deepEqual(transferActions({...value.transfers[0],status:'completed'}),[]);
});
test('global demo uses persisted customer journals, stable identities, coherent metrics/charts and bounded filters',async()=>{
 const env=browser();try{
  const repo=createTransactionRepository(actor), first=await repo.getSnapshot(), journals=JSON.stringify([...env.session]);
  assert.equal(first.transactions.length,36);assert.equal(first.customer_count,3);
  assert.ok(first.transactions.some(row=>row.status==='HELD'));assert.ok(first.transactions.some(row=>row.status==='PROCESSING'));
  const second=await repo.getSnapshot();assert.equal(JSON.stringify([...env.session]),journals);assert.deepEqual(first.transactions,second.transactions);
  assert.deepEqual(parseTransactionSnapshot(JSON.parse(JSON.stringify(first))),first);
  const summary=summarizeTransactions(first.transactions,first.as_of);
  assert.equal(summary.total_count,36);assert.equal(summary.held_count,6);assert.equal(summary.processing_count,6);
  const filtered=filterTransactions(first.transactions,{...defaultTransactionFilters,domain:'CRYPTO',status:'HELD'},first.as_of);assert.equal(filtered.length,2);assert.ok(filtered.every(r=>r.domain==='CRYPTO'&&r.status==='HELD'));
  const sorted=filterTransactions(first.transactions,{...defaultTransactionFilters,sort:'VALUE'},first.as_of);assert.ok(units(sorted[0].value_usd,2)>=units(sorted.at(-1).value_usd,2));
  assert.equal(transactionBuckets(first.transactions,first.as_of).length,7);
  assert.ok(readTransactionAudit().length>20);assert.ok(readTransactionAudit().every(event=>event.source==='TRANSACTIONS'));
  const bad=structuredClone(first);bad.transactions[0].value_usd='NaN';assert.throws(()=>parseTransactionSnapshot(bad),/Invalid/);
  const duplicate=structuredClone(first);duplicate.transactions.push(duplicate.transactions[0]);assert.throws(()=>parseTransactionSnapshot(duplicate),/Invalid/);
 }finally{env.close();}
});
test('admin decisions change the actual customer wallet and audit atomically, protect duplicates and reject stale review',async()=>{
 const env=browser();try{
  const customer='payments-test@example.test', client=createDemoTransferRepository(customer), repo=createTransactionRepository(actor);
  const quote=await client.quote(draft), sent=await client.submit(quote.id,'customer-transfer-1');
  const row=(await repo.getSnapshot()).transactions.find(r=>r.customer_id===customer);
  const command={action:'PROCESS',transfer_id:row.source_id,expected_version:0,reason:'External payment provider accepted this request'};
  const available=usd(sent).available;
  await repo.execute(customer,command,'admin-process-1');await repo.execute(customer,command,'admin-process-1');
  assert.equal((await client.getSnapshot()).transfers[0].status,'processing');assert.equal(usd(await client.getSnapshot()).available,available);
  await assert.rejects(repo.execute(customer,{...command,reason:'Different command under same idempotency key'},'admin-process-1'),/already used/);
  await assert.rejects(repo.execute(customer,{...command,action:'REJECT'},'stale-review-1'),/changed/);
  await repo.execute(customer,{...command,action:'SETTLE',expected_version:1},'admin-settle-1');
  assert.equal(usd(await client.getSnapshot()).reserved,'0.00');assert.equal((await createOverviewRepository(customer).getSnapshot()).summary.liquidity,available);
  const saved=readWallet(customer).events.filter(e=>e.kind==='transfer_admin');assert.equal(saved.length,2);
  assert.equal(readTransactionAudit().filter(e=>e.correlationId===row.source_id).length,2);
  await assert.rejects(createTransactionRepository({email:'client@example.test',role:'client'}).getSnapshot(),/Administrator/);
 }finally{env.close();}
});
test('risk stops and quota failures preserve financial state; refunds remain available during a stop',async()=>{
 const env=browser();try{
  const customer='risk-payment@example.test',client=createDemoTransferRepository(customer),repo=createTransactionRepository(actor);
  const q=await client.quote(draft);await client.submit(q.id,'risk-transfer-1');const id='trf-risk-transfer-1';
  const command={action:'PROCESS',transfer_id:id,expected_version:0,reason:'Provider processing with current risk checks'};
  const risk=structuredClone(MOCK_RISK_STATE);risk.policies[0].paused=true;env.local.set('mbank_risk_v1',JSON.stringify(risk));
  const before=JSON.stringify([...env.session]);await assert.rejects(repo.execute(customer,command,'risk-process-1'),/emergency stop/);assert.equal(JSON.stringify([...env.session]),before);
  const set=sessionStorage.setItem;sessionStorage.setItem=()=>{throw new Error('Quota exceeded');};
  await assert.rejects(repo.execute(customer,{...command,action:'REJECT'},'quota-reject-1'),/Quota/);assert.equal(JSON.stringify([...env.session]),before);sessionStorage.setItem=set;
  await repo.execute(customer,{...command,action:'REJECT'},'admin-reject-1');assert.equal(usd(await client.getSnapshot()).available,'142350.80');assert.equal((await client.getSnapshot()).transfers[0].status,'rejected');
 }finally{env.close();}
});
test('CSV exports the requested records, records data access and fails closed when audit cannot persist',async()=>{
 const env=browser();try{
  const repo=createTransactionRepository(actor),snapshot=await repo.getSnapshot(),row=snapshot.transactions[0];
  const blob=await repo.exportTransactions([row.id],'export-key-1');const csv=await blob.text();assert.equal(csv.trim().split('\r\n').length,2);
  assert.match(csv,/fee_usd/);assert.match(env.local.get('mbank_audit_journal_v1'),/TRANSACTIONS_EXPORTED/);
  assert.match(transactionCsv([{...row,counterparty:'=HYPERLINK("example")'}]),/'=HYPERLINK/);
  const set=localStorage.setItem;localStorage.setItem=()=>{throw new Error('Quota exceeded');};await assert.rejects(repo.exportTransactions([row.id],'export-key-2'),/audit|storage/i);localStorage.setItem=set;
 }finally{env.close();}
});
test('Go transport enforces shared mode, authenticated scope, idempotency, abort signal and no fallback',async()=>{
 const env=browser(),previous={fetch:global.fetch,mode:process.env.NEXT_PUBLIC_ADMIN_TRANSACTIONS_MODE,wallet:process.env.NEXT_PUBLIC_TRANSFERS_MODE};
 try{
  const fixture=await createTransactionRepository(actor).getSnapshot();fixture.mode='live';const calls=[];
  process.env.NEXT_PUBLIC_ADMIN_TRANSACTIONS_MODE='http';assert.throws(()=>createTransactionRepository(actor),/same service mode/);process.env.NEXT_PUBLIC_TRANSFERS_MODE='http';
  global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>fixture,headers:new Headers({'Content-Type':'text/csv'}),blob:async()=>new Blob(['id\r\nrecord'])};};
  const repo=createTransactionRepository(actor),controller=new AbortController();await repo.getSnapshot(controller.signal);
  assert.equal(calls[0].init.signal,controller.signal);assert.equal(calls[0].init.credentials,'include');assert.equal(calls[0].init.cache,'no-store');
  const command={action:'HOLD',transfer_id:'transfer/1',expected_version:4,reason:'Review unusual payment evidence'};await repo.execute('customer@example.test',command,'key-123456');
  assert.equal(calls[1].url,'/v1/admin/customers/customer%40example.test/transfers/transfer%2F1/decisions');assert.equal(calls[1].init.headers['Idempotency-Key'],'key-123456');assert.deepEqual(JSON.parse(calls[1].init.body),command);
  await repo.exportTransactions(['a'],'export-123456');assert.equal(calls[2].url,'/v1/admin/transactions/exports');
  global.fetch=async()=>({ok:false,status:409,json:async()=>({error:{message:'Transfer revision changed'}})});await assert.rejects(repo.execute('customer',command,'conflict-key'),/revision changed/);
  global.fetch=async()=>({ok:true,json:async()=>({...fixture,mode:'demo'})});await assert.rejects(repo.getSnapshot(),/live/);
 }finally{global.fetch=previous.fetch;if(previous.mode===undefined)delete process.env.NEXT_PUBLIC_ADMIN_TRANSACTIONS_MODE;else process.env.NEXT_PUBLIC_ADMIN_TRANSACTIONS_MODE=previous.mode;if(previous.wallet===undefined)delete process.env.NEXT_PUBLIC_TRANSFERS_MODE;else process.env.NEXT_PUBLIC_TRANSFERS_MODE=previous.wallet;env.close();}
});

test('global search matches every field, multiple terms, exact decimals, visible dates and audit notes',async()=>{
 const env=browser();try{
  const snapshot=await createTransactionRepository(actor).getSnapshot();
  const row=snapshot.transactions.find(item=>item.history.length&&item.domain==='FIAT');
  for(const query of [row.source_id.toUpperCase(),row.customer_id,row.destination,row.route,row.status,row.source,row.domain,row.amount,row.fee,row.created_at,row.history[0].actor,'demonstration settlement',`${row.domain} ${row.status} ${row.source_id}`,row.created_at.slice(0,10)]) {
   assert.ok(filterTransactions([row],{...defaultTransactionFilters,query},snapshot.as_of).length,query);
  }
  const accented={...row,counterparty:'Ștefan Ionescu'};assert.equal(filterTransactions([accented],{...defaultTransactionFilters,query:'stefan ionescu'},snapshot.as_of).length,1);
  assert.equal(filterTransactions([row],{...defaultTransactionFilters,query:'no-such-reference'},snapshot.as_of).length,0);
 }finally{env.close();}
});

test('card search scopes audit notes to the displayed decision and normalizes multi-field queries',async()=>{
 const env=browser();try{
  const snapshot=await createTransactionRepository(actor).getSnapshot();
  const row=snapshot.transactions.find(item=>item.history.length===2);
  const [first,second]=row.history;
  const original={...first,reason:'unique-first-investigation-note'};
  const later={...second,reason:'unique-second-settlement-evidence'};
  const updated={...row,history:[original,later]};
  assert.ok(matchesTransactionQuery(updated,'unique-first-investigation-note'));
  assert.ok(matchesTransactionQuery(updated,'unique-first-investigation-note',[original]));
  assert.equal(matchesTransactionQuery(updated,'unique-first-investigation-note',[later]),false);
  assert.ok(matchesTransactionQuery(updated,`${row.domain} ${row.asset} ${row.customer_id}`));
 }finally{env.close();}
});
