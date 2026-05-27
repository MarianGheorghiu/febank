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
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    // Simulăm latența backend-ului (ex: 2.5 secunde)
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-6 sm:py-12 px-4 relative z-10 bg-[#030712]">
      <div className="w-full max-w-xl dynamic-container">
        <GlassCard className="relative !p-5 sm:!p-10 space-y-8 shadow-[0_40px_90px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Componenta globală de loading care blochează complet UI-ul din card */}
          <LoadingOverlay
            isLoading={isLoading}
            message="Authenticating Terminal..."
          />

          {/* HEADER DUAL */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-6 gap-4">
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

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.03] border border-white/[0.08] rounded-full text-xs font-black uppercase tracking-wider text-gray-300 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shrink-0"
            >
              <ArrowLeft size={13} className="text-cyan-400" />
              <span className="hidden sm:inline">Landing Page</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>

          {/* SECȚIUNE TITLU */}
          <div className="space-y-2.5 text-center py-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              Access your sovereign asset and capital terminal.
            </p>
          </div>

          {/* FORMULAR SPAȚIOS */}
          <form className="space-y-6" onSubmit={handleLogin}>
            <Input
              label="Email Address"
              type="email"
              placeholder="investor@mbank.fi"
              icon={<Mail size={16} />}
              disabled={isLoading}
            />

            <div className="relative w-full">
              <Input
                label="Secure Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                icon={<Lock size={16} />}
                className="pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => !isLoading && setShowPassword(!showPassword)}
                className="absolute right-4 bottom-3.5 text-gray-400 hover:text-white cursor-pointer transition-colors z-20 p-1 rounded-md hover:bg-white/5 dynamic-disabled"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="text-right">
              <Link
                href="/auth/reset-password"
                className={`text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors tracking-wide uppercase ${isLoading ? "pointer-events-none opacity-40" : ""}`}
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              variant="primary"
              type="submit"
              className="py-4 text-xs font-black mt-2 w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <span>
                {isLoading
                  ? "Verifying Credentials..."
                  : "Sign In to Dashboard"}
              </span>
              {!isLoading && <ArrowRight size={14} />}
            </Button>
          </form>

          <hr className="border-t border-white/[0.2]" />

          {/* FOOTER ALINIAT ÎN INTERIORUL CARDULUI */}
          {/* "Open Account" este acum poziționat fix SUB text, atât pe desktop cât și pe mobile */}
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <p className="text-xs sm:text-sm text-gray-400 font-medium text-center tracking-wide">
              Don't have an institutional account?
            </p>
            <Link
              href="/auth/register"
              className={`inline-flex items-center justify-center text-cyan-400 font-black hover:text-cyan-300 transition-all duration-300 uppercase text-[11px] tracking-widest bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-cyan-500/30 px-6 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.4)] ${isLoading ? "pointer-events-none opacity-30" : ""}`}
            >
              Open Account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
