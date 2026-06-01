import { useState } from "react";
import { CornerUpLeft, Send } from "lucide-react";

interface MessageReplyComposerProps {
  onSendReply: (text: string) => void;
  onCancel: () => void;
}

export default function MessageReplyComposer({
  onSendReply,
  onCancel,
}: MessageReplyComposerProps) {
  const [replyText, setReplyText] = useState("");

  const QUICK_TEMPLATES = [
    "Secure Transaction Authorized.",
    "Request further biometric validation.",
    "Data logged. Disregard anomaly.",
  ];

  return (
    <div className="p-4 border-t border-white/[0.04] bg-zinc-950/40 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[10px] font-bold uppercase tracking-wider">
        <CornerUpLeft size={12} />
        <span>Compose Encrypted Routing Response</span>
      </div>

      {/* TEXTAREA PREMIUM GLASS */}
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Type secure uplink response payload..."
        className="w-full min-h-[80px] p-3 text-xs bg-zinc-900/60 border border-white/[0.05] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition resize-none font-sans"
      />

      {/* QUICK WORKFLOW TEMPLATES */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_TEMPLATES.map((tpl, idx) => (
          <button
            key={idx}
            onClick={() => setReplyText(tpl)}
            className="cursor-pointer px-2.5 py-1 text-[10px] font-mono border border-white/[0.03] bg-white/[0.02] text-zinc-400 rounded-md hover:text-blue-300 hover:border-blue-500/20 hover:bg-blue-500/5 transition"
          >
            {tpl}
          </button>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="cursor-pointer px-3 py-1.5 rounded-lg border border-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/5 font-mono text-[10px] uppercase font-bold transition"
        >
          Cancel
        </button>
        <button
          disabled={!replyText.trim()}
          onClick={() => onSendReply(replyText)}
          className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-mono text-[10px] uppercase font-bold rounded-lg transition shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          <Send size={11} />
          Transmit Reply
        </button>
      </div>
    </div>
  );
}
