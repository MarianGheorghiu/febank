// app/components/ui/cards/TransactionHistory.tsx
"use client";

import React, { useState } from "react";
import {
  Search,
  Trash2,
  CheckSquare,
  Square,
  ShieldAlert,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { CardTransaction } from "@/app/lib/mockCardData";

interface TransactionHistoryProps {
  transactions: CardTransaction[];
  isLoading: boolean;
  onDeleteSelected: (ids: string[]) => void;
  onDeleteAll: () => void;
}

export default function TransactionHistory({
  transactions,
  isLoading,
  onDeleteSelected,
  onDeleteAll,
}: TransactionHistoryProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = transactions.filter(
    (tx) =>
      tx.merchant.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((tx) => tx.id));
    }
  };

  const handleDeleteSelectedClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenim declanșarea selectului din rând accidental
    onDeleteSelected(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="relative bg-[#0a1024] border border-cyan-500/20 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)] flex flex-col h-full font-mono min-h-[615px]">
      {/* Background Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full gap-4">
        {/* ACTIONS TOOLBAR PANEL */}
        <div className="flex flex-col gap-3 pb-4 border-b border-cyan-500/10 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert
                  size={14}
                  className="text-cyan-400 animate-pulse"
                />
                Secure Ledger
              </h3>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mt-0.5">
                Real-time transaction tracking
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleDeleteSelectedClick}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-400 text-rose-400 hover:text-white rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Trash2 size={12} /> PURGE SELECTED ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm("Purge entire card ledger database?"))
                    onDeleteAll();
                }}
                disabled={filtered.length === 0}
                className="px-3 py-1.5 bg-white/5 hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/40 disabled:opacity-20 text-slate-400 hover:text-rose-400 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:active:scale-100"
              >
                PURGE ALL LOGS
              </button>
            </div>
          </div>

          {/* SEARCH & SELECT BAR */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="relative w-full flex-1">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search ledger by target or sector..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#02040f] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[10px] font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
              />
            </div>

            {filtered.length > 0 && (
              <button
                onClick={handleToggleSelectAll}
                className="w-full sm:w-auto px-3 py-2 bg-black/40 border border-white/5 hover:border-cyan-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {selectedIds.length === filtered.length ? (
                  <CheckSquare size={12} className="text-cyan-400" />
                ) : (
                  <Square size={12} className="text-slate-500" />
                )}
                <span className="tracking-wider">
                  BATCH SELECT ({filtered.length})
                </span>
              </button>
            )}
          </div>
        </div>

        {/* LISTA DE TRANZACTII CU SCROLLBAR REFINAT */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[420px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/20 hover:scrollbar-thumb-cyan-500/40">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-black/20 border border-white/5 rounded-lg p-3.5 animate-pulse h-14 w-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-white/5 rounded-lg bg-black/10">
              <Layers size={24} className="text-slate-600 mb-2 stroke-[1.5]" />
              <div className="text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest max-w-[200px]">
                No dynamic datablocks match telemetry.
              </div>
            </div>
          ) : (
            filtered.map((tx) => {
              const isSelected = selectedIds.includes(tx.id);
              const isNegative = tx.amount < 0;

              return (
                <div
                  key={tx.id}
                  onClick={() => handleToggleSelectOne(tx.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/5 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                      : "bg-black/30 border-white/[0.04] hover:border-cyan-500/20 hover:bg-cyan-950/5"
                  }`}
                >
                  {/* Left Side: Checkbox & Meta */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 transition-transform duration-200 active:scale-90">
                      {isSelected ? (
                        <CheckSquare size={14} className="text-cyan-400" />
                      ) : (
                        <Square
                          size={14}
                          className="text-slate-600 group-hover:text-slate-500"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate uppercase tracking-wide">
                        {tx.merchant}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-500 font-mono tracking-wider">
                        <span>{tx.date}</span>
                        <span className="text-slate-700">•</span>
                        <span className="text-slate-400 px-1 py-0.5 rounded bg-white/5 border border-white/[0.03]">
                          {tx.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Pricing & Badges */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`text-xs font-bold tracking-tight tabular-nums block ${
                        isNegative ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isNegative ? "-" : "+"}$
                      {Math.abs(tx.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>

                    {/* Premium Status Badge */}
                    <span
                      className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-sm border ${
                        tx.status?.toLowerCase() === "completed" ||
                        tx.status?.toLowerCase() === "success"
                          ? "bg-emerald-500/5 text-emerald-400/80 border-emerald-500/10"
                          : tx.status?.toLowerCase() === "pending"
                            ? "bg-amber-500/5 text-amber-400/80 border-amber-500/10"
                            : "bg-slate-500/5 text-slate-400/80 border-white/5"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
