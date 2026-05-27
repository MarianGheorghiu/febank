"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Landmark, KeyRound } from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay"; // Importăm componenta globală de loading

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    // Simulăm latența de rețea de 2.5 secunde
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-4 relative z-10 bg-[#030712]">
      <div className="w-full max-w-xl dynamic-container">
        <GlassCard className="relative !p-4 xs:!p-6 sm:!p-10 space-y-6 sm:space-y-8 shadow-[0_40px_90px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Overlay-ul blochează tot cardul la trimiterea formularului */}
          <LoadingOverlay
            isLoading={isLoading}
            message="Generating Recovery Key..."
          />

          {/* HEADER PREMIUM PE O SINGURĂ LINIE */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 sm:pb-6 gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-2 sm:p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.25)] shrink-0">
                <Landmark size={18} className="text-cyan-400" />
              </div>
              <span className="font-black text-sm sm:text-base tracking-[0.2em] bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-none uppercase shrink-0">
                MBANK
              </span>
            </div>

            <div className="text-right min-w-0">
              <span className="text-[9px] sm:text-[10px] md:text-xs text-cyan-300 font-black uppercase tracking-[0.12em] block truncate drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                Recovery Terminal
              </span>
            </div>
          </div>

          {/* TITLU CENTRAT RESPONSIV */}
          <div className="space-y-1.5 text-center py-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Reset Password
            </h2>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              Enter your verified email to request an automated recovery
              encryption key.
            </p>
          </div>

          {/* FORMULAR ULTRA-COMPACT */}
          <form className="space-y-5 sm:space-y-6" onSubmit={handleReset}>
            <Input
              label="Account Email Address"
              type="email"
              placeholder="investor@mbank.fi"
              icon={<Mail size={16} />}
              className="!py-2.5 sm:!py-3.5"
              disabled={isLoading}
            />

            <Button
              variant="primary"
              type="submit"
              className="py-3.5 sm:py-4 text-xs font-black w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <span>
                {isLoading ? "Transmitting Request..." : "Send Reset Link"}
              </span>
              {!isLoading && <KeyRound size={14} />}
            </Button>
          </form>

          {/* Linie separatoare strânsă cu !mt-2 pentru a elimina gap-ul inestetic */}
          <hr className="border-t border-white/[0.2]" />

          {/* FOOTER STRUCTURAT LIQUID */}
          <div className="flex flex-col items-center justify-center space-y-2.5 !mt-4">
            <p className="text-xs sm:text-sm text-gray-400 font-medium text-center tracking-wide">
              Remembered your credentials?
            </p>
            <Link
              href="/auth/login"
              className={`inline-flex items-center justify-center text-cyan-400 font-black hover:text-cyan-300 transition-all duration-300 uppercase text-[11px] tracking-widest bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-cyan-500/30 px-6 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.4)] ${isLoading ? "pointer-events-none opacity-30" : ""}`}
            >
              Return to Sign In
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
