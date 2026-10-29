/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain test harness. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {MOCK_FLAGS_CONFIG:fixture,CONFIG_SETTINGS,CONFIG_FLAGS}=require('../app/lib/mock/admin/flags-config.ts');
const {validatePayload,validConfigState,configChanges,publishConfig,evaluateFlag,rolloutBucket}=require('../app/lib/flags-config/engine.ts');
const {configAuditEvents}=require('../app/lib/flags-config/audit.ts');
const {validEvent}=require('../app/lib/audit/engine.ts');
const actor={email:'demo@admin.com',role:'admin'};
function request(){const payload=structuredClone(fixture.environments.sandbox.published);payload.settings['identity.session_minutes']=45;return {environment:'sandbox',expected_revision:1,payload,reason:'Adjust inactivity timeout for sandbox testing.',actor};}
test('catalog covers every domain, unique keys and independent valid environment defaults',()=>{
  assert.equal(validConfigState(fixture),true);
  assert.equal(new Set(CONFIG_SETTINGS.map(s=>s.module)).size,12);
  assert.equal(new Set(CONFIG_SETTINGS.map(s=>s.key)).size,CONFIG_SETTINGS.length);
  assert.equal(new Set(CONFIG_FLAGS.map(f=>f.key)).size,CONFIG_FLAGS.length);
  for(const value of Object.values(fixture.environments))assert.deepEqual(validatePayload(value.published),[]);
  const copy=structuredClone(fixture);copy.environments.sandbox.published.flags.instant_transfers.enabled=false;assert.equal(copy.environments.production.published.flags.instant_transfers.enabled,true);
});
test('validation rejects unknown and missing keys, invalid types, decimals and unsafe bounds',()=>{
  for(const value of ['',null,NaN,Infinity,4,121,30.5]){const payload=structuredClone(fixture.environments.production.published);payload.settings['identity.session_minutes']=value;assert.ok(validatePayload(payload).length);}
  const payload=structuredClone(fixture.environments.production.published);delete payload.settings['identity.admin_mfa'];payload.settings.unknown=true;assert.ok(validatePayload(payload).length);
  payload.settings['platform.base_currency']='BTC';assert.ok(validatePayload(payload).length);
  for(const pct of [-1,101,12.5,NaN]){const p=structuredClone(fixture.environments.production.published);p.flags.instant_transfers.rollout_pct=pct;assert.ok(validatePayload(p).length);}
});
test('dependent flags and cross-field payment thresholds are validated',()=>{
  const p=structuredClone(fixture.environments.production.published);p.flags.virtual_cards.enabled=false;p.flags.disposable_cards.enabled=true;assert.ok(validatePayload(p).some(e=>e.includes('requires')));
  p.settings['transfers.review_minor']=p.settings['transfers.daily_limit_minor']+1;assert.ok(validatePayload(p).some(e=>e.includes('threshold')));
});
test('publish records immutable snapshots, isolates environments and creates audit-compatible history',()=>{
  const req=request(),next=publishConfig(fixture,req,'release-1','2026-10-12T12:00:00Z');
  assert.equal(next.environments.sandbox.revision,2);assert.equal(fixture.environments.sandbox.revision,1);assert.equal(next.environments.production.revision,fixture.environments.production.revision);
  assert.equal(next.environments.sandbox.releases[0].before.settings['identity.session_minutes'],30);
  req.payload.settings['identity.session_minutes']=60;assert.equal(next.environments.sandbox.published.settings['identity.session_minutes'],45);
  assert.equal(configChanges(fixture.environments.sandbox.published,next.environments.sandbox.published).length,1);
  assert.equal(validConfigState(JSON.parse(JSON.stringify(next))),true);
  const events=configAuditEvents(next).filter(e=>e.target==='flags-config:sandbox');assert.equal(events.length,1);assert.ok(validEvent(events[0]));assert.equal(events[0].target,'flags-config:sandbox');
});
test('publication blocks unauthorized actors, stale revisions, missing reasons and production security weakening',()=>{
  assert.throws(()=>publishConfig(fixture,{...request(),actor:{...actor,role:'client'}},'x','2026-10-12T12:00:00Z'),/Administrator/);
  assert.throws(()=>publishConfig(fixture,{...request(),expected_revision:0},'x','2026-10-12T12:00:00Z'),/newer revision/);
  assert.throws(()=>publishConfig(fixture,{...request(),reason:'short'},'x','2026-10-12T12:00:00Z'),/reason/);
  const req=request();req.environment='production';req.expected_revision=fixture.environments.production.revision;req.payload.settings['identity.admin_mfa']=false;assert.throws(()=>publishConfig(fixture,req,'x','2026-10-12T12:00:00Z'),/Production requires/);
  const same=request();same.payload=structuredClone(fixture.environments.sandbox.published);assert.throws(()=>publishConfig(fixture,same,'x','2026-10-12T12:00:00Z'),/no changes/);
});
test('restoration is a new validated release referencing an existing pre-release snapshot',()=>{
  const next=publishConfig(fixture,request(),'release-1','2026-10-12T12:00:00Z');
  const restore={...request(),expected_revision:2,payload:next.environments.sandbox.releases[0].before,restored_from:'release-1'};
  const restored=publishConfig(next,restore,'release-2','2026-10-12T12:05:00Z');
  assert.equal(restored.environments.sandbox.revision,3);assert.equal(restored.environments.sandbox.published.settings['identity.session_minutes'],30);assert.equal(validConfigState(restored),true);
  assert.equal(configAuditEvents(restored).find(e=>e.target==='flags-config:sandbox').action,'CONFIG_RESTORED');
  assert.throws(()=>publishConfig(next,{...restore,restored_from:'missing'},'x','2026-10-12T12:05:00Z'),/Restoration/);
  const corrupt=structuredClone(restored);corrupt.environments.sandbox.releases[0].after.settings['identity.session_minutes']=50;assert.equal(validConfigState(corrupt),false);
});
test('rollout is stable, audience gated, monotonic and handles exact zero/100% boundaries',()=>{
  const p=structuredClone(fixture.environments.production.published);
  assert.equal(rolloutBucket('instant_transfers','customer-1'),rolloutBucket('instant_transfers','customer-1'));
  for(const pct of [0,25,100]){p.flags.instant_transfers.rollout_pct=pct;let enabled=0;for(let i=0;i<1000;i++){const result=evaluateFlag(p,'instant_transfers',`customer-${i}`,'all');if(result.enabled)enabled++;assert.equal(result.enabled,rolloutBucket('instant_transfers',`customer-${i}`)<pct*100);}if(pct===0)assert.equal(enabled,0);if(pct===100)assert.equal(enabled,1000);if(pct===25)assert.ok(enabled>150&&enabled<350);}
  p.flags.instant_transfers.audience='premium';assert.equal(evaluateFlag(p,'instant_transfers','customer-1','all').enabled,false);assert.equal(evaluateFlag(p,'instant_transfers','customer-1','premium').enabled,true);
  assert.equal(evaluateFlag(p,'missing','customer-1','all').enabled,false);assert.equal(evaluateFlag(p,'instant_transfers','','premium').enabled,false);
});
test('master controls, maintenance and parent audience gates override feature rollout',()=>{
  const p=structuredClone(fixture.environments.production.published);p.flags.disposable_cards.enabled=true;p.flags.virtual_cards.audience='premium';
  assert.equal(evaluateFlag(p,'disposable_cards','customer-1','all').enabled,false);
  assert.equal(evaluateFlag(p,'disposable_cards','customer-1','premium').enabled,true);
  p.settings['cards.issuing_enabled']=false;assert.equal(evaluateFlag(p,'disposable_cards','customer-1','premium').enabled,false);
  p.settings['platform.maintenance']=true;assert.equal(evaluateFlag(p,'instant_transfers','customer-1','all').enabled,false);
});
test('repository persists releases, rejects stale requests and preserves corrupt or unwritable storage',async()=>{
  const entries=new Map();
  global.localStorage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
  const {mockConfigRepository:repository,CONFIG_STORAGE_KEY:key}=require('../app/lib/flags-config/repository.ts');
  const initial=await repository.getSnapshot();assert.equal(initial.environments.sandbox.revision,1);
  const saved=await repository.publish(request());assert.equal(saved.environments.sandbox.revision,2);
  assert.equal(JSON.parse(entries.get(key)).environments.sandbox.releases.length,1);
  await assert.rejects(repository.publish(request()),/newer revision/);
  const raw=entries.get(key);global.localStorage.setItem=()=>{throw new Error('quota');};
  const change=request();change.expected_revision=2;change.payload.settings['identity.session_minutes']=60;
  await assert.rejects(repository.publish(change),/not published/);assert.equal(entries.get(key),raw);
  entries.set(key,'broken-json');await assert.rejects(repository.getSnapshot(),/invalid/);
  await assert.rejects(repository.publish(change));assert.equal(entries.get(key),'broken-json');
  delete global.localStorage;
});

