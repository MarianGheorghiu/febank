import { ShieldCheck, ArrowUpRight, Check } from "lucide-react";
import { Message } from "./types";

interface MessageCardProps {
  message: Message;
  onClick: (id: string) => void;
  isActive: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export default function MessageCard({
  message,
  onClick,
  isActive,
  isSelected,
  onToggleSelect,
}: MessageCardProps) {
  const isBank = message.type === "bank";

  return (
    <div
      onClick={() => onClick(message.id)}
      className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer backdrop-blur-md
        ${
          isActive
            ? "bg-blue-950/40 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            : "bg-zinc-950/20 border-white/[0.02] hover:border-white/[0.06] hover:bg-white/[0.01]"
        }`}
    >
      {/* OUTLOOK HOVER STYLE CHECKBOX CONTAINER - ZERO LAYOUT JUMP */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(message.id);
        }}
        className={`cursor-pointer flex-shrink-0 mt-1.5 w-4 h-4 rounded border flex items-center justify-center transition-all duration-150
          ${
            isSelected
              ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)] opacity-100"
              : "border-white/20 bg-zinc-900 opacity-0 group-hover:opacity-100 hover:border-blue-400"
          }`}
      >
        {isSelected && <Check size={10} strokeWidth={3} />}
      </div>

      {/* AVATAR COMPACT */}
      <div className="flex-shrink-0">
        {isBank ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck size={14} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 font-mono font-bold text-[10px]">
            {message.senderName.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* CONȚINUT */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-mono text-[10px] tracking-wider uppercase ${message.isUnread ? "text-blue-400 font-black" : "text-zinc-500 font-medium"}`}
          >
            {message.senderName}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">
            {message.timestamp}
          </span>
        </div>

        <h4
          className={`text-xs tracking-tight truncate transition-colors duration-150
          ${message.isUnread ? "font-black text-white" : "font-medium text-zinc-400"} 
          ${isActive ? "text-blue-300" : ""}`}
        >
          {message.title}
        </h4>

        <p
          className={`text-[11px] line-clamp-1 leading-relaxed transition-colors duration-150
          ${message.isUnread ? "text-zinc-300 font-bold" : "text-zinc-500 font-normal"}`}
        >
          {message.previewText}
        </p>

        {message.meta?.amount && (
          <div className="inline-flex items-center gap-1 mt-1 bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.2 rounded text-[10px] font-mono text-blue-300">
            <ArrowUpRight size={10} />
            {message.meta.amount}
          </div>
        )}
      </div>
    </div>
  );
}
