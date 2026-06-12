"use client";

import React, { useState } from "react";
import { Percent, Search, X, Check, Lock } from "lucide-react";
import { SmartPricingEngine as PricingType } from "@/app/lib/loans/types";

interface SmartPricingEngineProps {
  pricingData: PricingType;
}

export default function SmartPricingEngine({
  pricingData,
}: SmartPricingEngineProps) {
  const [questSearch, setQuestSearch] = useState("");

  const filteredQuests = pricingData.discounts.filter(
    (q) =>
      q.label.toLowerCase().includes(questSearch.toLowerCase()) ||
      q.description.toLowerCase().includes(questSearch.toLowerCase()),
  );

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[230px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* HEADER CARD */}
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Percent size={14} />
            </div>
            Pricing Core
          </h2>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
            CURRENT APR: {pricingData.currentRate.toFixed(2)}%
          </span>
        </div>

        {/* VISIBLE QUEST SEARCH BAR */}
        <div className="relative my-2 shrink-0">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="FILTER RATE OPTIMIZATION QUESTS..."
            value={questSearch}
            onChange={(e) => setQuestSearch(e.target.value)}
            className="w-full bg-[#02040f]/60 border border-cyan-500/30 focus:border-cyan-400 rounded-lg pl-8 pr-7 py-1.5 font-mono text-[10px] text-cyan-400 placeholder-slate-500 uppercase tracking-wider focus:outline-none transition-all"
          />
          {questSearch && (
            <button
              onClick={() => setQuestSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* CONTAINER QUEST SCROLL */}
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
          {filteredQuests.map((discount) => (
            <div
              key={discount.id}
              className={`flex justify-between items-center p-2.5 rounded-lg font-mono border transition-all ${
                discount.isAchieved
                  ? "bg-[#02040f]/80 border-cyan-500/30 shadow-[inset_0_0_10px_rgba(34,211,238,0.05)]"
                  : "bg-[#02040f]/30 border-blue-500/5 opacity-40"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`p-1 rounded shrink-0 ${discount.isAchieved ? "text-cyan-400 bg-cyan-950/40" : "text-slate-600"}`}
                >
                  {discount.isAchieved ? (
                    <Check size={12} strokeWidth={3} />
                  ) : (
                    <Lock size={12} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-[10px] text-white uppercase truncate tracking-wide">
                    {discount.label}
                  </span>
                  <span className="text-[8px] text-slate-500 truncate uppercase">
                    {discount.currentValue} / {discount.targetValue}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                {discount.isAchieved ? (
                  <span className="text-xs font-black text-cyan-400">
                    -{discount.discountValue.toFixed(2)}%
                  </span>
                ) : (
                  <button className="cursor-pointer px-2 py-0.5 text-[8px] font-black uppercase rounded bg-cyan-400 text-[#02040f] tracking-widest shadow-[0_0_5px_rgba(34,211,238,0.3)] hover:bg-white transition-all">
                    BOOST
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
