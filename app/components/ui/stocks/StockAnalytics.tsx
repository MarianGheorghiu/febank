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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Activity, PieChart as PieIcon, Layers } from "lucide-react";
import {
  MOCK_STOCK_HISTORY,
  MOCK_STOCK_ALLOCATION,
} from "@/app/lib/mockStockData";

type Timeframe = "1D" | "1W" | "1M" | "1Y" | "ALL";

export default function StockAnalytics() {
  const [chartView, setChartView] = useState<"PL" | "ALLOCATION">("PL");
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("1M");

  const timeframes: Timeframe[] = ["1D", "1W", "1M", "1Y", "ALL"];

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <div className="relative bg-[#0a1024] border border-cyan-500/30 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col w-full min-h-[450px] h-full overflow-hidden font-mono text-xs">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* CONTROL PANEL HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-3 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/20 text-cyan-400 shadow-inner">
              <Activity size={14} />
            </div>
            Intelligence Matrix
          </h2>

          <div className="flex items-center gap-1 bg-[#01030a] border border-blue-500/20 p-1 rounded-lg">
            <button
              onClick={() => setChartView("PL")}
              className={`px-3 py-1.5 rounded font-mono text-[10px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${
                chartView === "PL"
                  ? "bg-[#06b6d4]/20 text-cyan-400 border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "bg-transparent border border-transparent text-slate-500 hover:text-cyan-400"
              }`}
            >
              <Layers size={10} /> TREND
            </button>
            <button
              onClick={() => setChartView("ALLOCATION")}
              className={`px-3 py-1.5 rounded font-mono text-[10px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${
                chartView === "ALLOCATION"
                  ? "bg-[#06b6d4]/20 text-cyan-400 border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "bg-transparent border border-transparent text-slate-500 hover:text-cyan-400"
              }`}
            >
              <PieIcon size={10} /> SECTORS
            </button>
          </div>
        </div>

        {/* DYNAMIC CHART CONTAINER */}
        <div className="flex-1 bg-[#02040f]/60 border border-blue-500/10 rounded-lg p-3 sm:p-4 flex flex-col w-full h-full min-h-[300px]">
          {chartView === "PL" ? (
            <div className="w-full h-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 shrink-0">
                <span className="text-white/80 font-bold uppercase text-[10px] tracking-wider">
                  Valuation Escalation
                </span>

                <div className="flex items-center bg-[#01030a] border border-blue-500/20 p-1 rounded-md">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setActiveTimeframe(tf)}
                      className={`px-2.5 py-1 rounded font-mono text-[9px] font-black tracking-widest transition-all cursor-pointer ${
                        activeTimeframe === tf
                          ? "bg-[#06b6d4]/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-transparent text-slate-500 hover:text-white"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* RENDER AREA CHART - SOLUȚIA CU ABSOLUTE INSET-0 */}
              <div className="w-full flex-1 relative min-h-[220px]">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={MOCK_STOCK_HISTORY[activeTimeframe]}
                      margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="cyberCyanStocks"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#06b6d4"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#06b6d4"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="rgba(6,182,212,0.08)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="transparent"
                        tick={{
                          fill: "#64748b",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="transparent"
                        tick={{
                          fill: "#64748b",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatYAxis}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020512",
                          borderColor: "rgba(6,182,212,0.4)",
                          color: "#fff",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          borderRadius: "8px",
                          boxShadow: "0 0 20px rgba(6,182,212,0.15)",
                        }}
                        itemStyle={{ color: "#06b6d4", fontWeight: "bold" }}
                        formatter={(value: any) => [
                          `$${value.toLocaleString()}`,
                          "Capital",
                        ]}
                        labelStyle={{ color: "#64748b", marginBottom: "4px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="valoare"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#cyberCyanStocks)"
                        activeDot={{
                          r: 5,
                          fill: "#fff",
                          stroke: "#06b6d4",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 p-2">
              {/* RENDER PIE CHART - SOLUȚIA CU ABSOLUTE INSET-0 */}
              <div className="w-full md:w-1/2 relative min-h-[220px] md:h-full flex justify-center items-center">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOCK_STOCK_ALLOCATION}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="90%"
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {MOCK_STOCK_ALLOCATION.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020512",
                          borderColor: "rgba(6,182,212,0.3)",
                          borderRadius: "8px",
                          fontFamily: "monospace",
                          fontSize: "11px",
                        }}
                        itemStyle={{ color: "#fff", fontWeight: "bold" }}
                        formatter={(value: any) => [
                          `$${value.toLocaleString()}`,
                          "Allocation",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Text în centrul gogoșii */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-white/50 text-[9px] uppercase tracking-widest font-bold">
                      Total
                    </span>
                    <span className="text-cyan-400 font-black text-sm">
                      $122k
                    </span>
                  </div>
                </div>
              </div>

              {/* LEGENDĂ DETALIATĂ */}
              <div className="flex flex-col gap-2 w-full md:w-1/2 justify-center max-h-[250px] md:max-h-full overflow-y-auto pr-1 scrollbar-thin">
                {MOCK_STOCK_ALLOCATION.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shadow-[0_0_10px_currentColor]"
                        style={{
                          backgroundColor: item.color,
                          color: item.color,
                        }}
                      />
                      <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider truncate max-w-[100px] sm:max-w-[140px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-cyan-300 font-mono font-bold text-[11px] tabular-nums">
                      ${item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
