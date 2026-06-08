"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, ChevronRight, CheckCircle, Check } from "lucide-react";
import { CardType, BankCardData } from "@/app/lib/mockCardData";

interface OrderCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder: (newCard: Partial<BankCardData>) => void;
}

export default function OrderCardModal({
  isOpen,
  onClose,
  onConfirmOrder,
}: OrderCardModalProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<CardType>("physical");
  const [theme, setTheme] = useState<"cyan" | "magenta" | "amber" | "emerald">(
    "cyan",
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setType("physical");
      setTheme("cyan");
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

  if (!isOpen) return null;

  const handleProceed = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setStep(3);
      }, 1200);
    }
  };

  const handleFinish = () => {
    onConfirmOrder({ type, colorTheme: theme });
    onClose();
  };

  const cardTypes = [
    {
      key: "physical" as CardType,
      title: "PHYSICAL // HARDWARE VAULT",
      desc: "Titanium physical chassis deployed directly via secure pipeline.",
    },
    {
      key: "virtual" as CardType,
      title: "VIRTUAL // QUANTUM GHOST",
      desc: "Instant core allocation mapped directly inside the sandbox network.",
    },
    {
      key: "disposable" as CardType,
      title: "DISPOSABLE // BURNER TRACE",
      desc: "Automated single-use vector sequence. Deletes trace right after use.",
    },
  ];

  const chromaThemes = [
    {
      key: "cyan" as const,
      label: "CYAN GRID SYNC",
      color: "text-cyan-400",
      dot: "bg-cyan-400",
    },
    {
      key: "magenta" as const,
      label: "MAGENTA OVERDRIVE",
      color: "text-fuchsia-400",
      dot: "bg-fuchsia-500",
    },
    {
      key: "amber" as const,
      label: "AMBER RUNNER",
      color: "text-amber-400",
      dot: "bg-amber-500",
    },
    {
      key: "emerald" as const,
      label: "EMERALD SECURE",
      color: "text-emerald-400",
      dot: "bg-emerald-500",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
      {/* Background Dim Backdrop Layer */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
        onClick={() => !isProcessing && onClose()}
      />

      {/* FIXED CONTAINER OVERFLOW SHEET (Strict height constraints applied here) */}
      <div className="relative w-full sm:max-w-md bg-[#0a1024] border-t sm:border border-cyan-500/20 rounded-t-2xl sm:rounded-xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 font-mono flex flex-col gap-4 max-h-[80vh] sm:max-h-[520px] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 group">
        {/* iOS Mobile Sheet Top Bar Notch */}
        <div className="w-10 h-1 bg-slate-800 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

        {/* Dynamic Glow Layer */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl opacity-100 pointer-events-none" />

        {/* MOUNTED PINNED HEADER */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-cyan-500/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <CreditCard className="text-cyan-400 animate-pulse" size={14} />
            <div>
              <h3 className="text-white font-bold text-xs uppercase tracking-widest">
                ISSUE MODULE
              </h3>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">
                Configuration Pipeline • Stage {step}/3
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-white rounded transition-all cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ONLY SCROLLABLE AREA INSIDE MODAL (Isolating state elements cleanly) */}
        <div className="relative z-10 flex-1 overflow-y-auto pr-0.5 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/20">
          {/* STEP 1: OPTIONS SELECT */}
          {step === 1 && (
            <div className="flex flex-col gap-2 pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                Select Architecture Core:
              </span>
              {cardTypes.map((item) => {
                const isSelected = type === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => setType(item.key)}
                    className={`p-3 rounded-lg border flex flex-col gap-1 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/5 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                        : "bg-black/30 border-white/[0.04] hover:border-cyan-500/20 hover:bg-cyan-950/5"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-[11px] font-bold tracking-wide ${isSelected ? "text-cyan-400" : "text-white"}`}
                      >
                        {item.title}
                      </span>
                      {isSelected && (
                        <Check size={12} className="text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase leading-normal tracking-wide">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 2: CHROMA ELEMENTS */}
          {step === 2 && (
            <div className="flex flex-col gap-2 pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                Select Chroma Base Core:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {chromaThemes.map((item) => {
                  const isSelected = theme === item.key;
                  return (
                    <div
                      key={item.key}
                      onClick={() => setTheme(item.key)}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-cyan-500/5 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.05)] text-white"
                          : "bg-black/30 border-white/[0.04] text-slate-400 hover:border-cyan-500/20 hover:bg-cyan-950/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full ${item.dot} shrink-0`}
                        />
                        <span
                          className={`text-[10px] font-bold tracking-wider ${isSelected ? item.color : "text-slate-300"}`}
                        >
                          {item.label}
                        </span>
                      </div>
                      {isSelected && (
                        <Check size={12} className="text-cyan-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: FINISHED COMPILE */}
          {step === 3 && (
            <div className="text-center py-6 my-1 flex flex-col items-center justify-center gap-2.5 bg-black/20 border border-dashed border-cyan-500/10 rounded-lg">
              <CheckCircle
                size={32}
                className="text-emerald-400 animate-bounce"
              />
              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest">
                  CORE MATRIX GENERATED
                </h4>
                <p className="text-[9px] text-slate-500 max-w-xs px-4 mt-1 uppercase leading-normal tracking-wide">
                  Parameters compiled successfully. The unit has been
                  authorized, encrypted, and is ready for mounting.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PINNED BOTTOM PANEL ACTIONS */}
        <div className="relative z-10 pt-3 border-t border-cyan-500/10 flex justify-end shrink-0">
          {step < 3 ? (
            <button
              onClick={handleProceed}
              disabled={isProcessing}
              className="w-full h-9 bg-cyan-500/10 hover:bg-cyan-600 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100"
            >
              {isProcessing
                ? "COMPILING SYSTEM LAYERS..."
                : "CONTINUE CONFIGURATION"}
              {!isProcessing && <ChevronRight size={12} />}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full h-9 bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 hover:text-white rounded-lg text-[10px] font-bold tracking-widest uppercase cursor-pointer transition-all active:scale-95"
            >
              MOUNT UNIT TO CORE WALLET
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
