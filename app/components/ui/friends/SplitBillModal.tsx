"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Receipt,
  Users,
  Loader2,
  DollarSign,
  Percent,
  FileText,
  User,
} from "lucide-react";

interface FriendData {
  id: string;
  name: string;
  username: string;
}

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: FriendData | null;
}

export default function SplitBillModal({
  isOpen,
  onClose,
  friend,
}: SplitBillModalProps) {
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");

  // Pentru modul custom: cât plătește prietenul (în procente sau sumă fixă)
  const [friendSharePercent, setFriendSharePercent] = useState<number>(50);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Resetăm stările la închidere/deschidere
  useEffect(() => {
    if (!isOpen) {
      setTotalAmount("");
      setDescription("");
      setSplitMode("equal");
      setFriendSharePercent(50);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Blocăm scroll-ul pe body când modalul este activ
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !friend) return null;

  // Calcule matematice derivate din total
  const total = parseFloat(totalAmount) || 0;

  let userAmount = 0;
  let friendAmount = 0;

  if (splitMode === "equal") {
    userAmount = total / 2;
    friendAmount = total / 2;
  } else {
    friendAmount = (total * friendSharePercent) / 100;
    userAmount = total - friendAmount;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) return;

    setIsProcessing(true);

    // Simulare scriere în Social Ledger
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300">
      {/* BACKDROP BLUR GLASS */}
      <div
        className="absolute inset-0 bg-[#020617]/70 backdrop-blur-xl transition-all duration-300 cursor-pointer"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* MODAL CONTEXT CONTAINER */}
      <div
        className={`
          relative w-full sm:max-w-md 
          bg-gradient-to-b from-[#0b1536]/80 to-[#040819]/95 
          border-t sm:border border-purple-500/20 sm:border-white/10
          rounded-t-[24px] sm:rounded-2xl 
          p-6 sm:p-8
          shadow-[0_0_50px_rgba(168,85,247,0.15)] 
          backdrop-blur-2xl
          transition-all transform duration-300 ease-out
          z-10 max-h-[92vh] overflow-y-auto
          animate-in slide-in-from-bottom sm:zoom-in-95
        `}
      >
        {/* Mobile Indicator Bar */}
        <div className="w-12 h-1 bg-purple-500/20 rounded-full mx-auto mb-6 sm:hidden" />

        {/* HEADER AREA */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border bg-purple-500/10 border-purple-500/20 text-purple-400">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase">
                Split Ledger Bill
              </h3>
              <p className="text-[10px] text-purple-400/60 font-mono tracking-wide uppercase">
                P2P Distribution Engine
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

        {/* TARGET USER CARD INTERFACE */}
        <div className="mb-5 bg-[#070d24]/60 border border-purple-500/10 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded bg-purple-950/40 border border-purple-500/20 flex items-center justify-center font-mono font-bold text-xs text-purple-300 shrink-0">
              {friend.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold font-mono text-purple-400/70 uppercase tracking-wider">
                SPLITTING WITH
              </span>
              <span className="text-xs font-black text-white truncate block">
                {friend.name}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-[#02040f] border border-white/5 px-2 py-0.5 rounded">
            {friend.username}
          </span>
        </div>

        {/* CORE FORM SYSTEM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TOTAL BILL INPUT */}
          <div className="relative group">
            <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
              Total Invoice Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-mono font-black text-slate-500 group-focus-within:text-purple-400 transition-colors">
                $
              </span>
              <input
                type="number"
                required
                disabled={isProcessing}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="any"
                className="w-full bg-[#030712]/80 border border-blue-500/20 focus:border-purple-500/50 rounded-xl pl-9 pr-4 py-3 text-base font-mono font-bold text-white placeholder-slate-700 focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(168,85,247,0.1)]"
              />
            </div>
          </div>

          {/* BILL DESCRIPTION / PURPOSE */}
          <div>
            <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
              Bill Reference / Context
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <FileText size={14} />
              </span>
              <input
                type="text"
                required
                disabled={isProcessing}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Dinner, Shared Subscriptions, Uber"
                className="w-full bg-[#030712]/80 border border-blue-500/20 focus:border-purple-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-700 focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(168,85,247,0.1)]"
              />
            </div>
          </div>

          {/* MODE SWITCHER TAB */}
          <div>
            <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
              Distribution Algorithm
            </label>
            <div className="relative grid grid-cols-2 p-1 bg-[#030712]/60 border border-blue-500/10 rounded-xl isolate">
              {/* PASTILA MAGNETICĂ */}
              <div
                className={`
                  absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] 
                  bg-purple-500/20 border border-purple-500/30 rounded-lg 
                  transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) -z-10
                  ${splitMode === "equal" ? "translate-x-0" : "translate-x-full"}
                `}
              />

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setSplitMode("equal")}
                className={`flex items-center justify-center gap-2 py-2 text-[10px] font-mono font-bold transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed ${splitMode === "equal" ? "text-white" : "text-slate-400"}`}
              >
                <Users size={12} /> EQUAL (50/50)
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setSplitMode("custom")}
                className={`flex items-center justify-center gap-2 py-2 text-[10px] font-mono font-bold transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed ${splitMode === "custom" ? "text-white" : "text-slate-400"}`}
              >
                <Percent size={12} /> CUSTOM PERCENT
              </button>
            </div>
          </div>

          {/* EXTRA CONTROLS FOR CUSTOM MODE */}
          {splitMode === "custom" && (
            <div className="p-3 bg-[#030712]/40 border border-purple-500/10 rounded-xl space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400 uppercase">
                  Friend's Liability:
                </span>
                <span className="text-purple-400 font-bold">
                  {friendSharePercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isProcessing}
                value={friendSharePercent}
                onChange={(e) => setFriendSharePercent(Number(e.target.value))}
                className="w-full h-1 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0% (YOU PAY ALL)</span>
                <span>100% (THEY PAY ALL)</span>
              </div>
            </div>
          )}

          {/* DYNAMIC LEDGER PREVIEW BOX */}
          <div className="bg-[#02050f]/90 border border-purple-500/10 rounded-xl p-3.5 space-y-2.5 font-mono">
            <span className="block text-[9px] font-black tracking-widest text-slate-500 uppercase">
              Calculated Allocation Matrix
            </span>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Box 1: Cât plătești tu */}
              <div className="bg-purple-950/20 border border-purple-500/5 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <User size={11} className="text-purple-400" />{" "}
                  <span>YOUR SHARE</span>
                </div>
                <span className="text-xs font-black text-white">
                  ${userAmount.toFixed(2)}
                </span>
              </div>

              {/* Box 2: Cât datorează prietenul */}
              <div className="bg-purple-950/20 border border-purple-500/5 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-purple-400 mb-0.5">
                  <Users size={11} className="text-purple-400" />{" "}
                  <span className="truncate">THEIR DEBT</span>
                </div>
                <span className="text-xs font-black text-purple-400">
                  ${friendAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent my-1" />

          {/* EXECUTE ACTION BUTTON */}
          <button
            type="submit"
            disabled={isProcessing || total <= 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-[0_4px_25px_rgba(168,85,247,0.25)] font-mono font-black text-xs tracking-widest uppercase text-white transition-all duration-300 active:scale-[0.99] disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                SYNCING SOCIAL LEDGER SYSTEM...
              </span>
            ) : (
              <span>PUBLISH SPLIT TRANSACTION</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
