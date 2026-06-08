"use client";

import { useState } from "react";
import { Search, Globe, Flame, ShieldAlert, Cpu } from "lucide-react";
import { MOCK_MARKET_ASSETS, MarketAsset } from "@/app/lib/mockStockData";
import StockActionModal from "./StockActionModal";

export default function MarketExplorerTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [modalType, setModalType] = useState<"BUY" | "SELL" | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);

  const categories = [
    "All",
    "Top Movers",
    "AI & Robotics",
    "Big Tech",
    "Metals",
    "Oil & Gas",
    "ETFs",
  ];

  // Sistem de filtrare combinat
  const filteredAssets = MOCK_MARKET_ASSETS.filter((asset) => {
    const matchesSearch =
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategory === "All") return true;
    if (activeCategory === "Top Movers") return Math.abs(asset.change24h) > 3; // Mișcări majore
    return asset.category === activeCategory;
  }).sort((a, b) =>
    activeCategory === "Top Movers" ? b.change24h - a.change24h : 0,
  );

  const PercentText = ({ val }: { val: number }) => {
    const isPos = val >= 0;
    return (
      <span
        className={`font-mono text-[10px] font-bold ${isPos ? "text-emerald-400" : "text-rose-400"}`}
      >
        {isPos ? "+" : ""}
        {val.toFixed(2)}%
      </span>
    );
  };

  return (
    <>
      <div className="w-full flex flex-col bg-gradient-to-br from-[#020617] to-[#040e29] border border-blue-500/30 rounded-xl overflow-hidden relative transition-all duration-300 group hover:border-blue-500/80 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        {/* Glow & Title */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-blue-500/50 blur-[20px] pointer-events-none" />

        <div className="p-4 sm:p-5 border-b border-blue-500/20 bg-[#020816]/80 backdrop-blur-md flex flex-col gap-4 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-blue-400" />
                <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-widest uppercase">
                  Market Explorer
                </h2>
              </div>
              <p className="text-[9px] text-blue-200/50 font-mono mt-1 uppercase tracking-widest ml-6">
                Global Equities • Fractional • Thematics
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
              />
              <input
                type="text"
                placeholder="Find global assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#03091e] border border-blue-500/40 rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-blue placeholder-white-500 focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* CHIP FILTERS PENTRU CATEGORII */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap cursor-pointer px-3 py-1.5 rounded border font-mono text-[9px] font-bold uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? "bg-blue-500/20 border-blue-400 text-white"
                    : "bg-black/20 border-white/5 text-white hover:text-blue-400 hover:border-blue-500/30"
                }`}
              >
                {cat === "Top Movers" && (
                  <Flame size={10} className="inline mr-1 text-orange-400" />
                )}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* HEADERS DESKTOP (Grid 12) */}
        <div className="hidden lg:grid grid-cols-12 gap-2 xl:gap-4 py-2 border-b border-blue-500/20 bg-blue-950/20 text-[10px] font-mono font-bold text-white uppercase tracking-widest px-5 items-center">
          <div className="col-span-3">Instrument</div>
          <div className="col-span-2">Thematic / Region</div>
          <div className="col-span-1 text-right">Price</div>
          <div className="col-span-1 text-right">24h Change</div>
          <div className="col-span-1 text-right">7d Change</div>
          <div className="col-span-2 text-right">Volume</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* ASSETS LIST */}
        <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto p-2 sm:p-3 space-y-2.5 scrollbar-thin">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="group flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-2 xl:gap-4 items-center bg-[#050b1a]/60 p-4 sm:px-5 sm:py-2.5 rounded-lg border border-blue-500/10 hover:border-blue-500/40 hover:bg-[#071128] transition-all duration-300 shadow-sm"
            >
              {/* MOBILE VIEW */}
              <div className="w-full flex lg:hidden justify-between items-center mb-1 border-b border-blue-500/10 pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-[#020510] border border-blue-500/30 flex items-center justify-center font-mono font-black text-xs text-blue-400 relative">
                    {asset.symbol[0]}
                    {asset.isFractional && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-black text-[8px] px-1 rounded-sm leading-none pt-0.5">
                        ƒ
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">
                      {asset.name}
                    </span>
                    <span className="text-[9px] font-mono text-blue-400">
                      {asset.symbol} • {asset.region}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-sm font-mono font-bold text-white">
                    ${asset.price.toFixed(2)}
                  </span>
                  <PercentText val={asset.change24h} />
                </div>
              </div>

              {/* DESKTOP COLUMNS */}
              <div className="hidden lg:flex col-span-3 items-center gap-3">
                <div className="h-9 w-9 rounded bg-[#020510] border border-blue-500/30 flex items-center justify-center font-mono font-black text-xs text-blue-400 relative shrink-0">
                  {asset.symbol[0]}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {asset.name}
                  </span>
                  <span className="text-[9px] font-mono text-blue-400">
                    {asset.symbol}
                  </span>
                </div>
              </div>

              <div className="hidden lg:flex flex-col col-span-2">
                <span className="text-[9px] font-mono text-slate-300 uppercase">
                  {asset.category}
                </span>
                <span className="text-[8px] font-mono text-slate-500 uppercase">
                  {asset.region} MARKET
                </span>
              </div>

              <div className="hidden lg:block col-span-1 text-right font-mono font-bold text-white">
                ${asset.price.toFixed(2)}
              </div>

              <div className="hidden lg:flex col-span-1 justify-end">
                <PercentText val={asset.change24h} />
              </div>
              <div className="hidden lg:flex col-span-1 justify-end">
                <PercentText val={asset.change7d} />
              </div>

              <div className="hidden lg:block col-span-2 text-right font-mono text-[10px] text-slate-400">
                Vol: {asset.volume}
              </div>

              {/* ACTIONS */}
              <div className="w-full lg:col-span-2 flex items-center justify-end gap-2 mt-2 lg:mt-0">
                {asset.isFractional && (
                  <span className="hidden lg:inline-flex px-1.5 py-0.5 border border-blue-500/20 bg-blue-500/20 text-white text-[8px] font-mono rounded mr-1">
                    Fractional
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedAsset(asset);
                    setModalType("BUY");
                  }}
                  className="cursor-pointer flex-1 lg:flex-none px-4 py-1.5 rounded border font-mono font-black text-[9px] uppercase tracking-widest transition-all text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black"
                >
                  BUY
                </button>
                <button
                  onClick={() => {
                    setSelectedAsset(asset);
                    setModalType("SELL");
                  }}
                  className="cursor-pointer flex-1 lg:flex-none px-2 py-1.5 lg:px-4 lg:py-1.5 rounded border font-mono font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all duration-300 text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                >
                  SELL
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <StockActionModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType}
        stock={selectedAsset}
      />
    </>
  );
}
