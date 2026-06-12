"use client";

import React, { useState } from "react";
import { MessageSquareCode, PhoneCall, Send } from "lucide-react";

export default function ConciergeTerminal() {
  const [msg, setMsg] = useState("");
  const [log, setLog] = useState(
    "• STANDBY: LIAISON CHANNELS FULLY OPERATIONAL.",
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setLog(`• REQUEST SENT: "${msg.toUpperCase()}"`);
    setMsg("");
    setTimeout(() => {
      setLog("• CONCIERGE DISPATCH: COURIER AND RESERVATION VECTOR ENGAGED.");
    }, 1500);
  };

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[230px] overflow-hidden justify-between">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-2">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <MessageSquareCode size={14} />
            </div>
            Elite Concierge Node
          </h2>
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest">
            VVIP CALL LINK
          </span>
        </div>

        {/* SYSTEM STATUS TELEMETRY TERMINAL LOG */}
        <div className="flex-1 my-1.5 bg-[#02040f] border border-blue-500/10 rounded p-2.5 font-mono text-[9px] text-cyan-400/90 flex items-center">
          <p className="tracking-wide uppercase animate-in fade-in duration-100">
            {log}
          </p>
        </div>

        {/* MINI FORM INTERACTION CONTROLS */}
        <form onSubmit={handleSend} className="relative shrink-0 flex gap-2">
          <input
            type="text"
            placeholder="COMMAND DINNER, CHARTER FLIGHTS..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="flex-1 bg-[#02040f]/60 border border-cyan-500/30 focus:border-cyan-400 rounded p-1.5 text-[9px] font-mono text-white placeholder-slate-600 uppercase tracking-wider focus:outline-none"
          />
          <button
            type="submit"
            className="cursor-pointer bg-cyan-400 text-black px-3 rounded hover:bg-cyan-300 transition-all flex items-center justify-center"
          >
            <Send size={11} />
          </button>
        </form>
      </div>
    </div>
  );
}
