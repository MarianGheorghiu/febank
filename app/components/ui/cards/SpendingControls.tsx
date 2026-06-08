"use client";

import React from "react";
import {
  Sliders,
  Shield,
  Smartphone,
  Globe,
  CreditCard,
  Lock,
} from "lucide-react";
import { BankCardData, CardAllowedChannels } from "@/app/lib/mockCardData";

interface SpendingControlsProps {
  card: BankCardData;
  onUpdateLimit: (id: string, newLimit: number) => void;
  onToggleChannel: (id: string, channel: keyof CardAllowedChannels) => void;
}

export default function SpendingControls({
  card,
  onUpdateLimit,
  onToggleChannel,
}: SpendingControlsProps) {
  const isFrozen = card.status === "frozen";
  const percent = Math.min(
    (card.spentThisMonth / card.monthlyLimit) * 100,
    100,
  );

  const channels = [
    {
      key: "online" as const,
      label: "NET.GATEWAY // ONLINE",
      icon: <Globe size={13} />,
    },
    {
      key: "atm" as const,
      label: "VAULT.ACCESS // ATM",
      icon: <CreditCard size={13} />,
    },
    {
      key: "contactless" as const,
      label: "NODE.PROXIMITY // NFC",
      icon: <Smartphone size={13} />,
    },
    {
      key: "international" as const,
      label: "CROSS.MATRIX // INT",
      icon: <Shield size={13} />,
    },
  ];

  return (
    <div
      className={`relative bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group flex flex-col gap-4 font-mono ${
        isFrozen
          ? "border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.08)]"
          : "border border-cyan-500/20 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]"
      }`}
    >
      {/* Background Glow Effect identical to history wrapper */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Cyber Lock Overlay respecting the new rounded architecture */}
      {isFrozen && (
        <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md flex flex-col items-center justify-center z-30 rounded-xl transition-all">
          <div className="bg-rose-500/10 border border-rose-500/30 px-4 py-2 rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-in zoom-in-95 duration-200">
            <Lock size={14} className="text-rose-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase">
              GRID CONTROL LOCKED
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-4">
        {/* UPPER PANEL: SPENDING CEILING METRICS */}
        <div className="flex flex-col gap-3 pb-4 border-b border-cyan-500/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Sliders size={14} className="text-cyan-400 animate-pulse" />
                Spending Ceiling
              </h3>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-0.5">
                Hardware Core Limitation
              </span>
            </div>

            {/* Micro-telemetry widgets matching the dashboard's cleaner look */}
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider w-full sm:w-auto justify-between sm:justify-start">
              <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 px-2.5 py-1 rounded-lg text-fuchsia-400 tabular-nums flex items-center gap-1.5">
                <span className="text-white text-[8px]">USED:</span>
                <span className="text-fuchsia-300 font-bold">
                  ${card.spentThisMonth.toLocaleString("en-US")}
                </span>
              </div>

              <div className="bg-cyan-500/5 border border-cyan-500/20 px-2.5 py-1 rounded-lg text-cyan-400 tabular-nums flex items-center gap-1.5">
                <span className="text-white text-[8px]">LIMIT:</span>
                <span className="text-cyan-300 font-bold">
                  ${card.monthlyLimit.toLocaleString("en-US")}
                </span>
              </div>
            </div>
          </div>

          {/* Premium Progress bar matching transaction sub-components */}
          <div className="w-full h-1.5 bg-[#02040f] rounded-full overflow-hidden relative border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Slider Controller Refined */}
          <div className="flex flex-col gap-1 w-full">
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={card.monthlyLimit}
              onChange={(e) => onUpdateLimit(card.id, parseInt(e.target.value))}
              className="w-full h-1 bg-[#02040f] border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none transition-all
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-fuchsia-400
                [&::-webkit-slider-thumb]:shadow-[0_0_8px_#d946ef]"
            />
            <div className="flex justify-between text-[8px] text-white-500 font-bold tracking-widest uppercase mt-0.5">
              <span>MIN $1,000</span>
              <span className="text-white-600">STEP $1,000</span>
              <span>MAX $20,000</span>
            </div>
          </div>
        </div>

        {/* LOWER PANEL: CHANNELS SECURE GRID */}
        <div className="flex flex-col gap-2">
          <div className="px-0.5">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest block">
              Allocation Channels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {channels.map((ch) => {
              const active = card.allowedChannels[ch.key];
              return (
                <div
                  key={ch.key}
                  onClick={() => onToggleChannel(card.id, ch.key)}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 select-none ${
                    active
                      ? "bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.02)] text-white"
                      : "bg-black/30 border-white/[0.04] text-slate-500 hover:border-cyan-500/20 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded transition-colors ${
                        active
                          ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                          : "bg-white/5 border border-white/5 text-slate-600"
                      }`}
                    >
                      {ch.icon}
                    </div>
                    <span className="text-[10px] font-bold tracking-wide uppercase truncate">
                      {ch.label}
                    </span>
                  </div>

                  {/* High-tech micro toggle integrated with the new structure */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[8px] font-black tracking-wider transition-colors ${
                        active ? "text-cyan-400" : "text-slate-600"
                      }`}
                    >
                      {active ? "ON" : "OFF"}
                    </span>
                    <div
                      className={`w-7 h-3.5 rounded-full relative p-0.5 border transition-all duration-300 ${
                        active
                          ? "bg-cyan-950/60 border-cyan-500/30"
                          : "bg-black/80 border-white/10"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          active
                            ? "bg-cyan-400 translate-x-3.5 shadow-[0_0_8px_#22d3ee]"
                            : "bg-slate-700 translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
