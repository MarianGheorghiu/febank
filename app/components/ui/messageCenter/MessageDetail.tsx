import { Message } from "../types";
import {
  ShieldCheck,
  ArrowLeft,
  Trash2,
  CornerUpLeft,
  X,
  CheckCircle,
} from "lucide-react";
import MessageReplyComposer from "./MessageReplyComposer";

interface MessageDetailProps {
  message: Message | null;
  isReplying: boolean;
  setIsReplying: (val: boolean) => void;
  onClose: () => void;
  onDeleteMessage: (id: string) => void;
  onTriggerReplySubmit: (text: string) => void;
}

export default function MessageDetail({
  message,
  isReplying,
  setIsReplying,
  onClose,
  onDeleteMessage,
  onTriggerReplySubmit,
}: MessageDetailProps) {
  if (!message) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full border border-white/[0.02] rounded-2xl bg-zinc-950/10">
        <ShieldCheck size={20} className="text-zinc-800 animate-pulse" />
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-2">
          Awaiting secure stream decryption
        </p>
      </div>
    );
  }

  const isDeletedFolder = message.folder === "deleted";

  return (
    <div className="flex flex-col h-full border border-blue-500/[0.05] rounded-2xl bg-gradient-to-b from-[#04091a] to-[#02050f] relative overflow-hidden">
      {/* ACTION BAR INTEGRAT */}
      <div className="p-3 border-b border-b-white/[0.03] flex items-center justify-between bg-zinc-950/30 flex-shrink-0 gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            className="cursor-pointer block lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="truncate">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-blue-400 block truncate">
              {message.senderName}
            </span>
            <span className="text-[9px] text-zinc-600 font-mono">
              {message.timestamp}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isDeletedFolder && !message.replyPayload && (
            <button
              onClick={() => setIsReplying(true)}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/20 text-blue-400 font-mono text-[10px] font-bold transition"
            >
              <CornerUpLeft size={13} className="shrink-0" />
              <span className="leading-none transform translate-y-[0.5px]">
                REPLY
              </span>
            </button>
          )}

          <button
            onClick={() => onDeleteMessage(message.id)}
            className="cursor-pointer p-1.5 h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.03] text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition"
            title={isDeletedFolder ? "Purge Permanently" : "Move to Trash"}
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.03] text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition"
            title="Close Stream"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div
        className="flex-1 p-5 overflow-y-auto space-y-4 min-h-0
        [&::-webkit-scrollbar]:w-1.5 
        [&::-webkit-scrollbar-track]:bg-transparent 
        [&::-webkit-scrollbar-thumb]:bg-zinc-800 
        hover:[&::-webkit-scrollbar-thumb]:bg-blue-600/40 
        [&::-webkit-scrollbar-thumb]:rounded-md"
      >
        <h2 className="text-sm md:text-base font-black text-white tracking-tight leading-snug">
          {message.title}
        </h2>

        <p className="text-xs text-zinc-400 font-sans leading-relaxed whitespace-pre-line">
          {message.previewText}
        </p>

        {message.meta?.amount && (
          <div className="p-3 rounded-xl border border-blue-500/10 bg-blue-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            <div>
              <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">
                Payload Sum
              </span>
              <span className="text-xs font-mono font-black text-blue-400">
                {message.meta.amount}
              </span>
            </div>
            <button className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[11px] font-bold rounded-lg transition shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <CheckCircle size={13} />
              EXECUTE
            </button>
          </div>
        )}

        {/* THREAD SYSTEM: SECURE REPLY HISTORIC VIEW */}
        {message.replyPayload && (
          <div className="mt-6 pt-4 border-t border-dashed border-blue-500/20 space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-500/10 px-2 py-1 rounded-md">
              <span>Outgoing Secure Response Logged</span>
              <span className="text-zinc-500">
                {message.replyPayload.timestamp}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-emerald-500/10 text-xs text-zinc-300 italic font-sans leading-relaxed whitespace-pre-line">
              {message.replyPayload.body}
            </div>
          </div>
        )}
      </div>

      {/* COMPOSER IN LINEA */}
      {isReplying && (
        <MessageReplyComposer
          onSendReply={onTriggerReplySubmit}
          onCancel={() => setIsReplying(false)}
        />
      )}
    </div>
  );
}
