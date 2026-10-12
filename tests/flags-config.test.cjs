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
  assert.equal(next.environments.sandbox.revision,2);assert.equal(fixture.environments.sandbox.revision,1);assert.equal(next.environments.production.revision,1);
  assert.equal(next.environments.sandbox.releases[0].before.settings['identity.session_minutes'],30);
  req.payload.settings['identity.session_minutes']=60;assert.equal(next.environments.sandbox.published.settings['identity.session_minutes'],45);
  assert.equal(configChanges(fixture.environments.sandbox.published,next.environments.sandbox.published).length,1);
  assert.equal(validConfigState(JSON.parse(JSON.stringify(next))),true);
  const events=configAuditEvents(next);assert.equal(events.length,1);assert.ok(validEvent(events[0]));assert.equal(events[0].target,'flags-config:sandbox');
});
test('publication blocks unauthorized actors, stale revisions, missing reasons and production security weakening',()=>{
  assert.throws(()=>publishConfig(fixture,{...request(),actor:{...actor,role:'client'}},'x','2026-10-12T12:00:00Z'),/Administrator/);
  assert.throws(()=>publishConfig(fixture,{...request(),expected_revision:0},'x','2026-10-12T12:00:00Z'),/newer revision/);
  assert.throws(()=>publishConfig(fixture,{...request(),reason:'short'},'x','2026-10-12T12:00:00Z'),/reason/);
  const req=request();req.environment='production';req.payload.settings['identity.admin_mfa']=false;assert.throws(()=>publishConfig(fixture,req,'x','2026-10-12T12:00:00Z'),/Production requires/);
  const same=request();same.payload=structuredClone(fixture.environments.sandbox.published);assert.throws(()=>publishConfig(fixture,same,'x','2026-10-12T12:00:00Z'),/no changes/);
});
test('restoration is a new validated release referencing an existing pre-release snapshot',()=>{
  const next=publishConfig(fixture,request(),'release-1','2026-10-12T12:00:00Z');
  const restore={...request(),expected_revision:2,payload:next.environments.sandbox.releases[0].before,restored_from:'release-1'};
  const restored=publishConfig(next,restore,'release-2','2026-10-12T12:05:00Z');
  assert.equal(restored.environments.sandbox.revision,3);assert.equal(restored.environments.sandbox.published.settings['identity.session_minutes'],30);assert.equal(validConfigState(restored),true);
  assert.equal(configAuditEvents(restored)[0].action,'CONFIG_RESTORED');
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
