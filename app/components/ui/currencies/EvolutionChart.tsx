"use client";

import { useState, useMemo, useEffect } from "react";
import { Clock } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type AssetClass = "FIAT" | "CRYPTO" | "STOCKS";
type Timeframe = "1D" | "1W" | "1M" | "1Y" | "ALL";

const ASSET_CONFIGS = {
  FIAT: { color: "#10b981", label: "Fiat Capital", unit: "RON" },
  CRYPTO: { color: "#06b6d4", label: "Crypto Core", unit: "$" },
  STOCKS: { color: "#f59e0b", label: "Equity Index", unit: "$" },
};

// Generator determinist (Fără Math.random). Datele sunt stabile și complet predictibile
const generateMarketData = (asset: AssetClass, timeframe: Timeframe) => {
  let points = 12;
  if (timeframe === "1D") points = 24;
  if (timeframe === "1W") points = 7;
  if (timeframe === "1M") points = 30;

  const seeds: Record<AssetClass, number> = {
    FIAT: 1.5,
    CRYPTO: 7.3,
    STOCKS: 4.1,
  };
  const seed = seeds[asset];

  const data = [];
  let baseValue =
    asset === "CRYPTO" ? 64200 : asset === "STOCKS" ? 14800 : 28400;

  for (let i = 0; i < points; i++) {
    const wave1 = Math.sin(i * 0.4 + seed);
    const wave2 = Math.cos(i * 0.15 - seed) * 0.4;
    const marketTrend = i * (asset === "FIAT" ? 0.0005 : 0.015);

    const volatilityFactor =
      asset === "CRYPTO" ? 0.07 : asset === "STOCKS" ? 0.03 : 0.003;
    const finalPrice =
      baseValue * (1 + (wave1 + wave2 + marketTrend) * volatilityFactor);

    let label = `P-${i}`;
    if (timeframe === "1D") label = `${i}:00`;
    if (timeframe === "1W")
      label = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7];
    if (timeframe === "1M") label = `06/${i + 1 < 10 ? "0" + (i + 1) : i + 1}`;
    if (timeframe === "1Y")
      label = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][i % 12];
    if (timeframe === "ALL")
      label = `'${22 + Math.floor(i / 3)} Q${(i % 4) + 1}`;

    data.push({
      name: label,
      valoare: Math.round(finalPrice * 100) / 100,
    });
  }
  return data;
};

