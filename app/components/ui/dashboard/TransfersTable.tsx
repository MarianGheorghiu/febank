"use client";

import CardSurface from "@/app/components/ui/CardSurface";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Layers,
  ChevronDown,
} from "lucide-react";
import FilterControls from "./FilterControls";
import { filterTransactions, formatDate } from "@/app/lib/overview/engine";
import type { TransferPeriod, TransferTransaction } from "@/app/lib/types/dashboard";

const periodOptions: { value: TransferPeriod; label: string }[] = [
  { value: "1D", label: "Today" },
  { value: "3D", label: "3 Days" },
  { value: "1W", label: "1 Week" },
  { value: "2W", label: "2 Weeks" },
  { value: "1M", label: "1 Month" },
  { value: "3M", label: "3 Months" },
  { value: "6M", label: "6 Months" },
  { value: "1Y", label: "1 Year" },
];

export default function TransfersTable({ transactions, asOf }: { transactions: TransferTransaction[]; asOf: string }) {
  const [period, setPeriod] = useState<TransferPeriod>("1M");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentTransfers = useMemo(() => filterTransactions(transactions, period, asOf), [transactions, period, asOf]);
  const currentLabel =
    periodOptions.find((p) => p.value === period)?.label || period;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setIsDropdownOpen(false); };
    document.addEventListener("keydown", escape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); document.removeEventListener("keydown", escape); };
  }, []);

  const filteredTransfers = useMemo(() => {
    return currentTransfers.filter((tx) => {
      const matchQuery = searchQuery.toLowerCase();
      const matchesSearch =
        tx.reference.toLowerCase().includes(matchQuery) ||
        tx.amount.toString().includes(matchQuery) ||
        tx.currency.toLowerCase().includes(matchQuery) ||
        tx.type.toLowerCase().includes(matchQuery);

      const matchesStatus = selectedStatus
        ? tx.status === selectedStatus
        : true;
      return matchesSearch && matchesStatus;
    });
  }, [currentTransfers, searchQuery, selectedStatus]);

  const getTxDetails = (type: TransferTransaction["type"]) => {
    switch (type) {
      case "DEPOSIT":
        return {
          icon: <ArrowDownLeft size={15} className="text-emerald-400" />,
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        };
      case "WITHDRAW":
        return {
          icon: <ArrowUpRight size={15} className="text-rose-400" />,
          bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        };
      case "TRANSFER":
        return {
          icon: <RefreshCw size={13} className="text-blue-400" />,
          bg: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        };
      case "LOAN":
        return {
          icon: <Layers size={13} className="text-amber-400" />,
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        };
    }
  };

  const getStatusStyle = (status: TransferTransaction["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "PENDING":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse";
      case "CANCELLED":
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
      case "FAILED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    }
  };

  const statuses = ["ALL", "COMPLETED", "PENDING", "FAILED", "CANCELLED"];

  return (
    <CardSurface tone="blue" className="p-3 sm:p-5 flex flex-col overflow-hidden h-[430px]">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 shrink-0 z-20 gap-2">
        <div>
          <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-[0.12em] sm:tracking-[0.15em] block">
            Core Ledger
          </span>
          <h2 className="text-xs sm:text-sm font-black font-mono text-white uppercase tracking-tight mt-0.5">
            Activity Log
          </h2>
        </div>

        {/* TIME DROPDOWN */}
        <div
          ref={dropdownRef}
          className="relative inline-flex items-center shrink-0 w-[105px] sm:w-[120px]"
        >
          <button
            type="button"
            aria-expanded={isDropdownOpen}
            aria-label="Filter activity by period"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full bg-[#070b14] text-white font-mono text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 min-h-11 py-1.5 rounded-md border border-zinc-700 hover:border-cyan-400 transition-all cursor-pointer outline-none select-none text-left"
          >
            {currentLabel}
          </button>
          <ChevronDown
            size={13}
            className={`absolute right-2.5 text-cyan-400 pointer-events-none transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
          />

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-full bg-[#070b14] border border-zinc-700 rounded-md shadow-2xl overflow-hidden z-50 p-1 space-y-0.5">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setPeriod(opt.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left font-mono text-[11px] sm:text-xs px-2 min-h-9 py-1 rounded transition-all select-none cursor-pointer ${period === opt.value ? "bg-cyan-500 text-[#02040f] font-black" : "text-zinc-400 hover:text-white"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <FilterControls query={searchQuery} onQueryChange={setSearchQuery} label="Search ledger" options={statuses} selected={selectedStatus} onSelect={setSelectedStatus} />

      {/* TRANSACTIONS LIST */}
      <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 z-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {filteredTransfers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center font-mono py-12 bg-[#111a36]/50 rounded-lg border border-dashed border-zinc-800 p-4">
            <span className="text-zinc-400 text-xs">No transactions match these filters</span>
          </div>
        ) : (
          filteredTransfers.map((tx) => {
            const txStyle = getTxDetails(tx.type);
            const isPositive = tx.direction ? tx.direction === "incoming" : tx.type === "DEPOSIT" || tx.type === "LOAN";

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-[#111a36] border border-white/[0.05] hover:bg-[#162246] hover:border-cyan-500/60 transition-all duration-200 gap-2 sm:gap-4 group/row"
              >
                {/* STÂNGA */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded border flex items-center justify-center shrink-0 shadow-inner transition-all duration-200 ${txStyle?.bg}`}
                  >
                    {txStyle?.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-mono text-white tracking-tight truncate group-hover/row:text-cyan-300 transition-colors">
                      {tx.reference}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] font-mono text-zinc-400 mt-0.5">
                      {formatDate(tx.occurred_at)}
                    </p>
                  </div>
                </div>

                {/* DREAPTA */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="flex flex-col items-end text-right min-w-[75px] sm:min-w-[90px]">
                    <span
                      className={`font-mono text-xs sm:text-sm font-black tracking-tight tabular-nums ${isPositive ? "text-emerald-400" : "text-white"}`}
                    >
                      {isPositive ? "+" : "-"}
                      {Number(tx.amount).toLocaleString("en-US", { minimumFractionDigits: tx.currency === "BTC" ? 0 : 2, maximumFractionDigits: tx.currency === "BTC" ? 8 : 2 })}
                      <span className="text-[8px] sm:text-[9px] text-zinc-500 font-bold ml-0.5 uppercase">
                        {tx.currency}
                      </span>
                    </span>
                    <span
                      className={`text-[7px] sm:text-[8px] font-mono font-bold tracking-wider uppercase px-1 sm:px-1.5 py-0.5 mt-0.5 rounded border text-center ${getStatusStyle(tx.status)}`}
                    >
                      {tx.status === "FAILED" ? "DECLINED" : tx.status}
                    </span>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-[#0d1527] to-transparent pointer-events-none z-20" />
    </CardSurface>
  );
}
