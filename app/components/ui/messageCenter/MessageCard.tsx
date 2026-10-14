import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import type { Message } from "@/app/lib/types/messages";
import { formatMoney } from "@/app/lib/overview/engine";
import CardSurface from "../CardSurface";
export default function MessageCard({ message, onClick, isActive, isSelected, onToggleSelect, disabled }: {
  message: Message; onClick: (id: string) => void; isActive: boolean; isSelected: boolean; onToggleSelect: (id: string) => void; disabled?: boolean;
}) {
  const unread = message.read_at === null;
  const Icon = message.type === "bank" ? ShieldCheck : MessageCircle;
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/Bucharest" }).format(new Date(message.created_at));
  return <CardSurface tone="blue" className="shrink-0 flex items-start gap-1 p-2">
    <label className="flex min-h-11 w-9 shrink-0 cursor-pointer items-center justify-center">
      <input type="checkbox" checked={isSelected} disabled={disabled} onChange={() => onToggleSelect(message.id)} aria-label={`Select ${message.subject}`} className="h-4 w-4 accent-cyan-400 cursor-pointer" />
    </label>
    <button id={`message-open-${message.id}`} type="button" disabled={disabled} onClick={() => onClick(message.id)} aria-label={`Open ${message.subject}${unread ? ", unread" : ""}`} aria-current={isActive ? "true" : undefined} className="flex min-w-0 flex-1 gap-3 rounded-xl p-2 text-left cursor-pointer disabled:cursor-wait focus-visible:outline-none focus-visible:bg-blue-400/10">
      <span aria-hidden="true" className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-300/10 bg-blue-400/5 text-blue-300"><Icon size={16} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"><span className={`text-[11px] font-semibold ${unread ? "text-cyan-200" : "text-slate-300"}`}>{message.sender.name}</span><time dateTime={message.created_at} className="text-[10px] text-slate-500">{date}</time></span>
        <span className={`mt-1 flex items-start gap-2 text-sm leading-snug ${unread ? "font-semibold text-white" : "text-slate-200"}`}>{unread && <span aria-label="Unread" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />}<span className="min-w-0 break-words">{message.subject}</span></span>
        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{message.body}</span>
        {(message.amount || message.replies.length > 0) && <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          {message.amount && <span className="rounded-md border border-blue-300/10 bg-blue-400/5 px-2 py-1 text-blue-200">{formatMoney(message.amount.value, message.amount.currency)}</span>}
          {message.replies.length > 0 && <span className="inline-flex items-center gap-1"><Mail size={11} />{message.replies.length} {message.replies.length === 1 ? "reply" : "replies"}</span>}
        </span>}
      </span>
    </button>
  </CardSurface>;
}