const {createConfigRepository}=require('../app/lib/flags-config/repository.ts');
const {parseConfigSnapshot,parsePublication}=require('../app/lib/flags-config/response.ts');
const {simulateFlagCohorts}=require('../app/lib/flags-config/engine.ts');
const {assertGlobalConfig,assertWalletConfig}=require('../app/lib/flags-config/runtime.ts');
const {readConfigDraft,saveConfigDraft}=require('../app/lib/flags-config/draft.ts');
function browser() {
  const local=new Map(),session=new Map(),events=[];
  global.window={dispatchEvent:e=>events.push(e.type)};
  global.localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)};
  global.sessionStorage={getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k),key:i=>[...session.keys()][i]??null,get length(){return session.size;}};
  return {local,session,events,close(){delete global.window;delete global.localStorage;delete global.sessionStorage;}};
}
test('history is order-independent on the JSON wire and rejects altered chains, duplicate IDs and receipt references',()=>{
  const reordered=structuredClone(fixture);
  for(const env of Object.values(reordered.environments)){env.published.settings=Object.fromEntries(Object.entries(env.published.settings).reverse());}
  assert.ok(validConfigState(reordered));
  for(const mutate of [s=>s.environments.production.releases[0].after.settings['identity.session_minutes']=61,s=>s.environments.production.releases[1].id=s.environments.production.releases[0].id,s=>s.environments.production.releases[0].reason='short',s=>s.receipts=[{request_id:'orphan',fingerprint:'test',release_id:'missing'}]]){const s=structuredClone(fixture);mutate(s);assert.equal(validConfigState(s),false);}
  const snap={schema_version:2,catalog_version:1,scope:'GLOBAL',mode:'demo',snapshot_id:'config-test',as_of:'2026-10-29T12:00:00Z',state:fixture,permissions:{publish:true,export:true}};
  assert.doesNotThrow(()=>parseConfigSnapshot(snap));
  for(const mutate of [r=>r.scope='CUSTOMER',r=>r.catalog_version=2,r=>r.permissions.publish='yes',r=>r.as_of='2026-10-01T00:00:00Z']){const s=structuredClone(snap);mutate(s);assert.throws(()=>parseConfigSnapshot(s),/configuration|cutoff/);}
});
test('demo publication is idempotent, shared across administrators, atomic with release audit and replay-authorized',async()=>{
  const env=browser();try{
    const repo=createConfigRepository(actor),before=await repo.getSnapshot(),payload=structuredClone(before.state.environments.sandbox.published);payload.settings['identity.session_minutes']=45;
    const command={request_id:'config-global-publish-01',catalog_version:1,environment:'sandbox',expected_revision:1,payload,reason:'Validate the shared configuration publication.',restored_from:null};
    const first=await repo.publish(command),retry=await repo.publish(command);
    assert.equal(first.state.environments.sandbox.revision,2);assert.equal(retry.state.environments.sandbox.revision,2);
    assert.equal(first.state.environments.sandbox.releases[0].request_id,command.request_id);
    assert.equal(configAuditEvents(first.state).filter(e=>e.requestId===command.request_id).length,1);
    const other=await createConfigRepository({...actor,email:'second@admin.com'}).getSnapshot();assert.equal(other.state.environments.sandbox.published.settings['identity.session_minutes'],45);assert.ok(env.events.includes('mbank:config-updated'));
    await assert.rejects(()=>repo.publish({...command,reason:'Different command with a reused request ID.'}),/Idempotency/);
    const {mockConfigRepository}=require('../app/lib/flags-config/repository.ts');
    await assert.rejects(()=>mockConfigRepository.publish({...command,restored_from:undefined,actor:{...actor,role:'client'}}),/Administrator/);
    const raw=env.local.get('mbank_flags_config_v1');global.localStorage.setItem=()=>{throw Error('quota')};
    await assert.rejects(()=>repo.publish({...command,request_id:'config-quota',expected_revision:2,payload:{...payload,settings:{...payload.settings,'identity.session_minutes':60}}}),/not published/);assert.equal(env.local.get('mbank_flags_config_v1'),raw);
    assert.throws(()=>parsePublication({...first,state:fixture},command),/does not match/);
  }finally{env.close();}
});
test('existing demo values survive history enrichment and invalid configuration never falls back during execution',async()=>{
  const env=browser();try{
    const baseline=structuredClone(fixture);baseline.environments.production={revision:1,published:structuredClone(fixture.environments.production.published),releases:[]};
    env.local.set('mbank_flags_config_v1',JSON.stringify(baseline));
    const repo=createConfigRepository(actor),snapshot=await repo.getSnapshot();
    assert.deepEqual(snapshot.state.environments.production.published,baseline.environments.production.published);assert.equal(snapshot.state.environments.production.releases.length,30);
    assert.equal(JSON.parse(env.local.get('mbank_flags_config_v1')).environments.production.revision,1);
    baseline.environments.production.published.settings['communications.rate_limit']=8;env.local.set('mbank_flags_config_v1',JSON.stringify(baseline));
    assert.equal((await repo.getSnapshot()).state.environments.production.revision,1);
    env.local.set('mbank_flags_config_v1','broken');await assert.rejects(()=>repo.getSnapshot(),/invalid/);assert.throws(()=>assertGlobalConfig('crypto'));assert.equal(env.local.get('mbank_flags_config_v1'),'broken');
  }finally{env.close();}
});
test('production maintenance and module masters gate new demo commits while staging, retries and protective actions remain isolated',()=>{
  const env=browser();try{
    const state=structuredClone(fixture);state.environments.staging.published.settings['platform.maintenance']=true;state.environments.staging={revision:1,published:state.environments.staging.published,releases:[]};env.local.set('mbank_flags_config_v1',JSON.stringify(state));
    assert.doesNotThrow(()=>assertGlobalConfig('crypto'));
    state.environments.production={revision:1,published:structuredClone(fixture.environments.production.published),releases:[]};state.environments.production.published.settings['platform.maintenance']=true;env.local.set('mbank_flags_config_v1',JSON.stringify(state));
    assert.throws(()=>assertGlobalConfig('crypto'),/maintenance/);
    assert.doesNotThrow(()=>assertWalletConfig({kind:'cancel'},'customer@test.com'));
    assert.doesNotThrow(()=>assertWalletConfig({kind:'trading',command:{type:'cancel_order'}},'customer@test.com'));
    assert.doesNotThrow(()=>assertWalletConfig({kind:'credit',command:{action:'repay_loan'}},'customer@test.com'));
    assert.throws(()=>assertWalletConfig({kind:'credit',command:{action:'apply'}},'customer@test.com'),/maintenance/);
    state.environments.production.published.settings['platform.maintenance']=false;state.environments.production.published.settings['crypto.trading_enabled']=false;env.local.set('mbank_flags_config_v1',JSON.stringify(state));assert.throws(()=>assertGlobalConfig('crypto'),/paused/);assert.doesNotThrow(()=>assertGlobalConfig('stocks'));
    state.environments.production.published.flags.virtual_cards.enabled=false;env.local.set('mbank_flags_config_v1',JSON.stringify(state));assert.throws(()=>assertGlobalConfig('cards','virtual_cards','customer@test.com'),/Feature unavailable/);
  }finally{env.close();}
});
test('simulated cohorts are deterministic, audience-gated and monotonic; maintenance overrides every example',()=>{
  const published=structuredClone(fixture.environments.production.published),draft=structuredClone(published);
  draft.flags.new_onboarding.rollout_pct=60;
  const first=simulateFlagCohorts(published,draft,'new_onboarding',1000);assert.deepEqual(first,simulateFlagCohorts(published,draft,'new_onboarding',1000));
  for(const cohort of first){assert.ok(cohort.before_count>150&&cohort.before_count<350);assert.ok(cohort.after_count>=cohort.before_count);assert.equal(cohort.after_pct,cohort.after_count/10);}
  const restricted=simulateFlagCohorts(published,draft,'premium_offers',1000);assert.equal(restricted.find(c=>c.audience==='premium').after_count,1000);assert.equal(restricted.find(c=>c.audience==='all').after_count,0);
  draft.settings['platform.maintenance']=true;assert.ok(simulateFlagCohorts(published,draft,'new_onboarding',100).every(c=>c.after_count===0));assert.throws(()=>simulateFlagCohorts(published,draft,'new_onboarding',5001),/simulation size/);
});
test('draft persistence is operator-scoped, restores its comparison baseline and preserves malformed saved data',()=>{
  const env=browser();try{
    const draft={environment:'sandbox',revision:1,base:structuredClone(fixture.environments.sandbox.published),payload:request().payload,restored_from:null};
    saveConfigDraft(actor.email,draft);assert.deepEqual(readConfigDraft(actor.email).draft,draft);assert.equal(readConfigDraft('another@admin.com').draft,null);
    env.session.set([...env.session.keys()][0],'broken');assert.ok(readConfigDraft(actor.email).warning);assert.equal([...env.session.values()][0],'broken');
    saveConfigDraft(actor.email,null);assert.equal(readConfigDraft(actor.email).draft,null);
  }finally{env.close();}
});
test('configuration exports retain the reviewed global snapshot and require matching audited checksum receipts',async()=>{
  const env=browser();try{
    const repo=createConfigRepository(actor),snapshot=await repo.getSnapshot();
    const cmd={request_id:'config-export-test-01',snapshot_id:snapshot.snapshot_id,environment:'production',revision:snapshot.state.environments.production.revision,reason:'Operational configuration review.',content_sha256:'a'.repeat(64)};
    const receipt=await repo.recordExport(cmd);assert.ok(receipt.audit_event_id);assert.deepEqual(await repo.recordExport(cmd),receipt);
    const raw=env.local.get('mbank_audit_journal_v1');assert.equal(JSON.parse(raw).events[0].after.content_sha256,cmd.content_sha256);
    global.localStorage.setItem=()=>{throw Error('quota')};await assert.rejects(()=>repo.recordExport({...cmd,request_id:'config-export-quota'}),/No audit changes/);assert.equal(env.local.get('mbank_audit_journal_v1'),raw);
  }finally{env.close();}
});
test('Go transport uses authenticated global snapshots, cancellation and idempotent releases without browser storage fallback',async()=>{
  const oldFetch=global.fetch,oldMode=process.env.NEXT_PUBLIC_FLAGS_CONFIG_MODE;const env=browser();try{
    const demo=await createConfigRepository(actor).getSnapshot(),live={...demo,mode:'live'};process.env.NEXT_PUBLIC_FLAGS_CONFIG_MODE='http';
    global.localStorage.getItem=()=>{throw Error('local read forbidden')};
    const calls=[];global.fetch=async(url,init)=>{calls.push({url,init});return{ok:true,json:async()=>live};};
    const repo=createConfigRepository(actor),controller=new AbortController();await repo.getSnapshot(controller.signal);assert.equal(calls[0].url,'/v1/admin/config/snapshot');assert.equal(calls[0].init.credentials,'include');assert.equal(calls[0].init.cache,'no-store');assert.equal(calls[0].init.signal,controller.signal);
    assert.throws(()=>createConfigRepository({...actor,role:'client'}),/Administrator/);
    const payload=structuredClone(fixture.environments.sandbox.published);payload.settings['identity.session_minutes']=45;
    const cmd={request_id:'go-config-release-01',catalog_version:1,environment:'sandbox',expected_revision:1,payload,reason:'Publish a reviewed global configuration.',restored_from:null};
    const state=publishConfig(fixture,{...cmd,restored_from:undefined,actor},'go-release-1','2026-10-29T10:00:00Z');
    global.fetch=async(url,init)=>{calls.push({url,init});return{ok:true,json:async()=>({...live,state})};};await repo.publish(cmd);assert.equal(calls.at(-1).url,'/v1/admin/config/sandbox/releases');assert.equal(calls.at(-1).init.headers['Idempotency-Key'],cmd.request_id);assert.equal(JSON.parse(calls.at(-1).init.body).actor,undefined);
    global.fetch=async()=>({ok:true,json:async()=>demo});await assert.rejects(()=>repo.getSnapshot(),/Expected live/);
    global.fetch=async()=>({ok:false,status:409});await assert.rejects(()=>repo.publish(cmd),/newer revision/);
    global.fetch=async()=>({ok:false,status:503});await assert.rejects(()=>repo.getSnapshot(),/503/);
  }finally{global.fetch=oldFetch;if(oldMode===undefined)delete process.env.NEXT_PUBLIC_FLAGS_CONFIG_MODE;else process.env.NEXT_PUBLIC_FLAGS_CONFIG_MODE=oldMode;env.close();}
});
test('100 sandbox releases retain a coherent restorable chain without changing production',()=>{
  let state=structuredClone(fixture);
  for(let i=0;i<100;i++){
    const payload=structuredClone(state.environments.sandbox.published);payload.settings['identity.session_minutes']=i%2===0?45:60;
    state=publishConfig(state,{environment:'sandbox',expected_revision:state.environments.sandbox.revision,payload,actor,reason:`Exercise large release history number ${i+1}.`},`stress-release-${i}`,new Date(Date.parse('2026-10-29T12:00:00Z')+i*1000).toISOString());
  }
  assert.equal(state.environments.sandbox.releases.length,100);assert.equal(state.environments.sandbox.revision,101);assert.equal(validConfigState(state),true);assert.deepEqual(state.environments.production,fixture.environments.production);
});
test('real wallet retries survive a maintenance change but new writes fail without changing saved balances',()=>{
  const env=browser();try{
    const {commitWallet,readWallet}=require('../app/lib/wallet/store.ts');
    const event={kind:'overview',key:'global-config-wallet-01',at:new Date().toISOString(),operation:{id:'global-config-wallet-01',type:'deposit',amount:'10.00'}};
    const first=commitWallet('global-controls@example.test',event),saved=[...env.session.entries()];
    const state=structuredClone(fixture);state.environments.production={revision:1,releases:[],published:structuredClone(fixture.environments.production.published)};state.environments.production.published.settings['platform.maintenance']=true;env.local.set('mbank_flags_config_v1',JSON.stringify(state));
    const retry=commitWallet('global-controls@example.test',event);
    assert.deepEqual(retry.transfers.accounts.map(a=>[a.id,a.available,a.reserved]),first.transfers.accounts.map(a=>[a.id,a.available,a.reserved]));
    assert.deepEqual(retry.cash_operations,first.cash_operations);
    assert.throws(()=>commitWallet('global-controls@example.test',{...event,key:'global-config-wallet-02',operation:{...event.operation,id:'global-config-wallet-02'}}),/maintenance/);
    assert.deepEqual([...env.session.entries()],saved);assert.equal(readWallet('global-controls@example.test').events.length,1);
  }finally{env.close();}
});

test('premium feature eligibility uses the shared subscription registry rather than treating every customer as retail',()=>{
  const env=browser();try{
    const {SUBSCRIPTION_CUSTOMERS}=require('../app/lib/mock/admin/subscriptions.ts');
    const {customerMembership}=require('../app/lib/subscriptions/registry.ts');
    const premium=SUBSCRIPTION_CUSTOMERS.find(c=>customerMembership(c.email).tier!=='STANDARD');assert.ok(premium);
    const state=structuredClone(fixture);state.environments.production={revision:1,releases:[],published:structuredClone(fixture.environments.production.published)};
    state.environments.production.published.flags.virtual_cards.audience='premium';env.local.set('mbank_flags_config_v1',JSON.stringify(state));
    assert.doesNotThrow(()=>assertGlobalConfig('cards','virtual_cards',premium.email));
    assert.throws(()=>assertGlobalConfig('cards','virtual_cards','unmapped-customer@example.test'),/Restricted to premium/);
    env.local.set('mbank_subscriptions_v1','broken');assert.throws(()=>assertGlobalConfig('cards','virtual_cards',premium.email));
  }finally{env.close();}
});
