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

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-4 relative z-10 bg-[#030712]">
      {/* Container perfect optimizat pentru desktop și tablete */}
      <div className="w-full max-w-2xl dynamic-container">
        {/* !p-4 pe mobile foarte mici, p-6 pe tablete, p-10 pe desktop - elimină complet bug-ul de clipping */}
        <GlassCard className="!p-4 xs:!p-6 sm:!p-10 space-y-5 sm:space-y-7 shadow-[0_40px_90px_rgba(0,0,0,0.8)]">
          {/* HEADER PREMIUM REPROIECTAT MASIV PENTRU MOBILE */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4 sm:pb-6 gap-2 sm:gap-4">
            {/* STÂNGA: Iconița + Bloc Text (Pe mobil textul coboară dedesubt) */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-2 sm:p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.25)] shrink-0">
                <Landmark size={18} className="text-cyan-400" />
              </div>

              <div className="flex flex-col text-left">
                <span className="font-black text-sm sm:text-base tracking-[0.2em] bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-none uppercase shrink-0">
                  MBANK
                </span>

                {/* VIZIBIL DOAR PE MOBILE: Textul se mută elegant sub MBANK */}
                <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-[0.1em] mt-1.5 block sm:hidden leading-none">
                  KYC Sovereign Enrollment
                </span>
              </div>
            </div>

            {/* DREAPTA VIZIBILĂ DOAR PE DESKTOP/TABLETĂ (hidden sm:block) */}
            <div className="text-right min-w-0 hidden sm:block">
              <span className="text-[10px] md:text-xs text-cyan-300 font-black uppercase tracking-[0.12em] block truncate drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                KYC Sovereign Enrollment
              </span>
            </div>
          </div>

          {/* TITLU CENTRAT (Dimensiuni fluide pt. mobile) */}
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Create Asset Account
            </h2>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Verify your security matrix to deploy capital globally.
            </p>
          </div>

          {/* FORMULAR COMPACT ȘI SIMETRIC */}
          <form
            className="space-y-4 sm:space-y-6"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Grid simetric de 2 coloane pe desktop/tabletă (sm:) și 1 coloană pe mobil */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Input
                label="First Name"
                type="text"
                placeholder="John"
                icon={<User size={16} />}
                className="!py-2.5 sm:!py-3.5"
              />

              <Input
                label="Last Name"
                type="text"
                placeholder="Investor"
                icon={<User size={16} />}
                className="!py-2.5 sm:!py-3.5"
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                icon={<Phone size={16} />}
                className="!py-2.5 sm:!py-3.5"
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="name@domain.com"
                icon={<Mail size={16} />}
                className="!py-2.5 sm:!py-3.5"
              />

              {/* Adresa ocupă doar 1 coloană pe desktop, stând în linie cu Genul */}
              <Input
                label="Residential Address"
                type="text"
                placeholder="Wall Street 10, NY"
                icon={<MapPin size={16} />}
                className="!py-2.5 sm:!py-3.5"
              />

              {/* Dropdown Identity pe aceeași linie cu Adresa */}
              <div className="flex flex-col space-y-2 text-left w-full">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-200 pl-1">
                  Gender / Entity
                </label>
                <div className="relative w-full group">
                  <select
                    defaultValue=""
                    className="w-full bg-white/[0.05] border border-white/[0.15] rounded-xl py-2.5 sm:py-3.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-cyan-400/60 focus:bg-white/[0.09] focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 font-semibold appearance-none cursor-pointer"
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 bottom-2.5 sm:bottom-3.5 text-gray-400 hover:text-white cursor-pointer transition-colors z-20 p-1 rounded-md"
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
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 bottom-2.5 sm:bottom-3.5 text-gray-400 hover:text-white cursor-pointer transition-colors z-20 p-1 rounded-md"
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
              className="py-3.5 sm:py-4 text-xs font-black mt-2"
            >
              <span>Submit Enrollment Details</span>
              <ArrowRight size={14} />
            </Button>
          </form>

          <div className="h-[1px] bg-white/[0.06]" />

          {/* FOOTER */}
          <p className="text-xs text-gray-400 font-medium text-center">
            Already registered within ledger?{" "}
            <Link
              href="/auth/login"
              className="text-cyan-400 font-black hover:underline transition-colors ml-1 uppercase text-[11px] tracking-wider block sm:inline mt-1 sm:mt-0"
            >
              Sign In Here
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
