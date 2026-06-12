"use client";

import React, { useState } from "react";
import {
  Coins,
  Search,
  X,
  Layers,
  ShieldCheck,
  Check,
  Plus,
} from "lucide-react";
import { CollateralAsset, LombardLoan } from "@/app/lib/loans/types";
import {
  calculateLTV,
  getLTVStatus,
  calculateMaxBorrowCapacity,
} from "@/app/lib/loans/calculators";

interface LombardDashboardProps {
  portfolio: CollateralAsset[];
  activeLoan: LombardLoan | null;
  currency: string;
}

export default function LombardDashboard({
  portfolio,
  activeLoan,
  currency,
}: LombardDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<string[]>(
    portfolio
      .filter((a) => a.allocatedToLoan > 0 || a.isEligible)
      .map((a) => a.id),
  );

  const filteredPortfolio = portfolio.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeSelectedAssets = portfolio.filter((asset) =>
    selectedAssets.includes(asset.id),
  );
  const totalCollateralValue = activeSelectedAssets.reduce(
    (sum, asset) => sum + asset.totalValue,
    0,
  );
  const maxBorrowCapacity = calculateMaxBorrowCapacity(activeSelectedAssets);

  const borrowedAmount = activeLoan?.borrowedAmount || 0;
  const currentLTV = calculateLTV(borrowedAmount, totalCollateralValue);
  const ltvRisk = activeLoan
    ? getLTVStatus(
        currentLTV,
        activeLoan.marginCallLTV,
        activeLoan.liquidationLTV,
      )
    : "SAFE";

  const toggleAsset = (id: string) => {
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[484px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* HEADER CONTROL AREA */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Layers size={14} />
            </div>
            Lombard Leverage Pool
          </h2>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
            {activeSelectedAssets.length} / {portfolio.length} COLLATERALIZED
          </span>
        </div>

        {/* HIGH-CONTRAST SEARCH BAR */}
        <div className="relative mb-3 shrink-0">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="SEARCH ASSET CLASS OR TICKER..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#02040f]/60 border border-cyan-500/30 focus:border-cyan-400 rounded-lg pl-8 pr-7 py-2 font-mono text-[10px] text-cyan-400 placeholder-slate-500 uppercase tracking-wider focus:outline-none transition-all"
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

        {/* INTERACTIVE TABLE GRID */}
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1 mb-3">
          {filteredPortfolio.map((asset) => {
            const isSelected = selectedAssets.includes(asset.id);
            return (
              <div
                key={asset.id}
                onClick={() => asset.isEligible && toggleAsset(asset.id)}
                className={`flex justify-between items-center p-3 rounded-lg font-mono transition-all duration-150 ${
                  !asset.isEligible
                    ? "opacity-25 cursor-not-allowed bg-[#02040f]/20 border border-transparent"
                    : isSelected
                      ? "bg-[#02040f] border border-cyan-400 shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] cursor-pointer"
                      : "bg-[#02040f]/50 border border-blue-500/10 hover:border-cyan-500/40 hover:bg-[#02040f]/80 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                      isSelected
                        ? "bg-cyan-400 text-[#02040f] border-transparent shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                        : "bg-cyan-950/40 border border-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    {asset.ticker.slice(0, 3)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-white uppercase truncate flex items-center gap-2">
                      {asset.name}
                      <span className="px-1 rounded bg-[#02040f] text-[8px] text-cyan-400 border border-cyan-500/10">
                        LTV {asset.maxLTV}%
                      </span>
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide">
                      Class: {asset.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:flex flex-col">
                    <span className="font-black text-white text-xs">
                      ${asset.totalValue.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-cyan-400/70">
                      Cap: $
                      {(
                        (asset.totalValue * asset.maxLTV) /
                        100
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div
                    className={`p-1 rounded transition-all ${isSelected ? "text-cyan-400" : "text-slate-600"}`}
                  >
                    {isSelected ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM METRICS MATRIX AND APPLY BUTTON */}
        <div className="p-3 rounded-lg bg-[#02040f] border border-cyan-500/20 flex items-center justify-between gap-4 shrink-0 font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-bold block">
                Pledge Value
              </span>
              <span className="text-xs font-black text-white">
                ${totalCollateralValue.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-bold block">
                Available Draw
              </span>
              <span className="text-xs font-black text-cyan-400">
                ${maxBorrowCapacity.toLocaleString()}
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[8px] text-slate-500 uppercase font-bold block">
                Risk Vector
              </span>
              <span
                className={`text-xs font-black uppercase ${ltvRisk === "CRITICAL" ? "text-rose-400" : "text-emerald-400"}`}
              >
                {currentLTV}% {ltvRisk}
              </span>
            </div>
          </div>

          <button className="cursor-pointer px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-[#02040f] font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]">
            APPLY FOR LOAN
          </button>
        </div>
      </div>
    </div>
  );
}
