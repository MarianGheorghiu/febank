"use client";

import React, { useState } from "react";
import {
  Shield,
  Cpu,
  ShieldAlert,
  Eye,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { SecurityStatus } from "@/app/lib/securityMock";

export default function SecurityControls({
  initialStatus,
}: {
  initialStatus: SecurityStatus;
}) {
  // Mapăm starea inițială și ne asigurăm că avem și ipWhitelisting inclus corect
  const [status, setStatus] = useState<SecurityStatus>({
    quantumEncryption: initialStatus?.quantumEncryption ?? true,
    twoFactorAuth: initialStatus?.twoFactorAuth ?? true,
    biometricRetina: initialStatus?.biometricRetina ?? false,
    ipWhitelisting: initialStatus?.ipWhitelisting ?? false,
    securityScore: initialStatus?.securityScore ?? 80,
  });

  const toggle = (key: keyof SecurityStatus) => {
    if (key === "securityScore") return;
    setStatus((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const active = [
        next.quantumEncryption,
        next.twoFactorAuth,
        next.biometricRetina,
        next.ipWhitelisting,
      ].filter(Boolean).length;
      next.securityScore = 60 + active * 10;
      return next;
    });
  };

  // Listă completă de module pentru randare dinamică (Utilitate 100%)
  const modules = [
    {
      key: "quantumEncryption" as keyof SecurityStatus,
      name: "QUANTUM SHIELD",
      sub: "AES-256-QUANTUM PROTOCOL",
      icon: <Cpu size={16} className="text-cyan-400" />,
    },
    {
      key: "twoFactorAuth" as keyof SecurityStatus,
      name: "2FA TOTP CORE",
      sub: "HARDWARE ACCESS KEYS",
      icon: <ShieldAlert size={16} className="text-cyan-400" />,
    },
    {
      key: "biometricRetina" as keyof SecurityStatus,
      name: "RETINA BIOMETRICS",
      sub: "FORCED AUTH NODE",
      icon: <Eye size={16} className="text-cyan-400" />,
    },
    {
      key: "ipWhitelisting" as keyof SecurityStatus,
      name: "IP MAIN CLUSTER",
      sub: "GATEWAY WHITELISTING",
      icon: <Globe size={16} className="text-cyan-400" />,
    },
  ];

  return (
    <div className="font-mono antialiased bg-[#111827] border border-slate-700 rounded-xl p-5 flex flex-col h-full justify-between transition-all duration-200 shadow-lg">
      <div>
        {/* COMPACT CYBER HEADER */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#1e293b] border border-slate-600 text-cyan-400 shrink-0">
              <Shield size={14} />
            </div>
            <h2 className="text-white text-xs font-black uppercase tracking-widest">
              DEFENSE_CONTROLS
            </h2>
          </div>

          <div
            className={`text-xs font-black px-3 py-1 rounded-md border-2 ${
              status.securityScore >= 90
                ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "text-amber-400 border-amber-500/40 bg-amber-500/10"
            }`}
          >
            MATRIX_SCORE: {status.securityScore}%
          </div>
        </div>

        {/* METADATA CRITICAL INLINE STATUS */}
        <div className="text-[11px] font-black tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          // DEFENSE_BLADES_STATUS:{" "}
          {status.securityScore >= 90 ? "OPTIMAL" : "DEGRADED"}
        </div>

        {/* MASSIVE & HIGH-CONTRAST MODULE STACK */}
        <div className="space-y-2.5">
          {modules.map((mod) => {
            const isActive = status[mod.key] as boolean;
            return (
              <div
                key={mod.key}
                onClick={() => toggle(mod.key)}
                className={`flex justify-between items-center p-3.5 rounded-lg border cursor-pointer transition-all duration-150 ${
                  isActive
                    ? "bg-[#1e293b] border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.05)]"
                    : "bg-[#1f293d]/40 border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3.5 select-none">
                  <div
                    className={`p-2 rounded-md transition-colors ${isActive ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/30" : "bg-slate-900 text-slate-500 border border-slate-800"}`}
                  >
                    {mod.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white tracking-wide">
                      {mod.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {mod.sub}
                    </span>
                  </div>
                </div>

                {/* CUSTOM PREMIUM CYBER SWITCH BUTTON */}
                <div className="flex items-center gap-3 select-none">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest hidden sm:inline ${isActive ? "text-cyan-400" : "text-slate-500"}`}
                  >
                    {isActive ? "ONLINE" : "OFFLINE"}
                  </span>
                  <div
                    className={`relative w-11 h-6 rounded-md border transition-colors duration-200 ${
                      isActive
                        ? "bg-cyan-500/20 border-cyan-400"
                        : "bg-slate-900 border-slate-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 bottom-0.5 w-4 rounded transition-all duration-200 ${
                        isActive
                          ? "right-1 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                          : "left-1 bg-slate-500"
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REFINED CRITICAL WARNING NODE */}
      <div className="mt-4 p-3 rounded-lg border-2 border-red-500/30 bg-red-950/20 text-xs font-bold text-red-400 tracking-wide flex items-start gap-2.5 shadow-sm">
        <ShieldCheck
          size={16}
          className="text-red-400 shrink-0 mt-0.5 animate-pulse"
        />
        <div className="leading-tight">
          CRITICAL: DEACTIVATING CONTROL BLADES INSTANTLY VOIDS THE AUTOMATED
          FUND INSURANCE DEPOSIT PROTOCOL.
        </div>
      </div>
    </div>
  );
}
