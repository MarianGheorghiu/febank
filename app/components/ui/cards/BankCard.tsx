// app/components/ui/cards/BankCard.tsx
"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Copy, Check, Snowflake, ShieldCheck } from "lucide-react";
import { BankCardData } from "@/app/lib/mockCardData";

interface BankCardProps {
  card: BankCardData;
  onToggleFreeze: (id: string) => void;
}

export default function BankCard({ card, onToggleFreeze }: BankCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Teme rafinate cu multi-stop gradients și glow-uri personalizate pe culori
  const cardThemes = {
    cyan: "bg-gradient-to-br from-[#0c2445] via-[#051021] to-[#020612] border-cyan-500/40 text-white shadow-[0_0_40px_rgba(6,182,212,0.12)]",
    magenta:
      "bg-gradient-to-br from-[#3b0726] via-[#170310] to-[#070107] border-pink-500/40 text-white shadow-[0_0_40px_rgba(236,72,153,0.12)]",
    amber:
      "bg-gradient-to-br from-[#381d04] via-[#170c02] to-[#070300] border-amber-500/40 text-white shadow-[0_0_40px_rgba(245,158,11,0.12)]",
    emerald:
      "bg-gradient-to-br from-[#042b18] via-[#02120b] to-[#010503] border-emerald-500/40 text-white shadow-[0_0_40px_rgba(16,185,129,0.12)]",
  };

  const isFrozen = card.status === "frozen";

  const handleCopy = () => {
    navigator.clipboard.writeText(card.pan.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4 font-mono group/card">
      {/* CORP CARD - PREMIUM GLASS LAYERING */}
      <div
        className={`relative w-full rounded-2xl border p-5 sm:p-6 overflow-hidden min-h-[220px] flex flex-col justify-between transition-all duration-300 backdrop-blur-md select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${
          isFrozen
            ? "bg-[#0b0c10] border-white/10 text-slate-500 shadow-none"
            : cardThemes[card.colorTheme]
        }`}
      >
        {/* Abstract Micro-Grid Pattern Layer */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

        {/* Premium Frozen Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-[#02050f]/80 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <Snowflake size={14} className="text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
                SYSTEM FROZEN
              </span>
            </div>
          </div>
        )}

        {/* CARD HEADER */}
        <div className="flex justify-between items-center relative z-10">
          <span className="text-[9px] font-black bg-white/5 border border-white/10 backdrop-blur-md px-2 py-0.5 rounded text-slate-300 tracking-widest uppercase">
            {card.type} LOGIC
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/80 tracking-widest">
            <ShieldCheck
              size={12}
              className={isFrozen ? "text-slate-500" : "text-cyan-400"}
            />
            NIGHT BANK
          </div>
        </div>

        {/* HOLOGRAPHIC CHIP EMULATION */}
        <div className="w-9 h-7 rounded-md bg-gradient-to-br from-white/20 via-white/5 to-transparent border border-white/10 relative my-2 overflow-hidden shadow-inner">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10" />
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/10" />
        </div>

        {/* NUMĂR CARD - CRYPTO DISPLAY LOOK */}
        <div className="my-1 relative z-10">
          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-widest mb-1">
            Secure Cryptographic PAN
          </span>
          <span className="text-lg sm:text-xl font-bold tracking-widest text-white block bg-black/40 border border-white/[0.03] p-3 rounded-lg font-mono tracking-[0.2em] shadow-inner text-center sm:text-left">
            {showDetails ? card.pan : `••••  ••••  ••••  ${card.pan.slice(-4)}`}
          </span>
        </div>

        {/* CARD FOOTER META */}
        <div className="flex justify-between items-end gap-4 relative z-10 pt-2">
          <div className="min-w-0">
            <span className="text-[8px] text-slate-500 block uppercase tracking-widest font-bold">
              Matrix Holder
            </span>
            <span className="text-xs font-bold text-white truncate block tracking-wider uppercase">
              {card.holderName}
            </span>
          </div>

          <div className="flex gap-4 bg-black/30 px-3 py-1.5 rounded-lg border border-white/[0.03] shadow-inner shrink-0">
            <div>
              <span className="text-[8px] text-slate-500 block uppercase tracking-widest font-bold">
                Expiry
              </span>
              <span className="text-[11px] font-black text-slate-200 tabular-nums">
                {card.expiry}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 block uppercase tracking-widest font-bold">
                CVV
              </span>
              <span className="text-[11px] font-black text-cyan-400 tabular-nums">
                {showDetails ? card.cvv : "•••"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BUTOANE CONTROL - HIGH-CONTRAST INDEPENDENT COLORS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
        {/* Buton Reveal Codes - DEFINIT PRIN CYAN */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          disabled={isFrozen}
          className="py-2.5 px-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black rounded-lg text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-20 active:scale-95 disabled:active:scale-100"
        >
          {showDetails ? <EyeOff size={13} /> : <Eye size={13} />}
          {showDetails ? "HIDE DETAILS" : "REVEAL CODES"}
        </button>

        {/* Buton Copy PIN - DEFINIT PRIN INDIGO (Devine Emerald la succes) */}
        <button
          onClick={handleCopy}
          disabled={isFrozen}
          className={`py-2.5 px-4 border rounded-lg text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-20 active:scale-95 disabled:active:scale-100 ${
            copied
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500 hover:text-white"
          }`}
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400 font-black">COPIED</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>COPY PIN</span>
            </>
          )}
        </button>

        {/* Buton Freeze / Unfreeze - ROSE / EMERALD STATES */}
        <button
          onClick={() => onToggleFreeze(card.id)}
          className={`py-2.5 px-4 rounded-lg text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer border active:scale-95 ${
            isFrozen
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-black"
              : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white"
          }`}
        >
          <Snowflake size={13} className={isFrozen ? "" : "animate-pulse"} />
          {isFrozen ? "UNFREEZE UNIT" : "FREEZE UNIT"}
        </button>
      </div>
    </div>
  );
}
