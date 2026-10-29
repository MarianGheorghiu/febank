/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain test harness. */
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {MOCK_REFERRAL_REPORT:report}=require('../app/lib/mock/admin/referrals.ts');
const {filterReferrals,referralLeaderboard,referralCohorts}=require('../app/lib/referrals/engine.ts');
const {mockReferralsRepository:repository}=require('../app/lib/referrals/repository.ts');
const filters={query:'',status:'ALL',range:'ALL'};
test('fixtures have unique IDs, valid attribution and chronologically consistent UTC dates',()=>{
  assert.equal(new Set(report.referrals.map(r=>r.id)).size,report.referrals.length);
  assert.equal(new Set(report.referrers.map(r=>r.referral_code)).size,report.referrers.length);
  for(const r of report.referrals){assert.ok(report.referrers.some(p=>p.id===r.referrer_id));assert.ok(r.invited_at.endsWith('Z'));assert.ok(r.invited_at<=report.as_of);if(r.registered_at){assert.ok(r.invitee_id);assert.ok(r.registered_at>=r.invited_at&&r.registered_at<=report.as_of);}if(r.qualified_at)assert.ok(r.qualified_at>=r.registered_at&&r.qualified_at<=report.as_of);assert.ok(Number.isSafeInteger(r.reward_minor));if(r.status!=='QUALIFIED'){assert.equal(r.reward_minor,0);assert.equal(r.reward_status,'NONE');}}
});
test('referrer search and status filters share one attribution scope',()=>{const rows=filterReferrals(report,{...filters,query:' MB-1204-INVITE ',status:'QUALIFIED'});assert.ok(rows.length>0);assert.ok(rows.every(r=>r.referrer_id==='RFR-1'&&r.status==='QUALIFIED'));assert.equal(filterReferrals(report,{...filters,query:'does-not-exist'}).length,0);});
test('period bounds are inclusive and exclude future invitations',()=>{const end=report.as_of;const start=new Date(Date.parse(end)-30*86400000).toISOString();const seed=report.referrals[0];const input={...report,referrals:[{...seed,id:'start',invited_at:start},{...seed,id:'end',invited_at:end},{...seed,id:'old',invited_at:new Date(Date.parse(start)-1).toISOString()},{...seed,id:'future',invited_at:new Date(Date.parse(end)+1).toISOString()}]};assert.deepEqual(filterReferrals(input,{...filters,range:'30D'}).map(r=>r.id),['start','end']);});
test('leaderboard counts registered users instead of invitations and reconciles rewards',()=>{const rows=filterReferrals(report,filters);const leaders=referralLeaderboard(report,rows);assert.equal(leaders.reduce((n,r)=>n+r.invited,0),rows.length);assert.equal(leaders.reduce((n,r)=>n+r.registered,0),rows.filter(r=>r.registered_at).length);assert.equal(leaders.reduce((n,r)=>n+r.qualified,0),rows.filter(r=>r.status==='QUALIFIED').length);assert.ok(leaders.every((r,i)=>!i||leaders[i-1].registered>=r.registered));assert.equal(leaders.reduce((n,r)=>n+r.paid_minor+r.pending_minor+r.held_minor,0),rows.reduce((n,r)=>n+r.reward_minor,0));assert.deepEqual(referralLeaderboard(report,[]),[]);});
test('daily and weekly cohort buckets reconcile counts without double counting boundaries',()=>{for(const range of ['30D','90D','ALL']){const rows=filterReferrals(report,{...filters,range});const buckets=referralCohorts(report,rows,range);assert.equal(buckets.reduce((n,r)=>n+r.invited,0),rows.length);assert.equal(buckets.reduce((n,r)=>n+r.qualified,0),rows.filter(r=>r.status==='QUALIFIED').length);assert.equal(buckets.reduce((n,r)=>n+r.registered,0),rows.filter(r=>r.registered_at).length);}assert.ok(referralCohorts(report,[],'30D').every(b=>b.invited===0));});
test('report repository returns independent JSON-compatible snapshots',async()=>{const first=await repository.getReport();assert.deepEqual(JSON.parse(JSON.stringify(first)),report);first.referrals[0].reward_minor=999999;assert.notEqual((await repository.getReport()).referrals[0].reward_minor,999999);});

const {seedReferrals,validReferralState,applyReferralCommand:apply,rewardActions}=require('../app/lib/referrals/operations.ts');
const actor={role:'admin',email:'ops@admin.com'},now='2026-10-29T10:00:00.000Z';
const context={policy:{config_revision:2,reward_minor:1000,qualification_days:30,program_enabled:true},eligible_referrer_ids:report.referrers.map(r=>r.id),existing_customer_emails:[]};
const command=(action,state,extra={})=>({request_id:crypto.randomUUID(),expected_revision:state.revision,expected_config_revision:context.policy.config_revision,action,reason:'Campaign review CASE-524 confirmed.',...extra});
function storage(){const values=new Map();global.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};return values;}

