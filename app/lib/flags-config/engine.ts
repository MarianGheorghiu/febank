import { CONFIG_FLAGS, CONFIG_SETTINGS } from "@/app/lib/mock/admin/flags-config";
import { CONFIG_ENVIRONMENTS, type ConfigPayload, type ConfigChange, type ConfigState, type PublishConfigRequest } from "@/app/lib/types/admin/flags-config";

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export function validatePayload(value: unknown): string[] {
  if (!object(value) || !object(value.settings) || !object(value.flags)) return ["Configuration must contain settings and flags."];
  const settings=value.settings, flags=value.flags, errors:string[]=[];
  if (Object.keys(settings).length!==CONFIG_SETTINGS.length || Object.keys(flags).length!==CONFIG_FLAGS.length) errors.push("Configuration keys do not match the current catalog.");
  for (const definition of CONFIG_SETTINGS) {
    const v=settings[definition.key];
    if (definition.type==="boolean" ? typeof v!=="boolean" : definition.type==="select" ? !definition.options?.includes(v as string) : typeof v!=="number" || !Number.isSafeInteger(v) || v<(definition.min??0) || v>(definition.max??Number.MAX_SAFE_INTEGER)) errors.push(`${definition.name}: invalid value${definition.type==="number"?` (integer ${definition.min}–${definition.max})`:""}.`);
  }
  for (const definition of CONFIG_FLAGS) {
    const rule=flags[definition.key];
    if (!object(rule) || typeof rule.enabled!=="boolean" || typeof rule.rollout_pct!=="number" || !Number.isInteger(rule.rollout_pct) || rule.rollout_pct<0 || rule.rollout_pct>100 || !["all","premium","business","internal"].includes(String(rule.audience))) errors.push(`${definition.name}: invalid rollout rule.`);
    const parent=definition.depends_on?flags[definition.depends_on]:null;
    if (object(rule) && rule.enabled && definition.depends_on && (!object(parent) || !parent.enabled)) errors.push(`${definition.name} requires ${CONFIG_FLAGS.find(f=>f.key===definition.depends_on)?.name}.`);
  }
  if (typeof settings["transfers.review_minor"]==="number" && typeof settings["transfers.daily_limit_minor"]==="number" && settings["transfers.review_minor"]>settings["transfers.daily_limit_minor"]) errors.push("Transfer review threshold cannot exceed the daily transfer limit.");
  return errors;
}
export function configChanges(before: ConfigPayload, after: ConfigPayload): ConfigChange[] {
  return [
    ...CONFIG_SETTINGS.filter(s=>before.settings[s.key]!==after.settings[s.key]).map(s=>({key:s.key,name:s.name,before:before.settings[s.key],after:after.settings[s.key],critical:!!s.critical})),
    ...CONFIG_FLAGS.filter(f=>{
      const a=before.flags[f.key],b=after.flags[f.key];
      return a.enabled!==b.enabled || a.rollout_pct!==b.rollout_pct || a.audience!==b.audience;
    }).map(f=>({key:f.key,name:f.name,before:before.flags[f.key],after:after.flags[f.key],critical:!!f.critical})),
  ];
}
export function validConfigState(value: unknown): value is ConfigState {
  if (!object(value) || value.schema_version!==1 || !object(value.environments)) return false;
  return CONFIG_ENVIRONMENTS.every(environment=>{
    const v=value.environments as Record<string,unknown>, state=v[environment];
    if (!object(state) || !Number.isSafeInteger(state.revision) || Number(state.revision)<1 || validatePayload(state.published).length || !Array.isArray(state.releases)) return false;
    if (state.releases.length!==Number(state.revision)-1) return false;
    const releases=state.releases;
    if (new Set(releases.map(r=>object(r)?r.id:null)).size!==releases.length) return false;
    return releases.every((r,i)=>object(r) && typeof r.id==="string" && r.revision===Number(state.revision)-i && typeof r.timestamp==="string" && Number.isFinite(Date.parse(r.timestamp)) && typeof r.actor==="string" && typeof r.reason==="string" && (r.restored_from===null || typeof r.restored_from==="string") && !validatePayload(r.before).length && !validatePayload(r.after).length
      && JSON.stringify(r.after)===JSON.stringify(i===0?state.published:releases[i-1].before));
  });
}
export function publishConfig(state: ConfigState, request: PublishConfigRequest, id: string, timestamp: string): ConfigState {
  if (request.actor.role!=="admin" || !request.actor.email.trim()) throw new Error("Administrator access required.");
  if (!CONFIG_ENVIRONMENTS.includes(request.environment)) throw new Error("Unknown environment.");
  const current=state.environments[request.environment];
  if (request.expected_revision!==current.revision) throw new Error("A newer revision exists. Reload the published configuration before applying this draft.");
  if (request.reason.trim().length<10 || request.reason.trim().length>500) throw new Error("Provide a change reason of 10–500 characters.");
  const errors=validatePayload(request.payload);
  if (errors.length) throw new Error(errors.join(" "));
  if (request.environment==="production" && (request.payload.settings["identity.admin_mfa"]!==true || request.payload.settings["accounts.kyc_required"]!==true)) throw new Error("Production requires administrator MFA and verified identity checks.");
  if (request.restored_from && !current.releases.some(r=>r.id===request.restored_from && JSON.stringify(r.before)===JSON.stringify(request.payload))) throw new Error("Restoration must use a recorded pre-release snapshot.");
  if (!configChanges(current.published,request.payload).length) throw new Error("There are no changes to publish.");
  const next=structuredClone(state), environment=next.environments[request.environment];
  environment.revision++;
  environment.releases.unshift({id,revision:environment.revision,timestamp,actor:request.actor.email,reason:request.reason.trim(),restored_from:request.restored_from??null,before:structuredClone(current.published),after:structuredClone(request.payload)});
  environment.published=structuredClone(request.payload);
  return next;
}

// FNV-1a over UTF-8 bytes: implement the identical bucket algorithm in Go.
export function rolloutBucket(flag: string, subject: string): number {
  let hash=2166136261;
  for (const byte of new TextEncoder().encode(`${flag}:${subject}`)) hash=Math.imul(hash^byte,16777619)>>>0;
  return hash%10000;
}
const masterSettings:Record<string,string>={cards:"cards.issuing_enabled",crypto:"crypto.trading_enabled",stocks:"stocks.trading_enabled",loans:"loans.applications_enabled"};
export function evaluateFlag(payload: ConfigPayload, key: string, subject: string, audience: string): { enabled:boolean; reason:string } {
  const definition=CONFIG_FLAGS.find(f=>f.key===key), rule=payload.flags[key];
  if (!definition || !rule) return {enabled:false,reason:"Unknown feature"};
  if (!subject.trim()) return {enabled:false,reason:"A stable customer ID is required"};
  if (payload.settings["platform.maintenance"]===true) return {enabled:false,reason:"Maintenance mode overrides feature access"};
  if (masterSettings[definition.module] && payload.settings[masterSettings[definition.module]]===false) return {enabled:false,reason:"Module master control is disabled"};
  if (!rule.enabled) return {enabled:false,reason:"Feature is disabled"};
  if (rule.audience!=="all" && rule.audience!==audience) return {enabled:false,reason:`Restricted to ${rule.audience} audience`};
  if (definition.depends_on && !evaluateFlag(payload,definition.depends_on,subject,audience).enabled) return {enabled:false,reason:"Required parent feature is unavailable for this customer"};
  const enabled=rolloutBucket(key,subject)<rule.rollout_pct*100;
  return {enabled,reason:enabled?"Customer matches audience and rollout":"Customer is outside the rollout cohort"};
}
