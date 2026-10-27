import { KYC_STATUSES, USER_ROLES, USER_STATUSES, type ManagedUser, type UserCommand, type UserOperator, type UserProfile, type UserRegistry } from "./contracts";
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, min = 0, max = 200): v is string => typeof v === "string" && v.trim().length >= min && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v);
const date = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));
const email = (v: unknown): v is string => text(v, 3, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const normalizeEmail = (v: string) => v.trim().toLowerCase();
export function validateProfile(p: UserProfile) {
  if (!object(p) || Object.keys(p).sort().join() !== ["legal_name","username","contact_email","phone","country","address","date_of_birth","occupation","tax_country"].sort().join() || !text(p.legal_name, 2, 100) || !/^@[a-z0-9._-]{2,40}$/i.test(p.username) || !email(p.contact_email) || !text(p.phone, 0, 30) || p.phone && !/^\+?[\d\s()-]{6,30}$/.test(p.phone) || !/^[A-Z]{2}$/.test(p.country) || !/^[A-Z]{2}$/.test(p.tax_country) || !text(p.address, 0, 300) || !text(p.occupation, 0, 100)) throw new Error("Check the profile fields, contact email and two-letter country codes.");
  if (p.date_of_birth !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(p.date_of_birth) || !date(p.date_of_birth) || new Date(p.date_of_birth).toISOString().slice(0,10) !== p.date_of_birth || p.date_of_birth < "1900-01-01" || p.date_of_birth > new Date().toISOString().slice(0,10))) throw new Error("Enter a valid birth date between 1900 and today.");
}
export function userProfile(u: ManagedUser): UserProfile { return { legal_name: u.legal_name, username: u.username, contact_email: u.contact_email, phone: u.phone, country: u.country, address: u.address, date_of_birth: u.date_of_birth, occupation: u.occupation, tax_country: u.tax_country }; }
export function validateRegistry(v: unknown): asserts v is UserRegistry {
  if (!object(v) || v.schema_version !== 1 || !Number.isSafeInteger(v.revision) || Number(v.revision) < 0 || !Array.isArray(v.users) || !Array.isArray(v.sessions) || !Array.isArray(v.audit) || !Array.isArray(v.receipts)) throw new Error("Invalid user registry. Stored data was preserved.");
  const state = v as unknown as UserRegistry;
  for (const u of state.users) {
    if (!object(u) || !text(u.id,1) || !Number.isSafeInteger(u.version) || u.version < 1 || !email(u.login_email) || u.login_email !== normalizeEmail(u.login_email) || !USER_ROLES.includes(u.role) || !USER_STATUSES.includes(u.status) || !KYC_STATUSES.includes(u.kyc_status) || !["LOW","MEDIUM","HIGH"].includes(u.risk_level) || typeof u.politically_exposed !== "boolean" || !["ENABLED","NOT_ENROLLED","UNKNOWN"].includes(u.mfa_status) || !date(u.created_at) || !date(u.updated_at) || ![u.last_seen_at,u.password_reset_requested_at,u.mfa_reset_requested_at].every(d => d === null || date(d)) || !Array.isArray(u.notes) || !u.notes.every(n => object(n) && text(n.id,1) && text(n.text,10,500) && email(n.actor) && date(n.created_at))) throw new Error("Invalid user profile. Stored data was preserved.");
    validateProfile(userProfile(u));
  }
  const unique = (a: string[]) => new Set(a).size === a.length;
  if (!unique(state.users.map(u => u.id)) || !unique(state.users.map(u => u.login_email)) || !unique(state.users.map(u => u.username.toLowerCase())) || !unique(state.sessions.map(s => s.id)) || !unique(state.audit.map(a => a.id)) || !unique(state.receipts.map(r => r.key))) throw new Error("Duplicate user, session or operation identifiers.");
  if (!state.users.some(u => u.role === "ADMIN" && u.status === "ACTIVE")) throw new Error("At least one active administrator is required.");
  if (state.sessions.some(s => !object(s) || !text(s.id,1) || !state.users.some(u => u.id === s.user_id) || !text(s.device,1) || !date(s.started_at) || !date(s.last_seen_at) || !date(s.expires_at) || !(s.revoked_at === null || date(s.revoked_at)) || !(s.ip === null || text(s.ip,1)) || !(s.location === null || text(s.location,1)) || s.source !== "DEMO")) throw new Error("Invalid user sessions.");
  if (state.audit.some(a => !object(a) || a.source !== "USERS" || !date(a.timestamp) || !email(a.actor) || !text(a.id,1) || !text(a.action,1) || !text(a.reason,10,500) || !text(a.target,1) || a.origin !== "LOCAL" || !["ADMIN","CLIENT"].includes(a.actorRole) || a.outcome !== "SUCCESS") || state.receipts.some(r => !object(r) || !text(r.key,8,120) || !text(r.fingerprint,1,20000) || !email(r.actor))) throw new Error("Invalid user audit or operation history.");
}
export function assertUserOperator(state: UserRegistry, actor: UserOperator) {
  const known = state.users.find(u => u.login_email === normalizeEmail(actor.email));
  if (actor.role !== "admin" || !email(actor.email) || (known ? known.role !== "ADMIN" || known.status !== "ACTIVE" : !normalizeEmail(actor.email).endsWith("@admin.com"))) throw new Error("Active administrator access required.");
}
export function applyUserCommand(state: UserRegistry, command: UserCommand, actor: UserOperator, key: string, at: string): UserRegistry {
  validateRegistry(state); assertUserOperator(state, actor);
  if (!/^[a-zA-Z0-9_-]{8,120}$/.test(key) || !date(at)) throw new Error("A valid operation key and timestamp are required.");
  const fingerprint = JSON.stringify(command), receipt = state.receipts.find(r => r.key === key);
  if (receipt) { if (receipt.fingerprint !== fingerprint || receipt.actor !== normalizeEmail(actor.email)) throw new Error("Operation key already used for another request."); return state; }
  if (!command || !text(command.reason,10,500) || command.reason.trim().length < 10 || command.expected_revision !== state.revision) throw new Error("Provide an audit reason of 10–500 characters. If data changed, refresh and review again.");
  const fields: Record<UserCommand["action"], string[]> = { CREATE:["login_email","profile"], PROFILE:["user_id","profile"], ACCESS:["user_id","role","status"], VERIFICATION:["user_id","kyc_status","risk_level","politically_exposed"], REVOKE_SESSION:["user_id","session_id"], REVOKE_ALL:["user_id"], REQUEST_PASSWORD_RESET:["user_id"], REQUEST_MFA_RESET:["user_id"], NOTE:["user_id"], EXPORT:["user_ids","format"] };
  if (!fields[command.action] || Object.keys(command).sort().join() !== ["action","expected_revision","reason",...fields[command.action]].sort().join()) throw new Error("Unsupported user command or fields.");
  const next = structuredClone(state);
  let target = "user-registry", before: unknown = null, after: unknown = null;
  const user = "user_id" in command ? next.users.find(u => u.id === command.user_id) : undefined;
  if ("user_id" in command && !user) throw new Error("User no longer exists. Refresh the registry.");
  if (user) { target = user.id; before = structuredClone(user); }
  switch (command.action) {
    case "CREATE": {
      validateProfile(command.profile);
      if (!email(command.login_email)) throw new Error("A valid sign-in email is required.");
      // Importing the factory here would create a seed dependency; creation follows the same DTO.
      const p = command.profile;
      const created: ManagedUser = { ...p, contact_email: normalizeEmail(p.contact_email), id:`USR-${key}`, version:1, login_email:normalizeEmail(command.login_email), role:"CLIENT", status:"ACTIVE", kyc_status:"IN_REVIEW", risk_level:"MEDIUM", politically_exposed:false, mfa_status:"NOT_ENROLLED", password_reset_requested_at:null, mfa_reset_requested_at:null, created_at:at, updated_at:at, last_seen_at:null, notes:[] };
      next.users.push(created); target=created.id; after=created; break;
    }
    case "PROFILE": { validateProfile(command.profile); Object.assign(user!,command.profile,{contact_email:normalizeEmail(command.profile.contact_email)}); break; }
    case "ACCESS": {
      if (!USER_ROLES.includes(command.role) || !USER_STATUSES.includes(command.status)) throw new Error("Unsupported role or account status.");
      if (user!.login_email === normalizeEmail(actor.email) && (command.role !== user!.role || command.status !== "ACTIVE")) throw new Error("You cannot change your own administrator access.");
      if (command.role === user!.role && command.status === user!.status) throw new Error("No access changes to save.");
      user!.role=command.role; user!.status=command.status;
      for (const s of next.sessions.filter(s => s.user_id === user!.id && !s.revoked_at)) s.revoked_at=at;
      break;
    }
    case "VERIFICATION": {
      if (!KYC_STATUSES.includes(command.kyc_status) || !["LOW","MEDIUM","HIGH"].includes(command.risk_level) || typeof command.politically_exposed !== "boolean") throw new Error("Check verification and risk fields.");
      Object.assign(user!,{kyc_status:command.kyc_status,risk_level:command.risk_level,politically_exposed:command.politically_exposed}); break;
    }
    case "REVOKE_SESSION": { const s=next.sessions.find(s => s.id===command.session_id&&s.user_id===user!.id); if (!s||s.revoked_at||Date.parse(s.expires_at)<=Date.parse(at)) throw new Error("Select an active user session."); s.revoked_at=at; after={session_id:s.id,revoked_at:at}; break; }
    case "REVOKE_ALL": { const sessions=next.sessions.filter(s=>s.user_id===user!.id&&!s.revoked_at&&Date.parse(s.expires_at)>Date.parse(at)); if (!sessions.length) throw new Error("No active sessions to revoke."); for(const s of sessions)s.revoked_at=at; after={revoked_sessions:sessions.length}; break; }
    case "REQUEST_PASSWORD_RESET": if(user!.password_reset_requested_at)throw new Error("A password reset request is already pending."); user!.password_reset_requested_at=at; break;
    case "REQUEST_MFA_RESET": if(user!.mfa_reset_requested_at)throw new Error("An MFA recovery request is already pending."); user!.mfa_reset_requested_at=at; break;
    case "NOTE": user!.notes.unshift({id:`NOTE-${key}`,text:command.reason.trim(),actor:normalizeEmail(actor.email),created_at:at}); break;
    case "EXPORT": if (!Array.isArray(command.user_ids)||!command.user_ids.length||new Set(command.user_ids).size!==command.user_ids.length||command.user_ids.some(id=>!state.users.some(u=>u.id===id))||!["CSV","JSON"].includes(command.format)) throw new Error("Select valid users and an export format."); after={user_ids:command.user_ids,format:command.format}; break;
  }
  if (user) { user.version++; user.updated_at=at; after ??= structuredClone(user); }
  next.revision++;
  next.audit.unshift({id:`users:${key}`,timestamp:at,source:"USERS",domain:"PLATFORM",category:command.action==="EXPORT"?"DATA_ACCESS":command.action==="PROFILE"||command.action==="CREATE"?"CONFIGURATION":"SECURITY",action:`USER_${command.action}`,severity:["ACCESS","REVOKE_ALL","REQUEST_MFA_RESET"].includes(command.action)?"CRITICAL":"INFO",outcome:"SUCCESS",actor:normalizeEmail(actor.email),actorRole:"ADMIN",target,reason:command.reason.trim(),correlationId:key,requestId:null,sessionId:null,ip:null,durationMs:null,before,after,origin:"LOCAL"});
  next.receipts.push({key,fingerprint,actor:normalizeEmail(actor.email)});
  validateRegistry(next); return next;
}
export function usersCsv(users: ManagedUser[]) {
  const cell=(value: string) => `"${(/^[\s]*[=+@-]/.test(value)?"'":"")+value.replaceAll('"','""')}"`;
  return [["ID","Legal name","Sign-in email","Contact email","Role","Status","KYC","Risk","Country"],...users.map(u=>[u.id,u.legal_name,u.login_email,u.contact_email,u.role,u.status,u.kyc_status,u.risk_level,u.country])].map(row=>row.map(cell).join(",")).join("\r\n");
}
