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
} from "recharts";
import { Activity } from "lucide-react";
import { MOCK_MACRO_DATA, Timeframe } from "@/app/lib/mockAnalytics";

export default function TotalPortfolioChart() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const timeframes: Timeframe[] = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

  return (
    <div className="relative bg-[#0a1024] border border-cyan-500/30 rounded-xl p-5 h-[300px] flex flex-col group transition-all duration-300 hover:border-cyan-500/80">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
            <Activity size={14} />
          </div>
          Macro Portfolio Evolution
        </h2>

        {/* TIME CONTROLLER CRUCIAL PENTRU DATE REALISTE */}
        <div className="flex bg-[#02040f] border border-cyan-500/10 p-0.5 rounded-md gap-0.5 z-10 font-mono">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-wider transition-all cursor-pointer ${
                timeframe === tf
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
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
            data={MOCK_MACRO_DATA[timeframe]}
            margin={{ top: 5, right: 0, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cyberCyanMacro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
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
              tick={{ fill: "#ffffff" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#ffffff"
              fontSize={9}
              tick={{ fill: "#ffffff" }}
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cyberCyanMacro)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
