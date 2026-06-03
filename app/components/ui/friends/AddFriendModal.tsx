"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Loader2,
  Search,
  ShieldCheck,
  Globe,
  Zap,
} from "lucide-react";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFriendModal({
  isOpen,
  onClose,
}: AddFriendModalProps) {
  const [friendTag, setFriendTag] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Reset stări la închidere
  useEffect(() => {
    if (!isOpen) {
      setFriendTag("");
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Lock scroll pe body
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendTag) return;

    setIsProcessing(true);

    // Simulare sync ledger p2p
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300">
      {/* BACKDROP CU BLUR INTENS */}
      <div
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl cursor-pointer transition-all"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* MODAL CONTAINER */}
      <div
        className="relative w-full sm:max-w-md 
        bg-gradient-to-b from-[#0b1b3d]/90 to-[#040819]/98 
        border-t sm:border border-cyan-500/30 sm:border-white/10
        rounded-t-[32px] sm:rounded-3xl 
        p-6 sm:p-8
        shadow-[0_0_80px_rgba(6,182,212,0.15)] 
        backdrop-blur-2xl
        z-10 max-h-[92vh] overflow-y-auto
        animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
      >
        {/* Mobile Indicator */}
        <div className="w-12 h-1.5 bg-cyan-500/20 rounded-full mx-auto mb-8 sm:hidden" />

        {/* HEADER AREA */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex gap-4">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <UserPlus size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black font-mono tracking-tight text-white uppercase">
                Connect Node
              </h3>
              <p className="text-[10px] text-cyan-400/60 font-mono tracking-[0.2em] font-bold uppercase mt-1">
                P2P Network Discovery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* NETWORK INFO BADGE */}
        <div className="mb-8 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full border border-cyan-500/20 flex items-center justify-center bg-cyan-500/5">
            <Globe size={16} className="text-cyan-400 animate-pulse" />
          </div>
          <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
            Enter the <span className="text-cyan-300 font-bold">@handle</span>{" "}
            or
            <span className="text-cyan-300 font-bold"> Wallet ID</span> to
            broadcast a connection request across the secure ledger.
          </p>
        </div>

        {/* FORMULAR */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-[0.15em]">
                Target Identity
              </span>
              {friendTag.startsWith("@") && (
                <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-1 animate-pulse">
                  <ShieldCheck size={10} /> VALID FORMAT
                </span>
              )}
            </label>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                required
                disabled={isProcessing}
                value={friendTag}
                onChange={(e) => setFriendTag(e.target.value)}
                placeholder="@username or 0x..."
                className="w-full bg-black/40 border border-white/5 focus:border-cyan-500/50 rounded-2xl pl-12 pr-4 py-4 text-sm font-mono font-bold text-white placeholder-slate-700 focus:outline-none transition-all duration-500 focus:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
              />
            </div>
          </div>

          {/* FEATURES LIST (Subtil) */}
          <div className="grid grid-cols-2 gap-3 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                Instant Sync
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                Encrypted P2P
              </span>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

          {/* ACTION BUTTON */}
          <button
            type="submit"
            disabled={isProcessing || !friendTag}
            className="group relative w-full overflow-hidden py-4 rounded-2xl 
              font-mono font-black text-xs tracking-[0.2em] uppercase text-white
              transition-all duration-300 active:scale-[0.98]
              disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed cursor-pointer
              bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 
              shadow-[0_8px_25px_rgba(6,182,212,0.3)] hover:shadow-[0_8px_35px_rgba(6,182,212,0.4)]"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 size={18} className="animate-spin" />
                BROADCASTING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                ESTABLISH CONNECTION
              </span>
            )}

            {/* Element decorativ lucios la hover */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
          </button>
        </form>
      </div>
    </div>
  );
}
