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
import { Activity, BarChart3, Zap, AlertTriangle } from "lucide-react";

type Timeframe = "1D" | "1W" | "1M" | "1Y" | "ALL";

// Date simulate în care cheltuielile intersectează și depășesc pragurile de alarmă
const MOCK_ANALYTICS_DATA: Record<
  Timeframe,
  Array<{ date: string; spent: number }>
> = {
  "1D": [
    { date: "04:00", spent: 400 },
    { date: "08:00", spent: 1200 },
    { date: "12:00", spent: 4800 },
    { date: "16:00", spent: 5400 }, // Over limit
    { date: "20:00", spent: 5900 }, // Over limit
  ],
  "1W": [
    { date: "MON", spent: 1200 },
    { date: "TUE", spent: 3400 },
    { date: "WED", spent: 4900 },
    { date: "THU", spent: 5800 }, // Over limit
    { date: "FRI", spent: 6200 }, // Over limit
    { date: "SAT", spent: 4100 },
    { date: "SUN", spent: 5100 }, // Over limit
  ],
  "1M": [
    { date: "WK 01", spent: 1200 },
    { date: "WK 02", spent: 3800 },
    { date: "WK 03", spent: 5400 }, // Over limit
    { date: "WK 04", spent: 6100 }, // Over limit
  ],
  "1Y": [
    { date: "JAN-MAR", spent: 3400 },
    { date: "APR-JUN", spent: 5800 }, // Over limit
    { date: "JUL-SEP", spent: 4200 },
    { date: "OCT-DEC", spent: 6300 }, // Over limit
  ],
  ALL: [
    { date: "CYBER_24", spent: 3100 },
    { date: "CYBER_25", spent: 4950 },
    { date: "CYBER_26", spent: 6400 }, // Over limit
  ],
};

interface SpendingAnalyticsMatrixProps {
  spentThisMonth: number;
  monthlyLimit: number;
}