test('shared registry validates relations and distinguishes demo import evidence from recorded decisions',()=>{
 const state=seedReferrals();assert.ok(validReferralState(state));assert.ok(state.audit.length>=12);assert.ok(state.audit.every(e=>e.origin==='DEMO'&&e.evidenceKind==='SNAPSHOT'));
 const bad=structuredClone(state);bad.report.referrals[0].registered_at='invalid';assert.equal(validReferralState(bad),false);
 const orphan=structuredClone(state);orphan.report.referrals[0].referrer_id='missing';assert.equal(validReferralState(orphan),false);
 const paid=state.report.referrals.find(r=>r.reward_status==='PAID');assert.deepEqual(rewardActions(paid),[]);
});
test('new invitations preserve attribution and published terms without earning a reward or sending mail',()=>{
 const state=seedReferrals(),next=apply(state,command('INVITE',state,{referrer_id:report.referrers[0].id,invitee_name:'New Customer',invitee_email:'NEW@example.test'}),actor,context,now);
 const r=next.report.referrals[0];assert.equal(r.invitee_email,'new@example.test');assert.equal(r.status,'INVITED');assert.equal(r.invitee_id,null);assert.equal(r.reward_minor,0);assert.equal(r.reward_status,'NONE');assert.deepEqual(next.terms[r.id],{reward_minor:1000,qualification_days:30,config_revision:2});assert.equal(state.report.referrals.length,report.referrals.length);assert.ok(validReferralState(next));assert.equal(next.audit[0].source,'REFERRALS');assert.equal(next.audit[0].origin,'LOCAL');
});
test('self-referrals, existing customers, duplicate attribution, paused campaigns and ineligible referrers are blocked',()=>{
 const state=seedReferrals(),base={referrer_id:report.referrers[0].id,invitee_name:'New Customer',invitee_email:'new@example.test'};
 assert.throws(()=>apply(state,command('INVITE',state,{...base,invitee_email:report.referrers[0].email}),actor,context,now),/Self/);
 assert.throws(()=>apply(state,command('INVITE',state,{...base,invitee_email:report.referrals[0].invitee_email}),actor,context,now),/already/);
 assert.throws(()=>apply(state,command('INVITE',state,base),actor,{...context,existing_customer_emails:['new@example.test']},now),/Existing/);
 assert.throws(()=>apply(state,command('INVITE',state,base),actor,{...context,policy:{...context.policy,program_enabled:false}},now),/paused/);
 assert.throws(()=>apply(state,command('INVITE',state,base),actor,{...context,eligible_referrer_ids:[]},now),/eligible|verified/);
});
test('reward hold, release and payout queue transitions are audited and never turn into settled cash',()=>{
 let state=seedReferrals();const reward=state.report.referrals.find(r=>r.reward_status==='PENDING');
 state=apply(state,command('HOLD_REWARD',state,{referral_id:reward.id}),actor,context,now);assert.equal(state.audit[0].before.reward_status,'PENDING');assert.equal(state.audit[0].after.reward_status,'HELD');
 assert.throws(()=>apply(state,command('REQUEST_PAYOUT',state,{referral_id:reward.id}),actor,context,now),/not allowed/);
 state=apply(state,command('RELEASE_REWARD',state,{referral_id:reward.id}),actor,context,now);
 const c=command('REQUEST_PAYOUT',state,{referral_id:reward.id});const next=apply(state,c,actor,context,now);assert.equal(next.report.referrals.find(r=>r.id===reward.id).reward_status,'QUEUED');assert.equal(next.payout_requests.length,1);assert.equal(apply(next,c,actor,context,now),next);assert.ok(validReferralState(next));assert.throws(()=>apply(next,command('REQUEST_PAYOUT',next,{referral_id:reward.id}),actor,context,now),/not allowed/);
 const leaders=referralLeaderboard(next.report,next.report.referrals);assert.equal(leaders.reduce((n,r)=>n+r.paid_minor+r.pending_minor+r.held_minor+r.queued_minor,0),next.report.referrals.reduce((n,r)=>n+r.reward_minor,0));
});
test('roles, revision, request payload reuse, audit reasons and unqualified rewards are enforced',()=>{
 const state=seedReferrals(),reward=state.report.referrals.find(r=>r.reward_status==='PENDING'),c=command('HOLD_REWARD',state,{referral_id:reward.id});
 assert.throws(()=>apply(state,c,{...actor,role:'client'},context,now),/Administrator/);assert.throws(()=>apply(state,{...c,expected_revision:99},actor,context,now),/changed/);assert.throws(()=>apply(state,{...c,reason:'short'},actor,context,now),/reason/);
 const next=apply(state,c,actor,context,now);assert.throws(()=>apply(next,{...c,reason:'Different case and review reason'},actor,context,now),/Request ID/);
 const invite=state.report.referrals.find(r=>r.status==='INVITED');assert.throws(()=>apply(state,{...c,referral_id:invite.id},actor,context,now),/not allowed/);
 assert.throws(()=>apply(state,command('REQUEST_PAYOUT',state,{referral_id:reward.id}),actor,{...context,eligible_referrer_ids:[]},now),/eligible|verified/);
});
test('search supports invitee attribution, accents and multiple terms; export validates exact IDs',()=>{
 const state=seedReferrals();const r=state.report.referrals[0];assert.deepEqual(filterReferrals(state.report,{...filters,query:r.invitee_email}),[r]);
 const {searchReferralRecords}=require('../app/lib/referrals/engine.ts');const records=[{...r,invitee_name:'Ana Mărișan'}];assert.equal(searchReferralRecords(records,state.report,' ana  marisan ').length,1);
 assert.throws(()=>apply(state,command('EXPORT',state,{kind:'referrals',record_ids:['missing']}),actor,context,now),/scope/);
 const next=apply(state,command('EXPORT',state,{kind:'referrals',record_ids:[r.id]}),actor,context,now);assert.deepEqual(next.audit[0].after.record_ids,[r.id]);
});
test('shared storage is atomic and customer summaries observe the same held / queued reward state',async()=>{
 const values=storage(),{createReferralsRepository,getCustomerReferralSummary}=require('../app/lib/referrals/repository.ts'),{REFERRALS_KEY}=require('../app/lib/referrals/store.ts');
 const repo=createReferralsRepository(actor);let s=await repo.getSnapshot();const r=s.state.report.referrals.find(r=>r.reward_status==='PENDING'&&s.eligible_referrer_ids.includes(r.referrer_id));const ref=s.state.report.referrers.find(f=>f.id===r.referrer_id);
 const before=await getCustomerReferralSummary(ref.email);s=await repo.execute(command('HOLD_REWARD',s.state,{referral_id:r.id}));const held=await getCustomerReferralSummary(ref.email);assert.equal(held.held_minor,before.held_minor+r.reward_minor);assert.equal(held.pending_minor,before.pending_minor-r.reward_minor);assert.equal(held.paid_minor,before.paid_minor);
 const saved=values.get(REFERRALS_KEY);global.localStorage.setItem=()=>{throw Error('quota')};await assert.rejects(()=>repo.execute(command('RELEASE_REWARD',s.state,{referral_id:r.id})),/No changes saved/);assert.equal(values.get(REFERRALS_KEY),saved);
 values.set(REFERRALS_KEY,'{broken');await assert.rejects(()=>repo.getSnapshot(),/corrupt/);assert.equal(values.get(REFERRALS_KEY),'{broken');
 const unknown=await getCustomerReferralSummary('unknown@example.test').catch(()=>null);assert.equal(unknown,null);
});
test('Go adapter authenticates requests, validates snapshots and never reads local fixtures after failure',async()=>{
 const values=storage(),{createReferralsRepository,parseReferralSnapshot,getCustomerReferralSummary}=require('../app/lib/referrals/repository.ts');
 const demo=await createReferralsRepository(actor).getSnapshot(),live={...demo,mode:'live'},oldMode=process.env.NEXT_PUBLIC_REFERRALS_MODE,oldFetch=global.fetch,calls=[];
 process.env.NEXT_PUBLIC_REFERRALS_MODE='http';global.localStorage.getItem=()=>{throw Error('local storage must not be read')};global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>live};};
 try {
  assert.throws(()=>createReferralsRepository({...actor,role:'client'}),/Administrator/);const repo=createReferralsRepository(actor);await repo.getSnapshot();const c=command('EXPORT',live.state,{kind:'referrals',record_ids:[]});await repo.execute(c);assert.equal(calls[1].init.credentials,'include');assert.equal(calls[1].init.cache,'no-store');assert.equal(calls[1].init.headers['Idempotency-Key'],c.request_id);assert.equal(JSON.parse(calls[1].init.body).actor,undefined);
  const malformed=structuredClone(live);malformed.state.report.referrals[0].reward_minor=0.5;assert.throws(()=>parseReferralSnapshot(malformed),/Invalid/);
  global.fetch=async()=>({ok:false,status:409,json:async()=>({error:{message:'Revision conflict'}})});await assert.rejects(()=>repo.execute(c),/Revision conflict/);
  global.fetch=async()=>({ok:true,json:async()=>demo});await assert.rejects(()=>repo.getSnapshot(),/live data/);
  global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>({schema_version:1,mode:'live',as_of:now,referral_code:null,invited:0,registered:0,qualified:0,paid_minor:0,pending_minor:0,held_minor:0,queued_minor:0,currency:'EUR',program_available:false})};};await getCustomerReferralSummary('private@example.test');assert.ok(calls.at(-1).url.endsWith('/v1/me/referrals'));assert.ok(!calls.at(-1).url.includes('private@'));assert.equal(calls.at(-1).init.body,undefined);
 } finally {global.fetch=oldFetch;if(oldMode===undefined)delete process.env.NEXT_PUBLIC_REFERRALS_MODE;else process.env.NEXT_PUBLIC_REFERRALS_MODE=oldMode;storage();}
});

