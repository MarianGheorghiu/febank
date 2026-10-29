/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain test harness. */
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {MOCK_SUBSCRIPTIONS:fixture,SUBSCRIPTION_CUSTOMERS:customers}=require('../app/lib/mock/admin/subscriptions.ts');
const {applySubscriptionCommand:apply,validSubscriptionState:valid,subscriptionMetrics:metrics}=require('../app/lib/subscriptions/engine.ts');
const {mockSubscriptionsRepository:repo,SUBSCRIPTIONS_STORAGE_KEY:key}=require('../app/lib/subscriptions/store.ts');
const actor={role:'admin',email:'ops@admin.com'};const now='2026-10-09T12:00:00.000Z';
const fresh=()=>structuredClone(fixture);
const sub=fixture.subscriptions.find(s=>s.status==='ACTIVE'&&customers.find(c=>c.id===s.customer_id)?.eligible&&!s.cancel_at_period_end);
const cmd=(action,extra={})=>({request_id:crypto.randomUUID(),action,subscription_id:sub.id,expected_version:sub.version,reason:'Reviewed customer request CASE-42.',...extra});
test('fixtures have valid money, relations and UTC DTOs',()=>{assert.ok(valid(fixture));assert.ok(fixture.invoices.length>50);assert.equal(valid({...fixture,subscriptions:[{...sub,price_minor:1.5}]}),false);});
test('operations atomically preserve before/after evidence and original state',()=>{const input=fresh();const next=apply(input,cmd('SUSPEND'),actor,now);assert.equal(next.subscriptions.find(s=>s.id===sub.id).status,'SUSPENDED');assert.equal(next.audit[0].before.status,'ACTIVE');assert.equal(next.audit[0].after.status,'SUSPENDED');assert.equal(input.audit.length,0);assert.ok(valid(next));});
test('roles, reasons, stale versions and invalid transitions are rejected',()=>{assert.throws(()=>apply(fresh(),cmd('SUSPEND'),{...actor,role:'client'},now),/Administrator/);assert.throws(()=>apply(fresh(),cmd('SUSPEND',{reason:'short'}),actor,now),/reason/);assert.throws(()=>apply(fresh(),cmd('SUSPEND',{expected_version:99}),actor,now),/changed/);assert.throws(()=>apply(fresh(),cmd('RESUME'),actor,now),/not allowed/);});
test('request idempotency preserves state and rejects payload reuse',()=>{const command=cmd('SUSPEND');const next=apply(fresh(),command,actor,now);assert.equal(apply(next,command,actor,now),next);assert.throws(()=>apply(next,{...command,reason:'A different valid reason'},actor,now),/Request ID/);});
test('plan changes only schedule next renewal; cancel clears pending change',()=>{const next=apply(fresh(),cmd('CHANGE_PLAN',{plan_id:sub.plan_id==='METAL'?'PREMIUM':'METAL',cycle:'ANNUAL'}),actor,now);const changed=next.subscriptions.find(s=>s.id===sub.id);assert.equal(changed.price_minor,sub.price_minor);assert.ok(changed.pending_change);assert.deepEqual(next.invoices,fixture.invoices);const canceled=apply(next,cmd('CANCEL_AT_RENEWAL',{expected_version:changed.version}),actor,now).subscriptions.find(s=>s.id===sub.id);assert.equal(canceled.cancel_at_period_end,true);assert.equal(canceled.pending_change,null);assert.equal(canceled.status,'ACTIVE');});
test('retry records a queue request without collection and prevents duplicate retry',()=>{const invoice=fixture.invoices.find(i=>i.status==='FAILED');const s=fixture.subscriptions.find(s=>s.id===invoice.subscription_id);const command=cmd('RETRY_PAYMENT',{subscription_id:s.id,expected_version:s.version,invoice_id:invoice.id});const next=apply(fresh(),command,actor,now);const changed=next.invoices.find(i=>i.id===invoice.id);assert.equal(changed.status,'FAILED');assert.equal(changed.paid_at,null);assert.equal(changed.retry_requested_at,now);assert.throws(()=>apply(next,{...command,request_id:crypto.randomUUID(),expected_version:s.version+1},actor,now),/cannot be retried/);});
test('assignment rejects duplicate entitlement and ineligible customers',()=>{assert.throws(()=>apply(fresh(),cmd('ASSIGN',{customer_id:sub.customer_id,plan_id:'PREMIUM',cycle:'MONTHLY'}),actor,now),/already/);assert.throws(()=>apply(fresh(),cmd('ASSIGN',{customer_id:customers.find(c=>!c.eligible).id,plan_id:'PREMIUM',cycle:'MONTHLY'}),actor,now),/verified/);});
test('MRR annual normalization excludes canceled and suspended contracts',()=>{const s={...sub,status:'ACTIVE',cycle:'ANNUAL',price_minor:12000};const result=metrics([s,{...s,id:'x',status:'CANCELED'},{...s,id:'y',status:'SUSPENDED'}],[],now);assert.equal(result.mrr,1000);assert.equal(result.arr,12000);assert.equal(result.overdue_minor,0);});
test('storage failures preserve prior state and corrupt data is never replaced',async()=>{const values=new Map();global.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};await repo.execute(cmd('SUSPEND'),actor);assert.ok(valid(JSON.parse(values.get(key))));const previous=values.get(key);global.localStorage.setItem=()=>{throw Error('quota')};await assert.rejects(()=>repo.execute(cmd('CANCEL_AT_RENEWAL',{expected_version:2}),actor),/No changes saved/);assert.equal(values.get(key),previous);values.set(key,'{broken');await assert.rejects(()=>repo.execute(cmd('SUSPEND'),actor),/No changes saved/);assert.equal(values.get(key),'{broken');});
test('assignment creates one eligible entitlement with an audited renewal anchor',()=>{const customer=customers.find(c=>c.eligible&&!fixture.subscriptions.some(s=>s.customer_id===c.id&&s.status!=='CANCELED'));const next=apply(fresh(),cmd('ASSIGN',{customer_id:customer.id,plan_id:'PREMIUM',cycle:'MONTHLY'}),actor,now);assert.equal(next.subscriptions[0].price_minor,999);assert.equal(next.subscriptions[0].period_end,'2026-11-01T12:00:00.000Z');assert.equal(next.audit[0].before,null);assert.ok(valid(next));});
test('resuming suspended benefits preserves past due debt',()=>{const debtor=fixture.subscriptions.find(s=>s.status==='PAST_DUE'&&customers.find(c=>c.id===s.customer_id)?.eligible);const suspend=cmd('SUSPEND',{subscription_id:debtor.id,expected_version:debtor.version});const next=apply(fresh(),suspend,actor,now);const resumed=apply(next,cmd('RESUME',{subscription_id:debtor.id,expected_version:debtor.version+1}),actor,now);assert.equal(resumed.subscriptions.find(s=>s.id===debtor.id).status,'PAST_DUE');assert.deepEqual(resumed.invoices,fixture.invoices);});

