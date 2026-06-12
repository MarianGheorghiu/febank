"use client";

import React, { useState } from "react";
import { Shield, ShieldCheck, Zap } from "lucide-react";
import { BufferLine } from "@/app/lib/loans/types";

interface BufferLineWidgetProps {
  bufferData: BufferLine;
  currency: string;
}

export default function BufferLineWidget({
  bufferData,
  currency,
}: BufferLineWidgetProps) {
  const [enabled, setEnabled] = useState(bufferData.isActive);

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[230px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Shield
                size={14}
                className={
                  enabled && bufferData.usedAmount > 0
                    ? "animate-pulse text-amber-400"
                    : ""
                }
              />
            </div>
            Buffer Shield
          </h2>

          <button
            onClick={() => setEnabled(!enabled)}
            className={`cursor-pointer w-9 h-4.5 rounded-full p-[2px] transition-all border ${
              enabled
                ? "bg-cyan-400/20 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                : "bg-[#02040f] border-slate-700"
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all ${enabled ? "bg-cyan-400 translate-x-4.5 shadow-[0_0_5px_#22d3ee]" : "bg-slate-500 translate-x-0"}`}
            />
          </button>
        </div>

        {/* VALUE METRICS DISPLAY */}
        <div className="grid grid-cols-2 gap-3 font-mono my-2 shrink-0">
          <div className="p-2.5 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              Shield Limit
            </span>
            <span className="text-white font-black text-sm">
              ${bufferData.limit.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              Drawn Cache
            </span>
            <span
              className={`font-black text-sm ${bufferData.usedAmount > 0 ? "text-amber-400" : "text-white"}`}
            >
              ${bufferData.usedAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* TIMELINE CYCLE AND EXECUTE ACTIONS */}
        <div className="flex-1 flex flex-col justify-center my-1">
          {enabled && bufferData.usedAmount > 0 ? (
            <div className="p-2 bg-[#02040f] border border-cyan-500/20 rounded font-mono">
              <div className="flex justify-between items-center text-[8px] font-bold text-cyan-400 mb-1 uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <Zap size={10} /> Grace Vector
                </span>
                <span className="text-white">
                  {bufferData.remainingGraceDays} Days Left
                </span>
              </div>
              <div className="w-full h-1 bg-cyan-950 rounded overflow-hidden flex gap-[1px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 ${i < bufferData.remainingGraceDays ? "bg-cyan-400 shadow-[0_0_4px_#22d3ee]" : "bg-slate-800"}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-2 text-[9px] font-mono text-center border border-dashed border-cyan-500/20 text-slate-400 bg-[#02040f]/30 uppercase tracking-widest rounded">
              {enabled
                ? "✓ System Armed • Direct debits covered"
                : "⚠ Protection offline • Defused state"}
            </div>
          )}
        </div>

        {/* ACTION TRIGGER BUTTON */}
        <div className="shrink-0 pt-2 border-t border-cyan-500/10">
          <button className="cursor-pointer w-full py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-[#02040f] font-mono font-black text-[10px] uppercase tracking-widest transition-all text-center">
            MANUAL BUFFER DRAW
          </button>
        </div>
      </div>
    </div>
  );
}
