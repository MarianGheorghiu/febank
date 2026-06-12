"use client";

import React, { useState, useMemo } from "react";
import {
  Globe,
  Activity,
  TrendingUp,
  TrendingDown,
  Search,
  X,
} from "lucide-react";
import { marketAssetsData, MarketAsset } from "@/app/lib/mockData";

export default function MarketNewsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getCategoryTheme = (category: MarketAsset["category"]) => {
    switch (category) {
      case "CRYPTO":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40 group-hover/row:bg-purple-500/30 group-hover/row:border-purple-400";
      case "STOCKS":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 group-hover/row:bg-cyan-500/30 group-hover/row:border-cyan-400";
      case "FOREX":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40 group-hover/row:bg-blue-500/30 group-hover/row:border-blue-400";
      case "COMMODITIES":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 group-hover/row:bg-amber-500/30 group-hover/row:border-amber-400";
    }
  };

  const getBadgeTheme = (category: MarketAsset["category"]) => {
    switch (category) {
      case "CRYPTO":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover/row:bg-purple-500/20 group-hover/row:text-purple-300";
      case "STOCKS":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover/row:bg-cyan-500/20 group-hover/row:text-cyan-300";
      case "FOREX":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover/row:bg-blue-500/20 group-hover/row:text-blue-300";
      case "COMMODITIES":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover/row:bg-amber-500/20 group-hover/row:text-amber-300";
    }
  };

  const filteredAssets = useMemo(() => {
    return marketAssetsData.filter((asset) => {
      const matchesSearch =
        asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory
        ? asset.category === selectedCategory
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const categories = ["ALL", "CRYPTO", "STOCKS", "FOREX", "COMMODITIES"];

  return (
    <div className="p-3 sm:p-5 flex flex-col border border-cyan-500/40 bg-[#0d1527] rounded-xl relative overflow-hidden group transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] h-[355px]">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3 sm:mb-4 shrink-0 z-10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-[0.12em] sm:tracking-[0.15em]">
            <Globe size={11} className="text-cyan-400 sm:size-[12px]" />
            Global Ticker
          </div>
          <h2 className="text-xs sm:text-sm font-black font-mono text-white uppercase tracking-tight">
            Live Asset Metrics
          </h2>
        </div>
        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Activity size={9} className="animate-pulse sm:size-[10px]" /> LIVE
        </span>
      </div>

      {/* CONTROALE (SEARCH & FILTERS) */}
      <div className="space-y-2.5 sm:space-y-3 mb-3 sm:mb-4 shrink-0 z-10">
        <div className="relative flex items-center bg-[#070b14] border border-zinc-700 rounded-md focus-within:border-cyan-400 transition-all duration-200">
          <Search size={13} className="absolute left-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-8 pr-8 py-1.5 text-[11px] sm:text-xs font-mono text-white placeholder-zinc-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 p-0.5 rounded text-zinc-400 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Swipe orizontal pe mobil, așezare curată pe desktop */}
        <div className="flex gap-1 overflow-x-auto pb-1 font-mono snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            const isSelected =
              cat === "ALL"
                ? selectedCategory === null
                : selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === "ALL" ? null : cat)}
                className={`text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-1 rounded transition-all cursor-pointer border shrink-0 snap-start ${
                  isSelected
                    ? "bg-cyan-500 text-[#02040f] border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)] font-black"
                    : "bg-[#070b14] text-zinc-400 border-zinc-800 hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTA DE ACTIVE */}
      <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 z-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-[#111a36] border border-white/[0.05] hover:bg-[#162246] hover:border-cyan-500/60 transition-all duration-200 gap-2 sm:gap-3 group/row cursor-pointer"
            >
              {/* STÂNGA */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded border flex items-center justify-center shrink-0 font-mono text-[9px] sm:text-[10px] font-bold tracking-tighter transition-all duration-200 ${getCategoryTheme(asset.category)}`}
                >
                  {asset.ticker.slice(0, 3)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-white font-mono tracking-tight group-hover/row:text-cyan-300 truncate">
                      {asset.ticker}
                    </span>
                    <span
                      className={`text-[8px] font-bold px-1 rounded border font-mono tracking-wide ${getBadgeTheme(asset.category)}`}
                    >
                      {asset.category}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate transition-colors group-hover/row:text-zinc-300">
                    {asset.name}
                  </p>
                </div>
              </div>

              {/* DREAPTA */}
              <div className="flex items-center gap-2 sm:gap-3 text-right shrink-0">
                <div className="font-mono text-xs sm:text-sm font-bold text-white tabular-nums tracking-tight">
                  {asset.price}
                </div>
                <div
                  className={`w-16 sm:w-20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[11px] font-mono font-bold flex items-center justify-end gap-0.5 border shadow-sm ${
                    asset.pos
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  }`}
                >
                  {asset.pos ? (
                    <TrendingUp size={10} className="shrink-0" />
                  ) : (
                    <TrendingDown size={10} className="shrink-0" />
                  )}
                  <span className="tabular-nums">{asset.change}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center font-mono py-12 bg-[#111a36]/50 rounded-lg border border-dashed border-zinc-800 p-4">
            <span className="text-zinc-400 text-xs">
              No assets match filter
            </span>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
              className="mt-2 text-xs text-cyan-400 font-bold underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-[#0d1527] to-transparent pointer-events-none z-20" />
    </div>
  );
}
