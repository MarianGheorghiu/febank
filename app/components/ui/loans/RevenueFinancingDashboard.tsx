"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Search,
  X,
  Activity,
  RefreshCw,
  BarChart3,
  Radio,
} from "lucide-react";

interface StreamConfig {
  id: string;
  platform: string;
  mrr: number;
  status: "CONNECTED" | "SYNCING" | "OFFLINE";
  verifiedLimit: number;
}

const MOCK_REVENUE_STREAMS: StreamConfig[] = [
  {
    id: "str-1",
    platform: "STRIPE CORE API",
    mrr: 84000,
    status: "CONNECTED",
    verifiedLimit: 250000,
  },
  {
    id: "str-2",
    platform: "SHOPIFY GATEWAY",
    mrr: 42000,
    status: "CONNECTED",
    verifiedLimit: 120000,
  },
  {
    id: "str-3",
    platform: "APP STORE CONNECT",
    mrr: 19000,
    status: "SYNCING",
    verifiedLimit: 50000,
  },
];

export default function RevenueFinancingDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStreams, setSelectedStreams] = useState<string[]>([
    "str-1",
    "str-2",
  ]);
  const [repaymentPercentage, setRepaymentPercentage] = useState(8); // 8% din vânzările zilnice

  const filteredStreams = MOCK_REVENUE_STREAMS.filter((s) =>
    s.platform.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeStreams = MOCK_REVENUE_STREAMS.filter((s) =>
    selectedStreams.includes(s.id),
  );
  const combinedMRR = activeStreams.reduce((sum, s) => sum + s.mrr, 0);
  const maxFundingCapacity = activeStreams.reduce(
    (sum, s) => sum + s.verifiedLimit,
    0,
  );

  // Stările pentru slider-ul de finanțare solicitată
  const [requestedCapital, setRequestedCapital] = useState(
    maxFundingCapacity / 2,
  );

  useEffect(() => {
    setRequestedCapital(maxFundingCapacity / 2);
  }, [selectedStreams]);

  // Logica de calcul RBF (Factor fee standard de 1.06x - 1.10x în funcție de risc)
  const factorRate = repaymentPercentage > 10 ? 1.05 : 1.08;
  const totalPaybackAmount = requestedCapital * factorRate;
  const totalFactorFee = totalPaybackAmount - requestedCapital;

  // Estimare zile de rambursare pe baza vânzărilor zilnice estimate din MRR
  const dailyRevenue = combinedMRR / 30;
  const dailyRepaymentDeduction = dailyRevenue * (repaymentPercentage / 100);
  const estimatedDaysToRepay =
    dailyRepaymentDeduction > 0
      ? Math.round(totalPaybackAmount / dailyRepaymentDeduction)
      : 0;

  const toggleStream = (id: string) => {
    setSelectedStreams((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[484px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-3 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Cpu size={14} />
            </div>
            Revenue-Based Growth Capital
          </h2>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
            API LINKED
          </span>
        </div>

        {/* INPUT DE CĂUTARE FLUID */}
        <div className="relative shrink-0">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="FILTER CONNECTED MERCHANT ACCOUNTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#02040f]/60 border border-cyan-500/30 focus:border-cyan-400 rounded-lg pl-8 pr-7 py-2 font-mono text-[10px] text-cyan-400 placeholder-slate-500 uppercase tracking-wider focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* MERCHANT ACCOUNT STREAMS GRID */}
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
          {filteredStreams.map((stream) => {
            const isSelected = selectedStreams.includes(stream.id);
            const isSyncing = stream.status === "SYNCING";
            return (
              <div
                key={stream.id}
                onClick={() => !isSyncing && toggleStream(stream.id)}
                className={`flex justify-between items-center p-2.5 rounded-lg font-mono text-[11px] border transition-all ${
                  isSyncing
                    ? "opacity-40 cursor-wait bg-[#02040f]/20 border-transparent"
                    : isSelected
                      ? "bg-[#02040f] border-cyan-400 shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] cursor-pointer"
                      : "bg-[#02040f]/50 border-blue-500/10 hover:border-cyan-500/40 hover:bg-[#02040f]/80 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${isSelected ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-slate-600"}`}
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-white tracking-wide">
                      {stream.platform}
                    </span>
                    <span className="text-[8px] text-slate-500 uppercase">
                      Verified MRR: ${stream.mrr.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div>
                    <span className="font-black text-white text-xs block">
                      ${stream.verifiedLimit.toLocaleString()}
                    </span>
                    <span className="text-[8px] text-slate-500 uppercase">
                      Funding Limit
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INTERACTIVE CONTROLS & ESTIMATOR GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#02040f]/40 border border-blue-500/5 p-3.5 rounded-lg shrink-0">
          {/* SLIDERS BLOCK */}
          <div className="flex flex-col gap-3 font-mono justify-center">
            {/* SOLICITED CAPITAL SLIDER */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-bold uppercase tracking-wider">
                  Requested Funding
                </span>
                <span className="text-cyan-400 font-black">
                  ${requestedCapital.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={maxFundingCapacity > 0 ? 5000 : 0}
                max={maxFundingCapacity || 10000}
                step={5000}
                disabled={maxFundingCapacity === 0}
                value={requestedCapital}
                onChange={(e) => setRequestedCapital(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* DAILY REPAYMENT SHARE RATE */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-bold uppercase tracking-wider">
                  Daily Split Share
                </span>
                <span className="text-cyan-400 font-black">
                  {repaymentPercentage}% of Sales
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={20}
                step={1}
                value={repaymentPercentage}
                onChange={(e) => setRepaymentPercentage(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* OUTPUT LEDGER */}
          <div className="flex flex-col justify-between font-mono text-[11px] border-t md:border-t-0 md:border-l border-cyan-500/10 pt-3 md:pt-0 md:pl-4">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">FACTOR FEE RATE:</span>
                <span className="text-white font-bold">{factorRate}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TOTAL COST REPAY:</span>
                <span className="text-rose-400 font-bold">
                  ${Math.round(totalPaybackAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ESTIMATED MATURITY:</span>
                <span className="text-cyan-400 font-bold">
                  ~ {estimatedDaysToRepay} Days
                </span>
              </div>
            </div>

            <div className="p-1.5 rounded border border-cyan-500/20 bg-[#02040f] flex justify-between items-center mt-2">
              <span className="text-[8px] text-slate-400 font-bold uppercase">
                FACTOR COST METRIC
              </span>
              <span className="text-xs font-black text-cyan-400">
                ${Math.round(totalFactorFee).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="shrink-0">
          <button
            disabled={maxFundingCapacity === 0}
            className="cursor-pointer w-full py-2.5 rounded bg-cyan-400 hover:bg-cyan-300 text-[#02040f] font-mono font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            DISPATCH EXPANSION CAPITAL
          </button>
        </div>
      </div>
    </div>
  );
}
