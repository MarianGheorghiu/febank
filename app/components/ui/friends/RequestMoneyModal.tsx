"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, FileText, HandCoins } from "lucide-react";

interface FriendData {
  id: string;
  name: string;
  username: string;
}

interface RequestMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: FriendData | null;
}

export default function RequestMoneyModal({
  isOpen,
  onClose,
  friend,
}: RequestMoneyModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setReason("");
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

  if (!isOpen || !friend) return null;

  const total = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300">
      <div
        className="absolute inset-0 bg-[#020617]/70 backdrop-blur-xl transition-all duration-300 cursor-pointer"
        onClick={!isProcessing ? onClose : undefined}
      />

      <div
        className={`
          relative w-full sm:max-w-md 
          bg-gradient-to-b from-[#0b221d]/80 to-[#040f0c]/95 
          border-t sm:border border-emerald-500/20 sm:border-white/10
          rounded-t-[24px] sm:rounded-2xl 
          p-6 sm:p-8
          shadow-[0_0_50px_rgba(16,185,129,0.15)] 
          backdrop-blur-2xl
          transition-all transform duration-300 ease-out
          z-10 max-h-[92vh] overflow-y-auto
          animate-in slide-in-from-bottom sm:zoom-in-95
        `}
      >
        <div className="w-12 h-1 bg-emerald-500/20 rounded-full mx-auto mb-6 sm:hidden" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
              <HandCoins size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase">
                Request Funds
              </h3>
              <p className="text-[10px] text-emerald-400/60 font-mono tracking-wide uppercase">
                Inbound Invoice Protocol
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 bg-[#061410]/60 border border-emerald-500/10 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs text-emerald-300 shrink-0">
              {friend.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold font-mono text-emerald-400/70 uppercase tracking-wider">
                REQUESTING FROM
              </span>
              <span className="text-xs font-black text-white truncate block">
                {friend.name}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-[#020705] border border-white/5 px-2 py-0.5 rounded">
            {friend.username}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
              Requested Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-mono font-black text-slate-500 group-focus-within:text-emerald-400 transition-colors">
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
                className="w-full bg-[#030a08]/80 border border-emerald-500/20 focus:border-emerald-500/50 rounded-xl pl-9 pr-4 py-3 text-base font-mono font-bold text-white placeholder-slate-700 focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
              Reason / Context
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <FileText size={14} />
              </span>
              <input
                type="text"
                required
                disabled={isProcessing}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Concert Tickets, Rent"
                className="w-full bg-[#030a08]/80 border border-emerald-500/20 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-700 focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
              />
            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent my-1" />

          <button
            type="submit"
            disabled={isProcessing || total <= 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-[0_4px_25px_rgba(16,185,129,0.25)] font-mono font-black text-xs tracking-widest uppercase text-white transition-all duration-300 active:scale-[0.99] disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                DISPATCHING INVOICE...
              </span>
            ) : (
              <span>SEND REQUEST</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
