"use client";
import { useEffect, useRef, useState } from "react";
import { Save, Send, X } from "lucide-react";
import { MAX_REPLY_LENGTH } from "@/app/lib/messages/engine";
import { ActionButton } from "../dashboard/ActionButton";
export default function MessageReplyComposer({ initialDraft, onSendReply, onSaveDraft, onCancel }: {
  initialDraft: string; onSendReply: (text: string, replyId: string) => Promise<void>;
  onSaveDraft: (text: string) => Promise<void>; onCancel: () => void;
}) {
  const [body, setBody] = useState(initialDraft);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const dirty = useRef(false);
  const replyId = useRef<string | null>(null);
  const latest = useRef(body);
  useEffect(() => {
    if (!dirty.current) return;
    const timer = window.setTimeout(() => {
      if (!dirty.current) return;
      const value = latest.current;
      onSaveDraft(value).then(() => { if (latest.current === value) { dirty.current = false; setSaved(true); } }).catch(cause => setError(cause instanceof Error ? cause.message : "Draft could not be saved."));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [body, onSaveDraft]);
  useEffect(() => () => { if (dirty.current) void onSaveDraft(latest.current).catch(() => {}); }, [onSaveDraft]);
  async function saveAndClose(discard = false) {
    setPending(true); setError("");
    try { await onSaveDraft(discard ? "" : body); dirty.current = false; onCancel(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Draft could not be saved."); }
    finally { setPending(false); }
  }
  return <form onSubmit={async event => {
    event.preventDefault(); if (pending || !body.trim()) return;
    setPending(true); setError(""); dirty.current = false;
    try { replyId.current ??= crypto.randomUUID(); await onSendReply(body, replyId.current); }
    catch (cause) { dirty.current = true; setError(cause instanceof Error ? cause.message : "Reply could not be sent."); }
    finally { setPending(false); }
  }} className="space-y-3 rounded-xl border border-blue-300/15 bg-[#0a1428] p-4">
    <label htmlFor="message-reply" className="block text-xs font-semibold text-slate-200">Your reply</label>
    <textarea id="message-reply" autoFocus value={body} maxLength={MAX_REPLY_LENGTH} disabled={pending} onChange={event => { latest.current = event.target.value; replyId.current = null; dirty.current = true; setSaved(false); setBody(event.target.value); }} placeholder="Write your reply…" className="min-h-32 w-full resize-y rounded-xl border border-white/10 bg-[#060d1b] p-3 text-base sm:text-sm text-slate-100 outline-none focus:border-cyan-400/40" />
    <div className="flex flex-wrap justify-between gap-2 text-[10px] text-slate-400"><span role="status">{saved ? "Draft saved" : "Drafts are saved automatically"}</span><span>{body.length}/{MAX_REPLY_LENGTH}</span></div>
    <div className="flex flex-wrap gap-2">{["Thanks for the update.", "Could you share more details?", "I will review this and get back to you."].map(template => <button key={template} type="button" disabled={pending} onClick={() => { latest.current = template; replyId.current = null; dirty.current = true; setSaved(false); setBody(template); }} className="min-h-9 rounded-lg border border-white/10 px-2 text-[11px] text-slate-400 hover:bg-white/5 hover:text-slate-200 cursor-pointer">{template}</button>)}</div>
    {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <ActionButton type="submit" variant="cyan" icon={<Send size={14} />} disabled={pending || !body.trim()}>{pending ? "Saving…" : "Send reply"}</ActionButton>
      <ActionButton variant="blue" icon={<Save size={14} />} disabled={pending} onClick={() => void saveAndClose()}>Save & close</ActionButton>
      <ActionButton variant="blue" icon={<X size={14} />} disabled={pending} onClick={() => void saveAndClose(true)}>Discard draft</ActionButton>
    </div>
  </form>;
}
