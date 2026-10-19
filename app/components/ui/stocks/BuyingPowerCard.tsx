"use client";
import { useTradingPortfolio } from "@/app/lib/markets/projections";

import TransferModal from "../dashboard/TransferModal";
import React, { useState } from "react";
import {
  Wallet,
  ShieldCheck,
  Briefcase,
  Activity,
  Search,
} from "lucide-react";


export default function BuyingPowerCard() {
  const { cashUsd: cashBalance, holdings: MOCK_STOCK_HOLDINGS } = useTradingPortfolio();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalAction, setModalAction] = useState<"DEPOSIT" | "WITHDRAW" | null>(
    null,
  );

  // Sortăm portofoliul după valoarea totală a poziției (descrescător)
  const sortedHoldings = [...MOCK_STOCK_HOLDINGS].sort(
    (a, b) => b.shares * b.currentPrice - a.shares * a.currentPrice,
  );

  // Filtrăm după text
  const filteredHoldings = sortedHoldings.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalStockValue = sortedHoldings.reduce(
    (acc, stock) => acc + stock.shares * stock.currentPrice,
    0,
  );
  const totalPortfolioValue = totalStockValue + cashBalance;

  return (
    <>
      <div className="relative bg-[#0a1024] border border-cyan-500/30 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-full font-mono min-h-[450px]">
        {/* Glow Background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full gap-4">
          {/* HEADER */}
          <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
            <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <Briefcase size={14} />
              Portfolio Overview
            </h2>
            <div className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded font-bold tracking-widest">
              <ShieldCheck size={10} /> PROTECTED
            </div>
          </div>

          {/* BUYING POWER & TOTAL VALUE */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3 rounded-lg bg-[#020512]/80 border border-cyan-500/10 shadow-inner flex flex-col justify-center">
              <span className="text-[9px] text-cyan-400/70 font-bold tracking-wider uppercase mb-1 flex items-center gap-1">
                <Wallet size={10} /> BUYING POWER
              </span>
              <span className="text-lg sm:text-xl font-black text-white tracking-tight tabular-nums">
                $
                {cashBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#020512]/60 border border-white/[0.03] flex flex-col justify-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1 flex items-center gap-1">
                <Activity size={10} /> TOTAL ASSETS
              </span>
              <span className="text-lg sm:text-xl font-black text-cyan-400 tabular-nums">
                $
                {totalPortfolioValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* OWNED ASSETS LIST W/ SEARCH */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2 px-1 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Allocations ({filteredHoldings.length})
              </span>
            </div>

            {/* SEARCH BAR */}
            <div className="relative mb-3 shrink-0">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#02040f] border border-white/10 rounded-md pl-7 pr-3 py-1.5 text-[10px] font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredHoldings.length === 0 ? (
                <div className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest">
                  No assets found
                </div>
              ) : (
                filteredHoldings.map((stock) => {
                  const value = stock.shares * stock.currentPrice;
                  const allocation = (value / totalStockValue) * 100;

                  return (
                    <div
                      key={stock.symbol}
                      className="bg-black/40 border border-white/5 rounded-lg p-3 flex flex-col gap-2 hover:border-cyan-500/30 hover:bg-cyan-950/10 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">
                            {stock.symbol}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                            {stock.shares} Units
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-cyan-400 tabular-nums block">
                            $
                            {value.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="w-full flex items-center gap-2">
                        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: `${allocation}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 w-8 text-right tabular-nums">
                          {allocation.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* QUICK TRANSFER INTERFACE */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-cyan-500/10 shrink-0">
            <button
              onClick={() => setModalAction("DEPOSIT")}
              className="cursor-pointer py-2.5 px-2 rounded-lg border font-black text-[10px] uppercase tracking-widest transition-all duration-300 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black"
            >
              DEPOSIT FUNDS
            </button>
            <button
              onClick={() => setModalAction("WITHDRAW")}
              className="cursor-pointer py-2.5 px-2 rounded-lg border font-black text-[10px] uppercase tracking-widest transition-all duration-300 text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white hover:border-rose-500"
            >
              WITHDRAW
            </button>
          </div>
        </div>
      </div>

      {modalAction && <TransferModal
        isOpen={modalAction !== null}
        onClose={() => setModalAction(null)}
        type={modalAction === "DEPOSIT" ? "deposit" : "withdraw"}
      />}
    </>
  );
}