test('published campaign changes reach global views and invalidate reviewed invitation terms',async()=>{
 storage();const {createReferralsRepository,getCustomerReferralSummary}=require('../app/lib/referrals/repository.ts'),{mockConfigRepository}=require('../app/lib/flags-config/repository.ts');
 const repo=createReferralsRepository(actor),before=await repo.getSnapshot(),referrer=before.state.report.referrers.find(r=>before.eligible_referrer_ids.includes(r.id));
 const draft=command('INVITE',before.state,{referrer_id:referrer.id,invitee_name:'Prospective Customer',invitee_email:'campaign-new@example.test',expected_config_revision:before.policy.config_revision});
 const config=await mockConfigRepository.getSnapshot(),payload=structuredClone(config.environments.production.published);payload.settings['growth.referral_reward_minor']=2000;payload.settings['growth.referral_expiry_days']=45;
 await mockConfigRepository.publish({environment:'production',expected_revision:config.environments.production.revision,payload,reason:'Update new campaign reward and qualification window.',actor});
 const after=await repo.getSnapshot();assert.equal(after.policy.reward_minor,2000);assert.equal(after.policy.qualification_days,45);await assert.rejects(()=>repo.execute(draft),/terms changed/);
 const saved=await repo.execute({...draft,request_id:crypto.randomUUID(),expected_config_revision:after.policy.config_revision});const record=saved.state.report.referrals.find(r=>r.invitee_email==='campaign-new@example.test');assert.equal(saved.state.terms[record.id].reward_minor,2000);assert.equal(saved.state.terms[record.id].qualification_days,45);assert.equal(saved.state.terms[report.referrals[0].id].reward_minor,2500);
 const summary=await getCustomerReferralSummary(referrer.email);assert.equal(summary.invited,before.state.report.referrals.filter(r=>r.referrer_id===referrer.id).length+1);assert.equal(summary.qualified,before.state.report.referrals.filter(r=>r.referrer_id===referrer.id&&r.status==='QUALIFIED').length);assert.equal('referrals' in summary,false);
 const unknown=await getCustomerReferralSummary('unmapped@example.test');assert.equal(unknown.referral_code,null);assert.equal(unknown.invited,0);
});