export default function EvolutionChart() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeAsset, setActiveAsset] = useState<AssetClass>("CRYPTO");
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [hoveredPoint, setHoveredPoint] = useState<{
    name: string;
    valoare: number;
  } | null>(null);

  // Previne erorile de hidratare asigurându-ne că graficul este randat doar pe client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    return generateMarketData(activeAsset, timeframe);
  }, [activeAsset, timeframe]);

  const currentTheme = ASSET_CONFIGS[activeAsset];

  const displayedValue = useMemo(() => {
    if (hoveredPoint) return hoveredPoint.valoare;
    return chartData[chartData.length - 1]?.valoare || 0;
  }, [hoveredPoint, chartData]);

  const displayedLabel = useMemo(() => {
    if (hoveredPoint) return hoveredPoint.name;
    return "LIVE INDEX FEED";
  }, [hoveredPoint]);

  const xAxisInterval = useMemo(() => {
    if (timeframe === "1D") return 3;
    if (timeframe === "1M") return 5;
    return "preserveStartEnd";
  }, [timeframe]);

  return (
    <div
      className="relative bg-[#0a1024] border rounded-xl flex flex-col h-full overflow-hidden transition-all duration-300 group"
      style={{
        borderColor: `${currentTheme.color}30`,
        boxShadow: `0 0 40px ${currentTheme.color}03`,
      }}
    >
      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* HEADER CONTROL */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 pb-3 border-b border-blue-500/10 shrink-0 bg-[#02040f]/50 gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 bg-[#02040f] p-0.5 rounded-lg border border-blue-500/10">
              {(["FIAT", "CRYPTO", "STOCKS"] as AssetClass[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setActiveAsset(type);
                    setHoveredPoint(null);
                  }}
                  className={`px-3 py-1 font-mono text-[9px] font-black tracking-wider uppercase rounded transition-all cursor-pointer ${
                    activeAsset === type
                      ? "text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  style={
                    activeAsset === type
                      ? {
                          backgroundColor: `${ASSET_CONFIGS[type].color}20`,
                          boxShadow: `inset 0 0 10px ${ASSET_CONFIGS[type].color}30`,
                        }
                      : {}
                  }
                >
                  {type}
                </button>
              ))}
            </div>
            <span className="text-[8px] font-mono font-bold tracking-widest text-slate-400 uppercase px-1">
              {currentTheme.label} //{" "}
              <span className="text-white">{displayedLabel}</span>
            </span>
          </div>

          <div className="flex flex-col sm:items-end font-mono">
            <span
              className="text-xl font-black tracking-tight transition-colors duration-150"
              style={{ color: currentTheme.color }}
            >
              {currentTheme.unit === "$" ? "$" : ""}
              {displayedValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
              {currentTheme.unit === "RON" ? " RON" : ""}
            </span>
            <span className="text-[8px] font-bold text-white flex items-center gap-1 mt-0.5 tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
              LIVE DATA
            </span>
          </div>
        </div>

        {/* SUB-HEADER */}
        <div className="flex justify-between items-center px-4 py-2 bg-[#02040f]/20 border-b border-blue-500/5 shrink-0">
          <div className="flex items-center gap-1 text-[9px] font-mono text-white font-bold tracking-widest">
            <Clock size={10} className="text-blue-400" />
            <span>METRIC PERIOD</span>
          </div>
          <div className="flex gap-1">
            {(["1D", "1W", "1M", "1Y", "ALL"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  setHoveredPoint(null);
                }}
                className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded cursor-pointer transition-colors ${
                  timeframe === tf
                    ? "bg-blue-500/20 border border-blue-500/40 text-cyan-400 font-black"
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* CORP GRAFIC SECURED */}
        <div className="flex-1 min-h-0 w-full relative bg-[#02040f]/10">
          <div className="absolute inset-0 pt-4 pb-2 pr-4 pl-1">
            {!isMounted ? (
              <div className="flex items-center justify-center h-full w-full text-[10px] font-mono text-slate-500">
                INITIALIZING CHART...
              </div>
            ) : (
              /* MODIFIED: Added minWidth and minHeight props to bypass Recharts calculation warnings */
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 25, left: 10, bottom: 5 }}
                  onMouseMove={(e: any) => {
                    if (e?.activePayload?.[0]) {
                      setHoveredPoint({
                        name: e.activePayload[0].payload.name,
                        valoare: e.activePayload[0].value as number,
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient
                      id={`glowGradient-${activeAsset}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={currentTheme.color}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={currentTheme.color}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="rgba(255, 255, 255, 0.02)"
                    strokeDasharray="2 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#ffffff"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    fontFamily="monospace"
                    height={20}
                    interval={xAxisInterval}
                    tickMargin={8}
                    style={{ fill: "#ffffff", fontWeight: "600", opacity: 0.8 }}
                  />

                  <YAxis
                    stroke="#ffffff"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    fontFamily="monospace"
                    width={55}
                    tickMargin={6}
                    domain={["dataMin - 100", "dataMax + 100"]}
                    tickFormatter={(val) =>
                      val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
                    }
                    style={{ fill: "#ffffff", fontWeight: "600", opacity: 0.8 }}
                  />

                  <Tooltip
                    content={() => <></>}
                    cursor={{
                      stroke: `${currentTheme.color}40`,
                      strokeWidth: 1,
                      strokeDasharray: "3 3",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="valoare"
                    stroke={currentTheme.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#glowGradient-${activeAsset})`}
                    activeDot={{
                      r: 4,
                      stroke: "#02040f",
                      strokeWidth: 2,
                      fill: currentTheme.color,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
