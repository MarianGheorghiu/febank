"use client";

import React, { useState } from "react";
import { Percent, Shield, Check, Lock, Eye } from "lucide-react";

export default function BusinessHealthEngine() {
  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[230px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Shield size={14} />
            </div>
            Corporate Risk Optimizer
          </h2>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
            HEALTH: 92/100
          </span>
        </div>

        {/* OPERATIONS MATRIX QUESTS */}
        <div className="flex-1 overflow-y-auto space-y-1.5 my-2.5 pr-1 scrollbar-thin">
          {/* OPTIMIZER MATRIX ITEM 1 */}
          <div className="flex justify-between items-center p-2 rounded-lg font-mono border bg-[#02040f]/80 border-cyan-500/30 text-[10px]">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-0.5 rounded text-cyan-400 bg-cyan-950/40 shrink-0">
                <Check size={12} strokeWidth={3} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white uppercase truncate tracking-wide">
                  Accounting API Live Link
                </span>
                <span className="text-[8px] text-slate-500 truncate uppercase">
                  Xero / QuickBooks Live Synced
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-cyan-400 ml-2 shrink-0">
              -0.50% APR
            </span>
          </div>

          {/* OPTIMIZER MATRIX ITEM 2 */}
          <div className="flex justify-between items-center p-2 rounded-lg font-mono border bg-[#02040f]/30 border-blue-500/5 opacity-40 text-[10px]">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-0.5 rounded text-slate-600 shrink-0">
                <Lock size={11} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white uppercase truncate tracking-wide">
                  Cash Flow Primary Lock
                </span>
                <span className="text-[8px] text-slate-500 truncate uppercase">
                  Route 60% of Monthly Gross Here
                </span>
              </div>
            </div>
            <button className="cursor-pointer px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-cyan-400 text-[#02040f] shrink-0 hover:bg-white transition-all">
              LINK
            </button>
          </div>
        </div>

        {/* METRIC COMPLIANCE METRIC FOOTER */}
        <div className="text-[8px] font-mono flex justify-between items-center text-slate-500 border-t border-cyan-500/10 pt-2 shrink-0">
          <span>ALGORITHMIC SCORE REVIEWS DAILY</span>
          <span className="text-cyan-400 uppercase font-bold flex items-center gap-1 cursor-pointer hover:text-white">
            <Eye size={10} /> Audit Log
          </span>
        </div>
      </div>
    </div>
  );
}
