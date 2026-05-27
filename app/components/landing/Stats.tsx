"use client";

import { useState } from "react";
import {
  Activity,
  Globe2,
  Server,
  ArrowUpRight,
  Users,
  Clock,
  Coins,
  CheckCircle2,
} from "lucide-react";

export default function Stats() {
  const [activeTime, setActiveTime] = useState("24H");
  const timeframes = ["1H", "24H", "1W", "ALL"];

  // Coordonate SVG dedicate pentru fiecare timeframe (Manevra vizuală)
  const chartData: Record<
    string,
    { stroke: string; fill: string; dotX: number; dotY: number; peak: string }
  > = {
    "1H": {
      stroke: "M 0 150 Q 120 130 200 60 T 380 110 T 500 35 T 600 70",
      fill: "M 0 150 Q 120 130 200 60 T 380 110 T 500 35 T 600 70 L 600 200 L 0 200 Z",
      dotX: 500,
      dotY: 35,
      peak: "$168.4K/sec",
    },
    "24H": {
      stroke: "M 0 160 Q 100 120 180 140 T 360 80 T 480 50 T 600 20",
      fill: "M 0 160 Q 100 120 180 140 T 360 80 T 480 50 T 600 20 L 600 200 L 0 200 Z",
      dotX: 480,
      dotY: 50,
      peak: "$142.8K/sec",
    },
    "1W": {
      stroke: "M 0 110 Q 140 170 220 120 T 400 55 T 520 90 T 600 30",
      fill: "M 0 110 Q 140 170 220 120 T 400 55 T 520 90 T 600 30 L 600 200 L 0 200 Z",
      dotX: 400,
      dotY: 55,
      peak: "$195.1K/sec",
    },
    ALL: {
      stroke: "M 0 180 Q 90 140 200 100 T 350 130 T 490 65 T 600 45",
      fill: "M 0 180 Q 90 140 200 100 T 350 130 T 490 65 T 600 45 L 600 200 L 0 200 Z",
      dotX: 490,
      dotY: 65,
      peak: "$210.5K/sec",
    },
  };

  const currentChart = chartData[activeTime];

  return (
    <section
      id="stats"
      className="w-full max-w-5xl mx-auto pt-10 pb-24 space-y-12"
    >
      {/* Header Epic cu Gradient Unificat */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
        <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-cyan-400 text-[10px] font-black tracking-[0.2em] uppercase">
          Real-Time Metrics
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Unrivaled Scale. <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-500 bg-clip-text text-transparent">
            Transparent Performance.
          </span>
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm max-w-md leading-relaxed font-medium">
          Monitor the heartbeat of global liquidity flows. Our ledger
          architecture handles institutional volume with absolute transparency.
        </p>
      </div>

      {/* MARELE INTERACTIVE ANALYTICS DASHBOARD */}
      <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.01] backdrop-blur-2xl border border-white/[0.15] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] grid grid-cols-1 lg:grid-cols-3 gap-8 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-[250px] h-[250px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* ZONA GRAFICULUI PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Aggregate Volume
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  $4,819,240,115
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <ArrowUpRight size={12} /> +18.4%
                </span>
              </div>
            </div>

            {/* Toggles de timp interactive */}
            <div className="flex bg-black/50 border border-white/[0.08] p-1 rounded-xl w-fit self-start sm:self-center backdrop-blur-md">
              {timeframes.map((time) => (
                <button
                  key={time}
                  onClick={() => setActiveTime(time)}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all duration-300 cursor-pointer ${
                    time === activeTime
                      ? "bg-gradient-to-b from-white to-gray-200 text-black shadow-md scale-105 font-extrabold"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* MASTER CHIP VECTORIAL SVG DINAMIC */}
          <div className="w-full h-44 sm:h-56 pt-4 relative group">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 600 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Regiunea de umplere dinamică */}
              <path
                d={currentChart.fill}
                fill="url(#chartGlow)"
                className="transition-all duration-500 ease-in-out"
              />
              {/* Linia dinamică */}
              <path
                d={currentChart.stroke}
                fill="none"
                strokeWidth="3"
                className="stroke-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.6)] transition-all duration-500 ease-in-out"
              />
              {/* Target noduri dinamice */}
              <circle
                cx={currentChart.dotX}
                cy={currentChart.dotY}
                r="5"
                className="fill-purple-400 animate-ping transition-all duration-500 ease-in-out"
              />
              <circle
                cx={currentChart.dotX}
                cy={currentChart.dotY}
                r="4"
                className="fill-white stroke-purple-500 stroke-2 transition-all duration-500 ease-in-out"
              />
            </svg>

            {/* Tooltip Dinamic */}
            <div className="absolute top-4 left-[75%] -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none text-center hidden sm:block">
              <p className="text-[9px] text-gray-500 font-bold uppercase">
                Peak Velocity
              </p>
              <p className="text-xs font-black text-white transition-all duration-300">
                {currentChart.peak}
              </p>
            </div>
          </div>
        </div>

        {/* SIDEBAR METRICS CONCISE */}
        <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-6 lg:pt-0 lg:pl-8 space-y-4">
          <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
            Live Infrastructure
          </p>

          <div className="grid grid-cols-1 gap-3.5 flex-grow justify-center">
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                <Activity size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  Network Health
                </span>
                <span className="text-sm font-black text-white">
                  99.999% Uptime
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400 border border-pink-500/20">
                <Globe2 size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  Global Nodes
                </span>
                <span className="text-sm font-black text-white">
                  42 Active Corridors
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                <Server size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  Settlement Cost
                </span>
                <span className="text-sm font-black text-amber-400">
                  &lt; $0.001 Avg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARDURI MINI-STATS ULTRA PREMIUM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Accounts",
            value: "148,290",
            sub: "+12.4% MoM",
            icon: <Users size={14} />,
            color: "text-cyan-400",
          },
          {
            label: "Clearing Latency",
            value: "340 ms",
            sub: "Ultra-Fast Engine",
            icon: <Clock size={14} />,
            color: "text-purple-400",
          },
          {
            label: "Liquidity Depth",
            value: "$1.2B",
            sub: "Tier-1 Backed",
            icon: <Coins size={14} />,
            color: "text-amber-400",
          },
          {
            label: "System Audits",
            value: "Passed",
            sub: "100% Compliant",
            icon: <CheckCircle2 size={14} />,
            color: "text-emerald-400",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-b from-white/[0.12] to-white/[0.02] backdrop-blur-xl border border-white/[0.18] rounded-2xl p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.3)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] group hover:border-white/30 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                {item.label}
              </span>
              <div
                className={`${item.color} opacity-80 group-hover:scale-110 transition-transform`}
              >
                {item.icon}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl font-black text-white block tracking-tight">
                {item.value}
              </span>
              <span className="text-[9px] font-bold text-gray-400 tracking-wide block mt-1 bg-white/5 w-fit px-1.5 py-0.5 rounded border border-white/5">
                {item.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
