"use client";

import {
  ArrowUpRight,
  TrendingUp,
  Cpu,
  PiggyBank,
  Zap,
  ShieldCheck,
  Layers,
  ArrowDownUp,
} from "lucide-react";

export default function Features() {
  return (
    <section
      id="features"
      className="w-full max-w-5xl mx-auto pt-10 pb-24 space-y-16"
    >
      {/* Header Epic */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
        <div className="px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-400 text-[10px] font-black tracking-[0.2em] uppercase">
          Institutional Ecosystem
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          One Sovereign Interface. <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Every Asset Class.
          </span>
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed font-medium">
          Engineered for high-net-worth individuals. Manage legacy equities,
          volatile crypto markets, and automated cash vaulting under
          military-grade security rails.
        </p>
      </div>

      {/* ULTRA-BENTO GRID HARDCORE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: STOCKS & CRYPTO (Ocupă 2 coloane) */}
        <div className="md:col-span-2 bg-gradient-to-b from-white/[0.08] to-white/[0.01] backdrop-blur-2xl border border-white/[0.15] rounded-3xl p-6 sm:p-8 flex flex-col justify-between group hover:border-cyan-400/40 transition-all duration-500 min-h-[380px] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-[60px] pointer-events-none" />

          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Unified Asset Trading
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Stocks, Blue-chips & Crypto assets
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              0.01% Spreads
            </span>
          </div>

          {/* SIMULARE INTELIGENTĂ DE INTERFAȚĂ DE TRADING */}
          <div className="my-6 p-4 rounded-xl bg-black/40 border border-white/[0.05] space-y-4 shadow-inner">
            <div className="flex justify-between items-center text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-gray-300">
                  NVDA / TSLA / BTC Portfolio
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-400">
                +$12,480.92 (Live)
              </span>
            </div>
            {/* Grafic fals din bare CSS */}
            <div className="h-16 flex items-end gap-1.5 pt-4">
              <div className="w-full h-[30%] bg-white/10 rounded-sm group-hover:bg-cyan-500/20 transition-all duration-500" />
              <div className="w-full h-[45%] bg-white/10 rounded-sm group-hover:bg-cyan-500/30 transition-all duration-500" />
              <div className="w-full h-[35%] bg-white/10 rounded-sm group-hover:bg-cyan-500/20 transition-all duration-500" />
              <div className="w-full h-[60%] bg-white/10 rounded-sm group-hover:bg-cyan-500/40 transition-all duration-500" />
              <div className="w-full h-[50%] bg-white/10 rounded-sm group-hover:bg-cyan-500/30 transition-all duration-500" />
              <div className="w-full h-[85%] bg-gradient-to-t from-cyan-500 to-blue-400 rounded-sm shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-500" />
            </div>
          </div>

          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            Execute microsecond clearings on Apple, Nvidia, or Bitcoin.
            Capitalize on fractional trading directly from your core checking
            account with absolute liquidity.
          </p>
        </div>

        {/* CARD 2: SAVINGS VALUTS (1 coloană) */}
        <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.01] backdrop-blur-2xl border border-white/[0.15] rounded-3xl p-6 flex flex-col justify-between group hover:border-purple-400/40 transition-all duration-500 min-h-[380px] shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-[140px] h-[140px] bg-purple-500/10 rounded-full blur-[40px]" />

          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 w-fit shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <PiggyBank size={20} />
          </div>

          {/* SIMULARE DE DOBÂNDĂ LIVE (VAULT) */}
          <div className="my-4 p-4 rounded-xl bg-black/30 border border-white/[0.05] flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
              Algorithmic Yield
            </span>
            <span className="text-3xl font-black text-white group-hover:scale-105 transition-transform duration-500">
              14.2% <span className="text-xs text-purple-400">APY</span>
            </span>
            <span className="text-[10px] text-purple-300/70 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/10 mt-1">
              Compounding Every Block
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
              Smart High-Yield Vaults
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Auto-deploy idle cash into high-yield fiat and stable pools.
              Maximize passive growth with real-time interest distribution.
            </p>
          </div>
        </div>

        {/* CARD 3: INSTANT TRANSFERS (1 coloană) */}
        <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.01] backdrop-blur-2xl border border-white/[0.15] rounded-3xl p-6 flex flex-col justify-between group hover:border-amber-400/40 transition-all duration-500 min-h-[380px] shadow-2xl relative overflow-hidden">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 w-fit shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <Zap size={20} />
          </div>

          {/* SIMULARE DE TRANSFER WIDGET */}
          <div className="my-4 p-3 rounded-xl bg-black/30 border border-white/[0.05] space-y-2.5">
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
              <span>Routing Rail</span>
              <span className="text-amber-400 font-bold uppercase">
                Fluid Engine v2
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
              <span className="text-xs font-bold text-white">London Bank</span>
              <ArrowDownUp
                size={12}
                className="text-amber-400 animate-spin [animation-duration:6s]"
              />
              <span className="text-xs font-bold text-white">Zurich Vault</span>
            </div>
            <div className="text-center text-[11px] font-mono text-gray-500 group-hover:text-white transition-colors">
              Settlement Speed:{" "}
              <span className="text-amber-400 font-bold">380ms</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
              Hyper-Fluid Rail
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Bypass cross-border friction. Move multi-million fiat sums or tech
              liquidity across continents instantly with near-zero overhead
              costs.
            </p>
          </div>
        </div>

        {/* CARD 4: ADVANCED SECURITY (Ocupă 2 coloane) */}
        <div className="md:col-span-2 bg-gradient-to-b from-white/[0.08] to-white/[0.01] backdrop-blur-2xl border border-white/[0.15] rounded-3xl p-6 sm:p-8 flex flex-col justify-between group hover:border-emerald-400/40 transition-all duration-500 min-h-[380px] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-[60px] pointer-events-none" />

          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Quantum Vault Security
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Multi-Party Computation (MPC) Shielding
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <ShieldCheck size={12} /> SECURED
            </div>
          </div>

          {/* CRIPTO DIAGRAMĂ SIMULATĂ */}
          <div className="my-6 grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.05] flex flex-col justify-between space-y-2">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                Biometric HW Keys
              </span>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-white">
                  YubiKey / Passkey
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.05] flex flex-col justify-between space-y-2">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                Insurance Backing
              </span>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-white">
                  $500M Lloyds Vault
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            Sleep soundly. Every single transactional layer is isolated via
            End-to-End Cryptography and hardware enforcement keys, keeping
            capital guarded from cyber-threats on a bank-grade framework.
          </p>
        </div>
      </div>
    </section>
  );
}
