"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Search, X, Globe, Coins, Zap, Check } from "lucide-react";

type ConversionCategory = "AIR_MILES" | "CRYPTO_NODES";

interface ConversionTarget {
  id: string;
  category: ConversionCategory;
  name: string;
  ticker: string;
  rateMultiplier: number; // Ex: 10 puncte = 1 unitate
  networkFee: string;
}

const MOCK_TARGETS: ConversionTarget[] = [
  {
    id: "trg-01",
    category: "AIR_MILES",
    name: "EMIRATES SKYWARDS",
    ticker: "MILES",
    rateMultiplier: 8,
    networkFee: "ZERO FEES",
  },
  {
    id: "trg-02",
    category: "AIR_MILES",
    name: "AF-KLM FLYING BLUE",
    ticker: "MILES",
    rateMultiplier: 10,
    networkFee: "ZERO FEES",
  },
  {
    id: "trg-03",
    category: "AIR_MILES",
    name: "ANA MILEAGE CLUB VVIP",
    ticker: "MILES",
    rateMultiplier: 6,
    networkFee: "500 PTS SYNC",
  },
  {
    id: "trg-04",
    category: "CRYPTO_NODES",
    name: "BITCOIN SECURE BLOCK",
    ticker: "SATS",
    rateMultiplier: 1.2,
    networkFee: "1200 PTS MINER",
  },
  {
    id: "trg-05",
    category: "CRYPTO_NODES",
    name: "ETHER VALIDATOR NODE",
    ticker: "GWEI",
    rateMultiplier: 0.8,
    networkFee: "800 PTS GAS",
  },
];

interface Props {
  pointsBalance: number;
  onExecuteConversion: (pointsDeducted: number, toastMessage: string) => void;
}

