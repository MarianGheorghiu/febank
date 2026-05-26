"use client";

import {
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function CTA() {
  return (
    <section className="w-full max-w-5xl mx-auto pt-2 pb-16">
      {/* Master Container din Sticlă Fluidă Densă */}
      <div className="relative rounded-3xl bg-gradient-to-b from-white/[0.09] to-white/[0.01] backdrop-blur-2xl border border-white/[0.15] p-6 sm:p-10 md:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden group grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Efecte de lumini ambientale interioare */}
        <div className="absolute top-[-20%] left-[-10%] w-[250px] h-[250px] bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[250px] h-[250px] bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />

        {/* COLOANA STÂNGA: Invitația Instituțională */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            <Sparkles size={12} className="text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.2em] text-cyan-400 uppercase">
              Institutional Onboarding
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Ready to Deploy <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Sovereign Capital?
            </span>
          </h2>

          <p className="text-gray-400 text-xs sm:text-sm max-w-md leading-relaxed font-medium">
            Open an institutional-grade account today. Access live multi-asset
            clearings, algorithmic vaults, and sub-millisecond execution rails
            instantly.
          </p>

          <a
            href="/register"
            className="group w-full sm:w-auto bg-gradient-to-r from-white to-gray-100 text-black px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 shadow-xl hover:shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            Open Account
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </a>
        </div>

        {/* COLOANA DREAPTĂ: Private Client Concierge Terminal (Contact & Info) */}
        <div className="z-10 w-full bg-black/40 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-5 shadow-inner">
          <div className="border-b border-white/[0.08] pb-3 flex justify-between items-center">
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
              Private Concierge Desk
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ● Live
            </div>
          </div>

          {/* Datele de Contact Specifice și Premium */}
          <div className="space-y-4">
            {/* Telefon */}
            <div className="flex items-center gap-4 group/item">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-cyan-400 group-hover/item:border-cyan-400/30 transition-all">
                <Phone size={14} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                  Institutional Hotline
                </span>
                <a
                  href="tel:+18006226539"
                  className="text-xs sm:text-sm font-mono font-black text-white hover:text-cyan-400 transition-colors"
                >
                  +1 (800) MBANK-FX
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 group/item">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-purple-400 group-hover/item:border-purple-400/30 transition-all">
                <Mail size={14} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                  Secured Inquiries
                </span>
                <a
                  href="mailto:concierge@mbank.fi"
                  className="text-xs sm:text-sm font-bold text-white hover:text-purple-400 transition-colors tracking-wide"
                >
                  concierge@mbank.fi
                </a>
              </div>
            </div>

            {/* Program de lucru */}
            <div className="flex items-center gap-4 group/item">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-amber-400">
                <Clock size={14} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                  Global Coverage
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-200">
                  24 / 7 / 365{" "}
                  <span className="text-[10px] text-amber-400 font-medium font-mono ml-1">
                    UTC Engine
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
