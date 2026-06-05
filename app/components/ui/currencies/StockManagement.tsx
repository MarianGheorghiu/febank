"use client";

import React, { useState } from "react";
import { TrendingUp, Plus, Search, X } from "lucide-react";
import { StockAsset } from "@/app/lib/mockCurrencies";

export default function StockManagement({ stocks }: { stocks: StockAsset[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrarea acțiunilor după numele companiei
  const filteredStocks = stocks.filter((stock) =>
    stock.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative border border-cyan-500/30  bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] flex flex-col h-full overflow-hidden">
      {/* Neon Glow Cyberpunk (Strict Amber/Orange) */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/10 to-orange-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* HEADER CARD */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-amber-500/10 shrink-0">
          <h2 className="text-amber-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-amber-500/10 text-amber-400">
              <TrendingUp size={14} />
            </div>
            Equity Portfolio
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
              {filteredStocks.length} / {stocks.length} ASSETS
            </span>
          </div>
        </div>

        {/* SEARCH BAR INTEGRAT PENTRU STOCKS */}
        <div className="relative mb-4 shrink-0">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="SEARCH BY COMPANY NAME..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#02040f]/60 border border-blue-500/10 focus:border-amber-500/40 rounded-lg pl-8 pr-7 py-1.5 font-mono text-[10px] text-amber-400 placeholder-slate-600 uppercase tracking-wider focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* LISTA DE ACȚIUNI FILTRATE */}
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto scrollbar-thin pr-1">
          {filteredStocks.map((stock) => (
            <div
              key={stock.id}
              className="flex justify-between items-center p-3 rounded-lg bg-[#02040f]/50 border border-blue-500/10 hover:border-amber-500/30 hover:bg-[#02040f]/80 transition-all shrink-0 animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Ticker / Avatar generat din numele companiei */}
                <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-black text-xs shrink-0 select-none">
                  {stock.name.slice(0, 3).toUpperCase()}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="font-sans font-bold text-sm text-zinc-200 truncate">
                    {stock.name}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase mt-0.5">
                    {stock.shares} SHARES
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="font-mono font-black text-white text-sm">
                  $
                  {stock.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className="font-mono text-[8px] font-bold text-amber-400 bg-amber-400/5 px-1 rounded border border-amber-500/10 uppercase tracking-widest mt-0.5">
                  ACTIVE
                </span>
              </div>
            </div>
          ))}

          {filteredStocks.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono text-xs py-8">
              No positions found inside index.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
