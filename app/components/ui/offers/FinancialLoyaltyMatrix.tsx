"use client";

import React, { useState } from "react";
import { Percent, Sparkles, Lock, Search, X, Check } from "lucide-react";
import { CashbackOffer, RestrictedAsset } from "@/app/lib/mockOffers";

interface Props {
  cashbackOffers: CashbackOffer[];
  restrictedAssets: RestrictedAsset[];
  pointsBalance: number;
  onDeductPoints: (amount: number, brandName: string) => void;
  onUnlockAsset: (id: string) => void;
}

export default function FinancialLoyaltyMatrix({
  cashbackOffers,
  restrictedAssets,
  pointsBalance,
  onDeductPoints,
  onUnlockAsset,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCashback = cashbackOffers.filter(
    (cb) =>
      cb.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cb.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredAssets = restrictedAssets.filter((as) =>
    as.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[484px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-2">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-3 border-b border-cyan-500/10 shrink-0 font-mono">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Percent size={14} />
            </div>
            Financial Ecosystem & Yield
          </h2>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest">
            MATRIX INTEGRITY BLOCKS
          </span>
        </div>

        {/* HIGH CONTRAST SEARCH BAR */}
        <div className="relative my-1 shrink-0">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400"
          />
          <input
            type="text"
            placeholder="SEARCH LUXURY PERKS OR INVESTMENT NODES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#02040f]/60 border border-cyan-500/50 focus:border-cyan-400 rounded-lg pl-8 pr-7 py-2 font-mono text-[10px] text-white placeholder-slate-500 uppercase tracking-wider focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* SPLIT VIEW SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden my-1">
          {/* LEFT CONTAINER: CASHBACK PURGE */}
          <div className="flex flex-col h-full overflow-hidden border-b md:border-b-0 md:border-r border-cyan-500/10 pb-3 md:pb-0 md:pr-4">
            <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block mb-2">
              Dynamic Luxury Cashback Ledger
            </span>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {filteredCashback.map((cb) => {
                const eraseCost = Math.round(cb.minSpend * 8); // Cost calculat dinamic în puncte
                const canErase = pointsBalance >= eraseCost;

                return (
                  <div
                    key={cb.id}
                    className="flex justify-between items-center p-2.5 rounded-lg font-mono text-[10px] bg-[#02040f]/60 border border-blue-500/10"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-white uppercase truncate tracking-wide">
                        {cb.brand}
                      </span>
                      <span className="text-[8px] text-slate-500 uppercase truncate">
                        {cb.category} • Cost: {eraseCost.toLocaleString()} Pts
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-2 flex items-center gap-2.5">
                      <span className="text-emerald-400 font-black text-xs">
                        +{cb.rate}%
                      </span>
                      <button
                        disabled={!canErase}
                        onClick={() => onDeductPoints(eraseCost, cb.brand)}
                        className={`cursor-pointer px-2 py-1 text-[8px] font-black uppercase rounded tracking-widest transition-all ${
                          canErase
                            ? "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_5px_rgba(34,211,238,0.2)]"
                            : "bg-slate-900 text-slate-600 border border-transparent cursor-not-allowed"
                        }`}
                      >
                        PURGE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT CONTAINER: GATED PRIVATE INVESTMENTS */}
          <div className="flex flex-col h-full overflow-hidden pt-2 md:pt-0">
            <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block mb-2">
              Restricted Asset Operations
            </span>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
              {filteredAssets.map((as) => (
                <div
                  key={as.id}
                  className={`flex justify-between items-center p-2.5 rounded-lg font-mono border text-[10px] transition-all ${
                    as.isLocked
                      ? "bg-[#02040f]/30 border-blue-500/5 opacity-50"
                      : "bg-[#02040f]/60 border-cyan-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`p-1 rounded shrink-0 ${as.isLocked ? "text-slate-600" : "text-cyan-400 bg-cyan-950/40"}`}
                    >
                      {as.isLocked ? (
                        <Lock size={11} />
                      ) : (
                        <Sparkles size={11} />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-white uppercase truncate tracking-wide">
                        {as.name}
                      </span>
                      <span className="text-[8px] text-slate-500 uppercase tracking-tighter">
                        Min entry: ${as.minEntryCapital.toLocaleString()} •
                        Tier: {as.riskRating}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    {as.isLocked ? (
                      <button
                        onClick={() => onUnlockAsset(as.id)}
                        className="cursor-pointer px-2 py-0.5 text-[8px] font-black uppercase rounded bg-cyan-400 text-black tracking-widest hover:bg-white transition-all shadow-[0_0_5px_rgba(34,211,238,0.2)]"
                      >
                        UNLOCK
                      </button>
                    ) : (
                      <span className="text-xs font-black text-cyan-400 drop-shadow-[0_0_4px_#22d3ee]">
                        {as.expectedYield}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER METRICS */}
        <div className="text-[8px] font-mono flex justify-between items-center text-slate-500 border-t border-cyan-500/10 pt-2 shrink-0">
          <span>
            ALGORITHMIC SECURE DETECTORS: REWARDING ACTIVE TRADING YIELDS
          </span>
        </div>
      </div>
    </div>
  );
}