test('shared membership changes global execution pricing and never grants pending benefits',()=>{
 const values=new Map();global.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const {customerMembership}=require('../app/lib/subscriptions/registry.ts');
 const {customerRateTier}=require('../app/lib/rates/execution.ts');
 const paid=fixture.subscriptions.find(s=>s.status==='ACTIVE'&&s.plan_id!=='STANDARD'&&customers.find(c=>c.id===s.customer_id)?.eligible&&!s.cancel_at_period_end);
 const customer=customers.find(c=>c.id===paid.customer_id);
 assert.equal(customerRateTier(customer.email.toUpperCase()),paid.plan_id);
 const suspended=apply(fresh(),cmd('SUSPEND',{subscription_id:paid.id,expected_version:paid.version}),actor,now);
 values.set(key,JSON.stringify(suspended));assert.equal(customerRateTier(customer.email),'STANDARD');
 const scheduled=apply(fresh(),cmd('CHANGE_PLAN',{subscription_id:paid.id,expected_version:paid.version,plan_id:'STANDARD',cycle:'MONTHLY'}),actor,now);
 values.set(key,JSON.stringify(scheduled));assert.equal(customerMembership(customer.email).tier,paid.plan_id);
 values.set(key,'{corrupt');assert.throws(()=>customerRateTier(customer.email));
});

