"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Landmark,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-6 sm:py-12 px-4 relative z-10 bg-[#030712]">
      {/* Container extins (max-w-xl) pentru o prezență solidă pe web și scalare fluidă pe mobil */}
      <div className="w-full max-w-xl dynamic-container">
        {/* !p-5 pe mobil elimină bug-ul de clipping; sm:!p-10 redă aerul premium pe desktop */}
        <GlassCard className="!p-5 sm:!p-10 space-y-8 shadow-[0_40px_90px_rgba(0,0,0,0.8)]">
          {/* HEADER DUAL - REPROIECTAT COMPLET RESPONSIV */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-6 gap-4">
            {/* Stânga: Brand / Identitate */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)] shrink-0">
                <Landmark size={20} className="text-cyan-400" />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-black text-base tracking-[0.2em] text-white leading-none">
                  MBANK
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 hidden sm:block truncate">
                  Secured Institutional Gate
                </span>
                <span className="text-[9px] text-cyan-400/90 font-bold uppercase tracking-wider mt-1 sm:hidden truncate">
                  Institutional
                </span>
              </div>
            </div>

            {/* Dreapta: Navigație inteligentă (textul se adaptează pe mobil ca să nu se sufoce) */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.03] border border-white/[0.08] rounded-full text-xs font-black uppercase tracking-wider text-gray-300 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shrink-0"
            >
              <ArrowLeft size={13} className="text-cyan-400" />
              <span className="hidden sm:inline">Landing Page</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>

          {/* SECȚIUNE TITLU CENTRATĂ */}
          <div className="space-y-2.5 text-center py-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              Access your sovereign asset and capital terminal.
            </p>
          </div>

          {/* FORMULAR SPAȚIOS */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <Input
              label="Email Address"
              type="email"
              placeholder="investor@mbank.fi"
              icon={<Mail size={16} />}
            />

            {/* Container relativ controlat pentru input + toggle de ochi în interior */}
            <div className="relative w-full">
              <Input
                label="Secure Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                icon={<Lock size={16} />}
                className="pr-12" // Previne suprapunerea textului sub iconița de ochi
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bottom-3.5 text-gray-400 hover:text-white cursor-pointer transition-colors z-20 p-1 rounded-md hover:bg-white/5"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* RUTA CORECTATĂ: /auth/reset-password */}
            <div className="text-right">
              <Link
                href="/auth/reset-password"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors tracking-wide uppercase"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              variant="primary"
              type="submit"
              className="py-4 text-xs font-black mt-2"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight size={14} />
            </Button>
          </form>

          <div className="h-[1px] bg-white/[0.06]" />

          {/* FOOTER CARD - RUTA CORECTATĂ: /auth/register */}
          <p className="text-xs sm:text-sm text-gray-400 font-medium text-center">
            Don't have an institutional account?{" "}
            <Link
              href="/auth/register"
              className="text-cyan-400 font-black hover:underline transition-colors ml-1 uppercase text-[11px] sm:text-xs tracking-wider"
            >
              Open Account
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
