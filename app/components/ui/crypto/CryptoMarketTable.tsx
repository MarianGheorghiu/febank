"use client";

import { useState, useRef } from "react";
import { Search, Activity, Zap } from "lucide-react";
import CryptoActionModal, { TradeType } from "./CryptoActionModal";
import { MOCK_MARKET } from "@/app/lib/cryptoMock";

// ==========================================
// 1. NATIVE SVG SPARKLINE (CU HOVER EFFECT)
// ==========================================
const SparklineChart = ({
  data,
  isPositive,
}: {
  data: number[];
  isPositive: boolean;
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) return null;

  const width = 140;
  const height = 40;
  const padding = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const priceRange = max - min === 0 ? 1 : max - min;

  // Calculare coordonate puncte în interiorul viewBox-ului SVG
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padding + (1 - (val - min) / priceRange) * (height - padding * 2);
    return { x, y, val };
  });

  // Generare string path ("M x y L x y ...")
  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    "",
  );

  const strokeColor = isPositive ? "#34d399" : "#fb7185";

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentageX = mouseX / rect.width;

    // Identificare cel mai apropiat punct din matrice în funcție de X
    const index = Math.min(
      data.length - 1,
      Math.max(0, Math.round(percentageX * (data.length - 1))),
    );
    setHoveredIdx(index);
  };

  return (
    <div className="h-10 w-full relative overflow-visible group/spark flex items-center">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Linia de fundal de tracking (opțională, oferă profunzime la hover) */}
        {hoveredIdx !== null && (
          <line
            x1={points[hoveredIdx].x}
            y1={0}
            x2={points[hoveredIdx].x}
            y2={height}
            stroke="rgba(6, 182, 212, 0.25)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}

        {/* Linia Sparkline Principală */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Indicator Punct Activ la Hover */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <circle
            cx={points[hoveredIdx].x}
            cy={points[hoveredIdx].y}
            r={3}
            fill={strokeColor}
            stroke="#020617"
            strokeWidth={1}
          />
        )}
      </svg>

      {/* Micro-Tooltip Float dynamic ca la Recharts */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="absolute z-50 bg-[#020816] border border-cyan-500/40 rounded px-1.5 py-0.5 text-[9px] font-mono text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] pointer-events-none whitespace-nowrap"
          style={{
            left: `${(hoveredIdx / (data.length - 1)) * 100}%`,
            transform: `translateX(-50%)`,
            top: `-20px`,
          }}
        >
          ${points[hoveredIdx].val.toLocaleString()}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. COMPONENTA PRINCIPALĂ
// ==========================================
export default function CryptoMarketTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalType, setModalType] = useState<TradeType>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const filteredMarket = MOCK_MARKET.filter(
    (coin) =>
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleOpenAction = (type: TradeType, coin: any) => {
    setSelectedAsset({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      price: coin.price,
    });
    setModalType(type);
  };

  const PercentText = ({ val }: { val: number }) => {
    const isPos = val >= 0;
    return (
      <span
        className={`font-mono text-xs font-bold ${isPos ? "text-emerald-400" : "text-rose-400"}`}
      >
        {isPos ? "+" : ""}
        {val.toFixed(2)}%
      </span>
    );
  };

  return (
    <>
      {/* MODIFICAT: Adăugat 'group', 'transition-all duration-300', 
        'hover:border-cyan-500/80' și 'hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]'
      */}
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#020617] to-[#040e29] border border-cyan-500/30 rounded-xl overflow-hidden relative transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]">
        {/* ADĂUGAT: Efectul de Neon Glow Cyberpunk din spatele cardului */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-cyan-500/50 blur-[20px] pointer-events-none" />

        {/* HEADER & SEARCH BAR */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 bg-[#020816]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-cyan-400" />
              <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest uppercase">
                Market Matrix
              </h2>
            </div>
            <p className="text-[10px] text-cyan-200/50 font-mono mt-1 uppercase tracking-widest ml-6">
              Live Assets • Volatility Index
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-500/50"
            />
            <input
              type="text"
              placeholder="Search assets (e.g. BTC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#03091e] border border-cyan-500/30 rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono text-cyan-100 placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
            />
          </div>
        </div>

        {/* TABLE HEADERS Desktop */}
        <div className="hidden lg:grid grid-cols-12 gap-2 xl:gap-4 py-2 border-b border-cyan-500/20 bg-cyan-950/20 text-[11px] font-mono font-bold text-white uppercase tracking-widest shrink-0 items-center relative z-10">
          <div className="col-span-2 pl-5">Coin</div>
          <div className="col-span-1 text-right">Price</div>
          <div className="col-span-1 text-right">1h %</div>
          <div className="col-span-1 text-right">24h %</div>
          <div className="col-span-1 text-right">7d %</div>
          <div className="col-span-1 text-right">24h Vol</div>
          <div className="col-span-1 text-right">Mkt Cap</div>
          <div className="col-span-2 text-center">Last 7 Days</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {/* MARKET LIST */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 space-y-3 scrollbar-thin relative z-10">
          {filteredMarket.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-cyan-500/30 font-mono text-xs">
              <Zap size={32} className="mb-3 opacity-30" />
              <p>NO ASSETS MATCHING DESIGNATION</p>
            </div>
          ) : (
            filteredMarket.map((coin, idx) => {
              const isPositive7d = coin.change7d >= 0;

              return (
                <div
                  key={idx}
                  className="group flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-2 xl:gap-4 items-center bg-[#050b1a]/60 p-4 sm:px-5 sm:py-3 rounded-lg border border-cyan-500/10 hover:border-cyan-500/40 hover:bg-[#071128] transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                >
                  {/* MOBILE HEADER */}
                  <div className="w-full flex lg:hidden justify-between items-center mb-2 border-b border-cyan-500/10 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#020510] border border-cyan-500/30 flex items-center justify-center font-mono font-black text-xs text-cyan-400">
                        {coin.symbol[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          {coin.name}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {coin.symbol}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-white">
                        $
                        {coin.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* DESKTOP COL 1: COIN */}
                  <div className="hidden lg:flex col-span-2 items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#020510] border border-cyan-500/30 flex items-center justify-center font-mono font-black text-sm text-cyan-400 shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300">
                      {coin.symbol[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white tracking-wide">
                        {coin.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 mt-0.5 rounded border border-cyan-500/20 inline-block w-fit">
                        {coin.symbol}
                      </span>
                    </div>
                  </div>

                  {/* DESKTOP COL 2: PRICE */}
                  <div className="hidden lg:block col-span-1 text-right">
                    <span className="text-sm font-mono font-bold text-white group-hover:text-cyan-100 transition-colors">
                      $
                      {coin.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* PERCENTAGES */}
                  <div className="w-full lg:w-auto grid grid-cols-3 lg:contents gap-2 text-center lg:text-right">
                    <div className="col-span-1 flex flex-col lg:block bg-black/20 lg:bg-transparent rounded py-1 lg:py-0">
                      <span className="lg:hidden text-[9px] font-mono text-cyan-500/50 uppercase mb-1">
                        1h
                      </span>
                      <PercentText val={coin.change1h} />
                    </div>
                    <div className="col-span-1 flex flex-col lg:block bg-black/20 lg:bg-transparent rounded py-1 lg:py-0">
                      <span className="lg:hidden text-[9px] font-mono text-cyan-500/50 uppercase mb-1">
                        24h
                      </span>
                      <PercentText val={coin.change24h} />
                    </div>
                    <div className="col-span-1 flex flex-col lg:block bg-black/20 lg:bg-transparent rounded py-1 lg:py-0">
                      <span className="lg:hidden text-[9px] font-mono text-cyan-500/50 uppercase mb-1">
                        7d
                      </span>
                      <PercentText val={coin.change7d} />
                    </div>
                  </div>

                  {/* VOL & CAP */}
                  <div className="w-full lg:w-auto grid grid-cols-2 lg:contents gap-2 text-center lg:text-right">
                    <div className="col-span-1 flex flex-col lg:block bg-black/20 lg:bg-transparent rounded py-1 lg:py-0">
                      <span className="lg:hidden text-[9px] font-mono text-cyan-500/50 uppercase mb-1">
                        24h Vol
                      </span>
                      <span className="text-xs font-mono text-white/80">
                        {coin.volume}
                      </span>
                    </div>
                    <div className="col-span-1 flex flex-col lg:block bg-black/20 lg:bg-transparent rounded py-1 lg:py-0">
                      <span className="lg:hidden text-[9px] font-mono text-cyan-500/50 uppercase mb-1">
                        Mkt Cap
                      </span>
                      <span className="text-xs font-mono text-white/80">
                        {coin.cap}
                      </span>
                    </div>
                  </div>

                  {/* CUSTOM SVG SPARKLINE */}
                  <div className="w-full lg:w-auto col-span-2 px-2 bg-black/10 lg:bg-transparent rounded-lg py-1 lg:py-0 overflow-visible">
                    <span className="lg:hidden block text-center text-[9px] font-mono text-cyan-500/50 uppercase mb-1">
                      Last 7 Days
                    </span>
                    <SparklineChart
                      data={coin.sparkline}
                      isPositive={isPositive7d}
                    />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="w-full lg:w-auto col-span-2 flex items-center justify-between lg:justify-end gap-1.5 mt-2 lg:mt-0">
                    <button
                      onClick={() => handleOpenAction("BUY", coin)}
                      className="cursor-pointer flex-1 lg:flex-none px-2 py-1.5 lg:px-3 lg:py-2 rounded border font-mono font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all duration-300 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => handleOpenAction("SELL", coin)}
                      className="cursor-pointer flex-1 lg:flex-none px-2 py-1.5 lg:px-3 lg:py-2 rounded border font-mono font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all duration-300 text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    >
                      Sell
                    </button>
                    <button
                      onClick={() => handleOpenAction("SWAP", coin)}
                      className="cursor-pointer flex-1 lg:flex-none px-2 py-1.5 lg:px-3 lg:py-2 rounded border font-mono font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all duration-300 text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10 hover:bg-gradient-to-r hover:from-fuchsia-600 hover:to-cyan-600 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(217,70,239,0.4)]"
                    >
                      Swap
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CryptoActionModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType}
        asset={selectedAsset}
      />
    </>
  );
}