export default function SpendingAnalyticsMatrix({
  spentThisMonth,
  monthlyLimit,
}: SpendingAnalyticsMatrixProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("1M");

  // Calcule precise bazate pe starea curentă a cardului ales
  const isOverLimit = spentThisMonth > monthlyLimit;
  const deltaValue = Math.abs(spentThisMonth - monthlyLimit);

  const dailyAverage = (spentThisMonth / 8).toFixed(0);
  const efficiencyIndex = ((spentThisMonth / monthlyLimit) * 100).toFixed(0);
  const projectedSpend = (spentThisMonth * 3.7).toFixed(0);

  const timeframes: Timeframe[] = ["1D", "1W", "1M", "1Y", "ALL"];

  // Custom Core Tooltip Generator
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const currentSpent = payload[0].value;
      const difference = currentSpent - monthlyLimit;
      const breached = difference > 0;

      return (
        <div className="bg-[#0a1024] border border-cyan-500/30 p-2.5 rounded-lg font-mono text-[10px] shadow-2xl flex flex-col gap-1 z-50">
          <span className="text-slate-500 font-bold uppercase text-[8px]">
            Node Metrics // {payload[0].payload.date}
          </span>
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">TOTAL SPENT:</span>
            <span className="text-white font-bold">
              ${currentSpent.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t border-white/5 pt-1 mt-0.5">
            <span className="text-slate-400">CEILING PRAG:</span>
            <span className="text-slate-400">
              ${monthlyLimit.toLocaleString()}
            </span>
          </div>
          <div
            className={`flex justify-between gap-4 font-black ${breached ? "text-fuchsia-400" : "text-cyan-400"}`}
          >
            <span>{breached ? "OVERFLOW:" : "REMAINING:"}</span>
            <span>
              {breached ? "+" : "-"}${Math.abs(difference).toLocaleString()}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative bg-[#0a1024] border border-cyan-500/20 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)] flex flex-col h-[450px] overflow-hidden font-mono text-xs w-full">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full gap-4">
        {/* HEADER PANEL WITH ACTIVE WARNING SIGNALS */}
        <div className="flex justify-between items-center pb-3 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 bg-black/40 border border-white/5 rounded text-cyan-400">
              <Activity size={13} />
            </div>
            Ledger Analytics Engine
          </h2>

          {isOverLimit ? (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded text-[9px] font-black tracking-widest flex items-center gap-1 animate-pulse">
              <AlertTriangle size={10} />
              <span>OVERFLOW: ${deltaValue.toLocaleString()}</span>
            </div>
          ) : (
            <span className="text-cyan-400 bg-black/40 border border-cyan-500/10 px-2 py-0.5 rounded text-[9px] font-black tracking-widest">
              NOMINAL CORE STATUS
            </span>
          )}
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          <div className="p-2 bg-black/30 border border-white/[0.03] rounded-lg flex flex-col gap-0.5">
            <span className="text-slate-500 text-[8px] font-bold tracking-wider uppercase">
              TOTAL FLOW
            </span>
            <span className="text-xs font-bold text-white tabular-nums">
              ${spentThisMonth.toLocaleString("en-US")}
            </span>
          </div>

          <div className="p-2 bg-black/30 border border-white/[0.03] rounded-lg flex flex-col gap-0.5">
            <span className="text-slate-500 text-[8px] font-bold tracking-wider uppercase">
              DAILY BURN
            </span>
            <span className="text-xs font-bold text-fuchsia-400 tabular-nums">
              ${Number(dailyAverage).toLocaleString("en-US")}
            </span>
          </div>

          <div className="p-2 bg-black/30 border border-white/[0.03] rounded-lg flex flex-col gap-0.5">
            <span className="text-slate-500 text-[8px] font-bold tracking-wider uppercase">
              CAPACITY USED
            </span>
            <span
              className={`text-xs font-bold tabular-nums ${isOverLimit ? "text-rose-400" : "text-white"}`}
            >
              {efficiencyIndex}%
            </span>
          </div>

          <div className="p-2 bg-black/30 border border-white/[0.03] rounded-lg flex flex-col gap-0.5">
            <span className="text-slate-500 text-[8px] font-bold tracking-wider uppercase">
              FORECAST RUN
            </span>
            <span className="text-xs font-bold text-cyan-400 tabular-nums">
              ${Number(projectedSpend).toLocaleString("en-US")}
            </span>
          </div>
        </div>

        {/* PLOT CORE FIELD */}
        <div className="flex-1 bg-black/30 border border-white/[0.02] rounded-lg p-3 flex flex-col justify-between min-h-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between text-[8px] tracking-widest font-bold mb-3 shrink-0">
            <span className="text-slate-400 uppercase">
              TELEMETRY TIMELINE MATRIX
            </span>
            <div className="flex items-center gap-1 bg-black/60 border border-white/5 p-0.5 rounded-lg w-full sm:w-auto justify-between sm:justify-start">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-2 py-0.5 rounded font-mono text-[9px] font-black tracking-wider transition-all cursor-pointer ${
                    activeTimeframe === tf
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "bg-transparent text-slate-500 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* AREA CHART VECTOR LAYER */}
          <div className="w-full flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MOCK_ANALYTICS_DATA[activeTimeframe]}
                margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
              >
                <defs>
                  {/* Standard Base Cyan Gradient */}
                  <linearGradient
                    id="cyberSpentGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(6,182,212,0.04)"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={8}
                  tick={{
                    fill: "#64748b",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={8}
                  tick={{
                    fill: "#64748b",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, "auto"]}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "rgba(6,182,212,0.15)", strokeWidth: 1 }}
                />

                {/* THE CORE EXTRA LIMIT LINE (Fuchsia Neon representation of limits) */}
                <ReferenceLine
                  y={monthlyLimit}
                  stroke="#d946ef"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `CEILING HARDWARE: $${monthlyLimit.toLocaleString()}`,
                    fill: "#d946ef",
                    fontSize: 8,
                    fontWeight: "black",
                    position: "top",
                    fontFamily: "monospace",
                    offset: 6,
                  }}
                />

                {/* Main Vector Plot */}
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cyberSpentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
