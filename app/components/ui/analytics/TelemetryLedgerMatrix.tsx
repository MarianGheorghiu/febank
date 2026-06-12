"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Terminal,
  Activity,
  ShieldAlert,
  RefreshCw,
  X,
} from "lucide-react";

type MatrixTab = "PERFORMANCE" | "RISK_METRICS" | "SYSTEM_LOGS";

interface LedgerRow {
  id: string;
  asset: string;
  symbol: string;
  category: "crypto" | "stock" | "fiat";
  allocation: number;
  r7d: number;
  r30d: number;
  r1y: number;
  volatility: string;
  sharpe: number;
  maxDrawdown: string;
  status: "OPTIMAL" | "STABLE" | "HIGH_VOL" | "LIQUIDATING";
}

const LEDGER_DATA: LedgerRow[] = [
  {
    id: "btc",
    asset: "Bitcoin",
    symbol: "BTC",
    category: "crypto",
    allocation: 63.2,
    r7d: 8.42,
    r30d: 14.5,
    r1y: 112.4,
    volatility: "34.2%",
    sharpe: 2.15,
    maxDrawdown: "-18.4%",
    status: "HIGH_VOL",
  },
  {
    id: "eth",
    asset: "Ethereum",
    symbol: "ETH",
    category: "crypto",
    allocation: 12.1,
    r7d: -2.1,
    r30d: 5.85,
    r1y: 64.2,
    volatility: "41.5%",
    sharpe: 1.85,
    maxDrawdown: "-24.1%",
    status: "HIGH_VOL",
  },
  {
    id: "nvda",
    asset: "Nvidia Corp",
    symbol: "NVDA",
    category: "stock",
    allocation: 10.5,
    r7d: 4.15,
    r30d: 22.1,
    r1y: 185.3,
    volatility: "28.9%",
    sharpe: 2.45,
    maxDrawdown: "-12.5%",
    status: "OPTIMAL",
  },
  {
    id: "usd",
    asset: "US Dollar",
    symbol: "USD",
    category: "fiat",
    allocation: 17.1,
    r7d: 0.0,
    r30d: 0.0,
    r1y: 0.0,
    volatility: "0.2%",
    sharpe: 0.0,
    maxDrawdown: "0.0%",
    status: "STABLE",
  },
  {
    id: "aapl",
    asset: "Apple Inc.",
    symbol: "AAPL",
    category: "stock",
    allocation: 9.2,
    r7d: 1.05,
    r30d: -3.4,
    r1y: 24.8,
    volatility: "14.1%",
    sharpe: 1.65,
    maxDrawdown: "-8.2%",
    status: "OPTIMAL",
  },
];

const categoryColors = {
  crypto:
    "text-[#00f0ff] border-[#00f0ff]/40 bg-[#00f0ff]/10 shadow-[0_0_10px_rgba(0,240,255,0.15)]",
  stock:
    "text-[#bd00ff] border-[#bd00ff]/40 bg-[#bd00ff]/10 shadow-[0_0_10px_rgba(189,0,255,0.15)]",
  fiat: "text-[#00ff66] border-[#00ff66]/40 bg-[#00ff66]/10 shadow-[0_0_10px_rgba(0,255,102,0.15)]",
};

