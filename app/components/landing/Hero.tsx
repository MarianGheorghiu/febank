"use client";

import {
  ArrowRight,
  Star,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full max-w-5xl mx-auto pt-20 pb-6 md:pt-28 md:pb-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
      {/* COLOANA STÂNGA: Centrată pe mobile, aliniată la stânga pe desktop */}
      <div className="flex flex-col items-center text-center md:items-start md:text-left space-y-6 md:space-y-8 z-10">
        {/* Micro-badge fluid */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full border border-white/[0.08] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <Sparkles size={12} className="text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-cyan-400 uppercase">
            Institutional Grade Security
          </span>
        </div>

        {/* Titlul Principal */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] bg-gradient-to-b from-white via-gray-100 to-gray-500 bg-clip-text text-transparent">
          The Next Wave <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            of Global Wealth.
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-gray-400 text-sm md:text-base max-w-md leading-relaxed font-medium">
          Experience a modular financial operating system crafted with liquid
          interfaces for next-gen asset management. Fast, secure, transparent.
        </p>

        {/* Butonul Principal Call to Action (Centrat pe mobile) */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
          <a
            href="/register"
            className="group w-full sm:w-auto bg-gradient-to-r from-white to-gray-100 text-black px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 shadow-[0_4px_25px_rgba(255,255,255,0.05)] hover:shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            Open Account
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </a>
        </div>

        {/* SECȚIUNEA LOVED BY CUSTOMERS / STATS (Centrată pe mobile) */}
        <div className="pt-6 border-t border-white/[0.06] w-full flex flex-col items-center md:items-start sm:flex-row sm:justify-center md:justify-start gap-4 sm:gap-6">
          {/* Avatare Minimaliste */}
          <div className="flex items-center -space-x-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-[#0a0d14] flex items-center justify-center text-[10px] font-bold">
              JD
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 border-2 border-[#0a0d14] flex items-center justify-center text-[10px] font-bold">
              AM
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 border-2 border-[#0a0d14] flex items-center justify-center text-[10px] font-bold">
              ST
            </div>
            <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-[#0a0d14] flex items-center justify-center backdrop-blur-md text-[10px] font-bold text-cyan-400">
              +1k
            </div>
          </div>

          {/* Text Cifre Relevante */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className="fill-cyan-400 text-cyan-400"
                />
              ))}
              <span className="text-xs font-bold text-white ml-1">
                5.0 Rating
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5 tracking-wide text-center md:text-left">
              Trusted by 10,000+ global traders and elite investors.
            </p>
          </div>
        </div>
      </div>

      {/* COLOANA DREAPTĂ: Cardul de sticlă (Rămâne neschimbat, se așază fluid sub text pe mobile) */}
      <div className="relative flex items-center justify-center w-full min-h-[320px] md:min-h-[400px]">
        <div className="absolute w-[200px] h-[200px] bg-cyan-500/20 rounded-full blur-[60px] animate-pulse" />

        <div className="w-full max-w-[340px] aspect-[1.58/1] bg-gradient-to-br from-white/[0.12] to-white/[0.01] backdrop-blur-2xl border border-white/[0.18] rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative overflow-hidden transform rotate-[-4px] hover:rotate-0 transition-transform duration-500 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
                Premium Tier
              </span>
              <span className="text-sm font-black tracking-widest text-white mt-0.5">
                MBANK
              </span>
            </div>
            <div className="w-9 h-7 bg-gradient-to-br from-amber-400/40 to-amber-600/20 border border-amber-400/30 rounded-md shadow-inner relative opacity-80" />
          </div>

          <div className="mt-8 flex flex-col">
            <span className="text-sm font-medium tracking-[0.2em] text-gray-200">
              •••• •••• •••• 8824
            </span>
          </div>

          <div className="mt-auto pt-6 flex justify-between items-end w-full">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-wider text-gray-500">
                Card Holder
              </span>
              <span className="text-[10px] font-bold text-gray-300 tracking-wide uppercase mt-0.5">
                Global Investor
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] uppercase tracking-wider text-gray-500">
                Expiry
              </span>
              <span className="text-[10px] font-bold text-gray-300 tracking-wide mt-0.5">
                12/30
              </span>
            </div>
          </div>
        </div>

        {/* Widgets flotante */}
        <div className="absolute bottom-4 right-2 sm:right-6 bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 shadow-2xl flex items-center gap-3 transform rotate-[6px] hover:scale-105 transition-transform duration-300">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <TrendingUp size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
              Live Yield
            </span>
            <span className="text-xs font-black text-emerald-400">+24.81%</span>
          </div>
        </div>

        <div className="absolute top-4 left-2 sm:left-6 bg-black/40 backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 shadow-2xl flex items-center gap-3 transform rotate-[-8px]">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
            <ShieldCheck size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
              Status
            </span>
            <span className="text-xs font-black text-cyan-400">Encrypted</span>
          </div>
        </div>
      </div>
    </section>
  );
}
