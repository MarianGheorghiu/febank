"use client";

import React from "react";
import GlassCard from "../GlassCard";
import { Globe, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { marketAssetsData, MarketAsset } from "@/app/lib/mockData";

export default function MarketNewsTable() {
  const getCategoryTheme = (category: MarketAsset["category"]) => {
    switch (category) {
      case "CRYPTO":
        return "from-purple-500/20 to-transparent text-purple-400 border-purple-500/20";
      case "STOCKS":
        return "from-cyan-500/20 to-transparent text-cyan-400 border-cyan-500/20";
      case "FOREX":
        return "from-blue-500/20 to-transparent text-blue-400 border-blue-500/20";
      case "COMMODITIES":
        return "from-amber-500/20 to-transparent text-amber-400 border-amber-500/20";
    }
  };

  return (
    <GlassCard className="!p-6 flex flex-col border border-white/[0.06] bg-[#060913]/60 backdrop-blur-3xl rounded-[2rem] relative overflow-hidden group/panel shadow-[0_32px_64px_rgba(0,0,0,0.5)] hover:border-white/[0.1] transition-all duration-500 h-[440px]">
      {/* Glow ambiental intern liquid glass */}
      <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none group-hover/panel:bg-cyan-500/[0.06] transition-all duration-700" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 z-10 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase text-zinc-500 tracking-[0.2em]">
            <Globe
              size={12}
              className="text-zinc-500 group-hover/panel:rotate-90 transition-transform duration-1000 ease-out"
            />
            Global Market Ticker
          </div>
          <h2 className="text-base font-bold font-sans text-white tracking-tight">
            Live Asset Metrics
          </h2>
        </div>
        <span className="flex items-center gap-1.5 text-[9px] font-mono font-black bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <Activity size={10} className="animate-pulse" /> LIVE
        </span>
      </div>

      {/* LIST CONTAINER */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 z-10 select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {marketAssetsData.map((asset) => (
          <div
            key={asset.id}
            className="group/row flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] hover:border-white/[0.07] hover:scale-[1.01] transition-all duration-300 gap-3"
          >
            {/* Secțiune Stânga */}
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-1">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-b border flex items-center justify-center shrink-0 shadow-inner font-mono text-[10px] font-black tracking-tighter ${getCategoryTheme(asset.category)}`}
              >
                {asset.ticker.slice(0, 3)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white font-mono tracking-tight group-hover/row:text-cyan-400 transition-colors whitespace-normal break-words">
                    {asset.ticker}
                  </span>
                  <span className="hidden xs:inline text-[8px] font-black px-1.5 py-0.5 rounded-md border border-white/[0.03] bg-zinc-950/40 text-zinc-500 font-mono">
                    {asset.category}
                  </span>
                </div>
                {/* REZOLVARE MOBIL: Fără truncate, wrap fin și controlat */}
                <p className="text-[11px] text-zinc-400 font-medium font-sans mt-0.5 whitespace-normal leading-tight break-words">
                  {asset.name}
                </p>
              </div>
            </div>

            {/* Secțiune Dreapta */}
            <div className="flex items-center gap-3 text-right shrink-0">
              <div className="font-mono text-xs font-bold text-white tabular-nums tracking-tight">
                {asset.price}
              </div>
              <div
                className={`w-20 px-2 py-1 rounded-xl text-[11px] font-mono font-black flex items-center justify-end gap-1 border shadow-inner ${
                  asset.pos
                    ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                    : "bg-rose-500/5 text-rose-400 border-rose-500/10"
                }`}
              >
                {asset.pos ? (
                  <TrendingUp size={10} />
                ) : (
                  <TrendingDown size={10} />
                )}
                <span className="tabular-nums">{asset.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Smooth Premium Glass Fade Mask */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#04060d] via-[#04060d]/90 to-transparent pointer-events-none z-20 rounded-b-[2rem]" />
    </GlassCard>
  );
}
