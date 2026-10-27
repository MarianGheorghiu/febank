import { validJournal } from '../audit/engine';
import { OPERATIONS, TIERS, type RatePolicy, type RateTier, type RateCalculation, type RatesSnapshot, type RatesCommand } from './contracts';
const integer=(v:unknown,max=1e12):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
export function validatePolicies(policies: RatePolicy[]) {
  if(!Array.isArray(policies)||policies.length!==OPERATIONS.length)throw new Error('Provide exactly one policy for each operation.');
  const ids=new Set<string>(),operations=new Set<string>();
  for(const p of policies){
    if(!p||typeof p.id!=='string'||!/^rate-[a-z0-9-]{1,60}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||p.name.trim().length<3||p.name.length>100||!OPERATIONS.includes(p.operation)||operations.has(p.operation)||typeof p.enabled!=='boolean')throw new Error('Invalid or duplicate policy identity / operation.');
    ids.add(p.id);operations.add(p.operation);
    if(!integer(p.rate_bps,500)||!integer(p.spread_bps,500)||!integer(p.weekend_bps,500)||![p.fixed_minor,p.minimum_minor].every(v=>integer(v))||(p.maximum_minor!==null&&(!integer(p.maximum_minor)||p.maximum_minor<p.minimum_minor)))throw new Error('Rates must be 0–5%, amounts non-negative, and maximum must cover minimum.');
    if(!p.tier_discount_bps||!TIERS.every(t=>integer(p.tier_discount_bps[t],10000)))throw new Error('Tier discounts must be between 0% and 100%.');
    if(!Array.isArray(p.brackets)||p.brackets.length>10)throw new Error('Use up to 10 volume brackets.');
    let last=0;
    p.brackets.forEach((b,i)=>{if(!b||!integer(b.rate_bps,500)||(b.up_to_minor===null?i!==p.brackets.length-1:!integer(b.up_to_minor)||b.up_to_minor<=last))throw new Error('Bracket limits must increase and the final bracket must be unlimited.');last=b.up_to_minor??last;});
    if(p.brackets.length&&p.brackets.at(-1)!.up_to_minor!==null)throw new Error('End volume brackets with an unlimited bracket.');
  }
}
const divide=(amount:number,bps:number)=>Number((BigInt(amount)*BigInt(bps)+BigInt(9999))/BigInt(10000));
export function calculateRate(p: RatePolicy, amount_minor: number, tier: RateTier='STANDARD', weekend=false): RateCalculation {
  if(!integer(amount_minor)||!TIERS.includes(tier))throw new Error('Enter a valid USD amount (up to $10 billion) and tier.');
  if(!p.enabled)throw new Error('This operation is paused by the fee engine.');
  let weighted=BigInt(0),lower=0;
  for(const bracket of p.brackets){const upper=Math.min(amount_minor,bracket.up_to_minor??amount_minor);if(upper>lower)weighted+=BigInt(upper-lower)*BigInt(bracket.rate_bps);lower=upper;if(lower>=amount_minor)break;}
  const variable_minor=p.brackets.length?Number((weighted+BigInt(9999))/BigInt(10000)):divide(amount_minor,p.rate_bps),fixed_minor=amount_minor? p.fixed_minor:0;
  const discount_minor=Number(BigInt(variable_minor+fixed_minor)*BigInt(p.tier_discount_bps[tier])/BigInt(10000));
  const spread_minor=divide(amount_minor,p.spread_bps),weekend_minor=weekend?divide(amount_minor,p.weekend_bps):0;
  const raw_minor=variable_minor+fixed_minor-discount_minor+spread_minor+weekend_minor;
  const fee_minor=amount_minor?Math.max(p.minimum_minor,Math.min(p.maximum_minor??Number.MAX_SAFE_INTEGER,raw_minor)):0;
  const cap=fee_minor>raw_minor?'MINIMUM':fee_minor<raw_minor?'MAXIMUM':'NONE';
  return {rule_id:p.id,amount_minor,fee_minor,variable_minor,fixed_minor,discount_minor,spread_minor,weekend_minor,raw_minor,cap,effective_bps:amount_minor?Math.round(fee_minor/amount_minor*10000):0,
    trace:[`Matched ${p.id} · ${tier}`,`Variable pricing: ${p.brackets.length?`${p.brackets.length} progressive transaction-volume brackets`:`${p.rate_bps} bps flat`}`,`Variable + fixed: ${variable_minor} + ${fixed_minor} USD cents`,`Plan discount: −${discount_minor} cents · spread ${spread_minor} · weekend ${weekend_minor}`,`Bounds: ${cap} · final ${fee_minor} USD cents`]};
}
export function validRates(value: unknown): value is RatesSnapshot {
  try {const s=value as RatesSnapshot;if(!s||s.schema_version!==1||!integer(s.revision)||!['demo','live'].includes(s.mode)||!integer(s.active.version)||!Number.isFinite(Date.parse(s.active.published_at))||!Array.isArray(s.releases)||!validJournal({revision:s.revision,events:s.audit,notes:[]})||!Array.isArray(s.processed_requests))return false;validatePolicies(s.active.policies);for(const r of s.releases){validatePolicies(r.policies);if(!['DEMO','LOCAL'].includes(r.origin)||!r.id||!integer(r.version)||!r.maker||!r.reason||!['PENDING','PUBLISHED','REJECTED'].includes(r.status)||!Number.isFinite(Date.parse(r.created_at)))return false;}return s.processed_requests.every(r=>typeof r.key==='string'&&typeof r.payload==='string');}catch{return false;}
}
export function applyRatesCommand(state: RatesSnapshot, command: RatesCommand, actor: {email:string;role:string}, key:string, now:string): RatesSnapshot {
  if(actor.role!=='admin'||!actor.email.trim())throw new Error('Administrator access required.');
  if(!/^[\w-]{8,100}$/.test(key))throw new Error('Invalid request key.');
  const payload=JSON.stringify({command,actor:actor.email.toLowerCase()});
  const prior=state.processed_requests.find(r=>r.key===key);if(prior){if(prior.payload!==payload)throw new Error('Request key already used.');return state;}
  if(command.expected_revision!==state.revision)throw new Error('Configuration changed. Refresh and review again.');
  if(typeof command.reason!=='string'||command.reason.trim().length<10||command.reason.length>500)throw new Error('Provide an audit reason of 10–500 characters.');
  if(!Number.isFinite(Date.parse(now)))throw new Error('Invalid decision timestamp.');
  const next=structuredClone(state);let target:string,before:unknown,after:unknown;
  if(command.action==='PROPOSE'){
    validatePolicies(command.policies);
    if(state.releases.some(r=>r.status==='PENDING'))throw new Error('Review the pending release before proposing another.');
    if(JSON.stringify(command.policies)===JSON.stringify(state.active.policies))throw new Error('Change at least one policy before submitting.');
    const release={origin:'LOCAL' as const,id:`release-${key}`,policies:structuredClone(command.policies),version:state.active.version+1,maker:actor.email.toLowerCase(),created_at:now,reason:command.reason.trim(),status:'PENDING' as const,checker:null,decided_at:null};
    next.releases.unshift(release);target=release.id;before=state.active;after=release;
  }else if(command.action==='APPROVE'||command.action==='REJECT'){
    const release=next.releases.find(r=>r.id===command.release_id);
    if(!release||release.status!=='PENDING')throw new Error('Pending release unavailable.');
    if(release.maker.toLowerCase()===actor.email.toLowerCase())throw new Error('A different administrator must review this release.');
    if(release.version!==state.active.version+1)throw new Error('Release is based on an outdated version.');
    target=release.id;before=structuredClone(state.active);
    release.status=command.action==='APPROVE'?'PUBLISHED':'REJECTED';release.checker=actor.email.toLowerCase();release.decided_at=now;
    if(command.action==='APPROVE')next.active={version:release.version,policies:structuredClone(release.policies),published_at:now};
    after=release;
  }else throw new Error('Unsupported fee engine action.');
  next.revision++;next.processed_requests.push({key,payload});
  next.audit.unshift({id:`rates:${key}`,timestamp:now,source:'RATES',domain:'PLATFORM',category:'CONFIGURATION',action:`RATES_${command.action}`,severity:'WARNING',outcome:'SUCCESS',actor:actor.email,actorRole:'ADMIN',target,reason:command.reason.trim(),before,after,origin:'LOCAL',correlationId:key,requestId:key,sessionId:null,ip:null,durationMs:null});
  return next;
}
