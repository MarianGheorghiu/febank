/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain integration harness. */
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), Module=require('node:module'), ts=require('typescript');
const resolve=Module._resolveFilename; Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args);};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {settingsSeed,applySettings,validPreferences,parseSettingsSnapshot}=require('../app/lib/settings/engine.ts');
const {readSettings,commitSettings}=require('../app/lib/settings/store.ts');
const {createSettingsRepository,parseSecurityRedirect}=require('../app/lib/settings/repository.ts');
const {settingsReport}=require('../app/lib/settings/report.ts');
const {DEFAULT_PREFERENCES}=require('../app/lib/settings/defaults.ts');
const {readWallet}=require('../app/lib/wallet/store.ts');
const now='2026-10-23T12:00:00.000Z';
const seed=()=>settingsSeed('Alex Popescu',{id:'current-browser',started_at:now});
const command=(state,action,fields={})=>({action,expected_version:state.version,...fields});
function browser(){const data=new Map(), events=[]; const storage=prefix=>({getItem:key=>data.get(prefix+key)??null,setItem:(key,value)=>data.set(prefix+key,value),removeItem:key=>data.delete(prefix+key),key:index=>[...data.keys()].filter(k=>k.startsWith(prefix))[index]?.slice(prefix.length)??null,get length(){return [...data.keys()].filter(k=>k.startsWith(prefix)).length;}});global.window={location:{origin:'https://bank.example'},dispatchEvent:event=>events.push(event.type),addEventListener:()=>{},removeEventListener:()=>{}};global.localStorage=storage('local:');global.sessionStorage=storage('session:');return{data,events,close(){delete global.window;delete global.localStorage;delete global.sessionStorage;}};}

test('preferences validate complete enums and whole target percentages totaling 100, without accepting hidden security flags',()=>{
 assert.equal(validPreferences(DEFAULT_PREFERENCES),true);
 for(const invalid of [{...DEFAULT_PREFERENCES,target_allocation:{fiat:20,crypto:20,stock:20}},{...DEFAULT_PREFERENCES,timezone:'Fake/Zone'},{...DEFAULT_PREFERENCES,target_allocation:{fiat:35.5,crypto:39.5,stock:25}},{...DEFAULT_PREFERENCES,mfa:true}]) assert.equal(validPreferences(invalid),false);
 assert.throws(()=>applySettings(seed(),{action:'profile',expected_version:0,display_name:'Test',password:'never-store'},'request-key',now),/secrets/);
 assert.throws(()=>applySettings(seed(),{action:'profile',expected_version:0,display_name:'A'},'request-key',now),/display name/);
});

test('saved profile and preferences persist per customer with case normalization, versions and idempotency',()=>{
 const env=browser();try{const user='settings-persist@test', initial=readSettings(user,'Alex');
 const cmd=command(initial,'profile',{display_name:'Alex P.'});
 const saved=commitSettings(user,'Alex',cmd,'save-profile-001');assert.equal(saved.display_name,'Alex P.');assert.equal(saved.version,1);
 assert.equal(readSettings(user.toUpperCase(),'Alex').display_name,'Alex P.');
 assert.equal(commitSettings(user,'Alex',cmd,'save-profile-001').version,1);
 assert.throws(()=>commitSettings(user,'Alex',{...cmd,display_name:'Other'},'save-profile-001'),/already used/);
 assert.throws(()=>commitSettings(user,'Alex',cmd,'save-profile-002'),/settings changed/);
 assert.equal(readSettings('settings-other@test','Other User').display_name,'Other User');
 assert.ok(env.events.includes('mbank:settings-updated'));assert.equal(readSettings(user,'Alex').audit.length,1);
 }finally{env.close();}
});

test('portfolio defaults and email consent persist together without changing financial state',()=>{
 const env=browser();try{const email='settings-preferences@test';let state=readSettings(email,'Alex');
 const preferences={...structuredClone(DEFAULT_PREFERENCES),timezone:'UTC',date_locale:'ro-RO',motion:'reduce',analytics_period:'90D',asset_period:'3M',settlement_currency:'EUR',target_allocation:{fiat:50,crypto:25,stock:25}};
 const before=JSON.stringify(readWallet(email).state.transfers.accounts);
 state=commitSettings(email,'Alex',command(state,'preferences',{preferences}),'preferences-save-001');
 state=commitSettings(email,'Alex',command(state,'communications',{communications:{offers_email:true,portfolio_email:true,social_email:false,product_email:false}}),'communications-save-01');
 const next=readSettings(email,'Alex');assert.deepEqual(next.preferences,preferences);assert.equal(next.communications.offers_email,true);assert.equal(next.audit.length,2);assert.equal(JSON.stringify(readWallet(email).state.transfers.accounts),before);
 }finally{env.close();}
});