test('account eligibility revokes paid pricing even when subscription remains active',()=>{
 const values=new Map();global.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const {ensureManagedUser,readManagedUsers,USERS_KEY}=require('../app/lib/user-management/store.ts');
 const {customerMembership}=require('../app/lib/subscriptions/registry.ts');
 const paid=fixture.subscriptions.find(s=>s.status==='ACTIVE'&&s.plan_id!=='STANDARD'&&customers.find(c=>c.id===s.customer_id)?.eligible);
 const customer=customers.find(c=>c.id===paid.customer_id);ensureManagedUser(customer.email,customer.name,customer.id);
 const registry=readManagedUsers();registry.users.find(u=>u.login_email===customer.email).status='BLOCKED';values.set(USERS_KEY,JSON.stringify(registry));
 assert.equal(customerMembership(customer.email).tier,'STANDARD');
});

test('HTTP snapshot validates relationships without depending on local demo identities',()=>{
 const {decodeSubscriptionSnapshot}=require('../app/lib/subscriptions/repository.ts');
 const {SUBSCRIPTION_PLANS:plans}=require('../app/lib/mock/admin/subscriptions.ts');
 const state=fresh();state.subscriptions=state.subscriptions.map(s=>({...s,customer_id:`GO-${s.customer_id}`}));
 const snapshot={schema_version:1,mode:'live',as_of:now,state,customers:customers.map(c=>({...c,id:`GO-${c.id}`})),plans};
 assert.equal(decodeSubscriptionSnapshot(snapshot),snapshot);
 assert.throws(()=>decodeSubscriptionSnapshot({...snapshot,customers:[]}));
 assert.throws(()=>decodeSubscriptionSnapshot({...snapshot,plans:plans.map(p=>({...p,monthly_minor:0.5}))}));
});

test('Go adapter uses authenticated commands, preserves conflicts and never falls back to fixtures',async()=>{
 const previousMode=process.env.NEXT_PUBLIC_SUBSCRIPTIONS_MODE,previousFetch=global.fetch;
 process.env.NEXT_PUBLIC_SUBSCRIPTIONS_MODE='http';
 const {createSubscriptionsRepository}=require('../app/lib/subscriptions/repository.ts');
 const {SUBSCRIPTION_PLANS:plans}=require('../app/lib/mock/admin/subscriptions.ts');
 const calls=[];const snapshot={schema_version:1,mode:'live',as_of:now,state:fresh(),customers,plans};
 global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,status:200,json:async()=>snapshot};};
 try {
  assert.throws(()=>createSubscriptionsRepository({...actor,role:'client'}),/Administrator/);
  const source=createSubscriptionsRepository(actor);await source.getSnapshot();const command=cmd('SUSPEND');await source.execute(command);
  assert.equal(calls[1].init.credentials,'include');assert.equal(calls[1].init.cache,'no-store');assert.equal(calls[1].init.headers['Idempotency-Key'],command.request_id);
  const body=JSON.parse(calls[1].init.body);assert.equal(body.command.expected_version,sub.version);assert.equal(body.actor,undefined);
  global.fetch=async()=>({ok:false,status:409,json:async()=>({error:{message:'Version conflict'}})});
  await assert.rejects(()=>source.execute(command),/Version conflict/);
  global.fetch=async()=>({ok:true,status:200,json:async()=>({...snapshot,mode:'demo'})});await assert.rejects(()=>source.getSnapshot(),/live data/);
  const {readSubscriptions}=require('../app/lib/subscriptions/registry.ts');assert.throws(()=>readSubscriptions(),/backend/);
  global.fetch=async()=>({ok:true,status:204});await source.recordExport({request_id:'export-42',kind:'invoices',record_ids:[],expected_revision:0,as_of:now,filters:{}});
 } finally {global.fetch=previousFetch;if(previousMode===undefined)delete process.env.NEXT_PUBLIC_SUBSCRIPTIONS_MODE;else process.env.NEXT_PUBLIC_SUBSCRIPTIONS_MODE=previousMode;}
});
