"use client";

import React, { useState } from "react";
import { BarChart3, ShieldCheck, Zap, RefreshCw, Terminal } from "lucide-react";

type FacilityType = "REVOLVING" | "VENTURE_DEBT" | "EQUIPMENT";

interface FacilityConfig {
  allocatedLimit: number;
  drawnAmount: number;
  baseAPR: number;
  dscrRequirement: string; // Metrică financiară corporate corporativă (Debt Service Coverage Ratio)
  burnRateThreshold: string;
}

const FACILITIES_DATA: Record<FacilityType, FacilityConfig> = {
  REVOLVING: {
    allocatedLimit: 500000,
    drawnAmount: 140000,
    baseAPR: 6.45,
    dscrRequirement: "> 1.25x",
    burnRateThreshold: "N/A",
  },
  VENTURE_DEBT: {
    allocatedLimit: 1500000,
    drawnAmount: 0,
    baseAPR: 8.95,
    dscrRequirement: "VC Backed",
    burnRateThreshold: "< $80k/mo",
  },
  EQUIPMENT: {
    allocatedLimit: 300000,
    drawnAmount: 85000,
    baseAPR: 5.2,
    dscrRequirement: "> 1.10x",
    burnRateThreshold: "N/A",
  },
};

export default function CorporateCreditMatrix() {
  const [activeFacility, setActiveFacility] =
    useState<FacilityType>("REVOLVING");
  const data = FACILITIES_DATA[activeFacility];

  const availableToDraw = data.allocatedLimit - data.drawnAmount;
  const currentUtilizationRate = (
    (data.drawnAmount / data.allocatedLimit) *
    100
  ).toFixed(1);

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[230px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <BarChart3 size={14} />
            </div>
            Corporate Facilities
          </h2>

          {/* FACILITY TOGGLE TABS */}
          <div className="flex gap-1 bg-[#02040f] border border-cyan-500/10 p-0.5 rounded">
            {(Object.keys(FACILITIES_DATA) as FacilityType[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFacility(f)}
                className={`cursor-pointer px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-all ${
                  activeFacility === f
                    ? "bg-cyan-400 text-[#02040f]"
                    : "text-slate-400 hover:text-cyan-400"
                }`}
              >
                {f === "REVOLVING"
                  ? "Revolving"
                  : f === "VENTURE_DEBT"
                    ? "Venture"
                    : "Hardware"}
              </button>
            ))}
          </div>
        </div>

        {/* METRICS DISPATCH */}
        <div className="grid grid-cols-3 gap-2 font-mono text-[11px] my-2 shrink-0">
          <div className="p-2 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col">
            <span className="text-[8px] font-bold text-slate-500 uppercase">
              Allocated Facility
            </span>
            <span className="text-white font-black">
              ${data.allocatedLimit.toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col">
            <span className="text-[8px] font-bold text-slate-500 uppercase">
              Deployed Balance
            </span>
            <span className="text-white font-black">
              ${data.drawnAmount.toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col">
            <span className="text-[8px] font-bold text-slate-500 uppercase">
              Available Draw
            </span>
            <span className="text-cyan-400 font-black">
              ${availableToDraw.toLocaleString()}
            </span>
          </div>
        </div>

        {/* REAL-TIME MATRIX HEALTH SYSTEM */}
        <div className="flex-1 flex flex-col justify-center my-1">
          <div className="p-2 bg-[#02040f] border border-cyan-500/20 rounded font-mono text-[9px]">
            <div className="flex justify-between items-center font-bold text-cyan-400 mb-1 uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Terminal size={10} /> Compliance Vectors
              </span>
              <span className="text-white">
                Utilization: {currentUtilizationRate}%
              </span>
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 uppercase">
              <span>
                DSCR Barrier:{" "}
                <strong className="text-white">{data.dscrRequirement}</strong>
              </span>
              <span>
                APR: <strong className="text-white">{data.baseAPR}%</strong>
              </span>
              {data.burnRateThreshold !== "N/A" && (
                <span>
                  Burn Rate:{" "}
                  <strong className="text-white">
                    {data.burnRateThreshold}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ACTION EXECUTION TRIGGER */}
        <div className="shrink-0 pt-2 border-t border-cyan-500/10 flex gap-2">
          <button className="cursor-pointer flex-1 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-[#02040f] font-mono font-black text-[10px] uppercase tracking-widest transition-all text-center shadow-[0_0_10px_rgba(34,211,238,0.2)]">
            EXECUTE FUNDING DRAWDOWN
          </button>
        </div>
      </div>
    </div>
  );
}
