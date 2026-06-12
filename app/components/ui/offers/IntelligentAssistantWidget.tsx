"use client";

import React from "react";
import { Cpu, Navigation, Zap } from "lucide-react";

interface Props {
  onTriggerToast: (msg: string, type: "success" | "info") => void;
}

export default function IntelligentAssistantWidget({ onTriggerToast }: Props) {
  const handleSimulateGeoTrigger = () => {
    onTriggerToast(
      "PROXIMITY WARNING: You are near Otopeni Airport (OTP). Your VVIP access at Bucharest Business Lounge is fully unlocked. Generate your pass pass inside the terminal grid.",
      "info",
    );
  };

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[230px] overflow-hidden justify-between">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between font-mono">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Cpu size={14} />
            </div>
            Neural Matrix Engine
          </h2>
          <span className="text-cyan-400 bg-cyan-400/5 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase">
            PREDICTIVE
          </span>
        </div>

        {/* PREDICTIVE INSIGHT CARD */}
        <div className="p-2.5 rounded-lg bg-[#02040f] border border-blue-500/10 text-[10px] space-y-1 my-1.5">
          <div className="flex justify-between text-slate-500 font-bold text-[8px] uppercase">
            <span>Algorithmic Recommendation</span>
            <span className="text-cyan-400">94% Core Match</span>
          </div>
          <p className="text-white font-medium leading-tight uppercase">
            Detected high velocity flight expenditures. Prioritizing Platinum
            Global Travel Assurance.
          </p>
        </div>

        {/* GEO TRIGGER ACTIONS */}
        <div className="pt-2 border-t border-cyan-500/10 shrink-0">
          <button
            onClick={handleSimulateGeoTrigger}
            className="cursor-pointer w-full py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-[#02040f] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
          >
            <Navigation size={12} className="fill-current animate-pulse" />{" "}
            SIMULATE AIRPORT PROXIMITY
          </button>
        </div>
      </div>
    </div>
  );
}