test('failed writes and corrupted stored settings preserve prior state and do not emit success events',()=>{
 const env=browser();try{const email='settings-storage@test', before=readSettings(email,'Alex'); const write=localStorage.setItem;
 localStorage.setItem=()=>{throw new Error('quota');};assert.throws(()=>commitSettings(email,'Alex',command(before,'profile',{display_name:'Changed Name'}),'settings-fail-01'),/no changes/);localStorage.setItem=write;
 assert.equal(readSettings(email,'Alex').display_name,'Alex');assert.equal(env.events.length,0);
 localStorage.setItem('mbank_settings_v1:'+encodeURIComponent(email),'{broken');assert.throws(()=>readSettings(email,'Alex'),/preserved/);assert.equal(localStorage.getItem('mbank_settings_v1:'+encodeURIComponent(email)),'{broken');
 }finally{env.close();}
});

test('current session cannot be revoked; other demo sessions can be revoked without erasing history',()=>{
 let state=seed();assert.throws(()=>applySettings(state,command(state,'revoke_session',{session_id:'current-browser'}),'revoke-current',now),/Only another/);
 state=applySettings(state,command(state,'revoke_session',{session_id:'demo-mobile'}),'revoke-mobile',now);assert.equal(state.sessions.find(s=>s.id==='demo-mobile').revoked_at,now);assert.equal(state.sessions.length,3);
 state=applySettings(state,command(state,'revoke_others'),'revoke-others',now);assert.equal(state.sessions.filter(s=>!s.revoked_at).length,1);assert.equal(state.audit.length,2);
 assert.throws(()=>applySettings(state,command(state,'revoke_others'),'revoke-empty',now),/No other/);
});

test('requests are pending and cancellable; duplicate requests cannot invent completed security changes',()=>{
 let state=seed();state=applySettings(state,command(state,'request',{kind:'setup_mfa',details:'Please set up an authenticator app.'}),'mfa-request-001',now);assert.equal(state.requests[0].status,'pending');
 assert.throws(()=>applySettings(state,command(state,'request',{kind:'setup_mfa',details:'Another setup request please.'}),'mfa-request-002',now),/already have/);
 state=applySettings(state,command(state,'cancel_request',{request_id:'mfa-request-001'}),'mfa-cancel-001',now);assert.equal(state.requests[0].status,'cancelled');assert.equal(state.audit.length,2);
 assert.throws(()=>applySettings(state,command(state,'cancel_request',{request_id:'mfa-request-001'}),'mfa-cancel-002',now),/Only a pending/);
 assert.throws(()=>applySettings(state,command(state,'purge_audit'),'purge-impossible',now),/Unsupported/);
});

test('repository projects shared identity and wallet obligations; display edits do not mutate email, legal name or balances',async()=>{
 const env=browser();try{const email='settings-projection@test',repo=createSettingsRepository(email,'Legal Customer','MB-TEST');const before=await repo.getSnapshot();const cash=readWallet(email).state.transfers.accounts.find(a=>a.asset==='USD').available;
 assert.equal(before.identity.email,email);assert.equal(before.identity.legal_name,'Legal Customer');assert.equal(before.account_review.has_balances,true);assert.equal(before.account_review.has_personal_credit,true);assert.equal(before.security.mfa,'unknown');
 const next=await repo.execute(command(before,'profile',{display_name:'My Nickname'}),'nickname-save-01');assert.equal(next.display_name,'My Nickname');assert.equal(next.identity.legal_name,'Legal Customer');assert.equal(next.identity.email,email);assert.equal(readWallet(email).state.transfers.accounts.find(a=>a.asset==='USD').available,cash);
 const flow=await repo.startSecurityFlow('setup_mfa',next.version,'setup-mfa-demo-01');assert.equal(flow.kind,'demo_request');assert.equal(flow.snapshot.security.mfa,'unknown');assert.equal(flow.snapshot.requests[0].status,'pending');
 const report=JSON.parse(settingsReport({...flow.snapshot,token:'do-not-export',password:'do-not-export'}));assert.equal(report.token,undefined);assert.equal(report.password,undefined);assert.equal(report.sessions,undefined);
 }finally{env.close();}
});