test('Risk Control restrictions immediately block payout requests and customer campaign availability',async()=>{
 const values=storage(),{createReferralsRepository,getCustomerReferralSummary}=require('../app/lib/referrals/repository.ts'),{MOCK_RISK_STATE}=require('../app/lib/mock/admin/risk.ts');
 const repo=createReferralsRepository(actor),s=await repo.getSnapshot(),record=s.state.report.referrals.find(r=>r.reward_status==='PENDING'&&s.eligible_referrer_ids.includes(r.referrer_id)),referrer=s.state.report.referrers.find(r=>r.id===record.referrer_id);
 const risk=structuredClone(MOCK_RISK_STATE);risk.restrictions.push({email:referrer.email.toLowerCase(),reason:'Manual account restriction for investigation.',actor:actor.email,timestamp:now,releaseRequestedBy:null});values.set('mbank_risk_v1',JSON.stringify(risk));
 const restricted=await repo.getSnapshot();assert.equal(restricted.eligible_referrer_ids.includes(referrer.id),false);await assert.rejects(()=>repo.execute(command('REQUEST_PAYOUT',restricted.state,{referral_id:record.id})),/active|verified/);assert.equal((await getCustomerReferralSummary(referrer.email)).program_available,false);assert.equal(restricted.state.report.referrals.find(r=>r.id===record.id).reward_status,'PENDING');
});
