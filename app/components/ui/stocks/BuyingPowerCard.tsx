"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  ShieldCheck,
  Briefcase,
  Activity,
  Search,
  X,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { MOCK_STOCK_HOLDINGS } from "@/app/lib/mockStockData";

// ==========================================
// 1. MODAL PENTRU DEPUNERE / RETRAGERE
// ==========================================
interface FundsActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "DEPOSIT" | "WITHDRAW" | null;
  currentBalance: number;
}

function FundsActionModal({
  isOpen,
  onClose,
  type,
  currentBalance,
}: FundsActionModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setIsProcessing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !type) return null;

  const numAmount = parseFloat(amount) || 0;
  const isWithdraw = type === "WITHDRAW";
  const hasInsufficientFunds = isWithdraw && numAmount > currentBalance;

  const projectedBalance = isWithdraw
    ? currentBalance - numAmount
    : currentBalance + numAmount;

  const quickAmounts = [100, 500, 1000, isWithdraw ? currentBalance : 5000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount <= 0 || hasInsufficientFunds) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
      <div
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl transition-all duration-300 cursor-pointer"
        onClick={!isProcessing ? onClose : undefined}
      />

      <div className="relative w-full sm:max-w-sm bg-gradient-to-b from-[#0b1b36]/95 to-[#040819] border-t sm:border border-cyan-500/30 sm:border-white/20 rounded-t-[20px] sm:rounded-xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl transition-all transform duration-300 ease-out z-10 animate-in slide-in-from-bottom sm:zoom-in-95">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

        {/* HEADER */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg border ${!isWithdraw ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-rose-500/10 border-rose-500/40 text-rose-400"}`}
            >
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
                {type} FUNDS
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Liquidity Transfer
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BALANCE INFO */}
        <div className="mb-5 flex justify-between items-center p-3 rounded-lg bg-black/40 border border-white/10 shadow-inner">
          <span className="uppercase font-mono text-[10px] text-white/70 font-bold">
            Available Cash
          </span>
          <span className="text-white font-mono font-bold tabular-nums">
            $
            {currentBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-mono font-bold text-white/50">
              $
            </span>
            <input
              type="number"
              required
              disabled={isProcessing}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="any"
              className="w-full bg-[#030712]/80 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-xl font-mono font-bold text-white text-right focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
            />
          </div>

          {/* QUICK CHIPS */}
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isProcessing}
                onClick={() => setAmount(amt.toString())}
                className="py-1.5 text-center bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-[10px] font-mono font-bold text-white hover:text-cyan-300 rounded-md transition-all active:scale-95 cursor-pointer"
              >
                {isWithdraw && idx === 3 ? "MAX" : `+$${amt}`}
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-white/10 my-2" />

          {/* PREVIEW */}
          <div className="flex justify-between items-center text-white/90 font-mono text-[10px] px-1">
            <span className="uppercase font-bold tracking-wider">
              Projected Balance:
            </span>
            <span
              className={`${projectedBalance < 0 ? "text-rose-500" : "text-cyan-400"} font-black tabular-nums text-xs`}
            >
              $
              {projectedBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {hasInsufficientFunds && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 font-mono text-[10px] rounded-lg text-center font-bold tracking-wider uppercase">
              Insufficient Funds for Withdrawal
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isProcessing || numAmount <= 0 || hasInsufficientFunds}
            className={`w-full py-3.5 rounded-lg font-mono font-black text-[11px] tracking-widest uppercase text-white transition-all active:scale-[0.98] cursor-pointer ${
              !isWithdraw
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_4px_20px_rgba(16,185,129,0.2)] border border-emerald-500/30"
                : "bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 shadow-[0_4px_20px_rgba(244,63,94,0.2)] border border-rose-500/30"
            } disabled:opacity-30 disabled:active:scale-100 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> PROCESSING...
              </span>
            ) : (
              <span>CONFIRM {type}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. COMPONENTA PRINCIPALĂ BUYING POWER
// ==========================================
export default function BuyingPowerCard() {
  const cashBalance = 14250.75;
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

      <FundsActionModal
        isOpen={modalAction !== null}
        onClose={() => setModalAction(null)}
        type={modalAction}
        currentBalance={cashBalance}
      />
    </>
  );
}
