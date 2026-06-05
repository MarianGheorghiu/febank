"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Scale, Activity } from "lucide-react";
import { MOCK_DATA_STORE } from "@/app/lib/cryptoMock";

type Timeframe = "1D" | "1W" | "1M" | "1Y" | "ALL";

export default function CryptoPLAnalysis() {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("1M");

  const totalInvested = 62400;
  const currentPortfolioValue = 104250;
  const netProfitLoss = currentPortfolioValue - totalInvested;
  const plPercentage = ((netProfitLoss / totalInvested) * 100).toFixed(1);
  const estimatedTax = netProfitLoss * 0.1;

  const timeframes: Timeframe[] = ["1D", "1W", "1M", "1Y", "ALL"];

  return (
    <div className="relative bg-[#0a1024] border border-cyan-500/30 sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-full overflow-hidden font-mono text-xs">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Activity size={14} />
            </div>
            P&L Matrix Engine
          </h2>
          <span className="text-cyan-400 bg-[#02040f]/50 border border-blue-500/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest">
            LIVE ANALYTICS
          </span>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 shrink-0">
          <div className="p-2.5 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col gap-0.5">
            <span className="text-white text-[8px] font-bold tracking-wider uppercase">
              PORTFOLIO CAP
            </span>
            <span className="text-[13px] font-black text-white">
              ${currentPortfolioValue.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col gap-0.5">
            <span className="text-white text-[8px] font-bold tracking-wider uppercase">
              BREAK-EVEN BASE
            </span>
            <span className="text-[13px] font-black text-amber-400">
              ${totalInvested.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col gap-0.5">
            <span className="text-white text-[8px] font-black tracking-wider uppercase flex items-center gap-1">
              <TrendingUp size={9} className="text-emerald-400" /> NET PROFIT
            </span>
            <span className="text-[13px] font-black text-white">
              +{plPercentage}%
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col gap-0.5">
            <span className="text-cyan-400 text-[8px] font-bold tracking-wider uppercase flex items-center gap-1">
              <Scale size={9} /> FISCAL EST.
            </span>
            <span className="text-[13px] font-black text-white">
              ${estimatedTax.toLocaleString()}
            </span>
          </div>
        </div>

        {/* RECHARTS CONTAINER */}
        <div className="flex-1 bg-[#02040f]/40 border border-blue-500/10 rounded-lg p-3 flex flex-col justify-between min-h-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between text-[9px] tracking-wider mb-3 shrink-0">
            <span className="text-white font-bold uppercase">
              PERFORMANCE TIMELINE ANALYSIS
            </span>
            <div className="flex items-center gap-1 bg-[#01030a] border border-blue-500/20 p-1 rounded-lg">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-2.5 py-1 rounded font-mono text-[9px] font-black tracking-widest transition-all cursor-pointer ${
                    activeTimeframe === tf
                      ? "bg-[#06b6d4]/20 text-cyan-400 border border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.25)]"
                      : "bg-[#02040f] text-white hover:text-cyan-400 hover:bg-zinc-950 border border-white/[0.05]"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MOCK_DATA_STORE[activeTimeframe]}
                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="cyberCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(6,182,212,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff"
                  fontSize={9}
                  tick={{ fill: "#ffffff", fontWeight: "bold" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#ffffff"
                  fontSize={9}
                  tick={{ fill: "#ffffff", fontWeight: "bold" }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#02040f",
                    borderColor: "rgba(6,182,212,0.5)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: "10px",
                  }}
                />
                <ReferenceLine
                  y={totalInvested}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <Area
                  type="monotone"
                  dataKey="valoare"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cyberCyan)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
