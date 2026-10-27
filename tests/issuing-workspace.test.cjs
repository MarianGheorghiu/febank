/* eslint-disable @typescript-eslint/no-require-imports -- Shared card registry integration harness. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {createIssuingRepository}=require('../app/lib/card-issuing/repository.ts');
const {createCardsRepository}=require('../app/lib/cards/repository.ts');
const {parseIssuingSnapshot,decodeIssuingSnapshot}=require('../app/lib/card-issuing/response.ts');
const {searchCardCustomers,filterIssuingCards,filterIssuingAudit,issuingPage,issuingPortfolio,evaluateCardAuthorization}=require('../app/lib/card-issuing/engine.ts');
const {availableCardActions,cardExpired}=require('../app/lib/admin/card-issuing.ts');
const {ensureManagedUser,commitUserCommand,readManagedUsers}=require('../app/lib/user-management/store.ts');
const {MOCK_CARD_ISSUING_STATE:seed,MOCK_CARD_CUSTOMERS:customers}=require('../app/lib/mock/admin/card-issuing.ts');
const {readWallet}=require('../app/lib/wallet/store.ts');
const {cardAuditEvents}=require('../app/lib/audit/adapters.ts');
const admin={email:'issuing@admin.com',name:'Card Operations',role:'admin'},reason='Verified cardholder request and identity.',issue={action:'ISSUE',type:'VIRTUAL',network:'VISA',currency:'EUR',limits:{daily:1000,monthly:5000,atmDaily:0},reason,userId:customers[0].id};
function browser(){const local=new Map(),session=new Map(),events=[];global.window={dispatchEvent:e=>events.push(e.type)};global.localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v)};global.sessionStorage={getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),key:i=>[...session.keys()][i],get length(){return session.size;}};return {local,session,events,close(){delete global.window;delete global.localStorage;delete global.sessionStorage;}};}
function wire(snapshot){const money=v=>v.toFixed(2),card=c=>({...c,limits:Object.fromEntries(Object.entries(c.limits).map(([k,n])=>[k,money(n)])),spentToday:money(c.spentToday),spentThisMonth:money(c.spentThisMonth)});return {...snapshot,mode:'live',cards:snapshot.cards.map(card),audit:snapshot.audit.map(a=>({...a,before:a.before?card(a.before):null,after:a.after?card(a.after):null})),policy:{...snapshot.policy,maxMonthlyLimit:money(snapshot.policy.maxMonthlyLimit),defaultLimits:Object.fromEntries(Object.entries(snapshot.policy.defaultLimits).map(([k,n])=>[k,money(n)]))}};}
test('new admin boundary enforces authorization, revision, request identity and atomic issue/replace retries',async()=>{
 const env=browser();try{const repo=createIssuingRepository(admin),base=await repo.getSnapshot();assert.equal(base.cards.length,seed.cards.length);
 const command={...issue,expected_revision:base.revision},issued=await repo.execute(command,'admin-issue-001'),id=issued.cards[0].id;
 assert.equal((await repo.execute(command,'admin-issue-001')).cards[0].id,id);assert.equal((await repo.getSnapshot()).cards.length,seed.cards.length+1);
 await assert.rejects(repo.execute({...command,currency:'USD'},'admin-issue-001'),/already used/);await assert.rejects(repo.execute(command,'admin-issue-002'),/changed/);
 const active=await repo.execute({action:'ACTIVATE',cardId:id,expectedVersion:1,expected_revision:issued.revision,reason},'activate-admin-001');
 const replacement={action:'REPLACE',cardId:id,expectedVersion:2,expected_revision:active.revision,reason},replaced=await repo.execute(replacement,'replace-admin-001');await repo.execute(replacement,'replace-admin-001');assert.equal(replaced.cards.filter(c=>c.replacesCardId===id).length,1);assert.equal(replaced.cards.find(c=>c.id===id).status,'TERMINATED');
 await assert.rejects(createIssuingRepository({...admin,role:'client'}).getSnapshot(),/Administrator/);assert.ok(env.events.includes('mbank:cards-updated'));
 }finally{env.close();}
});
test('managed customers can be issued before opening Cards Vault; admin restrictions immediately affect customer capabilities',async()=>{
 const env=browser();try{const user=ensureManagedUser('new-cardholder@example.test','New Cardholder'),repo=createIssuingRepository(admin),before=await repo.getSnapshot();assert.ok(before.customers.some(c=>c.id===user.id));
 const wallet=JSON.stringify(readWallet(user.login_email).state.transfers.accounts);
 const issued=await repo.execute({...issue,userId:user.id,expected_revision:before.revision},'managed-issue-001'),card=issued.cards[0];
 const client=createCardsRepository(user.login_email,user.legal_name),view=await client.getSnapshot();assert.equal(view.cards.length,1,'admin enrollment must not mint a separate active demo card');assert.equal(view.cards[0].id,card.id);assert.equal(view.cards[0].status,'PENDING');
 let updated=await repo.execute({action:'ACTIVATE',cardId:card.id,expectedVersion:1,expected_revision:issued.revision,reason},'managed-activate-001');
 updated=await repo.execute({action:'UPDATE_CONTROLS',cardId:card.id,expectedVersion:2,expected_revision:updated.revision,limits:{daily:200,monthly:1000,atmDaily:0},channels:{online:false,atm:false,contactless:false,international:false},reason},'managed-controls-001');
 let snapshot=await client.getSnapshot();assert.equal(snapshot.cards[0].channels.online,false);await assert.rejects(client.execute({action:'UPDATE_CONTROLS',card_id:card.id,expected_version:3,limits:card.limits,channels:card.channels},'customer-override-001'),/approved/);
 await repo.execute({action:'FREEZE',cardId:card.id,expectedVersion:3,expected_revision:updated.revision,reason},'managed-freeze-001');snapshot=await client.getSnapshot();assert.equal(snapshot.cards[0].status,'FROZEN');assert.ok(!snapshot.permissions[card.id].includes('UNFREEZE'));assert.equal(JSON.stringify(readWallet(user.login_email).state.transfers.accounts),wallet);
 const registry=readManagedUsers();commitUserCommand({action:'ACCESS',user_id:user.id,role:'CLIENT',status:'BLOCKED',expected_revision:registry.revision,reason},admin,'block-holder-001');const latest=await repo.getSnapshot();assert.equal(latest.customers.find(c=>c.id===user.id).accountStatus,'BLOCKED');assert.ok(!availableCardActions(latest.cards.find(c=>c.id===card.id),latest.customers.find(c=>c.id===user.id)).includes('UNFREEZE'));
 }finally{env.close();}
});
test('masked exports record the exact scope, customer events retain client attribution, and failed storage cannot issue',async()=>{
 const env=browser();try{const repo=createIssuingRepository(admin),base=await repo.getSnapshot(),next=await repo.execute({action:'EXPORT',cardIds:[base.cards[0].id],reason,expected_revision:base.revision},'export-masked-001');assert.deepEqual(next.audit[0].exportedCardIds,[base.cards[0].id]);assert.equal(cardAuditEvents(next.audit)[0].after.records,1);
 const client=createCardsRepository(customers[0].email);let view=await client.getSnapshot();await client.execute({action:'FREEZE',card_id:'CRD-1001',expected_version:view.cards.find(c=>c.id==='CRD-1001').version},'client-freeze-001');const current=await repo.getSnapshot();assert.equal(cardAuditEvents(current.audit).find(e=>e.action==='FREEZE'&&e.actor===customers[0].email).actorRole,'CLIENT');
 const saved=env.local.get('mbank_admin_card_issuing_v1'),set=localStorage.setItem;localStorage.setItem=()=>{throw new Error('quota');};await assert.rejects(repo.execute({...issue,expected_revision:current.revision},'quota-issue-001'),/no changes/);assert.equal(env.local.get('mbank_admin_card_issuing_v1'),saved);localStorage.setItem=set;
 env.local.set('mbank_admin_card_issuing_v1','{corrupt');await assert.rejects(repo.getSnapshot(),/could not be restored/);
 }finally{env.close();}
});
test('expiry, authorization channels, balance, risk, spend and unknown ATM counters are explicit',()=>{
 const card=seed.cards[0],owner=customers.find(c=>c.id===card.userId),at='2026-10-27T12:00:00Z',input={amount_minor:5000,channel:'ONLINE',international:false};
 assert.equal(evaluateCardAuthorization(card,owner,input,at,100000,null).decision,'ELIGIBLE');
 for(const changed of [{...card,status:'FROZEN'},{...card,expiry:'09/26'},{...card,channels:{...card.channels,online:false}}])assert.equal(evaluateCardAuthorization(changed,owner,input,at,100000,null).decision,'DECLINED');
 assert.equal(evaluateCardAuthorization(card,owner,input,at,100,null).decision,'DECLINED');assert.equal(evaluateCardAuthorization(card,owner,input,at,null,null).decision,'INCOMPLETE');assert.equal(evaluateCardAuthorization(card,owner,input,at,100000,'Account risk restriction.').decision,'DECLINED');
 assert.equal(evaluateCardAuthorization(card,owner,{...input,channel:'ATM'},at,100000,null).decision,'INCOMPLETE');assert.equal(evaluateCardAuthorization(card,owner,{...input,amount_minor:300000},at,1e9,null).decision,'DECLINED');
 assert.equal(cardExpired({...card,expiry:'10/26'},'2026-10-31T23:59:59Z'),false);assert.equal(cardExpired({...card,expiry:'10/26'},'2026-11-01T00:00:00Z'),true);
 assert.ok(!availableCardActions({...card,status:'PENDING',expiry:'09/26'},owner,at).includes('ACTIVATE'));
});
test('portfolio keeps currency totals separate and bounded pagination handles over 100 records',()=>{
 const cards=Array.from({length:127},(_,i)=>({...seed.cards[i%seed.cards.length],id:`card-page-${i}`}));const model=issuingPage(filterIssuingCards(cards,customers,'','ALL'),99);assert.equal(model.rows.length,7);assert.equal(model.page,15);
 assert.equal(filterIssuingCards(cards,customers,'card-page-126').length,1);const report=issuingPortfolio(seed.cards,customers,'2026-10-27T12:00:00Z');assert.equal(report.statuses.reduce((s,r)=>s+r.count,0),seed.cards.length);assert.equal(report.currencies.length,3);assert.equal(report.currencies.find(c=>c.currency==='USD').usage_minor,seed.cards.filter(c=>c.currency==='USD'&&c.status!=='TERMINATED').reduce((n,c)=>n+Math.round(c.spentThisMonth*100),0));
 const events=Array.from({length:127},(_,i)=>({...seed.audit[i%seed.audit.length],id:`event-${i}`}));assert.equal(issuingPage(filterIssuingAudit(events,'','ALL',null),0).rows.length,8);
});
test('Go boundary uses exact decimal strings, session credentials, cancellation and idempotency without fallback',async()=>{
 const env=browser(),originalFetch=global.fetch,mode=process.env.NEXT_PUBLIC_CARDS_MODE;try{const base=await createIssuingRepository(admin).getSnapshot(),payload=wire(base),calls=[];process.env.NEXT_PUBLIC_CARDS_MODE='http';global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>payload};};const repo=createIssuingRepository(admin),controller=new AbortController();await repo.getSnapshot(controller.signal);await repo.execute({...issue,expected_revision:0},'http-admin-001');assert.equal(calls[0].url,'/v1/admin/cards');assert.equal(calls[0].options.signal,controller.signal);assert.equal(calls[1].options.credentials,'include');assert.equal(calls[1].options.headers['Idempotency-Key'],'http-admin-001');assert.equal(JSON.parse(calls[1].options.body).limits.daily,'1000.00');assert.equal(JSON.parse(calls[1].options.body).actor,undefined);
 assert.equal(decodeIssuingSnapshot(payload).cards[0].limits.daily,2500);assert.throws(()=>decodeIssuingSnapshot({...payload,cards:[{...payload.cards[0],cvv:'123'}]}),/Invalid/);assert.throws(()=>decodeIssuingSnapshot({...payload,cards:[{...payload.cards[0],limits:{...payload.cards[0].limits,daily:'1.001'}}]}),/Invalid/);assert.throws(()=>parseIssuingSnapshot({...base,cards:[{...base.cards[0],userId:'unknown'}]}),/Invalid/);
 global.fetch=async()=>({ok:false,status:409,json:async()=>({error:{message:'Registry version conflict.'}})});await assert.rejects(repo.execute({...issue,expected_revision:0},'http-conflict-001'),/conflict/);
 }finally{global.fetch=originalFetch;if(mode===undefined)delete process.env.NEXT_PUBLIC_CARDS_MODE;else process.env.NEXT_PUBLIC_CARDS_MODE=mode;env.close();}
});

test('cardholder search is accent-insensitive, supports multiple name/email/ID terms and excludes restricted profiles',()=>{
 const profiles=[...customers,...seed.customers];assert.ok(searchCardCustomers(profiles,'  ana   marisan ').some(c=>c.name==='Ana Mărișan'));assert.ok(searchCardCustomers(profiles,'stefan dumitru').some(c=>c.name==='Ștefan Dumitru'));assert.equal(searchCardCustomers(profiles,'nonexistent@example.invalid').length,0);assert.ok(searchCardCustomers(profiles,'ISS-DEMO-01').some(c=>c.id==='USR-ISS-DEMO-01'));assert.ok(searchCardCustomers(profiles,'').every(c=>c.accountStatus==='ACTIVE'&&c.kycStatus==='VERIFIED'));
});
test('demo enrichment preserves existing identities, operator changes and deleted card records across reloads',()=>{
 const {enrichIssuingDemo}=require('../app/lib/mock/admin/card-issuing.ts');
 const ana=seed.customers.find(c=>c.id==='USR-ISS-DEMO-01');
 const legacy={revision:8,cards:structuredClone(seed.cards.filter(c=>!c.id.startsWith('CRD-ISS-DEMO-'))),audit:structuredClone(seed.audit.filter(e=>!e.id.startsWith('CAU-ISS-DEMO-'))),customers:[{...ana,id:'already-enrolled-ana'}]};
 const before=JSON.stringify(legacy),enriched=enrichIssuingDemo(legacy);assert.equal(JSON.stringify(legacy),before);assert.equal(enriched.revision,9);assert.equal(enriched.customers.filter(c=>c.email===ana.email).length,1);assert.equal(enriched.cards.find(c=>c.id==='CRD-ISS-DEMO-2001').userId,'already-enrolled-ana');
 const card=enriched.cards.find(c=>c.id==='CRD-ISS-DEMO-2006');card.status='TERMINATED';card.customerDeletedAt='2026-10-27T12:00:00Z';const reloaded=enrichIssuingDemo(enriched);assert.equal(reloaded.cards.find(c=>c.id===card.id).status,'TERMINATED');assert.equal(reloaded.cards.length,enriched.cards.length);assert.equal(reloaded.audit.length,enriched.audit.length);
 parseIssuingSnapshot({...enriched,schema_version:1,mode:'demo',as_of:'2026-10-27T12:00:00Z',customers:[...customers,...enriched.customers],policy:require('../app/lib/mock/admin/card-issuing.ts').MOCK_ISSUING_POLICY});
});
