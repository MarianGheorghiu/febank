"use client";
import { useSyncExternalStore } from "react";
import type { AuditActor, AuditDraft, AuditEvent, AuditJournal } from "@/app/lib/types/admin/audit";
import { redact, validJournal } from "./engine";
export const AUDIT_STORAGE_KEY = "mbank_audit_journal_v1";
const EMPTY: AuditJournal = {revision:0,events:[],notes:[]};
let cached: AuditJournal | null = null;
let warning: string | null = null;
const listeners = new Set<() => void>();
function read(): AuditJournal {
  const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
  if (!raw) return EMPTY;
  const data: unknown = JSON.parse(raw);
  if (!validJournal(data)) throw new Error("Audit journal is invalid. Preserve browser storage for recovery; audit writes are blocked.");
  return data;
}
function safeRead() {
  warning = null;
  try { return read(); } catch { warning="Local audit journal is unavailable or corrupt. Its events are excluded; exports and annotations are blocked. Preserve the stored data for recovery."; return EMPTY; }
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
}
function checkActor(actor: AuditActor) {
  if (actor.role!=="admin" || !actor.email.trim()) throw new Error("Administrator access required for audit writes.");
}
function makeEvent(draft: AuditDraft, actor: AuditActor, now: string): AuditEvent {
  return {...draft,id:`journal:${crypto.randomUUID()}`,timestamp:now,domain:draft.domain??"PLATFORM",severity:draft.severity??"INFO",outcome:draft.outcome??"SUCCESS",actor:actor.email,actorRole:"ADMIN",correlationId:draft.correlationId??null,requestId:null,sessionId:null,ip:draft.ip??null,durationMs:null,origin:"LOCAL",before:redact(draft.before),after:redact(draft.after)};
}
export function appendAuditEvent(draft: AuditDraft, actor: AuditActor) {
  checkActor(actor);
  const state=read(); const event=makeEvent(draft,actor,new Date().toISOString());
  save({...state,revision:state.revision+1,events:[event,...state.events]}); return event;
}
export function appendAuditNote(eventId: string, text: string, actor: AuditActor) {
  checkActor(actor);
  if (!eventId || text.trim().length<10 || text.trim().length>500) throw new Error("A note of 10–500 characters is required.");
  const state=read(); const timestamp=new Date().toISOString();
  const note={id:`note:${crypto.randomUUID()}`,eventId,text:text.trim(),actor:actor.email,timestamp};
  const event=makeEvent({source:"AUDIT",category:"COMPLIANCE",action:"INVESTIGATION_NOTE_ADDED",target:eventId,reason:note.text,before:null,after:{noteId:note.id}},actor,timestamp);
  save({...state,revision:state.revision+1,notes:[...state.notes,note],events:[event,...state.events]}); return note;
}
