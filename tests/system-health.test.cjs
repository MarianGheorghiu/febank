/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain test harness. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {MOCK_SYSTEM_HEALTH:report}=require('../app/lib/mock/admin/system-health.ts');
const {healthSummary,healthServices,effectiveStatus}=require('../app/lib/system-health/engine.ts');
const {mockSystemHealthRepository:repository}=require('../app/lib/system-health/repository.ts');
test('fixture coverage, hourly bins and incident references are coherent',()=>{assert.equal(new Set(report.services.map(s=>s.id)).size,report.services.length);assert.equal(report.samples.length,24);assert.equal(report.samples.at(-1).timestamp,report.as_of);report.samples.forEach((s,i)=>{assert.ok(s.server_errors<=s.requests);assert.ok(s.server_errors>=0);if(i)assert.equal(Date.parse(s.timestamp)-Date.parse(report.samples[i-1].timestamp),3600000);});for(const i of report.incidents){assert.ok(report.services.some(s=>s.id===i.service_id));assert.ok(i.started_at<=i.updated_at&&Date.parse(i.updated_at)<=Date.parse(report.as_of));}assert.ok(report.probe_successes_24h<=report.probe_total_24h);});
test('summary weighs request counts and probe counts without averaging percentiles',()=>{const s=healthSummary(report);assert.equal(s.status,'DEGRADED');assert.equal(s.healthy,6);assert.equal(s.total,8);assert.equal(s.availability,14392/14400*100);assert.equal(s.errorRate,report.samples.reduce((n,s)=>n+s.server_errors,0)/report.samples.reduce((n,s)=>n+s.requests,0)*100);});
test('empty telemetry is unavailable and never represented as healthy or zero errors',()=>{const s=healthSummary({...report,services:[],samples:[],probe_total_24h:0});assert.equal(s.status,'UNKNOWN');assert.equal(s.errorRate,null);assert.equal(s.availability,null);});
test('stale, future and malformed service probes cannot report healthy',()=>{assert.equal(effectiveStatus('OPERATIONAL','2026-10-09T11:58:00Z',report.as_of),'OPERATIONAL');for(const date of ['2026-10-09T11:57:59Z','2026-10-09T12:00:01Z','invalid'])assert.equal(effectiveStatus('OPERATIONAL',date,report.as_of),'UNKNOWN');assert.equal(healthSummary({...report,services:[{...report.services[0],checked_at:'invalid'}]}).status,'UNKNOWN');assert.equal(healthSummary({...report,services:[{...report.services[0],status:'OUTAGE'}]}).status,'OUTAGE');assert.equal(healthSummary({...report,services:[{...report.services[0],status:'OUTAGE'},{...report.services[1],checked_at:'invalid'}]}).status,'OUTAGE');});
test('domain filters partition services and do not mutate snapshot',()=>{assert.equal(healthServices(report,'ALL').length,8);for(const domain of ['PLATFORM','FIAT','CRYPTO','STOCK']){const rows=healthServices(report,domain);assert.equal(rows.length,2);assert.ok(rows.every(s=>s.domain===domain));}assert.equal(healthSummary(report).total,8);});
test('repository returns isolated Go-compatible snapshots',async()=>{const first=await repository.getSnapshot();assert.deepEqual(JSON.parse(JSON.stringify(first)),report);first.services[0].status='OUTAGE';assert.equal((await repository.getSnapshot()).services[0].status,'OPERATIONAL');});
const {controlStatus,domainHealth,serviceHealthStatus}=require('../app/lib/system-health/engine.ts');
test('financial thresholds handle both directions, boundary values and missing probes',()=>{
  const max=report.controls.find(c=>c.id==='quote-age'),min=report.controls.find(c=>c.id==='fiat-liquidity');
  assert.equal(controlStatus(max,report.as_of),'DEGRADED');
  assert.equal(controlStatus({...max,value:max.threshold},report.as_of),'OPERATIONAL');
  assert.equal(controlStatus({...max,value:null},report.as_of),'UNKNOWN');
  assert.equal(controlStatus({...max,value:NaN},report.as_of),'UNKNOWN');
  assert.equal(controlStatus({...max,checked_at:'invalid'},report.as_of),'UNKNOWN');
  assert.equal(controlStatus({...max,checked_at:'2026-10-09T11:57:59Z'},report.as_of),'UNKNOWN');
  assert.equal(controlStatus({...max,checked_at:'2026-10-09T12:00:01Z'},report.as_of),'UNKNOWN');
  assert.equal(controlStatus({...min,value:109},report.as_of),'DEGRADED');
  assert.equal(controlStatus({...min,value:110},report.as_of),'OPERATIONAL');
});
test('banking controls and dependencies cover each domain with valid references',()=>{
  assert.equal(report.controls.length,12);assert.equal(new Set(report.controls.map(c=>c.id)).size,12);
  for(const domain of ['PLATFORM','FIAT','CRYPTO','STOCK'])assert.equal(report.controls.filter(c=>c.domain===domain).length,3);
  for(const control of report.controls)assert.ok(report.services.some(s=>s.id===control.service_id&&s.domain===control.domain));
  for(const service of report.services){assert.ok(service.queue_target_seconds>0);for(const id of service.dependencies)assert.ok(id!==service.id&&report.services.some(s=>s.id===id));}
});
test('a financial control breach overrides a passing connectivity probe',()=>{
  const changed={...report,controls:report.controls.map(c=>c.id==='ledger-balance'?{...c,value:1}:c)};
  assert.equal(serviceHealthStatus(changed,changed.services.find(s=>s.id==='ledger')),'DEGRADED');
  assert.equal(domainHealth(changed,'FIAT').status,'DEGRADED');
  assert.equal(domainHealth(changed,'FIAT').healthy,1);
  assert.equal(domainHealth(report,'FIAT').status,'OPERATIONAL');
  assert.equal(domainHealth(report,'CRYPTO').queued,38);
  assert.equal(domainHealth(report,'STOCK').incidents,3);
});
test('infrastructure outages and unavailable telemetry affect overall and platform health',()=>{
  const changed={...report,resources:[{...report.resources[0],status:'OUTAGE'}]};
  assert.equal(healthSummary(changed).status,'OUTAGE');assert.equal(domainHealth(changed,'PLATFORM').status,'OUTAGE');
  assert.equal(healthSummary({...report,resources:[{...report.resources[0],checked_at:'invalid'}]}).status,'UNKNOWN');
});
test('probe error budget and queue breaches use explicit targets',()=>{
  const summary=healthSummary(report);assert.equal(summary.queued,54);assert.equal(summary.breachedQueues,1);
  assert.ok(Math.abs(summary.budgetRemainingPct-44.44444444)<0.00001);
  assert.equal(healthSummary({...report,probe_successes_24h:0}).budgetRemainingPct,0);
  assert.equal(healthSummary({...report,probe_successes_24h:14400}).budgetRemainingPct,100);
  assert.equal(healthSummary({...report,probe_total_24h:0}).budgetRemainingPct,null);
});

