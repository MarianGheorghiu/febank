"use client";

import React, { useState, useEffect } from "react";
import { X, Wallet, ArrowLeftRight, Loader2, Phone, User } from "lucide-react";
import { Friend } from "@/app/lib/mockFriends"; // Presupunând că ai tipul definit aici

interface QuickFriendTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend | null; // Aici primim obiectul prieten complet direct
}

export default function QuickFriendTransferModal({
  isOpen,
  onClose,
  friend,
}: QuickFriendTransferModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const mockBalance = 48250.75;
  const quickAmounts = [10, 20, 50, 100]; // Sume mai mici, specifice transferurilor rapide între prieteni

  // Resetăm starea la închidere/deschidere
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Blocăm scroll-ul pe fundal
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !friend) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300">
      {/* BACKDROP CLOUD GLASS */}
      <div
        className="absolute inset-0 bg-[#020617]/70 backdrop-blur-xl transition-all duration-300 cursor-pointer"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* LIQUID GLASS MODAL BOX - Stilzat cu accent pe Cyan/Transfer Rapid */}
      <div
        className={`
        relative w-full sm:max-w-md 
        bg-gradient-to-b from-[#0b1b36]/80 to-[#040819]/95 
        border-t sm:border border-cyan-500/20 sm:border-white/10
        rounded-t-[24px] sm:rounded-2xl 
        p-6 sm:p-8
        shadow-[0_0_50px_rgba(6,182,212,0.15)] 
        backdrop-blur-2xl
        transition-all transform duration-300 ease-out
        z-10 max-h-[92vh] overflow-y-auto
        animate-in slide-in-from-bottom sm:zoom-in-95
      `}
      >
        {/* Mobile Handle */}
        <div className="w-12 h-1 bg-cyan-500/20 rounded-full mx-auto mb-6 sm:hidden" />

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border bg-cyan-500/10 border-cyan-500/20 text-cyan-400">
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase">
                Quick P2P Send
              </h3>
              <p className="text-[10px] text-cyan-400/60 font-mono tracking-wide uppercase">
                Direct Contact Transfer
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

        {/* RECIPIENT AUTO-FILL INFO BOX */}
        <div className="mb-5 bg-[#051124]/60 border border-cyan-500/10 rounded-xl p-3.5 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-sm text-cyan-300 shrink-0">
              {friend.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-bold font-mono text-cyan-400/70 uppercase tracking-wider mb-0.5">
                SENDING TO
              </span>
              <span className="text-sm font-black text-white truncate block">
                {friend.name}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-[#02050f] border border-white/5 px-2 py-0.5 rounded align-self-start">
              {friend.username}
            </span>
          </div>

          <div className="mt-1 pt-2 border-t border-cyan-500/10 flex items-center gap-2 text-xs font-mono text-slate-300">
            <Phone size={12} className="text-cyan-500/60" />
            <span>{friend.phone}</span>
          </div>
        </div>

        {/* BALANCE BOX */}
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-slate-500" />
            <span className="text-[10px] font-bold font-mono text-slate-500 tracking-wider">
              BALANCE
            </span>
          </div>
          <span className="text-xs font-black font-mono text-slate-300 tracking-wide">
            ${mockBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* DYNAMIC FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* INPUT SUMĂ */}
          <div className="relative group">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-mono font-black text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                $
              </span>
              <input
                type="number"
                required
                disabled={isProcessing}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="any"
                className="w-full bg-[#030712]/80 border border-cyan-500/20 rounded-xl pl-9 pr-4 py-4 text-2xl font-mono font-bold text-white placeholder-slate-700 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300"
              />
            </div>
          </div>

          {/* CHIPS DE SELECTIE RAPIDĂ */}
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((qAmount) => (
              <button
                key={qAmount}
                type="button"
                disabled={isProcessing}
                onClick={() => setAmount(qAmount.toString())}
                className="py-2 px-1 text-center bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-500/10 hover:border-cyan-400/30 text-[11px] font-mono font-bold text-cyan-300/80 rounded-lg transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                ${qAmount}
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent my-1" />

          {/* BUTTON PRINCIPAL */}
          <button
            type="submit"
            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            className={`
              relative w-full py-4 rounded-xl 
              font-mono font-black text-xs tracking-widest uppercase text-white
              bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_4px_25px_rgba(6,182,212,0.3)]
              transition-all duration-300 active:scale-[0.99]
              disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer
            `}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                INITIATING P2P SEND...
              </span>
            ) : (
              <span>SEND FUNDS NOW</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
