/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain test harness. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(__dirname,'..',request.slice(2)):request,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {MOCK_SYSTEM_HEALTH:report}=require('../app/lib/mock/admin/system-health.ts');
const {healthSummary,healthServices,effectiveStatus}=require('../app/lib/system-health/engine.ts');
const {mockSystemHealthRepository:repository}=require('../app/lib/system-health/repository.ts');
test('fixture coverage, hourly bins and incident references are coherent',()=>{assert.equal(new Set(report.services.map(s=>s.id)).size,report.services.length);assert.equal(report.samples.length,24);assert.equal(report.samples.at(-1).timestamp,report.as_of);report.samples.forEach((s,i)=>{assert.ok(s.server_errors<=s.requests);assert.ok(s.server_errors>=0);if(i)assert.equal(Date.parse(s.timestamp)-Date.parse(report.samples[i-1].timestamp),3600000);});for(const i of report.incidents){assert.ok(report.services.some(s=>s.id===i.service_id&&s.status==='DEGRADED'));assert.ok(i.started_at<=i.updated_at&&Date.parse(i.updated_at)<=Date.parse(report.as_of));}assert.ok(report.probe_successes_24h<=report.probe_total_24h);});
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
  assert.equal(domainHealth(report,'STOCK').incidents,1);
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
