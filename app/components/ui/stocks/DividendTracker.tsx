"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  ChevronRight,
  Coins,
  Search,
  X,
} from "lucide-react";

// Mock Data pentru Dividende
const MOCK_DIVIDENDS = [
  {
    id: 1,
    symbol: "KO",
    company: "Coca-Cola Co.",
    exDate: "2026-06-01",
    payDate: "2026-06-15",
    amountPerShare: 0.485,
    sharesOwned: 50,
    status: "PENDING",
  },
  {
    id: 2,
    symbol: "AAPL",
    company: "Apple Inc.",
    exDate: "2026-06-10",
    payDate: "2026-06-22",
    amountPerShare: 0.25,
    sharesOwned: 15,
    status: "UPCOMING",
  },
  {
    id: 3,
    symbol: "XOM",
    company: "Exxon Mobil",
    exDate: "2026-06-20",
    payDate: "2026-07-05",
    amountPerShare: 0.95,
    sharesOwned: 120,
    status: "UPCOMING",
  },
  {
    id: 4,
    symbol: "PFE",
    company: "Pfizer Inc.",
    exDate: "2026-05-10",
    payDate: "2026-06-01",
    amountPerShare: 0.42,
    sharesOwned: 210,
    status: "PAID",
  },
];

export default function DividendTracker() {
  const [searchQuery, setSearchQuery] = useState("");

  // Statisticile globale se calculează pe baza întregului set de date
  const pendingDividends = MOCK_DIVIDENDS.filter((d) => d.status !== "PAID");
  const totalUpcoming = pendingDividends.reduce(
    (acc, curr) => acc + curr.amountPerShare * curr.sharesOwned,
    0,
  );
  const earnedYTD =
    342.5 +
    MOCK_DIVIDENDS.filter((d) => d.status === "PAID").reduce(
      (acc, curr) => acc + curr.amountPerShare * curr.sharesOwned,
      0,
    );

  // Filtrarea listei în funcție de input-ul utilizatorului
  const filteredDividends = MOCK_DIVIDENDS.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative bg-[#0a1024] border border-cyan-500/30 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] flex flex-col h-full font-mono min-h-[440px]">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full gap-4">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <CalendarDays size={14} />
            Dividend Tracker
          </h2>
          <div className="flex items-center gap-1 text-[9px] text-purple-400 bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded font-bold tracking-widest uppercase">
            <Coins size={10} /> Passive Income
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="p-3 rounded-lg bg-gradient-to-br from-[#020512]/80 to-[#051124] border border-cyan-500/10 shadow-inner flex flex-col justify-center">
            <span className="text-[9px] text-cyan-400/70 font-bold tracking-wider uppercase mb-1 flex items-center gap-1">
              <Clock size={10} /> EST. UPCOMING (30D)
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight tabular-nums">
              +$
              {totalUpcoming.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#020512]/60 border border-white/[0.03] flex flex-col justify-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1 flex items-center gap-1">
              <CheckCircle2 size={10} /> EARNED YTD
            </span>
            <span className="text-lg sm:text-xl font-black text-white tabular-nums">
              ${earnedYTD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative group shrink-0">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
          />
          <input
            type="text"
            placeholder="Filter assets or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-cyan-500/20 rounded pl-8 pr-7 py-1.5 text-[10px] font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_10px_rgba(34,211,238,0.1)] transition-all uppercase tracking-wider"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* TIMELINE LIST */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Payment Schedule</span>
            {searchQuery && (
              <span className="text-cyan-400 text-[9px] lowercase font-normal">
                found {filteredDividends.length} matches
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredDividends.length > 0 ? (
              filteredDividends.map((item) => {
                const totalPayout = item.amountPerShare * item.sharesOwned;
                const isPaid = item.status === "PAID";
                const isPending = item.status === "PENDING";

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-between ${isPaid ? "bg-black/20 border-white/5 opacity-60" : "bg-black/40 border-cyan-500/10 hover:bg-cyan-950/10 hover:border-cyan-500/30"}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Data / Status Icon */}
                      <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-[#02040f] border border-white/5 shrink-0">
                        {isPaid ? (
                          <CheckCircle2 size={16} className="text-slate-500" />
                        ) : (
                          <>
                            <span className="text-[8px] text-slate-400 uppercase font-bold">
                              {new Date(item.payDate).toLocaleString(
                                "default",
                                {
                                  month: "short",
                                },
                              )}
                            </span>
                            <span className="text-xs font-black text-white leading-none">
                              {new Date(item.payDate).getDate()}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          {item.symbol}
                          {isPending && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1 rounded uppercase tracking-wider">
                              Processing
                            </span>
                          )}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {item.sharesOwned} shares @ ${item.amountPerShare}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span
                        className={`text-sm font-black tabular-nums ${isPaid ? "text-slate-400" : "text-emerald-400"}`}
                      >
                        +${totalPayout.toFixed(2)}
                      </span>
                      <span className="text-[8px] text-slate-500 uppercase flex items-center gap-1">
                        Details <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-600 border border-dashed border-slate-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  No dividends match filter
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
