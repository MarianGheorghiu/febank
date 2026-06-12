"use client";

import React, { useState } from "react";
import { Radio, ShieldCheck, Check, EyeOff, UserCheck } from "lucide-react";

interface VCFund {
  name: string;
  focus: string;
  ticketRange: string;
  matchScore: number;
}

const MOCK_VC_FUNDS: VCFund[] = [
  {
    name: "CYBER-VENTURES TOKYO",
    focus: "B2B SAAS / TECH",
    ticketRange: "$500K - $2M",
    matchScore: 96,
  },
  {
    name: "SHIBUYA SEED NETWORK",
    focus: "FINTECH / WEALTH",
    ticketRange: "$100K - $500K",
    matchScore: 89,
  },
];

export default function SmartCapitalMatching() {
  const [anonymous, setAnonymous] = useState(true);
  const [matchingActive, setMatchingActive] = useState(false);

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[230px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between font-mono">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Radio
                size={14}
                className={matchingActive ? "animate-pulse" : ""}
              />
            </div>
            Smart Capital Matchmaking
          </h2>

          {/* ANONYMOUS SWITCHER */}
          <button
            onClick={() => setAnonymous(!anonymous)}
            className={`cursor-pointer px-2 py-0.5 rounded text-[8px] font-black uppercase border transition-all flex items-center gap-1 ${
              anonymous
                ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.1)]"
                : "bg-[#02040f] border-slate-700 text-slate-500"
            }`}
          >
            <EyeOff size={10} /> {anonymous ? "ANONYMOUS MODE" : "PUBLIC"}
          </button>
        </div>

        {/* CORE INTERACTIVE CONTENT DISPLAY */}
        <div className="flex-1 flex flex-col justify-center my-2 text-[10px]">
          {matchingActive ? (
            <div className="space-y-1.5 overflow-y-auto max-h-[85px] pr-0.5 scrollbar-thin">
              {MOCK_VC_FUNDS.map((vc, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-2 rounded bg-[#02040f]/80 border border-cyan-500/20 text-[10px]"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-white tracking-wide">
                      {vc.name}
                    </span>
                    <span className="text-[8px] text-slate-500 uppercase">
                      {vc.focus} • Ticket: {vc.ticketRange}
                    </span>
                  </div>
                  <span className="font-black text-cyan-400 text-xs bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    {vc.matchScore}% MATCH
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 border border-dashed border-cyan-500/20 rounded bg-[#02040f]/40 text-center text-slate-400 uppercase text-[9px] tracking-wide leading-normal">
              Route your financial vectors to Tier-1 Venture Capital and Angel
              networks directly via secure algorithmic scanning.
            </div>
          )}
        </div>

        {/* EXECUTE INTERACTION BUTTON */}
        <div className="shrink-0 pt-1">
          <button
            onClick={() => setMatchingActive(!matchingActive)}
            className={`cursor-pointer w-full py-1.5 rounded font-black text-[10px] uppercase tracking-widest transition-all text-center ${
              matchingActive
                ? "bg-[#02040f] text-cyan-400 border border-cyan-500/40 hover:border-cyan-400"
                : "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
            }`}
          >
            {matchingActive
              ? "DISCONNECT MATCH PIPELINE"
              : "INITIATE EQUITY VC ROUTER"}
          </button>
        </div>
      </div>
    </div>
  );
}
