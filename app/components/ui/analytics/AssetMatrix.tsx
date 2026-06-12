"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronRight, X } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  MOCK_ASSETS_DATA,
  Timeframe,
  AssetCategory,
} from "@/app/lib/mockAnalytics";

export default function AssetMatrix() {
  const [category, setCategory] = useState<AssetCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(
    MOCK_ASSETS_DATA[0]?.id || "",
  );
  const [chartTf, setChartTf] = useState<Timeframe>("1M");

  const categories: { id: AssetCategory | "all"; label: string }[] = [
    { id: "all", label: "ALL_SYSTEMS" },
    { id: "fiat", label: "FIAT" },
    { id: "crypto", label: "CRYPTO" },
    { id: "stock", label: "STOCKS" },
  ];

  const timeframes: Timeframe[] = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

  const filteredAssets = useMemo(() => {
    return MOCK_ASSETS_DATA.filter((asset) => {
      const matchesCat = category === "all" || asset.category === category;
      const matchesSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [category, search]);

  const currentAsset = useMemo(() => {
    return (
      MOCK_ASSETS_DATA.find((a) => a.id === selectedId) || MOCK_ASSETS_DATA[0]
    );
  }, [selectedId]);

  // Maparea punctelor din istoric la date calendaristice reale înapoi din Iunie 2026
  const computedChartData = useMemo(() => {
    if (!currentAsset) return [];
    const rawData = currentAsset.history[chartTf];
    const endDate = new Date(2026, 5, 12); // Ancorat în Iunie 2026

    return rawData.map((point, index) => {
      const totalPoints = rawData.length;
      const daysAgo = totalPoints - 1 - index;

      const targetDate = new Date(endDate);
      targetDate.setDate(endDate.getDate() - daysAgo);

      // Formatare inteligentă a datei în funcție de intervalul ales
      let displayDate = "";
      if (chartTf === "1W") {
        displayDate = targetDate
          .toLocaleDateString("ro-RO", { weekday: "short" })
          .toUpperCase();
      } else if (chartTf === "1M" || chartTf === "3M") {
        displayDate = targetDate
          .toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })
          .toUpperCase();
      } else {
        displayDate = targetDate
          .toLocaleDateString("ro-RO", { month: "short", year: "2-digit" })
          .toUpperCase();
      }

      return {
        ...point,
        formattedDate: displayDate,
      };
    });
  }, [currentAsset, chartTf]);

  const categoryColors: Record<AssetCategory, string> = {
    crypto: "#00f0ff",
    stock: "#bd00ff",
    fiat: "#00ff66",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch font-mono w-full m-0 p-0 bg-[#02040a] text-slate-200">
      {/* LEFT: NEO TOKYO LIST CONTAINER */}
      <div className="lg:col-span-5 bg-[#060b18] border border-cyan-500/30 rounded-xl flex flex-col h-[460px] overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:border-cyan-400/50">
        {/* UPPER CONTROLS */}
        <div className="p-4 border-b border-cyan-500/20 flex flex-col gap-3 shrink-0 bg-[#030712]">
          <div className="flex items-center justify-between">
            <span className="text-cyan-400 font-black text-[11px] tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              ASSET_VAULT_v2.6
            </span>
            <div className="flex bg-black/60 p-0.5 rounded-md border border-cyan-500/20 gap-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-w-[55px] text-center ${
                    category === cat.id
                      ? "bg-cyan-500 text-black font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat.label.replace("_SYSTEMS", "")}
                </button>
              ))}
            </div>
          </div>

          {/* NEO TOKYO SEARCH BAR */}
          <div className="relative group">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/60 group-focus-within:text-cyan-400 transition-colors"
            />
            <input
              type="text"
              placeholder="// SEARCH_ASSET_MATRIX..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#030712] border border-cyan-500/30 focus:border-cyan-400 rounded-md pl-9 pr-8 py-2 text-[10px] text-cyan-300 font-bold tracking-widest placeholder-cyan-800 focus:outline-none uppercase transition-all duration-200 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-gradient-to-r from-[#030712] to-[#0a1424]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* LIST FEED */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 divide-y divide-cyan-500/10 bg-[#040814]">
          {filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 tracking-wider">
              // NO_ASSETS_FOUND_IN_MATRIX
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isSelected = asset.id === selectedId;
              const assetTotalVal = parseFloat(asset.balance) * asset.priceUsd;
              const accentColor = categoryColors[asset.category];

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedId(asset.id)}
                  className={`flex items-center justify-between px-4 py-3 transition-all duration-200 cursor-pointer group relative ${
                    isSelected
                      ? "bg-gradient-to-r from-cyan-950/40 to-transparent"
                      : "bg-transparent hover:bg-cyan-950/10"
                  }`}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-200 ${
                      isSelected
                        ? "bg-cyan-400 shadow-[0_0_10px_#00f0ff]"
                        : "bg-transparent group-hover:bg-cyan-500/20"
                    }`}
                  />

                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-md text-[9px] font-black flex items-center justify-center border transition-all shadow-[inset_0_0_6px_rgba(0,0,0,0.4)] shrink-0"
                      style={{
                        borderColor: `${accentColor}40`,
                        color: accentColor,
                        backgroundColor: `${accentColor}0a`,
                        boxShadow: isSelected
                          ? `0 0 10px ${accentColor}20`
                          : undefined,
                      }}
                    >
                      {asset.symbol.slice(0, 3).toUpperCase()}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-bold text-xs tracking-wide truncate uppercase group-hover:text-cyan-300 transition-colors">
                        {asset.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
                        {asset.balance}{" "}
                        <span className="text-cyan-400/70 font-bold text-[9px]">
                          {asset.symbol}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="flex flex-col">
                      <span className="text-slate-100 font-black text-xs tracking-wide">
                        $
                        {assetTotalVal.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold mt-0.5 px-1 py-0.2 rounded text-center self-end ${
                          asset.change24h >= 0
                            ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10"
                            : "text-rose-400 bg-rose-500/5 border border-rose-500/10"
                        }`}
                      >
                        {asset.change24h >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(asset.change24h)}%
                      </span>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`transition-all duration-200 ${
                        isSelected
                          ? "text-cyan-400 translate-x-0.5"
                          : "text-slate-600 group-hover:text-cyan-400/50"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: CHART MATRIX */}
      <div className="lg:col-span-7 bg-[#060b18] border border-cyan-500/30 rounded-xl p-4 flex flex-col h-[460px] relative group overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:border-cyan-400/50">
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-3 mb-4 shrink-0 relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-wider uppercase leading-none">
                {currentAsset?.name || "SELECT_ASSET"}
              </h3>
              {currentAsset && (
                <span
                  className="text-[9px] px-2 py-0.5 font-black rounded border bg-black/50"
                  style={{
                    borderColor: `${categoryColors[currentAsset.category]}30`,
                    color: categoryColors[currentAsset.category],
                  }}
                >
                  {currentAsset.symbol}
                </span>
              )}
            </div>
            <span className="text-[9px] text-cyan-400/60 uppercase font-bold tracking-widest mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
              TELEMETRY_STREAM_FEED
            </span>
          </div>

          {/* TIMEFRAME BUTTONS REDESIGNED (NEO TOKYO) */}
          {currentAsset && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex bg-black/40 border border-cyan-500/20 p-0.5 rounded-md gap-1">
                {timeframes.map((tf) => {
                  const isActive = chartTf === tf;
                  return (
                    <button
                      key={tf}
                      onClick={() => setChartTf(tf)}
                      className={`px-2.5 py-1 rounded text-[9px] font-black tracking-wider transition-all duration-150 cursor-pointer border ${
                        isActive
                          ? "bg-gradient-to-b from-cyan-400 to-cyan-500 text-black border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                          : "text-cyan-500/60 border-transparent hover:text-cyan-300 hover:bg-cyan-500/5 hover:border-cyan-500/10"
                      }`}
                    >
                      {tf}
                    </button>
                  );
                })}
              </div>
              <span className="text-lg font-black text-white tracking-wide leading-none">
                $
                {(
                  parseFloat(currentAsset.balance) * currentAsset.priceUsd
                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* CHART AXES REPAIRED */}
        <div className="flex-1 w-full relative z-10 min-h-0 pt-2">
          {currentAsset && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={computedChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 15 }}
              >
                <defs>
                  <linearGradient
                    id="dynamicAssetGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={categoryColors[currentAsset.category]}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={categoryColors[currentAsset.category]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="rgba(6, 182, 212, 0.04)"
                  vertical={false}
                />

                {/* X Axis - Clean Calendar Data */}
                <XAxis
                  dataKey="formattedDate"
                  stroke="rgba(6, 182, 212, 0.2)"
                  tick={{
                    fill: "#64748b",
                    fontSize: 9,
                    fontFamily: "monospace",
                    fontWeight: "bold",
                  }}
                  dy={10}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={25}
                />

                {/* Y Axis - Clear Currency Formatting */}
                <YAxis
                  stroke="rgba(6, 182, 212, 0.2)"
                  tick={{
                    fill: "#64748b",
                    fontSize: 9,
                    fontFamily: "monospace",
                  }}
                  dx={-5}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(val) =>
                    `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  }
                />

                <Tooltip
                  formatter={(value: any) => [
                    `$${Number(value).toLocaleString()}`,
                    "VALOARE",
                  ]}
                  labelFormatter={(label) => `DATA: ${label}`}
                  contentStyle={{
                    backgroundColor: "#030712",
                    borderColor: "rgba(6,182,212,0.4)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    padding: "8px",
                    boxShadow: "0 0 15px rgba(0,240,255,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={categoryColors[currentAsset.category]}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dynamicAssetGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
