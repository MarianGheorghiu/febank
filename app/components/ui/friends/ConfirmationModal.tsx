"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  variant: "danger" | "warning";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  variant,
}: ConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md transition-all cursor-pointer"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* BOX */}
      <div
        className={`
        relative w-full max-w-sm 
        bg-gradient-to-b from-[#0e1738] to-[#040819] 
        border ${isDanger ? "border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)]" : "border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]"}
        rounded-xl p-5 sm:p-6 text-center font-mono
        animate-in zoom-in-95 duration-200
      `}
      >
        {/* ICON BAR */}
        <div
          className={`mx-auto h-12 w-12 rounded-lg border flex items-center justify-center mb-4 ${
            isDanger
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}
        >
          {isDanger ? <ShieldAlert size={22} /> : <AlertTriangle size={22} />}
        </div>

        {/* TEXTS */}
        <h3 className="text-sm font-black text-white tracking-wider uppercase mb-2">
          {title}
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-6 whitespace-pre-line">
          {description}
        </p>

        {/* ACTIONS BUTTONS */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer disabled:opacity-30"
          >
            CANCEL
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setIsSubmitting(true);
              setTimeout(() => {
                onConfirm();
                onClose();
              }, 1000); // Mic delay pentru efect vizual de scriere în ledger
            }}
            className={`py-2.5 rounded-lg text-[10px] font-black tracking-widest uppercase text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-500 shadow-[0_2px_15px_rgba(244,63,94,0.3)]"
                : "bg-amber-600 hover:bg-amber-500 shadow-[0_2px_15px_rgba(245,158,11,0.3)]"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                SYNCING...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