test('secure redirects only permit unexpired same-origin authentication paths',()=>{
 const expiry=new Date(Date.now()+60000).toISOString();assert.equal(parseSecurityRedirect({redirect_url:'/auth/secure/mfa?flow=test',expires_at:expiry},'https://bank.example').kind,'redirect');
 for(const redirect_url of ['https://evil.example/auth/secure/mfa','//evil.example/auth/secure/mfa','/dashboard','/auth/secure/../../evil','/auth/secure/\\evil']) assert.throws(()=>parseSecurityRedirect({redirect_url,expires_at:expiry},'https://bank.example'),/authentication|bank/);
 assert.throws(()=>parseSecurityRedirect({redirect_url:'/auth/secure/mfa',expires_at:'2020-01-01T00:00:00Z'},'https://bank.example'),/authentication/);
});

test('HTTP adapter authenticates, uses CAS/idempotency, validates scope and never falls back to demo',async()=>{
 const env=browser(), previous={settings:process.env.NEXT_PUBLIC_SETTINGS_MODE,wallet:process.env.NEXT_PUBLIC_TRANSFERS_MODE,base:process.env.NEXT_PUBLIC_SETTINGS_API_URL}, fetchBefore=global.fetch;
 try{const demo=await createSettingsRepository('settings-http@test','Test Client','MB-HTTP').getSnapshot();const live={...demo,mode:'http',sessions:demo.sessions.map(s=>({...s,source:'server'}))};
 process.env.NEXT_PUBLIC_SETTINGS_MODE='http';process.env.NEXT_PUBLIC_TRANSFERS_MODE='http';process.env.NEXT_PUBLIC_SETTINGS_API_URL='https://api.example';let calls=[];
 global.fetch=async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>live};};const repo=createSettingsRepository('settings-http@test','Test Client','MB-HTTP');await repo.getSnapshot();assert.equal(calls[0].url,'https://api.example/v1/me/settings');assert.equal(calls[0].options.credentials,'include');assert.equal(calls[0].options.cache,'no-store');
 await repo.execute(command(live,'profile',{display_name:'Test New'}),'settings-http-01');assert.equal(calls[1].options.headers['Idempotency-Key'],'settings-http-01');assert.equal(JSON.parse(calls[1].options.body).expected_version,0);
 global.fetch=async()=>({ok:true,json:async()=>({...live,identity:{...live.identity,email:'another@test'}})});await assert.rejects(()=>repo.getSnapshot(),/scope/);
 global.fetch=async()=>({ok:false,status:503,json:async()=>({error:{message:'Unavailable'}})});await assert.rejects(()=>repo.getSnapshot(),/Unavailable/);
 process.env.NEXT_PUBLIC_SETTINGS_MODE='demo';assert.throws(()=>createSettingsRepository('settings-http@test','Name','CODE'),/same service mode/);
 }finally{for(const [key,value]of Object.entries({NEXT_PUBLIC_SETTINGS_MODE:previous.settings,NEXT_PUBLIC_TRANSFERS_MODE:previous.wallet,NEXT_PUBLIC_SETTINGS_API_URL:previous.base}))if(value===undefined)delete process.env[key];else process.env[key]=value;global.fetch=fetchBefore;env.close();}
});

test('snapshot validator rejects malformed preferences and missing current-session scope',async()=>{
 const env=browser();try{const s=await createSettingsRepository('settings-validator@test','Test Client','CODE').getSnapshot();assert.equal(parseSettingsSnapshot(s).schema_version,1);
 for(const change of [v=>v.preferences.motion='fast',v=>v.sessions.forEach(s=>s.current=false),v=>v.security.mfa=true,v=>v.requests=[{id:'bad'}]]){const invalid=structuredClone(s);change(invalid);assert.throws(()=>parseSettingsSnapshot(invalid));}
 }finally{env.close();}
});
