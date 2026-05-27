"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Landmark,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay"; // Importăm componenta globală de loading

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    // Simulăm latența de rețea/backend de 2.5 secunde
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-4 relative z-10 bg-[#030712]">
      <div className="w-full max-w-2xl dynamic-container">
        <GlassCard className="relative !p-4 xs:!p-6 sm:!p-10 space-y-5 sm:space-y-7 shadow-[0_40px_90px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Overlay-ul blochează tot cardul la trimiterea formularului */}
          <LoadingOverlay
            isLoading={isLoading}
            message="Processing Sovereign Registration..."
          />

          {/* HEADER PREMIUM */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4 sm:pb-6 gap-2 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-2 sm:p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.25)] shrink-0">
                <Landmark size={18} className="text-cyan-400" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-black text-sm sm:text-base tracking-[0.2em] bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-none uppercase shrink-0">
                  MBANK
                </span>
                <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-[0.1em] mt-1.5 block sm:hidden leading-none">
                  KYC Sovereign Enrollment
                </span>
              </div>
            </div>
            <div className="text-right min-w-0 hidden sm:block">
              <span className="text-[10px] md:text-xs text-cyan-300 font-black uppercase tracking-[0.12em] block truncate drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                KYC Sovereign Enrollment
              </span>
            </div>
          </div>

          {/* TITLU CENTRAT */}
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Create Asset Account
            </h2>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Verify your security matrix to deploy capital globally.
            </p>
          </div>

          {/* FORMULAR COMPACT */}
          <form className="space-y-4 sm:space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Input
                label="First Name"
                type="text"
                placeholder="John"
                icon={<User size={16} />}
                className="!py-2.5 sm:!py-3.5"
                disabled={isLoading}
              />

              <Input
                label="Last Name"
                type="text"
                placeholder="Investor"
                icon={<User size={16} />}
                className="!py-2.5 sm:!py-3.5"
                disabled={isLoading}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                icon={<Phone size={16} />}
                className="!py-2.5 sm:!py-3.5"
                disabled={isLoading}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="name@domain.com"
                icon={<Mail size={16} />}
                className="!py-2.5 sm:!py-3.5"
                disabled={isLoading}
              />

              <Input
                label="Residential Address"
                type="text"
                placeholder="Wall Street 10, NY"
                icon={<MapPin size={16} />}
                className="!py-2.5 sm:!py-3.5"
                disabled={isLoading}
              />

              {/* Dropdown Identity */}
              <div className="flex flex-col space-y-2 text-left w-full">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-200 pl-1">
                  Gender / Entity
                </label>
                <div className="relative w-full group">
                  <select
                    defaultValue=""
                    disabled={isLoading}
                    className="w-full bg-white/[0.05] border border-white/[0.15] rounded-xl py-2.5 sm:py-3.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-cyan-400/60 focus:bg-white/[0.09] focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 font-semibold appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option
                      value=""
                      disabled
                      className="bg-[#0a0d14] text-white/40"
                    >
                      Select Identity
                    </option>
                    <option value="male" className="bg-[#0a0d14] text-white">
                      Male
                    </option>
                    <option value="female" className="bg-[#0a0d14] text-white">
                      Female
                    </option>
                    <option
                      value="institutional"
                      className="bg-[#0a0d14] text-white"
                    >
                      Corporate / Institution
                    </option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                    <ChevronDown size={15} />
                  </div>
                </div>
              </div>

              {/* Parolă */}
              <div className="relative w-full">
                <Input
                  label="Secure Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  icon={<Lock size={16} />}
                  className="pr-12 !py-2.5 sm:!py-3.5"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => !isLoading && setShowPassword(!showPassword)}
                  className="absolute right-4 bottom-2.5 sm:bottom-3.5 text-gray-400 hover:text-white cursor-pointer transition-colors z-20 p-1 rounded-md"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirmare Parolă */}
              <div className="relative w-full">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  icon={<Lock size={16} />}
                  className="pr-12 !py-2.5 sm:!py-3.5"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() =>
                    !isLoading && setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 bottom-2.5 sm:bottom-3.5 text-gray-400 hover:text-white cursor-pointer transition-colors z-20 p-1 rounded-md"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              type="submit"
              className="py-3.5 sm:py-4 text-xs font-black mt-2 w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <span>
                {isLoading
                  ? "Verifying Credentials..."
                  : "Submit Enrollment Details"}
              </span>
              {!isLoading && <ArrowRight size={14} />}
            </Button>
          </form>

          {/* Linie separatoare strânsă cu !mt-2 */}
          <hr className="border-t border-white/[0.2]" />

          {/* FOOTER STRUCTURAT LIQUID */}
          {/* S-a mărit textul la text-xs sm:text-sm, iar butonul a trecut sub el, asigurat prin flex-col */}
          <div className="flex flex-col items-center justify-center space-y-2.5 !mt-4">
            <p className="text-xs sm:text-sm text-gray-400 font-medium text-center tracking-wide">
              Already registered within ledger?
            </p>
            <Link
              href="/auth/login"
              className={`inline-flex items-center justify-center text-cyan-400 font-black hover:text-cyan-300 transition-all duration-300 uppercase text-[11px] tracking-widest bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-cyan-500/30 px-6 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.4)] ${isLoading ? "pointer-events-none opacity-30" : ""}`}
            >
              Sign In Here
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
