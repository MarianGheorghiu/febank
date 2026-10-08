"use client";
import { STOCKS_CATALOG } from "@/app/lib/mock/stock-catalog";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  TrendingUp,
  BarChart2,
  Globe,
  ShieldCheck,
  Flame,
  Newspaper,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  PieChart,
  Search,
  ChevronDown,
  X,
} from "lucide-react";

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isGreen = data.close >= data.open;
    return (
      <div className="bg-[#0b1b36]/95 border border-slate-600 p-2.5 rounded-lg font-mono text-[11px] shadow-2xl backdrop-blur-md space-y-1 text-white z-50">
        <div className="text-cyan-400 border-b border-slate-700/60 pb-1 mb-1 uppercase tracking-wider font-black">
          {data.name}
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-300 font-bold">OPEN:</span>
          <span className="font-black">${data.open.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-300 font-bold">CLOSE:</span>
          <span
            className={
              isGreen
                ? "text-emerald-400 font-black"
                : "text-rose-400 font-black"
            }
          >
            ${data.close.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-300 font-bold">HIGH:</span>
          <span className="text-slate-200 font-black">
            ${data.high.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-300 font-bold">LOW:</span>
          <span className="text-slate-200 font-black">
            ${data.low.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Interfață strictă pentru a elimina eroarea ts(2322) din StocksPage
interface StockAnalyticsHubProps {
  symbol?: string;
  onClose?: () => void;
}

export default function StockAnalyticsHub({
  symbol = "NVDA",
  onClose,
}: StockAnalyticsHubProps) {
  const [currentSymbol, setCurrentSymbol] = useState<string>(symbol);
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "1Y" | "ALL">(
    "1D",
  );
  const [chartType, setChartType] = useState<"LINE" | "CANDLE">("CANDLE");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sincronizare stare internă când se schimbă prop-ul din exterior (de ex: la click în tabel)
  useEffect(() => {
    if (symbol && STOCKS_CATALOG[symbol]) {
      setCurrentSymbol(symbol);
    }
  }, [symbol]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const assetData = STOCKS_CATALOG[currentSymbol] || STOCKS_CATALOG["NVDA"];

  const chartData = useMemo(() => {
    const rawPoints = assetData.chart[timeframe] || [];
    return rawPoints.map((item) => ({
      ...item,
      bodyRange: [item.open, item.close],
      wickRange: [item.low, item.high],
    }));
  }, [assetData, timeframe]);

  const filteredCatalogOptions = useMemo(() => {
    return Object.keys(STOCKS_CATALOG).filter(
      (sym) =>
        sym.toLowerCase().includes(selectorSearch.toLowerCase()) ||
        STOCKS_CATALOG[sym].name
          .toLowerCase()
          .includes(selectorSearch.toLowerCase()),
    );
  }, [selectorSearch]);

  const isAssetUp = assetData.change >= 0;

  return (
    <div className="relative bg-[#0a1024] border border-cyan-500/30 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] flex flex-col h-full font-mono min-h-[440px]">
      {/* GLOW EFFECT IDENTIC CU RESTUL MODULELOR */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* INNER LAYER CONTEXT */}
      <div className="relative z-10 flex flex-col h-full gap-4">
        {/* HEADER DESK PRINCIPAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-3">
          <div className="flex flex-col gap-1.5" ref={dropdownRef}>
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
                Analytics Desk:
              </h2>

              {/* SELECTOR DESK RESPONSIV */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setSelectorSearch("");
                  }}
                  className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 px-2.5 py-1.5 rounded text-cyan-300 text-[11px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)] active:scale-95"
                >
                  <span>
                    {currentSymbol} - {assetData.name}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* BOTTOM SHEET FIX PENTRU MOBIL & POPUP DESKTOP */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="fixed sm:absolute left-0 bottom-0 sm:bottom-auto sm:top-full z-50 w-full sm:w-72 bg-[#0b132b] border-t sm:border border-cyan-500/40 rounded-t-xl sm:rounded-lg shadow-2xl p-4 sm:p-2 backdrop-blur-2xl animate-in slide-in-from-bottom sm:slide-in-from-top-2 duration-200 max-h-[80vh] sm:max-h-64 flex flex-col gap-3 sm:gap-2">
                      <div className="flex items-center justify-between sm:hidden mb-0.5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Select Asset
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-slate-400 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="relative group shrink-0">
                        <Search
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400"
                        />
                        <input
                          type="text"
                          placeholder="Search ticker..."
                          value={selectorSearch}
                          onChange={(e) => setSelectorSearch(e.target.value)}
                          className="w-full bg-black/50 border border-slate-700/80 rounded pl-7 pr-7 py-1.5 text-[11px] text-white focus:outline-none focus:border-cyan-400 font-bold placeholder-slate-500 uppercase tracking-wide"
                        />
                        {selectorSearch && (
                          <button
                            type="button"
                            onClick={() => setSelectorSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto space-y-1 sm:space-y-0.5 scrollbar-thin flex-1">
                        {filteredCatalogOptions.length > 0 ? (
                          filteredCatalogOptions.map((sym) => (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => {
                                setCurrentSymbol(sym);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 sm:py-1.5 rounded text-[11px] flex items-center justify-between transition-colors cursor-pointer border ${
                                currentSymbol === sym
                                  ? "bg-cyan-500/20 text-cyan-300 font-black border-cyan-500/30"
                                  : "text-slate-300 border-transparent hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <span className="font-black">{sym}</span>
                              <span className="text-slate-400 truncate max-w-[150px]">
                                {STOCKS_CATALOG[sym].name}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="p-2 text-center text-slate-500 text-[10px] uppercase">
                            No options found
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">
              Advanced Telemetry Protocol Dashboard
            </p>
          </div>

          {/* PRICING ENGINE */}
          <div className="flex items-baseline sm:text-right gap-2 sm:flex-col sm:gap-0 shrink-0">
            <span className="text-base sm:text-lg font-black text-white tabular-nums tracking-tight">
              $
              {assetData.price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span
              className={`text-[10px] font-bold flex items-center gap-0.5 uppercase tracking-wider ${isAssetUp ? "text-emerald-400" : "text-rose-400"}`}
            >
              {isAssetUp ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              {isAssetUp ? "+" : ""}
              {assetData.change.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              ({isAssetUp ? "+" : ""}
              {assetData.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* WORKSTATION DYNAMICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* CHART WORKBENCH & HIGH READABILITY METRICS */}
          <div className="lg:col-span-2 space-y-4 flex flex-col min-w-0">
            <div className="bg-black/30 border border-slate-900 rounded-lg p-3 flex flex-col justify-between relative h-64">
              {/* FILTRE GRAFIC */}
              <div className="flex items-center justify-between gap-2 mb-3 z-10">
                <div className="flex bg-black/60 border border-slate-800 p-0.5 rounded">
                  {(["1D", "1W", "1M", "1Y", "ALL"] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-0.5 text-[9px] font-black rounded uppercase transition-all cursor-pointer ${
                        timeframe === tf
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "border border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="flex bg-black/60 border border-slate-800 p-0.5 rounded">
                  <button
                    type="button"
                    onClick={() => setChartType("LINE")}
                    className={`p-1 rounded transition-colors cursor-pointer ${chartType === "LINE" ? "bg-slate-800 text-cyan-400" : "text-slate-500 hover:text-white"}`}
                  >
                    <TrendingUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("CANDLE")}
                    className={`p-1 rounded transition-colors cursor-pointer ${chartType === "CANDLE" ? "bg-slate-800 text-cyan-400" : "text-slate-500 hover:text-white"}`}
                  >
                    <BarChart2 size={12} />
                  </button>
                </div>
              </div>

              {/* ENGINE SIZING CHIP */}
              <div className="w-full flex-1 min-h-0 text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 5, right: 5, bottom: 5, left: -25 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "#475569",
                        fontSize: 9,
                        fontWeight: "bold",
                      }}
                      axisLine={{ stroke: "#1e293b" }}
                      tickLine={{ stroke: "#1e293b" }}
                    />
                    <YAxis
                      domain={["dataMin - 1", "dataMax + 1"]}
                      tick={{
                        fill: "#475569",
                        fontSize: 9,
                        fontWeight: "bold",
                      }}
                      axisLine={{ stroke: "#1e293b" }}
                      tickLine={{ stroke: "#1e293b" }}
                      orientation="right"
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    {chartType === "LINE" ? (
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke="#22d3ee"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4, stroke: "#050b18", strokeWidth: 2 }}
                      />
                    ) : (
                      <>
                        <Bar dataKey="wickRange" fill="#1e293b" barSize={1.2}>
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-wick-${index}`}
                              fill={
                                entry.close >= entry.open
                                  ? "#34d399"
                                  : "#f43f5e"
                              }
                            />
                          ))}
                        </Bar>
                        <Bar dataKey="bodyRange" barSize={8}>
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-body-${index}`}
                              fill={
                                entry.close >= entry.open
                                  ? "transparent"
                                  : "#f43f5e"
                              }
                              stroke={
                                entry.close >= entry.open
                                  ? "#34d399"
                                  : "#f43f5e"
                              }
                              strokeWidth={1.5}
                            />
                          ))}
                        </Bar>
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KEY FUNDAMENTALS PANEL (COMPACTED & SLEEK) */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase px-0.5 block">
                Valuation Fundamentals
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {assetData.stats.map((stat, i) => {
                  const Icon = { Globe, Activity, DollarSign, PieChart, Flame, ShieldCheck }[stat.icon];
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border flex flex-col justify-between transition-colors bg-[#0e172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
                        stat.highlight
                          ? "border-amber-500/40 bg-gradient-to-br from-[#0e172a] to-amber-950/15"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-slate-200 gap-1 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider leading-none truncate">
                          {stat.label}
                        </span>
                        <Icon
                          size={11}
                          className={
                            stat.highlight
                              ? "text-amber-400 shrink-0"
                              : "text-cyan-400/70 shrink-0"
                          }
                        />
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xs font-black tracking-tight text-white">
                          {stat.value}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">
                          {stat.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STREAM DATA CAPTURE */}
          <div className="flex flex-col h-full bg-black/20 border border-slate-900 rounded-lg p-3 min-w-0">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Newspaper size={12} className="text-cyan-400" /> Narrative
              Streams
            </span>

            <div className="space-y-2 overflow-y-auto flex-1 max-h-[260px] lg:max-h-none pr-0.5 scrollbar-thin">
              {assetData.news.map((item) => {
                const isBullish = item.sentiment === "BULLISH";
                return (
                  <div
                    key={item.id}
                    className="p-2 bg-[#0a1024]/80 rounded border border-slate-800/60 hover:border-slate-700 transition-colors group cursor-pointer flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-black text-white bg-slate-800 px-1 py-0.5 rounded uppercase tracking-wide">
                          {item.source}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold">
                          {item.time}
                        </span>
                      </div>
                      <span
                        className={`text-[7px] font-black px-1.5 rounded uppercase tracking-wider border ${isBullish ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}
                      >
                        {item.sentiment}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-bold leading-normal text-slate-300 group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
