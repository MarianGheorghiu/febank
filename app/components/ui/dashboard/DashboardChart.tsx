"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type TimePeriod = "1W" | "1M" | "3M" | "6M" | "1Y";

interface PeriodDetails {
  val: string;
  change: string;
  pos: boolean;
  data: number[];
  labels: string[];
}

interface DashboardChartProps {
  title: string;
  datasets: Record<TimePeriod, PeriodDetails>;
  variant: "crypto" | "stocks" | "expenses";
}

export default function DashboardChart({
  title,
  datasets,
  variant,
}: DashboardChartProps) {
  const [period, setPeriod] = useState<TimePeriod>("1M");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const currentData = datasets[period];
  const { data, labels, val, change, pos } = currentData;

  // Formatare date pentru Recharts
  const chartData = useMemo(() => {
    return data.map((value, index) => ({
      label: labels[index] || "",
      value: value,
    }));
  }, [data, labels]);

  // Teme Cyberpunk solide cu noul Royal Blue pentru expenses
  const themes = {
    crypto: {
      line: "#a855f7", // Neon Purple
      gradientId: `cyber-purple-${title.replace(/\s+/g, "")}`,
      cardStyle:
        "bg-[#090514] border-purple-500/30 hover:border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.05)]",
      accentBg: "bg-purple-500/10 border-purple-500/20",
      accentText: "text-purple-400",
      stopOpacity: 0.25,
    },
    stocks: {
      line: "#00f0ff", // Neon Cyan
      gradientId: `cyber-cyan-${title.replace(/\s+/g, "")}`,
      cardStyle:
        "bg-[#050f14] border-cyan-500/30 hover:border-cyan-500/80 shadow-[0_0_20px_rgba(0,240,255,0.05)]",
      accentBg: "bg-cyan-500/10 border-cyan-500/20",
      accentText: "text-cyan-400",
      stopOpacity: 0.2,
    },
    expenses: {
      line: "#2563eb", // Royal / Electric Blue
      gradientId: `cyber-blue-${title.replace(/\s+/g, "")}`,
      cardStyle:
        "bg-[#050814] border-blue-500/30 hover:border-blue-500/80 shadow-[0_0_20px_rgba(37,99,235,0.05)]",
      accentBg: "bg-blue-500/10 border-blue-500/20",
      accentText: "text-blue-400",
      stopOpacity: 0.2,
    },
  };

  const theme = themes[variant];
  const activePoint = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  const displayValue = activePoint
    ? variant === "crypto"
      ? `${activePoint.value} BTC`
      : `$${activePoint.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : val;

  const displaySubtext = activePoint ? `Index on ${activePoint.label}` : change;

  return (
    <div
      className={`p-5 flex flex-col justify-between border rounded-xl transition-all duration-300 h-[300px] group relative overflow-hidden ${theme.cardStyle}`}
    >
      {/* HEADER TECH INFO */}
      <div className="flex justify-between items-start gap-4 mb-4 shrink-0 z-10">
        <div className="min-w-0">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-[0.15em] block">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
              {displayValue}
            </h3>
          </div>
          <p
            className={`text-[11px] font-mono font-medium mt-0.5 flex items-center gap-1 transition-all duration-150 ${
              activePoint
                ? theme.accentText
                : pos
                  ? "text-emerald-400"
                  : "text-rose-400"
            }`}
          >
            {!activePoint && (pos ? "↑" : "↓")}
            <span>{displaySubtext}</span>
          </p>
        </div>

        {/* TIME CONTROLLER CYBERPUNK */}
        <div className="flex bg-[#02040f] border border-white/[0.05] p-0.5 rounded-md gap-0.5 z-10 font-mono">
          {(["1W", "1M", "3M", "6M", "1Y"] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={(e) => {
                e.preventDefault();
                setPeriod(p);
                setHoveredIndex(null);
              }}
              className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all duration-200 cursor-pointer ${
                period === p
                  ? `${theme.accentBg} ${theme.accentText} border border-white/[0.05]`
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* GRAPH CONTAINER */}
      <div className="w-full flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -28, bottom: 0 }}
            onMouseMove={(e) => {
              if (e && typeof e.activeTooltipIndex === "number") {
                setHoveredIndex(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id={theme.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={theme.line}
                  stopOpacity={theme.stopOpacity}
                />
                <stop offset="95%" stopColor={theme.line} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.02)"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              stroke="rgba(255,255,255,0.1)"
              fontSize={9}
              tick={{ fill: "#52525b", fontFamily: "monospace" }}
              tickLine={false}
              axisLine={false}
              dy={8}
            />

            <YAxis
              stroke="rgba(255,255,255,0.1)"
              fontSize={9}
              tick={{ fill: "#52525b", fontFamily: "monospace" }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const currentObj = payload[0].payload;
                  return (
                    <div className="bg-[#02040f] border border-white/[0.08] px-2.5 py-1.5 rounded-md font-mono text-[10px] shadow-2xl flex flex-col gap-0.5">
                      <span className="text-zinc-500 uppercase tracking-wider block text-center">
                        {currentObj.label}
                      </span>
                      <span className="text-[11px] font-bold text-white text-center block tracking-tight">
                        {variant === "crypto"
                          ? `${currentObj.value}`
                          : `$${currentObj.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{
                stroke: "rgba(255,255,255,0.05)",
                strokeWidth: 1.25,
                strokeDasharray: "4 3",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.line}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${theme.gradientId})`}
              dot={false}
              activeDot={{
                r: 4,
                stroke: "#ffffff",
                strokeWidth: 1.5,
                fill: theme.line,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
