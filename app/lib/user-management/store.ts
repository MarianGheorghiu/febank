import { useSyncExternalStore } from "react";
import type { ManagedSession, ManagedUser, UserCommand, UserOperator, UserRegistry } from "./contracts";
import { applyUserCommand, normalizeEmail, validateRegistry } from "./engine";
import { managedUser, seedUsers } from "./seed";
export const USERS_KEY = "mbank_user_registry_v1";
export const USERS_EVENT = "mbank:users-updated";
const server = seedUsers();
let cached: UserRegistry | null = null, warning: string | null = null;
const listeners = new Set<() => void>();
export function readManagedUsers(): UserRegistry {
  if (typeof localStorage === "undefined") return structuredClone(server);
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return seedUsers();
  try { const value: unknown=JSON.parse(raw); validateRegistry(value); return value; }
  catch { throw new Error("User registry is unavailable or corrupt. Access changes and customer operations are blocked; saved data was preserved."); }
}
function save(state: UserRegistry) {
  validateRegistry(state);
  try { localStorage.setItem(USERS_KEY,JSON.stringify(state)); }
  catch { throw new Error("User changes and their audit record could not be saved. No changes were applied."); }
  cached=state; warning=null; listeners.forEach(fn=>fn());
  if (typeof window!=="undefined") window.dispatchEvent?.(new Event(USERS_EVENT));
  return state;
}
export function commitUserCommand(command: UserCommand, actor: UserOperator, key: string) {
  const state=readManagedUsers(), next=applyUserCommand(state,command,actor,key,new Date().toISOString());
  return next===state?state:save(next);
}
export function findManagedUser(email: string) { return readManagedUsers().users.find(u=>u.login_email===normalizeEmail(email)); }
/** Provision only a missing demo identity. Existing administrative changes are never overwritten. */
export function ensureManagedUser(email: string, name: string, preferredId?: string) {
  email=normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid demo identity is required.");
  const state=readManagedUsers(), existing=state.users.find(u=>u.login_email===email);
  if(existing)return existing;
  const at=new Date().toISOString();
  let hash=2166136261; for(const ch of email)hash=Math.imul(hash^ch.charCodeAt(0),16777619);
  const suffix=(hash>>>0).toString(16);
  const user=managedUser(email,name.trim().length>=2?name:`Customer ${email.split("@")[0]}`,preferredId??`USR-DEMO-${suffix}`,at,email.endsWith("@admin.com")?"ADMIN":"CLIENT");
  if(state.users.some(u=>u.id===user.id))throw new Error("The demo identity ID is already assigned.");
  if(state.users.some(u=>u.username.toLowerCase()===user.username.toLowerCase()))user.username=`${user.username.slice(0,30)}-${suffix}`;
  save({...state,revision:state.revision+1,users:[...state.users,user]}); return user;
}
export function registerManagedSession(user: ManagedUser, id: string, startedAt: string): ManagedSession {
  const state=readManagedUsers(), existing=state.sessions.find(s=>s.id===id);
  if(existing){if(existing.user_id!==user.id)throw new Error("Session identity mismatch.");return existing;}
  const session: ManagedSession={id,user_id:user.id,device:"Current demo browser",ip:null,location:null,started_at:startedAt,last_seen_at:startedAt,revoked_at:null,expires_at:new Date(Date.parse(startedAt)+7*86400000).toISOString(),source:"DEMO"};
  save({...state,revision:state.revision+1,users:state.users.map(u=>u.id===user.id?{...u,last_seen_at:startedAt}:u),sessions:[session,...state.sessions]}); return session;
}
export function assertManagedAccess(email: string, financial = true) {
  const u=findManagedUser(email);
  if(!u)return; // Unobserved legacy demo customers are provisioned on sign-in.
  if(u.status!=="ACTIVE")throw new Error("This account is blocked by User Management. Contact support.");
  if(financial && (u.role!=="CLIENT" || u.kyc_status!=="VERIFIED"))throw new Error("Verified customer access is required. Review the user verification status.");
}
function snapshot(){if(typeof window==="undefined")return server;if(!cached){try{cached=readManagedUsers();warning=null;}catch(cause){warning=cause instanceof Error?cause.message:"User registry unavailable.";cached=server;}}return cached;}
function subscribe(fn:()=>void){listeners.add(fn);const changed=(event:StorageEvent)=>{if(event.key===USERS_KEY||event.key===null){cached=null;snapshot();listeners.forEach(listener=>listener());}};window.addEventListener("storage",changed);return()=>{listeners.delete(fn);window.removeEventListener("storage",changed);};}
export function useUserRegistry(){return useSyncExternalStore(subscribe,snapshot,()=>server);}
export function usersStorageWarning(){return warning;}

/** Customer session revocation uses the same registry and atomic audit transaction as Admin. */
export function revokeOwnManagedSessions(email: string, sessionIds: string[], currentId: string, key: string) {
  const state=readManagedUsers(), normalized=normalizeEmail(email), user=state.users.find(u=>u.login_email===normalized);
  if(!user||user.status!=="ACTIVE")throw new Error("An active customer identity is required.");
  if(!/^[a-zA-Z0-9_-]{8,120}$/.test(key))throw new Error("Invalid session request key.");
  const fingerprint=JSON.stringify({action:"SELF_REVOKE",sessionIds,currentId}),previous=state.receipts.find(r=>r.key===key);
  if(previous){if(previous.fingerprint!==fingerprint||previous.actor!==normalized)throw new Error("Operation key already used for another request.");return state;}
  if(!sessionIds.length||new Set(sessionIds).size!==sessionIds.length||sessionIds.includes(currentId))throw new Error("Select another active session.");
  const at=new Date().toISOString(),next=structuredClone(state);
  for(const id of sessionIds){const s=next.sessions.find(s=>s.id===id&&s.user_id===user.id);if(!s||s.revoked_at||Date.parse(s.expires_at)<=Date.parse(at))throw new Error("Select another active session.");s.revoked_at=at;}
  const target=next.users.find(u=>u.id===user.id)!;target.version++;target.updated_at=at;next.revision++;
  next.audit.unshift({id:`users:${key}`,timestamp:at,source:"USERS",domain:"PLATFORM",category:"ACCESS",action:"USER_SELF_REVOKE_SESSIONS",severity:"INFO",outcome:"SUCCESS",actor:normalized,actorRole:"CLIENT",target:user.id,reason:"Customer signed out other sessions from account settings.",correlationId:key,requestId:null,sessionId:currentId,ip:null,durationMs:null,before:null,after:{session_ids:sessionIds,revoked_at:at},origin:"LOCAL"});
  next.receipts.push({key,fingerprint,actor:normalized});return save(next);
}
