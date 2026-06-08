"use client";

import { useState } from "react";
import { Search, Briefcase, Activity, Zap } from "lucide-react";
import { MOCK_STOCK_HOLDINGS, StockHolding } from "@/app/lib/mockStockData";
import StockActionModal from "./StockActionModal";

export default function StockHoldingsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalType, setModalType] = useState<"BUY" | "SELL" | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockHolding | null>(null);

  const filteredHoldings = MOCK_STOCK_HOLDINGS.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const triggerAction = (type: "BUY" | "SELL", stock: StockHolding) => {
    setSelectedStock(stock);
    setModalType(type);
  };

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
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#020617] to-[#040e29] border border-cyan-500/30 rounded-xl overflow-hidden relative transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-cyan-500/50 blur-[20px] pointer-events-none" />

        {/* HEADER & SEARCH BAR */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 bg-[#020816]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-cyan-400" />
              <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest uppercase">
                Holdings Ledger
              </h2>
            </div>
            <p className="text-[9px] text-cyan-200/50 font-mono mt-1 uppercase tracking-widest ml-6">
              Active Securities Portfolio
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-500/50"
            />
            <input
              type="text"
              placeholder="Search assets (e.g. NVDA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#03091e] border border-cyan-500/30 rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono text-cyan-100 placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
            />
          </div>
        </div>

        {/* TABLE HEADERS Desktop */}
        <div className="hidden lg:grid grid-cols-12 gap-2 xl:gap-4 py-2 border-b border-cyan-500/20 bg-cyan-950/20 text-[10px] font-mono font-bold text-white uppercase tracking-widest shrink-0 items-center relative z-10">
          <div className="col-span-3 pl-5">Asset</div>
          <div className="col-span-1 text-center">Sector</div>
          <div className="col-span-1 text-right">Shares</div>
          <div className="col-span-1 text-right">Avg Cost</div>
          <div className="col-span-1 text-right">Price</div>
          <div className="col-span-2 text-right">Total Equity</div>
          <div className="col-span-3 text-right pr-5">Actions</div>
        </div>

        {/* MARKET LIST */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 space-y-2.5 scrollbar-thin relative z-10">
          {filteredHoldings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-cyan-500/30 font-mono text-xs mt-10">
              <Zap size={32} className="mb-3 opacity-30" />
              <p>NO ASSETS MATCHING DESIGNATION</p>
            </div>
          ) : (
            filteredHoldings.map((stock, idx) => {
              const currentVal = stock.shares * stock.currentPrice;
              const unrealizedPL = currentVal - stock.shares * stock.avgCost;
              const plPercent =
                (unrealizedPL / (stock.shares * stock.avgCost)) * 100;

              return (
                <div
                  key={idx}
                  className="group flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-2 xl:gap-4 items-center bg-[#050b1a]/60 p-4 sm:px-5 sm:py-2.5 rounded-lg border border-cyan-500/10 hover:border-cyan-500/40 hover:bg-[#071128] transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                >
                  {/* MOBILE HEADER */}
                  <div className="w-full flex lg:hidden justify-between items-center mb-2 border-b border-cyan-500/10 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#020510] border border-cyan-500/30 flex items-center justify-center font-mono font-black text-xs text-cyan-400">
                        {stock.symbol[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          {stock.name}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {stock.symbol} • {stock.sector}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm font-mono font-bold text-white">
                        $
                        {currentVal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <PercentText val={plPercent} />
                    </div>
                  </div>

                  {/* DESKTOP COL 1: ASSET */}
                  <div className="hidden lg:flex col-span-3 items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#020510] border border-cyan-500/30 flex items-center justify-center font-mono font-black text-xs text-cyan-400 shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300">
                      {stock.symbol[0]}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white tracking-wide truncate">
                        {stock.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 mt-0.5 rounded border border-cyan-500/20 inline-block w-fit">
                        {stock.symbol}
                      </span>
                    </div>
                  </div>

                  {/* DESKTOP COL 2: SECTOR */}
                  <div className="hidden lg:block col-span-1 text-center">
                    <span className="text-[9px] font-mono text-slate-400/80 uppercase border border-white/5 bg-black/20 px-1.5 py-0.5 rounded">
                      {stock.sector}
                    </span>
                  </div>

                  {/* SHARES, AVG COST, PRICE (Grid on Mobile, Cols on Desktop) */}
                  <div className="w-full lg:contents grid grid-cols-3 gap-2 text-center lg:text-right">
                    <div className="col-span-1 lg:col-span-1 flex flex-col lg:block bg-black/20 lg:bg-transparent rounded py-1.5 lg:py-0">
                      <span className="lg:hidden text-[9px] font-mono text-cyan-500/50 uppercase mb-0.5">
                        Shares
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {stock.shares}
                      </span>
                    </div>
                    <div className="col-span-1 lg:col-span-1 flex flex-col lg:block bg-black/20 lg:bg-transparent rounded py-1.5 lg:py-0">
                      <span className="lg:hidden text-[9px] font-mono text-cyan-500/50 uppercase mb-0.5">
                        Avg Cost
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        ${stock.avgCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-1 lg:col-span-1 flex flex-col lg:block bg-black/20 lg:bg-transparent rounded py-1.5 lg:py-0">
                      <span className="lg:hidden text-[9px] font-mono text-cyan-500/50 uppercase mb-0.5">
                        Live Price
                      </span>
                      <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-100 transition-colors">
                        ${stock.currentPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* DESKTOP TOTAL EQUITY */}
                  <div className="hidden lg:flex flex-col col-span-2 text-right justify-center">
                    <span className="text-xs font-mono font-bold text-white">
                      $
                      {currentVal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <PercentText val={plPercent} />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="w-full lg:w-auto lg:col-span-3 flex items-center justify-between lg:justify-end gap-1.5 mt-2 lg:mt-0">
                    <button
                      onClick={() => triggerAction("BUY", stock)}
                      className="cursor-pointer flex-1 lg:flex-none px-2 py-1.5 lg:px-4 lg:py-1.5 rounded border font-mono font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all duration-300 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => triggerAction("SELL", stock)}
                      className="cursor-pointer flex-1 lg:flex-none px-2 py-1.5 lg:px-4 lg:py-1.5 rounded border font-mono font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all duration-300 text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <StockActionModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType}
        stock={selectedStock}
      />
    </>
  );
}
