"use client";

import React, { useState, useEffect } from "react";
import { X, Wallet, Loader2, ArrowLeftRight, Info } from "lucide-react";

interface StockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "BUY" | "SELL" | null;
  stock: any | null;
}

export default function StockActionModal({
  isOpen,
  onClose,
  type,
  stock,
}: StockActionModalProps) {
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT" | "STOP">(
    "MARKET",
  );
  const [sharesQuantity, setSharesQuantity] = useState<string>("");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const mockAvailableCash = 14250.75;
  const ownedShares = stock?.shares || 0;

  useEffect(() => {
    if (!isOpen) {
      setSharesQuantity("");
      setTargetPrice("");
      setOrderType("MARKET");
      setIsProcessing(false);
    } else if (stock) {
      setTargetPrice((stock.currentPrice || stock.price || 0).toString());
    }
  }, [isOpen, stock]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !stock || !type) return null;

  const livePrice = stock.currentPrice || stock.price || 0;
  const executionPrice =
    orderType === "MARKET" ? livePrice : parseFloat(targetPrice) || 0;

  const qty = parseFloat(sharesQuantity) || 0;
  const subTotal = qty * executionPrice;

  const brokerageFee = subTotal > 0 ? Math.max(0.5, subTotal * 0.001) : 0;

  const totalCost =
    type === "BUY" ? subTotal + brokerageFee : subTotal - brokerageFee;
  const postTransactionCash =
    type === "BUY"
      ? mockAvailableCash - totalCost
      : mockAvailableCash + totalCost;

  const hasInsufficientFunds = type === "BUY" && totalCost > mockAvailableCash;
  const hasInsufficientShares = type === "SELL" && qty > ownedShares;
  const isPriceInvalid =
    orderType !== "MARKET" && (!targetPrice || parseFloat(targetPrice) <= 0);
  const isDisabled =
    isProcessing ||
    qty <= 0 ||
    hasInsufficientFunds ||
    hasInsufficientShares ||
    isPriceInvalid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl transition-all duration-300 cursor-pointer"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* COMPACT CYBERPUNK TRADING TERMINAL */}
      <div className="relative w-full sm:max-w-md bg-gradient-to-b from-[#0b1b36]/95 to-[#040819] border-t sm:border border-cyan-500/30 sm:border-white/20 rounded-t-[20px] sm:rounded-xl p-4 sm:p-5 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl transition-all transform duration-300 ease-out z-10 max-h-[96vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95">
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

        {/* HEADER EXECUTIV */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border transition-colors duration-300 ${type === "BUY" ? "bg-green-500/10 border-green-500/40 text-green-400" : "bg-red-500/10 border-red-500/40 text-red-400"}`}
            >
              {type} ORDER
            </div>
            <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
              Execution Desk
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 border border-transparent transition-all duration-300 ease-in-out cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* DETALII ACTIV DIRECT DISCRETE */}
        <div className="mb-4 bg-[#051124]/60 border border-white/10 rounded-lg p-3 flex justify-between items-center text-xs font-mono">
          <div>
            <span className="text-white font-bold block text-sm">
              {stock.name}
            </span>
            <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded mt-1 inline-block">
              {stock.symbol}
            </span>
          </div>
          <div className="text-right">
            <span className="text-white/70 block text-[9px] uppercase tracking-wider mb-0.5">
              Live Price
            </span>
            <span className="text-white font-black tabular-nums text-sm">
              ${livePrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* CONTEXT PORTOFOLIU */}
        <div className="mb-5 grid grid-cols-2 gap-2 text-[10px] font-mono text-white/90">
          <div className="flex justify-between items-center p-2.5 rounded-lg bg-black/40 border border-white/10 shadow-inner">
            <span className="uppercase text-[9px] text-white/70">
              Buying Power
            </span>
            <span className="text-white font-bold tabular-nums">
              $
              {mockAvailableCash.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between items-center p-2.5 rounded-lg bg-black/40 border border-white/10 shadow-inner">
            <span className="uppercase text-[9px] text-white/70">Position</span>
            <span className="text-white font-bold tabular-nums">
              {ownedShares} Units
            </span>
          </div>
        </div>

        {/* DYNAMIC OPERATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SELECTOR TIP ORDIN (Fără "sărituri" vizuale) */}
          <div className="grid cursor-pointer grid-cols-3 bg-[#02050f] border border-white/10 rounded-lg p-1">
            {(["MARKET", "LIMIT", "STOP"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={`py-1.5 cursor-pointer text-[9px] uppercase tracking-wider font-mono font-bold rounded-md transition-all duration-300 ease-in-out border ${
                  orderType === t
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                    : "border-transparent text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {t === "STOP" ? "Stop Loss" : t}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {orderType !== "MARKET" && (
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-cyan-300 tracking-wider">
                  {orderType === "LIMIT" ? "LIMIT PRICE" : "TRIGGER PRICE"}
                </span>
                <input
                  type="number"
                  required
                  disabled={isProcessing}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="w-full bg-[#030712]/80 border border-white/10 rounded-lg pl-32 pr-3 py-3 text-sm font-mono font-bold text-white text-right focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300 ease-in-out"
                />
              </div>
            )}

            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-white/70 tracking-wider">
                QUANTITY
              </span>
              <input
                type="number"
                required
                disabled={isProcessing}
                value={sharesQuantity}
                onChange={(e) => setSharesQuantity(e.target.value)}
                placeholder="0.00"
                min="0.001"
                step="any"
                className="w-full bg-[#030712]/80 border border-white/10 rounded-lg pl-32 pr-3 py-3 text-sm font-mono font-bold text-white text-right focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300 ease-in-out"
              />
            </div>
          </div>

          {/* CHIPS SELECTIE RAPIDĂ (Hover lin) */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 25, 50].map((amt) => (
              <button
                key={amt}
                type="button"
                disabled={isProcessing}
                onClick={() => setSharesQuantity(amt.toString())}
                className="py-1.5 cursor-pointer text-center bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-[10px] font-mono font-bold text-white hover:text-cyan-300 rounded-md transition-all duration-300 ease-out transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                +{amt}
              </button>
            ))}
          </div>

          {/* INTERFAȚA MATRICEALĂ DE PREVIEW & TAXE (Culori deschise și clare) */}
          <div className="p-3.5 rounded-lg bg-black/50 border border-white/10 space-y-2.5 font-mono text-[10px] mt-2 shadow-inner">
            <div className="text-white uppercase tracking-widest text-[9px] font-bold border-b border-white/10 pb-2 flex items-center gap-1.5">
              <Info size={12} className="text-cyan-400" /> Pre-Trade Summary
            </div>
            <div className="flex justify-between items-center text-white/90">
              <span>Estimated Value:</span>
              <span className="text-white font-bold tabular-nums">
                $
                {subTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center text-white/90">
              <span>Brokerage Fee:</span>
              <span className="text-yellow-400 font-bold tabular-nums">
                ${brokerageFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-white/90">
              <span>Cash Impact:</span>
              <span
                className={`${type === "BUY" ? "text-red-400" : "text-green-400"} font-black tabular-nums text-[11px]`}
              >
                {type === "BUY" ? "-" : "+"}$
                {totalCost.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="h-[1px] bg-white/10 my-1" />
            <div className="flex justify-between items-center text-white/90">
              <span className="font-bold uppercase tracking-wider text-[9px]">
                Pro-Forma Liquidity:
              </span>
              <span
                className={`${postTransactionCash < 0 ? "text-red-500" : "text-white"} font-black tabular-nums`}
              >
                $
                {postTransactionCash.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {hasInsufficientFunds && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/40 text-red-300 font-mono text-[10px] rounded-lg text-center font-bold tracking-wider">
              INSUFFICIENT BUYING POWER
            </div>
          )}
          {hasInsufficientShares && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/40 text-red-300 font-mono text-[10px] rounded-lg text-center font-bold tracking-wider">
              INSUFFICIENT OWNED UNITS
            </div>
          )}

          {/* CONFIRMARE EXECUTARE (Efect fluid) */}
          <button
            type="submit"
            disabled={isDisabled}
            className={`w-full py-3.5 mt-2 rounded-lg font-mono font-black text-[12px] tracking-widest uppercase text-white transition-all duration-300 ease-in-out active:scale-[0.98] cursor-pointer ${
              type === "BUY"
                ? "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.25)] border border-green-500/30"
                : "bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-[0_4px_20px_rgba(244,63,94,0.25)] border border-red-500/30"
            } disabled:opacity-30 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                TRANSMITTING...
              </span>
            ) : (
              <span>CONFIRM {type} ORDER</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
