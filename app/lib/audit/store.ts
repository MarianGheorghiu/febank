"use client";
import { useSyncExternalStore } from "react";
import type { AuditActor, AuditDraft, AuditEvent, AuditJournal } from "@/app/lib/types/admin/audit";
import { redact, validJournal } from "./engine";
export const AUDIT_STORAGE_KEY = "mbank_audit_journal_v1";
export const AUDIT_EVENT="mbank:audit-updated";
const EMPTY: AuditJournal = {revision:0,events:[],notes:[]};
let cached: AuditJournal | null = null;
let warning: string | null = null;
const listeners = new Set<() => void>();
export function readAuditJournal(): AuditJournal {
  const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
  if (!raw) return EMPTY;
  const data: unknown = JSON.parse(raw);
  if (!validJournal(data)) throw new Error("Audit journal is invalid. Preserve browser storage for recovery; audit writes are blocked.");
  return data;
}
function safeRead() {
  warning = null;
  try { return readAuditJournal(); } catch { warning="Local audit journal is unavailable or corrupt. Its events are excluded; exports and annotations are blocked. Preserve the stored data for recovery."; return EMPTY; }
}
function snapshot() { return typeof window==="undefined" ? EMPTY : cached ??= safeRead(); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const changed = (event: StorageEvent) => { if (event.key===AUDIT_STORAGE_KEY || event.key===null) refreshAuditJournal(); };
  window.addEventListener("storage",changed);
  return () => { listeners.delete(listener); window.removeEventListener("storage",changed); };
}
export function useAuditJournal() { return useSyncExternalStore(subscribe,snapshot,() => EMPTY); }
export function auditJournalWarning() { return warning; }
export function refreshAuditJournal() { cached=safeRead(); listeners.forEach(fn => fn()); }
function save(state: AuditJournal) {
  if (!validJournal(state)) throw new Error("Invalid audit record. No changes were saved.");
  try { localStorage.setItem(AUDIT_STORAGE_KEY,JSON.stringify(state)); }
  catch { throw new Error("Audit storage is unavailable or full. No audit changes were saved."); }
  cached=state; warning=null; listeners.forEach(fn => fn());
  if(typeof window!=="undefined")window.dispatchEvent(new Event(AUDIT_EVENT));
}
function checkActor(actor: AuditActor) {
  if (actor.role!=="admin" || !actor.email.trim()) throw new Error("Administrator access required for audit writes.");
}
function makeEvent(draft: AuditDraft, actor: AuditActor, now: string): AuditEvent {
  return {...draft,id:`journal:${crypto.randomUUID()}`,timestamp:now,domain:draft.domain??"PLATFORM",severity:draft.severity??"INFO",outcome:draft.outcome??"SUCCESS",actor:actor.email,actorRole:"ADMIN",correlationId:draft.correlationId??null,requestId:null,sessionId:null,ip:draft.ip??null,durationMs:null,origin:"LOCAL",before:redact(draft.before),after:redact(draft.after)};
}
export function appendAuditEvent(draft: AuditDraft, actor: AuditActor, key?: string) {
  checkActor(actor);
  const state=readAuditJournal(); const payload=JSON.stringify({actor:actor.email.toLowerCase(),draft:redact(draft)});
  if(key!==undefined){if(!key.trim())throw new Error("Idempotency key required.");const receipt=state.receipts?.find(r=>r.key===key);if(receipt){if(receipt.payload!==payload)throw new Error("Idempotency key reused for another audit operation.");const saved=state.events.find(e=>e.id===receipt.resultId);if(!saved)throw new Error("Invalid audit receipt.");return saved;}}
  const event=makeEvent(draft,actor,new Date().toISOString());
  save({...state,revision:state.revision+1,events:[event,...state.events],...(key?{receipts:[...(state.receipts??[]),{key,payload,resultId:event.id}]}:{})}); return event;
}
export function appendAuditNote(eventId: string, text: string, actor: AuditActor, request?: {key:string;expectedRevision:number}) {
  checkActor(actor);
  if (!eventId || text.trim().length<10 || text.trim().length>500) throw new Error("A note of 10–500 characters is required.");
  const state=readAuditJournal();
  const payload=JSON.stringify({actor:actor.email.toLowerCase(),eventId,text:text.trim(),expectedRevision:request?.expectedRevision});
  if(request){if(!request.key.trim())throw new Error("Idempotency key required.");const receipt=state.receipts?.find(r=>r.key===request.key);if(receipt){if(receipt.payload!==payload)throw new Error("Idempotency key reused for a different note.");const saved=state.notes.find(n=>n.id===receipt.resultId);if(!saved)throw new Error("Invalid note receipt.");return saved;}if(request.expectedRevision!==state.revision)throw new Error("Audit annotations changed. Refresh and review before retrying.");}
  const timestamp=new Date().toISOString();
  const note={id:`note:${crypto.randomUUID()}`,eventId,text:text.trim(),actor:actor.email,timestamp};
  const event=makeEvent({source:"AUDIT",category:"COMPLIANCE",action:"INVESTIGATION_NOTE_ADDED",target:eventId,reason:note.text,before:null,after:{noteId:note.id}},actor,timestamp);
  save({...state,revision:state.revision+1,notes:[...state.notes,note],events:[event,...state.events],...(request?{receipts:[...(state.receipts??[]),{key:request.key,payload,resultId:note.id}]}:{})}); return note;
}
