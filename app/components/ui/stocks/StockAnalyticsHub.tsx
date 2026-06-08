"use client";

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

// --- MOCK CATALOG ---
const STOCKS_CATALOG: Record<
  string,
  {
    name: string;
    exchange: string;
    price: number;
    change: number;
    changePercent: number;
    stats: Array<{
      label: string;
      value: string;
      unit: string;
      icon: any;
      highlight?: boolean;
    }>;
    news: Array<{
      id: number;
      source: string;
      time: string;
      title: string;
      sentiment: string;
    }>;
    chart: Record<
      string,
      Array<{
        name: string;
        open: number;
        high: number;
        low: number;
        close: number;
      }>
    >;
  }
> = {
  NVDA: {
    name: "NVIDIA Corp.",
    exchange: "NASDAQ",
    price: 127.4,
    change: 4.12,
    changePercent: 3.34,
    stats: [
      { label: "Market Cap", value: "3.13 T", unit: "USD", icon: Globe },
      { label: "P/E Ratio", value: "68.42", unit: "x", icon: Activity },
      { label: "EPS", value: "1.86", unit: "USD", icon: DollarSign },
      { label: "Div. Yield", value: "0.04%", unit: "Annual", icon: PieChart },
      {
        label: "Implied Vol. (IV)",
        value: "44.2%",
        unit: "High",
        icon: Flame,
        highlight: true,
      },
      { label: "Short Float", value: "1.24%", unit: "Low", icon: ShieldCheck },
    ],
    news: [
      {
        id: 1,
        source: "Bloomberg",
        time: "24m ago",
        title:
          "NVIDIA rolls out Blackwell B200 updates addressing micro-architectural power leaks.",
        sentiment: "BULLISH",
      },
      {
        id: 2,
        source: "Reuters",
        time: "2h ago",
        title:
          "EU antitrust regulators initiate exploratory inquiries into AI hardware cluster dominance.",
        sentiment: "BEARISH",
      },
      {
        id: 3,
        source: "TechCrunch",
        time: "5h ago",
        title:
          "Hyperscalers lock in 3-year data center capacity orders, sustaining extreme chip demand backlog.",
        sentiment: "BULLISH",
      },
    ],
    chart: {
      "1D": [
        { name: "09:30", open: 120, high: 123, low: 119, close: 122 },
        { name: "11:00", open: 122, high: 125, low: 120, close: 121 },
        { name: "12:30", open: 121, high: 126, low: 121, close: 125 },
        { name: "14:00", open: 125, high: 125, low: 118, close: 119 },
        { name: "15:30", open: 119, high: 128, low: 119, close: 127.4 },
      ],
      "1W": [
        { name: "Mon", open: 115, high: 119, low: 114, close: 118 },
        { name: "Tue", open: 118, high: 122, low: 117, close: 120 },
        { name: "Wed", open: 120, high: 121, low: 115, close: 116 },
        { name: "Thu", open: 116, high: 126, low: 116, close: 124 },
        { name: "Fri", open: 124, high: 129, low: 123, close: 127.4 },
      ],
      "1M": [
        { name: "W1", open: 102, high: 109, low: 100, close: 106 },
        { name: "W2", open: 106, high: 112, low: 103, close: 110 },
        { name: "W3", open: 110, high: 114, low: 107, close: 108 },
        { name: "W4", open: 108, high: 130, low: 108, close: 127.4 },
      ],
      "1Y": [
        { name: "Q1", open: 80, high: 92, low: 75, close: 88 },
        { name: "Q2", open: 88, high: 105, low: 85, close: 101 },
        { name: "Q3", open: 101, high: 104, low: 90, close: 94 },
        { name: "Q4", open: 94, high: 135, low: 93, close: 127.4 },
      ],
      ALL: [
        { name: "2022", open: 35, high: 48, low: 22, close: 42 },
        { name: "2023", open: 42, high: 75, low: 38, close: 68 },
        { name: "2024", open: 68, high: 98, low: 60, close: 85 },
        { name: "2025", open: 85, high: 120, low: 80, close: 118 },
        { name: "2026", open: 118, high: 142, low: 112, close: 127.4 },
      ],
    },
  },
  AAPL: {
    name: "Apple Inc.",
    exchange: "NASDAQ",
    price: 184.25,
    change: -2.15,
    changePercent: -1.15,
    stats: [
      { label: "Market Cap", value: "2.89 T", unit: "USD", icon: Globe },
      { label: "P/E Ratio", value: "29.12", unit: "x", icon: Activity },
      { label: "EPS", value: "6.15", unit: "USD", icon: DollarSign },
      { label: "Div. Yield", value: "0.52%", unit: "Annual", icon: PieChart },
      { label: "Implied Vol. (IV)", value: "18.6%", unit: "Low", icon: Flame },
      {
        label: "Short Float",
        value: "0.58%",
        unit: "Minimal",
        icon: ShieldCheck,
      },
    ],
    news: [
      {
        id: 1,
        source: "Financial Times",
        time: "1h ago",
        title:
          "Apple secures exclusive hardware allocation for next-gen 2nm TSMC wafer nodes.",
        sentiment: "BULLISH",
      },
      {
        id: 2,
        source: "WSJ",
        time: "4h ago",
        title:
          "Slowing ecosystem hardware upgrades in key Asian sectors pressuring near-term retail targets.",
        sentiment: "BEARISH",
      },
    ],
    chart: {
      "1D": [
        { name: "09:30", open: 186.0, high: 186.5, low: 183.2, close: 183.8 },
        { name: "11:00", open: 183.8, high: 185.0, low: 183.0, close: 184.9 },
        { name: "12:30", open: 184.9, high: 185.2, low: 184.0, close: 184.2 },
        { name: "14:00", open: 184.2, high: 184.5, low: 182.8, close: 183.1 },
        { name: "15:30", open: 183.1, high: 184.6, low: 183.0, close: 184.25 },
      ],
      "1W": [
        { name: "Mon", open: 188, high: 189, low: 184, close: 185 },
        { name: "Tue", open: 185, high: 187, low: 183, close: 186 },
        { name: "Wed", open: 186, high: 186, low: 182, close: 183 },
        { name: "Thu", open: 183, high: 185, low: 182, close: 184 },
        { name: "Fri", open: 184, high: 185, low: 183, close: 184.25 },
      ],
      "1M": [
        { name: "W1", open: 180, high: 185, low: 179, close: 183 },
        { name: "W2", open: 183, high: 188, low: 182, close: 186 },
        { name: "W3", open: 186, high: 192, low: 185, close: 189 },
        { name: "W4", open: 189, high: 190, low: 183, close: 184.25 },
      ],
      "1Y": [
        { name: "Q1", open: 170, high: 182, low: 165, close: 178 },
        { name: "Q2", open: 178, high: 195, low: 175, close: 192 },
        { name: "Q3", open: 192, high: 200, low: 180, close: 185 },
        { name: "Q4", open: 185, high: 198, low: 181, close: 184.25 },
      ],
      ALL: [
        { name: "2022", open: 130, high: 180, low: 125, close: 150 },
        { name: "2023", open: 150, high: 198, low: 145, close: 192 },
        { name: "2024", open: 192, high: 220, low: 165, close: 185 },
        { name: "2025", open: 185, high: 210, low: 170, close: 180 },
        { name: "2026", open: 180, high: 195, low: 175, close: 184.25 },
      ],
    },
  },
  TSLA: {
    name: "Tesla Inc.",
    exchange: "NASDAQ",
    price: 210.8,
    change: 12.4,
    changePercent: 6.25,
    stats: [
      { label: "Market Cap", value: "668.50 B", unit: "USD", icon: Globe },
      { label: "P/E Ratio", value: "54.10", unit: "x", icon: Activity },
      { label: "EPS", value: "3.90", unit: "USD", icon: DollarSign },
      { label: "Div. Yield", value: "0.00%", unit: "N/A", icon: PieChart },
      {
        label: "Implied Vol. (IV)",
        value: "56.4%",
        unit: "Extreme",
        icon: Flame,
        highlight: true,
      },
      {
        label: "Short Float",
        value: "3.41%",
        unit: "Elevated",
        icon: ShieldCheck,
      },
    ],
    news: [
      {
        id: 1,
        source: "Electrek",
        time: "45m ago",
        title:
          "Full Self-Driving (FSD) v13 rollout achieves 4x increase in critical intervention thresholds.",
        sentiment: "BULLISH",
      },
      {
        id: 2,
        source: "CNBC",
        time: "3h ago",
        title:
          "Gigafactory regulatory milestones greenlit for alternative grid storage units allocation.",
        sentiment: "BULLISH",
      },
    ],
    chart: {
      "1D": [
        { name: "09:30", open: 198.5, high: 202.0, low: 197.0, close: 201.2 },
        { name: "11:00", open: 201.2, high: 206.5, low: 200.5, close: 205.0 },
        { name: "12:30", open: 205.0, high: 208.4, low: 204.0, close: 207.1 },
        { name: "14:00", open: 207.1, high: 212.0, low: 206.5, close: 209.8 },
        { name: "15:30", open: 209.8, high: 214.5, low: 209.0, close: 210.8 },
      ],
      "1W": [
        { name: "Mon", open: 190, high: 195, low: 188, close: 192 },
        { name: "Tue", open: 192, high: 200, low: 191, close: 198 },
        { name: "Wed", open: 198, high: 204, low: 196, close: 202 },
        { name: "Thu", open: 202, high: 208, low: 201, close: 206 },
        { name: "Fri", open: 206, high: 215, low: 205, close: 210.8 },
      ],
      "1M": [
        { name: "W1", open: 175, high: 185, low: 172, close: 182 },
        { name: "W2", open: 182, high: 190, low: 180, close: 188 },
        { name: "W3", open: 188, high: 202, low: 185, close: 199 },
        { name: "W4", open: 199, high: 216, low: 197, close: 210.8 },
      ],
      "1Y": [
        { name: "Q1", open: 240, high: 250, low: 160, close: 175 },
        { name: "Q2", open: 175, high: 198, low: 165, close: 188 },
        { name: "Q3", open: 188, high: 220, low: 174, close: 205 },
        { name: "Q4", open: 205, high: 235, low: 192, close: 210.8 },
      ],
      ALL: [
        { name: "2022", open: 350, high: 400, low: 110, close: 123 },
        { name: "2023", open: 123, high: 299, low: 120, close: 248 },
        { name: "2024", open: 248, high: 270, low: 140, close: 220 },
        { name: "2025", open: 220, high: 265, low: 160, close: 202 },
        { name: "2026", open: 202, high: 235, low: 180, close: 210.8 },
      ],
    },
  },
  BTC: {
    name: "Bitcoin",
    exchange: "CRYPTO",
    price: 94250.0,
    change: -1420.0,
    changePercent: -1.48,
    stats: [
      { label: "Market Cap", value: "1.85 T", unit: "USD", icon: Globe },
      { label: "P/E Ratio", value: "N/A", unit: "Protocol", icon: Activity },
      { label: "Block Subsidy", value: "3.125", unit: "BTC", icon: DollarSign },
      { label: "Supply Limit", value: "21M", unit: "Max", icon: PieChart },
      {
        label: "Implied Vol. (IV)",
        value: "48.9%",
        unit: "High",
        icon: Flame,
        highlight: true,
      },
      { label: "Hashrate", value: "620E", unit: "EH/s", icon: ShieldCheck },
    ],
    news: [
      {
        id: 1,
        source: "CoinDesk",
        time: "12m ago",
        title:
          "Institutional custody inflows match historic peaks as sovereign treasury exploration continues.",
        sentiment: "BULLISH",
      },
      {
        id: 2,
        source: "Blockworks",
        time: "3h ago",
        title:
          "Mining difficulty parameters adjust upwards by 4.2%, squeezing inefficient data center layouts.",
        sentiment: "BEARISH",
      },
    ],
    chart: {
      "1D": [
        { name: "09:30", open: 95670, high: 95900, low: 94800, close: 95100 },
        { name: "11:00", open: 95100, high: 95400, low: 94100, close: 94350 },
        { name: "12:30", open: 94350, high: 94800, low: 93900, close: 94120 },
        { name: "14:00", open: 94120, high: 94650, low: 93850, close: 94500 },
        { name: "15:30", open: 94500, high: 94900, low: 93950, close: 94250 },
      ],
      "1W": [
        { name: "Mon", open: 92000, high: 96500, low: 91500, close: 95800 },
        { name: "Tue", open: 95800, high: 98200, low: 95000, close: 97100 },
        { name: "Wed", open: 97100, high: 97400, low: 93500, close: 94200 },
        { name: "Thu", open: 94200, high: 95600, low: 93800, close: 94950 },
        { name: "Fri", open: 94950, high: 95400, low: 93200, close: 94250 },
      ],
      "1M": [
        { name: "W1", open: 88000, high: 91000, low: 85000, close: 89500 },
        { name: "W2", open: 89500, high: 94000, low: 88200, close: 93200 },
        { name: "W3", open: 93200, high: 99800, low: 92100, close: 96400 },
        { name: "W4", open: 96400, high: 97500, low: 93100, close: 94250 },
      ],
      "1Y": [
        { name: "Q1", open: 42000, high: 73500, low: 40500, close: 68000 },
        { name: "Q2", open: 68000, high: 72000, low: 58000, close: 62500 },
        { name: "Q3", open: 62500, high: 66000, low: 52500, close: 64100 },
        { name: "Q4", open: 64100, high: 99400, low: 63000, close: 94250 },
      ],
      ALL: [
        { name: "2022", open: 47000, high: 48000, low: 15500, close: 16500 },
        { name: "2023", open: 16500, high: 44000, low: 16300, close: 42200 },
        { name: "2024", open: 42200, high: 73500, low: 38500, close: 68500 },
        { name: "2025", open: 68500, high: 99500, low: 50500, close: 88400 },
        { name: "2026", open: 88400, high: 104000, low: 82100, close: 94250 },
      ],
    },
  },
};

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
                  const Icon = stat.icon;
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
