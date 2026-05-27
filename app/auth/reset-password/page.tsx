"use client";

import Link from "next/link";
import { Mail, Landmark, KeyRound } from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-4 relative z-10 bg-[#030712]">
      {/* Aliniat la dimensiunea max-w-xl pentru consistență vizuală perfectă */}
      <div className="w-full max-w-xl dynamic-container">
        {/* !p-4 pe mobile foarte mici, p-6 pe tablete, p-10 pe desktop - elimină complet bug-ul de clipping */}
        <GlassCard className="!p-4 xs:!p-6 sm:!p-10 space-y-6 sm:space-y-8 shadow-[0_40px_90px_rgba(0,0,0,0.8)]">
          {/* HEADER PREMIUM PE O SINGURĂ LINIE (Stânga: Brand + Logo | Dreapta: Descriere Terminal) */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 sm:pb-6 gap-4">
            {/* STÂNGA: Iconița și numele MBANK în aceeași linie */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-2 sm:p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.25)] shrink-0">
                <Landmark size={18} className="text-cyan-400" />
              </div>
              <span className="font-black text-sm sm:text-base tracking-[0.2em] bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-none uppercase shrink-0">
                MBANK
              </span>
            </div>

            {/* DREAPTA: Textul Secured Recovery Terminal pe aceeași linie, aliniat la dreapta și mai luminos */}
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
          <form
            className="space-y-5 sm:space-y-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              label="Account Email Address"
              type="email"
              placeholder="investor@mbank.fi"
              icon={<Mail size={16} />}
              className="!py-2.5 sm:!py-3.5"
            />

            <Button
              variant="primary"
              type="submit"
              className="py-3.5 sm:py-4 text-xs font-black"
            >
              <span>Send Reset Link</span>
              <KeyRound size={14} />
            </Button>
          </form>

          <div className="h-[1px] bg-white/[0.06]" />

          {/* FOOTER */}
          <p className="text-xs text-gray-400 font-medium text-center">
            Remembered your credentials?{" "}
            <Link
              href="/auth/login"
              className="text-cyan-400 font-black hover:underline transition-colors ml-1 uppercase text-[11px] tracking-wider block sm:inline mt-1 sm:mt-0"
            >
              Return to Sign In
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