export default function PointsConversionHub({
  pointsBalance,
  onExecuteConversion,
}: Props) {
  const [activeTab, setActiveTab] = useState<ConversionCategory>("AIR_MILES");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("trg-01");
  const [pointsToSwap, setPointsToSwap] = useState(25000);

  const filteredTargets = MOCK_TARGETS.filter(
    (t) =>
      t.category === activeTab &&
      (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticker.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const currentTarget =
    MOCK_TARGETS.find((t) => t.id === selectedTargetId) || MOCK_TARGETS[0];

  // Forțăm selectarea primului element din noul tab când utilizatorul schimbă categoria
  useEffect(() => {
    const firstOfTab = MOCK_TARGETS.find((t) => t.category === activeTab);
    if (firstOfTab) setSelectedTargetId(firstOfTab.id);
  }, [activeTab]);

  // Recalibrare slider dacă valoarea depășește balanța curentă a utilizatorului
  useEffect(() => {
    if (pointsToSwap > pointsBalance) {
      setPointsToSwap(Math.max(0, pointsBalance));
    }
  }, [pointsBalance]);

  // Calcule matematice de conversie directă
  const outputUnits = Math.round(pointsToSwap / currentTarget.rateMultiplier);
  const canConvert = pointsToSwap > 0 && pointsBalance >= pointsToSwap;

  const handleSwapTrigger = () => {
    if (!canConvert) return;
    const msg = `CONVERSION COMPLETE: Swapped ${pointsToSwap.toLocaleString()} Points into ${outputUnits.toLocaleString()} ${currentTarget.ticker} transferred directly to your external ${currentTarget.name} wallet matrix.`;
    onExecuteConversion(pointsToSwap, msg);
  };

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[484px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-3">
        {/* HEADER CONTROL TABS */}
        <div className="flex justify-between items-center pb-3 border-b border-cyan-500/10 shrink-0">
          <div className="flex gap-1 bg-[#02040f] border border-cyan-500/20 p-0.5 rounded">
            <button
              onClick={() => {
                setActiveTab("AIR_MILES");
                setSearchQuery("");
              }}
              className={`cursor-pointer px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                activeTab === "AIR_MILES"
                  ? "bg-cyan-400 text-[#02040f]"
                  : "text-slate-400 hover:text-cyan-400"
              }`}
            >
              AIR MILES
            </button>
            <button
              onClick={() => {
                setActiveTab("CRYPTO_NODES");
                setSearchQuery("");
              }}
              className={`cursor-pointer px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                activeTab === "CRYPTO_NODES"
                  ? "bg-cyan-400 text-[#02040f]"
                  : "text-slate-400 hover:text-cyan-400"
              }`}
            >
              CRYPTO ASSETS
            </button>
          </div>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest uppercase">
            SWAP NODE
          </span>
        </div>

        {/* CONTRAST HIGH VISIBILITY SEARCH */}
        <div className="relative shrink-0">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400"
          />
          <input
            type="text"
            placeholder={`FILTER GATES FOR ${activeTab === "AIR_MILES" ? "MILES" : "TOKENS"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#02040f]/60 border border-cyan-500/50 focus:border-cyan-400 rounded-lg pl-8 pr-7 py-1.5 font-mono text-[10px] text-white placeholder-slate-500 uppercase tracking-wider focus:outline-none transition-all"
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

        {/* TARGET LIST VIEW SELECTION */}
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-0.5 bg-black/10 rounded border border-blue-500/5 p-1">
          {filteredTargets.map((target) => {
            const isSelected = selectedTargetId === target.id;
            return (
              <div
                key={target.id}
                onClick={() => setSelectedTargetId(target.id)}
                className={`flex justify-between items-center p-2 rounded font-mono text-[10px] border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#02040f] border-cyan-400 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]"
                    : "bg-[#02040f]/50 border-blue-500/10 hover:border-cyan-500/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded border text-[9px] font-black flex items-center justify-center ${
                      isSelected
                        ? "bg-cyan-400 text-black border-transparent"
                        : "bg-cyan-950/20 border-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    {target.category === "AIR_MILES" ? "AV" : "CR"}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white uppercase tracking-wide">
                      {target.name}
                    </span>
                    <span className="text-[7px] text-slate-500 uppercase">
                      Vector Multiplier: {target.rateMultiplier} Pts = 1{" "}
                      {target.ticker}
                    </span>
                  </div>
                </div>

                <span className="text-[8px] text-slate-400 font-bold uppercase bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
                  {target.networkFee}
                </span>
              </div>
            );
          })}
        </div>

        {/* INTERACTIVE QUANTUM SWAP SLIDER CONTROL */}
        <div className="bg-[#02040f]/80 border border-cyan-500/20 p-3 rounded-lg font-mono shrink-0 space-y-2.5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500 font-bold uppercase">
              Liquidation Points Size
            </span>
            <span className="text-cyan-400 font-black">
              {pointsToSwap.toLocaleString()} PTS
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(1000, pointsBalance)}
            step={1000}
            disabled={pointsBalance === 0}
            value={pointsToSwap}
            onChange={(e) => setPointsToSwap(Number(e.target.value))}
            className="w-full accent-cyan-400 h-1 bg-cyan-950 rounded appearance-none cursor-pointer"
          />

          {/* DYNAMIC RATE REAL-TIME LEDGER DISPLAY */}
          <div className="pt-2 border-t border-cyan-500/10 flex justify-between items-center">
            <span className="text-slate-400 text-[10px] uppercase">
              OUTPUT METRIC PACK
            </span>
            <div className="text-right">
              <span className="text-sm font-black text-emerald-400 drop-shadow-[0_0_6px_#34d399]">
                {outputUnits.toLocaleString()}
              </span>
              <span className="text-[9px] text-white font-bold ml-1 uppercase">
                {currentTarget.ticker}
              </span>
            </div>
          </div>
        </div>

        {/* PRIMARY SUBMIT ACTION */}
        <div className="shrink-0">
          <button
            disabled={!canConvert}
            onClick={handleSwapTrigger}
            className="cursor-pointer w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-[#02040f] font-mono font-black text-[10px] uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {!canConvert && pointsToSwap > 0
              ? "INSUFFICIENT TERMINAL ALLOCATION"
              : "EXECUTE SWAP MATRIX"}
          </button>
        </div>
      </div>
    </div>
  );
}
