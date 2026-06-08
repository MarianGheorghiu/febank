"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { BankCardData } from "@/app/lib/mockCardData";

interface CardSelectorProps {
  cards: BankCardData[];
  selectedCardId: string;
  onSelect: (id: string) => void;
}

export default function CardSelector({
  cards,
  selectedCardId,
  onSelect,
}: CardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    // Outer Wrapper acts as the hover group trigger
    <div className="relative w-full md:w-80 font-mono group" ref={dropdownRef}>
      <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5 select-none relative z-10">
        Active Core Unit:
      </label>

      {/* Identical Background Glow Effect from TransactionHistory */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Main Trigger Button reacting to parent group hover */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-10 w-full h-10 bg-[#0a1024] text-white text-xs font-bold rounded-lg px-3 flex items-center justify-between border transition-all duration-300 cursor-pointer focus:outline-none ${
          isOpen
            ? "border-cyan-500/60 shadow-[0_0_30px_rgba(34,211,238,0.12)] bg-[#0c132c]"
            : "border-cyan-500/20 group-hover:border-cyan-500/60 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]"
        }`}
      >
        <span className="truncate tracking-wide">
          [{activeCard.type.toUpperCase()}] •••• {activeCard.pan.slice(-4)}
        </span>
        <div className="flex items-center gap-2.5 shrink-0 pl-3 border-l border-white/5 ml-2 h-5">
          <span
            className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-sm border ${
              activeCard.status === "frozen"
                ? "bg-rose-500/5 text-rose-400/80 border-rose-500/10"
                : "bg-emerald-500/5 text-emerald-400/80 border-emerald-500/10"
            }`}
          >
            {activeCard.status}
          </span>
          <ChevronDown
            size={14}
            className={`text-cyan-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-[#0a1024] border border-cyan-500/20 rounded-lg shadow-[0_12px_30px_rgba(0,0,0,0.5)] z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/20">
            {cards.map((c) => {
              const isSelected = c.id === selectedCardId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelect(c.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 flex items-center justify-between text-left text-xs font-bold transition-all duration-200 border-b border-white/[0.04] last:border-none cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/5 text-white border-l-2 border-l-cyan-400"
                      : "bg-black/30 text-slate-400 hover:border-cyan-500/20 hover:bg-cyan-950/5 hover:text-white"
                  }`}
                >
                  <span className="truncate">
                    [{c.type.toUpperCase()}] •••• {c.pan.slice(-4)}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-sm border ${
                        c.status === "frozen"
                          ? "bg-rose-500/5 text-rose-400/80 border-rose-500/10"
                          : "bg-emerald-500/5 text-emerald-400/80 border-emerald-500/10"
                      }`}
                    >
                      {c.status}
                    </span>
                    {isSelected && (
                      <Check size={12} className="text-cyan-400 ml-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
