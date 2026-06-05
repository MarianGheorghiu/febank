"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  Activity,
  ArrowRightLeft,
} from "lucide-react";

export type TradeType = "BUY" | "SELL" | "SWAP" | null;

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
}

interface CryptoActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TradeType;
  asset: CryptoAsset | null;
}

export default function CryptoActionModal({
  isOpen,
  onClose,
  type,
  asset,
}: CryptoActionModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [swapTarget, setSwapTarget] = useState<string>("USDT");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setIsProcessing(false);
    }
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !asset || !type) return null;

  const total = parseFloat(amount) || 0;

  // CONFIGURARE TEMĂ CYBERPUNK BAZATĂ PE ACȚIUNE
  const theme = {
    BUY: {
      bg: "from-[#02120a]/95 to-[#010805]/95",
      border: "border-emerald-500/30",
      glow: "shadow-[0_0_40px_rgba(16,185,129,0.15)]",
      icon: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      btn: "bg-emerald-500 hover:bg-emerald-400 text-black",
      text: "text-emerald-400",
      inputFocus:
        "focus:border-emerald-500/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
      title: "EXECUTE BUY ORDER",
    },
    SELL: {
      bg: "from-[#120205]/95 to-[#080102]/95",
      border: "border-rose-500/30",
      glow: "shadow-[0_0_40px_rgba(244,63,94,0.15)]",
      icon: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      btn: "bg-rose-500 hover:bg-rose-400 text-white",
      text: "text-rose-400",
      inputFocus:
        "focus:border-rose-500/50 focus:shadow-[0_0_20px_rgba(244,63,94,0.1)]",
      title: "EXECUTE SELL ORDER",
    },
    SWAP: {
      bg: "from-[#0f0212]/95 to-[#050108]/95",
      border: "border-fuchsia-500/30",
      glow: "shadow-[0_0_40px_rgba(217,70,239,0.15)]",
      icon: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
      btn: "bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white",
      text: "text-fuchsia-400",
      inputFocus:
        "focus:border-fuchsia-500/50 focus:shadow-[0_0_20px_rgba(217,70,239,0.1)]",
      title: "ATOMIC SWAP",
    },
  }[type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* OVERLAY MATTED */}
      <div
        className="absolute inset-0 bg-[#000000]/80 backdrop-blur-md transition-all cursor-pointer"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* MODAL CONTAINER */}
      <div
        className={`relative w-full sm:max-w-md bg-gradient-to-b ${theme.bg} border-t sm:border ${theme.border} rounded-t-[24px] sm:rounded-xl p-6 sm:p-8 ${theme.glow} backdrop-blur-3xl transition-all z-10 animate-in slide-in-from-bottom-8 sm:zoom-in-95`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg border flex items-center justify-center ${theme.icon}`}
            >
              {type === "BUY" && <ArrowDownToLine size={20} />}
              {type === "SELL" && <ArrowUpFromLine size={20} />}
              {type === "SWAP" && <RefreshCcw size={20} />}
            </div>
            <div>
              <h3
                className={`text-sm font-black font-mono tracking-widest uppercase ${theme.text}`}
              >
                {theme.title}
              </h3>
              <p className="text-[10px] font-mono tracking-wider uppercase text-white/40">
                Encrypted Connection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ASSET SELECTOR / INFO BOX */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-zinc-900 border border-white/10 flex items-center justify-center font-mono font-bold text-white shrink-0">
                {asset.symbol[0]}
              </div>
              <div>
                <span className="block text-xs font-black text-white tracking-wider">
                  {asset.symbol}
                </span>
                <span className="block text-[10px] font-mono text-white/50">
                  {asset.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-mono text-white/40 uppercase mb-0.5">
                Market Price
              </span>
              <span className="text-sm font-mono font-bold text-white">
                ${asset.price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* INPUT AMOUNT */}
          <div className="space-y-2">
            <label className="flex justify-between text-[10px] font-bold font-mono text-white/50 uppercase tracking-widest">
              <span>Amount ({type === "SWAP" ? asset.symbol : "USD"})</span>
              <span className="text-white/30">Balance: --</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                disabled={isProcessing}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="any"
                className={`w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-lg font-mono font-black text-white placeholder-white/20 focus:outline-none transition-all duration-300 ${theme.inputFocus}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-white/40">
                {type === "SWAP" ? asset.symbol : "USD"}
              </span>
            </div>

            {/* CALCUL CONVERSIE */}
            {total > 0 && type !== "SWAP" && (
              <div
                className={`text-[10px] font-mono text-right mt-2 ${theme.text}`}
              >
                ≈ {(total / asset.price).toFixed(6)} {asset.symbol}
              </div>
            )}
          </div>

          {/* SWAP SPECIFIC UI - TARGET ASSET */}
          {type === "SWAP" && (
            <>
              <div className="flex justify-center -my-2 relative z-10">
                <div
                  className={`p-2 rounded-full bg-[#050108] border ${theme.border} ${theme.text}`}
                >
                  <ArrowRightLeft size={16} className="rotate-90" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold font-mono text-white/50 uppercase tracking-widest">
                  Receive Asset
                </label>
                <select
                  value={swapTarget}
                  onChange={(e) => setSwapTarget(e.target.value)}
                  className={`w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-sm font-mono font-bold text-white focus:outline-none appearance-none transition-all ${theme.inputFocus}`}
                >
                  <option value="USDT">USDT - Tether USD</option>
                  <option value="ETH">ETH - Ethereum</option>
                  <option value="SOL">SOL - Solana</option>
                </select>
                {total > 0 && (
                  <div
                    className={`text-[10px] font-mono text-right mt-2 ${theme.text}`}
                  >
                    Estimated Output: ≈ {(total * 1.02).toFixed(4)} {swapTarget}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing || total <= 0}
              className={`w-full py-4 rounded-xl font-mono font-black text-sm tracking-widest uppercase transition-all duration-300 active:scale-[0.98] disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer shadow-lg ${theme.btn}`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  INITIATING CONTRACT...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Activity size={16} />
                  CONFIRM {type}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
