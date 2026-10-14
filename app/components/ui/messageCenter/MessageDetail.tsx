"use client";
import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, ArrowLeft, ExternalLink, Inbox, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import type { Message, MessageCommand } from "@/app/lib/types/messages";
import { formatDate, formatMoney } from "@/app/lib/overview/engine";
import CardSurface from "../CardSurface";
import { ActionButton } from "../dashboard/ActionButton";
import MessageIconButton from "./MessageIconButton";
import MessageReplyComposer from "./MessageReplyComposer";
export default function MessageDetail({ message, draft, isReplying, onReplyingChange, onClose, onCommand, onPurge, onSendReply, onSaveDraft, pending }: {
  message: Message | null; draft: string; isReplying: boolean; onReplyingChange: (value: boolean) => void; onClose: () => void;
  onCommand: (command: MessageCommand) => Promise<boolean>; onPurge: (ids: string[]) => void;
  onSendReply: (id: string, body: string, replyId: string) => Promise<void>; onSaveDraft: (id: string, body: string) => Promise<void>; pending: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const readingPane = useRef<HTMLDivElement>(null);
  const messageId = message?.id;
  useEffect(() => { if (messageId) { if (readingPane.current) readingPane.current.scrollTop = 0; heading.current?.focus({ preventScroll: true }); } }, [messageId]);
  const saveDraft = useCallback((body: string) => messageId ? onSaveDraft(messageId, body) : Promise.resolve(), [messageId, onSaveDraft]);
  if (!message) return <CardSurface tone="blue" className="hidden h-full min-h-0 overflow-auto flex-col items-center justify-center p-8 text-center lg:flex"><Inbox size={32} className="text-blue-300/50" /><h2 className="mt-4 text-base font-semibold text-slate-200">Your conversations, in one place</h2><p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">Select a message to read its details, manage it or reply.</p></CardSurface>;
  const deleted = message.folder === "deleted";
  return <CardSurface as="section" tone="blue" aria-label="Conversation details" className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/5 p-2">
      <MessageIconButton label="Back to messages" icon={<ArrowLeft size={15} />} disabled={pending} onClick={onClose} />
      <div className="flex items-center gap-1">
        <MessageIconButton label={message.read_at ? "Mark unread" : "Mark read"} icon={message.read_at ? <Mail size={14} /> : <MailOpen size={14} />} disabled={pending} onClick={() => void onCommand({ kind: message.read_at ? "mark_unread" : "mark_read", ids: [message.id] })} />
        {deleted ? <MessageIconButton label="Restore" icon={<ArchiveRestore size={14} />} disabled={pending} onClick={() => void onCommand({ kind: "restore", ids: [message.id] })} /> : <MessageIconButton label={message.folder === "archived" ? "Move to inbox" : "Archive"} icon={<Archive size={14} />} disabled={pending} onClick={() => void onCommand({ kind: message.folder === "archived" ? "unarchive" : "archive", ids: [message.id] })} />}
        <MessageIconButton label={deleted ? "Delete permanently" : "Move to trash"} icon={<Trash2 size={14} />} danger disabled={pending} onClick={() => deleted ? onPurge([message.id]) : void onCommand({ kind: "trash", ids: [message.id] })} />
      </div>
    </div>
    <div ref={readingPane} className="min-h-0 flex-1 space-y-5 p-4 sm:p-6 overflow-y-auto overscroll-contain scrollbar-thin">
      <header><p className="text-[10px] font-mono uppercase tracking-widest text-blue-300/70">{message.type === "bank" ? "Bank message" : "Friend conversation"}</p><h2 ref={heading} tabIndex={-1} className="mt-2 break-words text-lg font-semibold leading-snug text-white outline-none">{message.subject}</h2><p className="mt-2 text-sm text-slate-300">{message.sender.name}</p><time dateTime={message.created_at} className="mt-1 block text-xs text-slate-500">{formatDate(message.created_at)}</time></header>
      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{message.body}</p>
      {message.amount && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-300/10 bg-blue-400/5 p-4"><div><p className="text-[10px] uppercase tracking-wider text-slate-400">{message.amount.label}</p><p className="mt-1 text-lg font-semibold tabular-nums text-blue-200">{formatMoney(message.amount.value, message.amount.currency)}</p></div><span className="text-xs text-slate-400">{message.amount.direction === "incoming" ? "Incoming" : "Outgoing"}</span></div>}
      {message.action && !deleted && <Link href={`/dashboard/${message.action.target}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300/15 bg-blue-400/5 px-4 py-2 text-xs text-blue-200 transition-colors hover:border-cyan-300/30 focus-visible:outline-2 focus-visible:outline-cyan-300"><ExternalLink size={14} />{message.action.label}</Link>}
      {message.replies.length > 0 && <div className="space-y-3 border-t border-white/5 pt-5"><h3 className="text-xs font-semibold text-slate-300">Your replies ({message.replies.length})</h3>{message.replies.map(reply => <div key={reply.id} className="rounded-xl border border-blue-300/10 bg-[#0a1428] p-4"><div className="flex flex-wrap justify-between gap-2 text-[10px] text-slate-500"><span className="text-cyan-200/70">You · Sent</span><time dateTime={reply.created_at}>{formatDate(reply.created_at)}</time></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">{reply.body}</p></div>)}</div>}
      {!deleted && message.can_reply && !isReplying && <ActionButton variant="cyan" icon={<Reply size={14} />} disabled={pending} onClick={() => onReplyingChange(true)}>{draft ? "Continue draft" : "Reply"}</ActionButton>}
      {!message.can_reply && !deleted && <p className="text-xs text-slate-500">This notification does not accept replies.</p>}
      {isReplying && message.can_reply && !deleted && <MessageReplyComposer key={message.id} initialDraft={draft} onSendReply={(body, replyId) => onSendReply(message.id, body, replyId)} onSaveDraft={saveDraft} onCancel={() => onReplyingChange(false)} />}
    </div>
  </CardSurface>;
}
