"use client";

import React, { useState, useRef, useEffect } from "react";
import GlassCard from "./GlassCard";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Layers,
  ChevronDown,
} from "lucide-react";
import {
  transfersHistoryData,
  TransferPeriod,
  TransferTransaction,
} from "@/app/lib/mockData";

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

export default function TransfersTable() {
  const [period, setPeriod] = useState<TransferPeriod>("1M");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTransfers = transfersHistoryData[period] || [];
  const currentLabel =
    periodOptions.find((p) => p.value === period)?.label || period;

  // Închide dropdown-ul la click în exterior
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

  const getTxDetails = (type: TransferTransaction["type"]) => {
    switch (type) {
      case "DEPOSIT":
        return {
          icon: <ArrowDownLeft size={16} className="text-emerald-400" />,
          bg: "bg-emerald-500/10 border-emerald-500/15",
        };
      case "WITHDRAW":
        return {
          icon: <ArrowUpRight size={16} className="text-rose-400" />,
          bg: "bg-rose-500/10 border-rose-500/15",
        };
      case "TRANSFER":
        return {
          icon: <RefreshCw size={14} className="text-blue-400" />,
          bg: "bg-blue-500/10 border-blue-500/15",
        };
      case "LOAN":
        return {
          icon: <Layers size={14} className="text-amber-400" />,
          bg: "bg-amber-500/10 border-amber-500/15",
        };
    }
  };

  const getStatusStyle = (status: TransferTransaction["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "text-emerald-400/80";
      case "PENDING":
        return "text-amber-400/80 animate-pulse";
      case "FAILED":
        return "text-rose-400/80";
    }
  };

  return (
    <GlassCard className="!p-6 flex flex-col border border-white/[0.06] bg-[#060913]/60 backdrop-blur-3xl rounded-[2rem] relative overflow-hidden h-[440px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] hover:border-white/[0.1] transition-all duration-500">
      {/* Glow ambiental intern */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-500/[0.03] rounded-full blur-3xl pointer-events-none transition-all duration-700" />

      {/* HEADER COMPONENT */}
      <div className="flex items-center justify-between mb-6 z-20 shrink-0 gap-4">
        <div className="min-w-0">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-[0.2em] block">
            Core Ledger
          </span>
          <h2 className="text-base font-bold font-sans text-white tracking-tight mt-0.5">
            Activity Log
          </h2>
        </div>

        {/* COMPACT SELECT ROYAL BLUE */}
        <div
          ref={dropdownRef}
          className="relative inline-flex items-center shrink-0 mr-[15px] w-[105px]"
        >
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full bg-blue-950/20 hover:bg-blue-900/30 text-white font-mono text-xs font-bold pl-2.5 pr-6 py-2 rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all cursor-pointer outline-none shadow-[0_0_15px_rgba(37,99,235,0.05)] text-left select-none"
          >
            {currentLabel}
          </button>
          <ChevronDown
            size={13}
            className={`absolute right-2 text-blue-400 pointer-events-none transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180 text-blue-300" : ""
            }`}
          />

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-0.5 w-full bg-[#090d1a] border border-blue-500/30 rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85),0_0_20px_rgba(37,99,235,0.1)] overflow-hidden z-50 p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {periodOptions.map((opt) => {
                const isSelected = period === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setPeriod(opt.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left font-mono text-xs px-2 py-1.5 rounded-lg transition-all duration-150 block select-none ${
                      isSelected
                        ? "bg-blue-600 text-white font-bold shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        : "text-zinc-400 hover:text-blue-300 hover:bg-blue-600/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* LISTA DE TRANZACȚII - ANTI-COLLISION GRIDS */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 z-10 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {currentTransfers.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-bold">
              No records found
            </span>
          </div>
        ) : (
          currentTransfers.map((tx) => {
            const txStyle = getTxDetails(tx.type);
            const isPositive = tx.type === "DEPOSIT" || tx.type === "LOAN";

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.02] hover:border-white/[0.07] hover:scale-[1.005] transition-all duration-300 gap-4"
              >
                {/* COLOANA STÂNGA */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${txStyle?.bg}`}
                  >
                    {txStyle?.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold font-sans text-white tracking-tight whitespace-normal leading-tight break-words">
                      {tx.reference}
                    </h4>
                    <p className="text-[11px] font-mono text-zinc-400 font-medium mt-1">
                      {tx.date}
                    </p>
                  </div>
                </div>

                {/* COLOANA DREAPTA */}
                <div className="flex flex-col items-end shrink-0 text-right min-w-[90px] pl-1">
                  <span
                    className={`font-mono text-sm font-black tracking-tight tabular-nums ${
                      isPositive ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {isPositive ? "+" : "-"}
                    {tx.amount}
                    <span className="text-[10px] text-zinc-500 font-black ml-1 uppercase">
                      {tx.currency}
                    </span>
                  </span>

                  <span
                    className={`text-[9px] font-mono font-black tracking-wider uppercase mt-1 flex items-center gap-1.5 ${getStatusStyle(tx.status)}`}
                  >
                    <span className="text-[7px]">●</span> {tx.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MASCĂ PREMIUM GRADIENT PENTRU EFFECTUL DE SCROLL SUB STICLĂ */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#04060d] via-[#04060d]/90 to-transparent pointer-events-none z-20 rounded-b-[2rem]" />
    </GlassCard>
  );
}