export default function TelemetryLedgerMatrix() {
  const [activeTab, setActiveTab] = useState<MatrixTab>("PERFORMANCE");
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    return LEDGER_DATA.filter(
      (item) =>
        item.asset.toLowerCase().includes(search.toLowerCase()) ||
        item.symbol.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  return (
    <div className="w-full h-[440px] bg-[#060b19]/60 backdrop-blur-xl border border-cyan-400/30 rounded-2xl flex flex-col overflow-hidden transition-all duration-500 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15),0_0_20px_rgba(6,182,212,0.05)] hover:border-cyan-400/50 font-mono">
      {/* GLOSSY TOP CONTROL HUB */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 relative z-10">
        {/* INTERMEDIATE NODE HEADER */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_10px_#00f0ff]"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-sm tracking-widest uppercase flex items-center gap-2">
              <Terminal size={15} className="text-cyan-400" />
              ANALYTICS_LEDGER_SYSTEM
            </span>
          </div>
        </div>

        {/* CONTROLS: LIQUID GLASS DESIGN */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          {/* LIQUID GLASS SEARCH */}
          <div className="relative w-full sm:w-56 group">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60 group-focus-within:text-cyan-300 transition-colors duration-300"
            />
            <input
              type="text"
              placeholder="SEARCH PROTOCOLS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white font-bold tracking-wider placeholder-cyan-900/60 focus:outline-none transition-all duration-300 focus:border-cyan-400/60 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(0,240,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.05)] uppercase"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* APPLE-STYLE FLOATING HUD TABS */}
          <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/5 gap-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.2)]">
            {(
              ["PERFORMANCE", "RISK_METRICS", "SYSTEM_LOGS"] as MatrixTab[]
            ).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 text-[11px] font-black tracking-widest rounded-lg transition-all duration-300 ease-out border uppercase select-none cursor-pointer relative overflow-hidden ${
                    isActive
                      ? "text-black border-white/20 bg-gradient-to-tr from-cyan-400 via-blue-400 to-indigo-400 shadow-[0_4px_12px_rgba(6,182,212,0.4),inset_0_1px_0_0_rgba(255,255,255,0.3)] transform scale-[1.01]"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-white/[0.04] active:scale-[0.98]"
                  }`}
                >
                  {/* Glass Reflection Overlay for Active State */}
                  {isActive && (
                    <span className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                  )}
                  {tab.split("_")[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MID-SIZED CORE DATA VIEWPORT */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-[#040814]/40 to-[#02040a]/90 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* TAB 1: PERFORMANCE */}
        {activeTab === "PERFORMANCE" && (
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="sticky top-0 bg-[#060b19] z-10 border-b border-white/10 text-xs text-cyan-400 font-extrabold uppercase tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
              <tr className="bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-md">
                <th className="py-3.5 px-5">ASSET_NODE</th>
                <th className="py-3.5 px-5 text-center">ALLOCATION</th>
                <th className="py-3.5 px-5 text-right">RETURN_7D</th>
                <th className="py-3.5 px-5 text-right">RETURN_30D</th>
                <th className="py-3.5 px-5 text-right">RETURN_1Y</th>
                <th className="py-3.5 px-5 text-center">SYSTEM_STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-sm text-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-14 text-center text-cyan-700 font-black tracking-widest uppercase"
                  >
                    // REGISTRY_NODE_EMPTY
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-white/[0.04] transition-colors duration-150"
                  >
                    {/* Asset / Node Identity */}
                    <td className="py-3.5 px-5 flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border tracking-wider ${categoryColors[row.category]}`}
                      >
                        {row.symbol}
                      </span>
                      <span className="text-white font-extrabold tracking-wide text-[13px]">
                        {row.asset.toUpperCase()}
                      </span>
                    </td>

                    {/* Allocation Slider Bar */}
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-white font-black min-w-[40px] text-right">
                          {row.allocation}%
                        </span>
                        <div className="w-20 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(0,240,255,0.5)] transition-all duration-500"
                            style={{ width: `${row.allocation}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Metrics (Crisp High-Contrast Text) */}
                    <td
                      className={`py-3.5 px-5 text-right font-black tracking-wide text-[13px] ${row.r7d >= 0 ? "text-emerald-400" : "text-rose-500"}`}
                    >
                      {row.r7d >= 0 ? "+" : ""}
                      {row.r7d}%
                    </td>
                    <td
                      className={`py-3.5 px-5 text-right font-black tracking-wide text-[13px] ${row.r30d >= 0 ? "text-emerald-400" : "text-rose-500"}`}
                    >
                      {row.r30d >= 0 ? "+" : ""}
                      {row.r30d}%
                    </td>
                    <td className="py-3.5 px-5 text-right font-black tracking-wide text-[13px] text-white">
                      <span
                        className={`px-2 py-0.5 rounded-md border border-white/5 backdrop-blur-md ${row.r1y >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"}`}
                      >
                        {row.r1y >= 0 ? "▲" : "▼"} {Math.abs(row.r1y)}%
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-md font-black border tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${
                          row.status === "OPTIMAL"
                            ? "border-emerald-400 text-emerald-400 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                            : row.status === "STABLE"
                              ? "border-cyan-400 text-cyan-400 bg-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                              : "border-amber-400 text-amber-400 bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB 2: RISK METRICS */}
        {activeTab === "RISK_METRICS" && (
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="sticky top-0 bg-[#060b19] z-10 border-b border-white/10 text-xs text-cyan-400 font-extrabold uppercase tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
              <tr className="bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-md">
                <th className="py-3.5 px-5">ASSET_NODE</th>
                <th className="py-3.5 px-5 text-right">VOLATILITY (ANNUAL)</th>
                <th className="py-3.5 px-5 text-right">SHARPE_RATIO</th>
                <th className="py-3.5 px-5 text-right">MAX_DRAWDOWN</th>
                <th className="py-3.5 px-5 text-center">SECURITY_INTEGRITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-sm text-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 text-center text-cyan-700 font-black tracking-widest uppercase"
                  >
                    // RISK_METRICS_EMPTY
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-white/[0.04] transition-colors duration-150"
                  >
                    <td className="py-4 px-5 font-black text-white text-[13px]">
                      {row.asset.toUpperCase()}{" "}
                      <span className="text-white/40 font-normal text-xs">
                        [{row.symbol}]
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right font-black text-amber-400 tracking-wider text-[13px]">
                      {row.volatility}
                    </td>
                    <td className="py-4 px-5 text-right font-black">
                      <span className="bg-black/40 border border-white/10 px-2.5 py-0.5 rounded-md text-cyan-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        {row.sharpe.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right text-rose-400 font-black tracking-wide text-[13px]">
                      {row.maxDrawdown}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center">
                        {row.sharpe > 2.0 ? (
                          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black bg-emerald-500/10 border border-emerald-400/40 px-2.5 py-0.5 rounded-md tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <Activity size={11} className="animate-pulse" />{" "}
                            SHIELD_ACTIVE
                          </span>
                        ) : row.sharpe > 0 ? (
                          <span className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-black bg-cyan-500/10 border border-cyan-400/40 px-2.5 py-0.5 rounded-md tracking-widest">
                            <Activity size={11} /> MONITORING
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-black bg-amber-500/10 border border-amber-400/40 px-2.5 py-0.5 rounded-md tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                            <ShieldAlert size={11} /> RISK_EXPOSURE
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB 3: SYSTEM LOGS */}
        {activeTab === "SYSTEM_LOGS" && (
          <div className="p-4 bg-[#030611]/30 font-mono text-xs text-cyan-400/90 space-y-2 h-full overflow-y-auto">
            <div className="flex items-start gap-2 border-b border-white/[0.02] pb-1.5">
              <span className="text-slate-500 shrink-0 select-none">
                [10:12:35]
              </span>
              <span className="text-emerald-400 font-black shrink-0">
                // [MATRIX_SYNC]
              </span>
              <span className="text-white tracking-wide">
                Telemetry synchronization routine executed successfully.
                Structural integrity optimal.
              </span>
            </div>
            <div className="flex items-start gap-2 border-b border-white/[0.02] pb-1.5">
              <span className="text-slate-500 shrink-0 select-none">
                [10:05:12]
              </span>
              <span className="text-emerald-400 font-black shrink-0">
                // [DB_WRITE]
              </span>
              <span className="text-white tracking-wide">
                BTC algorithmic history nodes verified and injected into
                localized system pipeline.
              </span>
            </div>
            <div className="flex items-start gap-2 border-b border-white/[0.02] pb-1.5">
              <span className="text-slate-500 shrink-0 select-none">
                [10:01:45]
              </span>
              <span className="text-cyan-400 font-black shrink-0">
                // [ENGINE_MET]
              </span>
              <span className="text-cyan-300 tracking-wide">
                Rebalancing scheduler detected negligible drift (-0.45% Equity
                allocation deviation).
              </span>
            </div>
            <div className="flex items-start gap-2 border-b border-white/[0.02] pb-1.5">
              <span className="text-slate-500 shrink-0 select-none">
                [09:44:22]
              </span>
              <span className="text-purple-400 font-black shrink-0">
                // [RISK_EVAL]
              </span>
              <span className="text-white tracking-wide">
                Mathematical Sharpe calculation routine processed for NVDA asset
                node -&gt; Alpha verified at 2.45.
              </span>
            </div>
            <div className="animate-pulse text-cyan-500 font-black pt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 inline-block animate-ping"></span>
              AWAITING_NEXT_DATABLOCK_EMISSION_STREAM...
            </div>
          </div>
        )}
      </div>

      {/* FOOTER NODES SYSTEM BAR */}
      <div className="p-3 border-t border-white/10 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wider shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <span>
            CONSOLE: <span className="text-cyan-400">REALTIME_GRID_6</span>
          </span>
          <span className="text-white/10">|</span>
          <span>
            NODES:{" "}
            <span className="text-white">
              {filteredData.length}/{LEDGER_DATA.length}
            </span>
          </span>
        </div>
        <span className="flex items-center gap-2 text-cyan-400/90 bg-white/[0.02] border border-white/5 px-2.5 py-0.5 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <RefreshCw size={10} className="animate-spin text-cyan-400" />
          FEED_SECURE_LIVE
        </span>
      </div>
    </div>
  );
}
