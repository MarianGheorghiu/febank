"use client";

import {
  ShieldCheck,
  Cpu,
  Terminal,
  Key,
  Lock,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function Security() {
  return (
    // Strângem și aici pt-2 pentru a păstra fluiditatea ritmului paginii, fără gap-uri goale
    <section
      id="security"
      className="w-full max-w-5xl mx-auto pt-6 pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
    >
      {/* COLOANA STÂNGA: Titlu Premium, Tech Spec și Pilonii de Încredere */}
      <div className="flex flex-col items-center text-center md:items-start md:text-left space-y-6 md:space-y-8 z-10">
        {/* Micro-badge de Securitate */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 backdrop-blur-md">
          <ShieldCheck size={12} className="text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.15em] text-emerald-400 uppercase">
            Military-Grade Protection
          </span>
        </div>

        {/* Titlul Principal cu Gradient */}
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Fort Knox Ledger. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
            Powered by Golang.
          </span>
        </h2>

        <p className="text-gray-400 text-xs sm:text-sm max-w-md leading-relaxed font-medium">
          Your capital is fortified by an immutable backend framework built from
          the ground up in Go. Zero memory leaks, multi-threaded consensus, and
          sub-millisecond execution rails protect every cent.
        </p>

        {/* DETALII TEHNICE BACKEND (GOLANG HIGHLIGHT) */}
        <div className="w-full space-y-3.5">
          {[
            {
              title: "Compiled Go Core Infrastructure",
              desc: "Goroutine-backed microservices handle up to 500k concurrent requests safely.",
              icon: <Terminal size={14} />,
            },
            {
              title: "Multi-Party Computation (MPC)",
              desc: "Private keys are fragmented across distributed hardware vaults, never exposed.",
              icon: <Key size={14} />,
            },
            {
              title: "Deterministic Cryptography",
              desc: "E2E AES-256 and SHA-3 encryption protocols enforced at thread level.",
              icon: <Lock size={14} />,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.06] hover:border-emerald-500/20 transition-all duration-300"
            >
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 mt-0.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                {item.icon}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white tracking-wide">
                  {item.title}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5 leading-relaxed font-medium">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLOANA DREAPTĂ: Matricea Interactivă de Securitate (Visual Glass Terminal) */}
      <div className="relative flex items-center justify-center w-full min-h-[340px] md:min-h-[420px]">
        {/* Lumina ambientală smarald în fundal */}
        <div className="absolute w-[220px] h-[220px] bg-emerald-500/10 rounded-full blur-[70px]" />

        {/* Main Sovereign Glass Monitor */}
        <div className="w-full max-w-[360px] bg-gradient-to-b from-white/[0.1] to-white/[0.01] backdrop-blur-2xl border border-white/[0.18] rounded-3xl p-6 shadow-[0_25px_50px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] space-y-6 group">
          {/* Header Shield Terminal */}
          <div className="flex justify-between items-center w-full pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                Go Shield Active
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold text-gray-500">
              v4.1.2-stable
            </span>
          </div>

          {/* Simularea Nodurilor active din backend-ul de Go */}
          <div className="space-y-3">
            <span className="text-[9px] font-black tracking-wider text-gray-500 uppercase block">
              Active Thread Channels
            </span>

            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] flex justify-between items-center group-hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-2.5">
                  <Cpu size={14} className="text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-gray-300">
                    goroutine_ledger_pool
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  0.02ms
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] flex justify-between items-center group-hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-2.5">
                  <Lock size={14} className="text-purple-400" />
                  <span className="text-xs font-mono font-bold text-gray-300">
                    tls_handshake_crypto
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  100% OK
                </span>
              </div>
            </div>
          </div>

          {/* Statusul de audit general */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">
                Compliance Standard
              </span>
              <span className="text-xs font-black text-white mt-0.5">
                SOC2 Type II & PCI-DSS
              </span>
            </div>
            <CheckCircle2
              size={20}
              className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
            />
          </div>
        </div>

        {/* Floating Warning Overrider (Mini Card suprapus fin în exterior) */}
        <div className="absolute -bottom-2 -right-2 sm:right-4 bg-black/70 backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 shadow-2xl flex items-center gap-2.5 transform rotate-[4px]">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
            <ShieldCheck size={14} />
          </div>
          <span className="text-[10px] font-black text-gray-300 tracking-wide uppercase">
            Zero-Trust Protocol
          </span>
        </div>
      </div>
    </section>
  );
}
