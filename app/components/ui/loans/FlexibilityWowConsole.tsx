"use client";

import React, { useState } from "react";
import { ShieldAlert, Zap, Globe, RefreshCw, CheckCircle2 } from "lucide-react";

export default function FlexibilityWowConsole() {
  const [skipUsed, setSkipUsed] = useState(false);
  const [consolidationOpen, setConsolidationOpen] = useState(false);

  const handleSkipInstallment = () => {
    setSkipUsed(true);
  };

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[230px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between font-mono">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Zap size={14} />
            </div>
            Premium Flexibility Matrix
          </h2>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase">
            Control Engine
          </span>
        </div>

        {/* CONTROLS AREA WITH TWO EXPANSION LAYERS */}
        <div className="flex-1 flex flex-col justify-center gap-2.5 my-1.5">
          {/* 1. ONE-CLICK SKIP ROW */}
          <div className="p-2 bg-[#02040f]/80 border border-blue-500/10 rounded flex justify-between items-center text-[10px]">
            <div className="flex flex-col">
              <span className="font-bold text-white uppercase tracking-wide">
                One-Click Installment Skip
              </span>
              <span className="text-[8px] text-slate-500 uppercase">
                1 Penalty-Free Pause Token Available Per Year
              </span>
            </div>
            <button
              disabled={skipUsed}
              onClick={handleSkipInstallment}
              className={`cursor-pointer px-2.5 py-1 text-[8px] font-black uppercase rounded tracking-wider transition-all ${
                skipUsed
                  ? "bg-slate-900 text-slate-600 border border-transparent cursor-not-allowed"
                  : "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
              }`}
            >
              {skipUsed ? "EXECUTED" : "SKIP NEXT RATĂ"}
            </button>
          </div>

          {/* 2. CROSS-BORDER REFINANCE PREVIEW BLOCK */}
          <div className="p-2 bg-[#02040f]/80 border border-blue-500/10 rounded flex justify-between items-center text-[10px]">
            <div className="flex flex-col">
              <span className="font-bold text-white uppercase tracking-wide">
                Multi-Currency Consolidation
              </span>
              <span className="text-[8px] text-slate-500 uppercase">
                Refinance External Foreign Debt (EUR, JPY, GBP)
              </span>
            </div>
            <button
              onClick={() => setConsolidationOpen(!consolidationOpen)}
              className={`cursor-pointer p-1 rounded border transition-all ${
                consolidationOpen
                  ? "text-cyan-400 border-cyan-400 bg-cyan-950/40"
                  : "text-slate-400 border-blue-500/20 hover:text-cyan-400"
              }`}
            >
              <Globe size={13} />
            </button>
          </div>
        </div>

        {/* DYNAMIC LOWEST SUB-DRAWER DISPLAY FOR CROSS BORDER */}
        <div className="shrink-0 h-6 flex items-center justify-between border-t border-cyan-500/10 pt-2 text-[8px] text-slate-500 uppercase">
          {consolidationOpen ? (
            <span className="text-cyan-400 font-bold flex items-center gap-1 animate-pulse">
              • Input Hub Ready • Syncing international credit parameters
            </span>
          ) : (
            <>
              <span>Algorithmic schedule adjustment: Active</span>
              {skipUsed && (
                <span className="text-cyan-400 font-bold">
                  ✓ Recalculating Matrix...
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