const {parseHealthSnapshot,parseExportReceipt}=require('../app/lib/system-health/response.ts');
const {incidentGroups,healthSnapshotStale,resourceStatus}=require('../app/lib/system-health/engine.ts');
const {createHealthRepository}=require('../app/lib/system-health/repository.ts');
const actor={email:'health-ops@admin.com',role:'admin'};
test('global v3 contract rejects broken references, counts, graph cycles and malformed resources',()=>{
  assert.doesNotThrow(()=>parseHealthSnapshot(report));
  for(const mutate of [r=>r.schema_version=2,r=>r.scope='CUSTOMER',r=>r.services.push(r.services[0]),r=>r.services[0].dependencies=['ledger'],r=>r.controls[0].service_id='missing',r=>r.probe_successes_24h=r.probe_total_24h+1,r=>r.samples[0].server_errors=r.samples[0].requests+1,r=>r.resources[0].metrics[0].value=-1,r=>r.resources[0].trend.samples[0].timestamp=r.as_of,r=>r.incidents[0].revision=0,r=>r.window.sample_interval_seconds=0,r=>r.maintenance.ends_at=r.maintenance.starts_at]){
    const changed=structuredClone(report);mutate(changed);assert.throws(()=>parseHealthSnapshot(changed),/Invalid System Health/);
  }
});
test('missing histograms remain nullable and incomplete 24h bins never yield a claimed full-window error rate',()=>{
  const changed=structuredClone(report);changed.api_p95_ms=null;changed.samples[0].fiat_p95_ms=null;
  assert.equal(parseHealthSnapshot(changed).api_p95_ms,null);
  assert.equal(healthSummary({...report,samples:report.samples.slice(1)}).errorRate,null);
  assert.equal(healthSummary({...report,samples:report.samples.slice(1)}).availability,healthSummary(report).availability);
});
test('live freshness uses wall time while deterministic demo observations remain explicitly historical',()=>{
  const at=Date.parse(report.as_of),live={...report,mode:'live'};
  assert.equal(healthSnapshotStale(live,at+120000),false);
  assert.equal(healthSnapshotStale(live,at+120001),true);
  assert.equal(healthSnapshotStale(live,at-30001),true);
  assert.equal(healthSnapshotStale(report,at+86400000),false);
});
test('queue and numeric infrastructure thresholds override passing probes',()=>{
  const gateway={...report.services[0],queue_depth:1,oldest_job_seconds:61};
  assert.equal(serviceHealthStatus(report,gateway),'DEGRADED');
  assert.equal(serviceHealthStatus(report,{...gateway,queue_depth:0}),'OPERATIONAL');
  const resource=structuredClone(report.resources[0]);resource.metrics[0].value=6;
  assert.equal(resourceStatus(resource,report.as_of),'DEGRADED');resource.metrics[0].value=null;
  assert.equal(resourceStatus(resource,report.as_of),'UNKNOWN');
});
test('ten varied incidents group, search and filter without affecting global metrics',()=>{
  assert.equal(report.incidents.length,10);
  for(const group of ['STATE','SEVERITY','DOMAIN','OWNER']){
    const groups=incidentGroups(report,{query:'',state:'ALL',severity:'ALL',group});
    assert.equal(groups.reduce((n,g)=>n+g.incidents.length,0),10);
    assert.equal(new Set(groups.flatMap(g=>g.incidents.map(i=>i.id))).size,10);
  }
  const query=incidentGroups(report,{query:'INC-1050',state:'INVESTIGATING',severity:'CRITICAL',group:'DOMAIN'});
  assert.equal(query.length,1);assert.equal(query[0].key,'CRYPTO');assert.equal(query[0].incidents.length,1);
  assert.equal(incidentGroups(report,{query:'no-match',state:'ALL',severity:'ALL',group:'STATE'}).length,0);
  assert.equal(healthSummary(report).queued,54);
});
test('grouping preserves all 150 incidents with deterministic critical-first ordering',()=>{
  const large={...report,incidents:Array.from({length:150},(_,i)=>({...report.incidents[i%10],id:`INC-STRESS-${i}`}))};
  const groups=incidentGroups(large,{query:'',state:'ALL',severity:'ALL',group:'SEVERITY'});
  assert.equal(groups[0].key,'CRITICAL');assert.equal(groups[0].incidents.length,15);
  assert.equal(groups.flatMap(g=>g.incidents).length,150);
  assert.equal(incidentGroups(large,{query:'Markets operations',state:'ALL',severity:'ALL',group:'OWNER'})[0].incidents.length,45);
});
test('authenticated HTTP mode uses cancellation and idempotency, validates receipts and never falls back to mock',async()=>{
  const oldFetch=global.fetch,oldMode=process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE;
  try{
    process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE='http';
    assert.throws(()=>createHealthRepository({...actor,role:'client'}),/Administrator/);
    const repo=createHealthRepository(actor),calls=[],live={...report,mode:'live'},controller=new AbortController();
    global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>live};};
    const snapshot=await repo.getSnapshot(controller.signal);assert.equal(snapshot.scope,'GLOBAL');
    assert.equal(calls[0].url,'/v1/admin/system-health');assert.equal(calls[0].init.credentials,'include');assert.equal(calls[0].init.cache,'no-store');assert.equal(calls[0].init.signal,controller.signal);
    const command={request_id:'health-test-export',snapshot_id:report.snapshot_id,reason:'Operational diagnostic review.',content_sha256:'a'.repeat(64)};
    global.fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>({...command,audit_event_id:'audit-health-export',recorded_at:report.as_of})};};
    await repo.recordExport(command);assert.equal(calls.at(-1).url,'/v1/admin/system-health/exports');assert.equal(calls.at(-1).init.headers['Idempotency-Key'],command.request_id);assert.equal(JSON.parse(calls.at(-1).init.body).actor,undefined);
    assert.throws(()=>parseExportReceipt({...command,content_sha256:'b'.repeat(64),audit_event_id:'audit-wrong',recorded_at:report.as_of},command),/Invalid System Health/);
    global.fetch=async()=>({ok:true,json:async()=>report});await assert.rejects(()=>repo.getSnapshot(),/Expected live/);
    global.fetch=async()=>({ok:false,status:503});await assert.rejects(()=>repo.getSnapshot(),/503/);
    global.fetch=async()=>({ok:false,status:409});await assert.rejects(()=>repo.acknowledge({request_id:'review-01',snapshot_id:report.snapshot_id,incident_id:report.incidents[0].id,expected_revision:1,note:'Reviewed chain queue delays.'}),/changed/);
  }finally{global.fetch=oldFetch;if(oldMode===undefined)delete process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE;else process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE=oldMode;}
});
test('demo reviews and exports share durable browser audit records and reject invalid commands',async()=>{
  const data=new Map(),oldWindow=global.window,oldStorage=global.localStorage,oldMode=process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE;
  global.window={dispatchEvent:()=>{}};global.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  delete process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE;
  try{
    const repo=createHealthRepository(actor),incident=report.incidents[0];
    const request={request_id:'health-review-test-01',snapshot_id:report.snapshot_id,incident_id:incident.id,expected_revision:1,note:'Reviewed queue delays with the on-call team.'};
    const first=await repo.acknowledge(request),retry=await repo.acknowledge(request);assert.deepEqual(first,retry);
    const snapshot=await createHealthRepository({...actor,email:'other-ops@admin.com'}).getSnapshot();assert.equal(snapshot.incidents[0].acknowledgement.audit_event_id,first.audit_event_id);assert.equal(snapshot.incidents[0].state,incident.state);
    await assert.rejects(()=>repo.acknowledge({...request,request_id:'stale-review',expected_revision:2}),/changed/);
    await assert.rejects(()=>repo.acknowledge({...request,request_id:'short-review',note:'short'}),/10–500/);
    const exp={request_id:'health-export-test-01',snapshot_id:report.snapshot_id,reason:'Incident diagnostic report review.',content_sha256:'a'.repeat(64)};
    const receipt=await repo.recordExport(exp);assert.ok(receipt.audit_event_id);assert.deepEqual(await repo.recordExport(exp),receipt);
    global.localStorage.setItem=()=>{throw Error('quota')};await assert.rejects(()=>repo.recordExport({...exp,request_id:'failed-export'}),/No audit changes/);
  }finally{if(oldWindow===undefined)delete global.window;else global.window=oldWindow;if(oldStorage===undefined)delete global.localStorage;else global.localStorage=oldStorage;if(oldMode===undefined)delete process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE;else process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE=oldMode;}
});
