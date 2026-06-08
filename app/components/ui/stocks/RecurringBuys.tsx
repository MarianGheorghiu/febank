"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Repeat,
  Plus,
  Bot,
  PauseCircle,
  PlayCircle,
  Settings2,
  X,
  Search,
  Check,
  Loader2,
} from "lucide-react";

// --- MOCK DATA ---
const MOCK_DCA = [
  {
    id: "dca_1",
    symbol: "VOO",
    name: "Vanguard S&P 500",
    amount: 150,
    frequency: "Monthly",
    day: "25th",
    nextRun: "2026-06-25",
    status: "ACTIVE",
  },
  {
    id: "dca_2",
    symbol: "AAPL",
    name: "Apple Inc.",
    amount: 25,
    frequency: "Weekly",
    day: "Mondays",
    nextRun: "2026-06-15",
    status: "ACTIVE",
  },
  {
    id: "dca_3",
    symbol: "BTC",
    name: "Bitcoin",
    amount: 50,
    frequency: "Bi-Weekly",
    day: "Fridays",
    nextRun: "2026-06-12",
    status: "PAUSED",
  },
];

const AVAILABLE_ASSETS = [
  { symbol: "BTC", name: "Bitcoin", type: "Crypto" },
  { symbol: "ETH", name: "Ethereum", type: "Crypto" },
  { symbol: "SOL", name: "Solana", type: "Crypto" },
  { symbol: "AAPL", name: "Apple Inc.", type: "Stock" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "Stock" },
  { symbol: "NVDA", name: "NVIDIA Corp.", type: "Stock" },
  { symbol: "VOO", name: "Vanguard S&P 500", type: "ETF" },
  { symbol: "QQQ", name: "Invesco QQQ", type: "ETF" },
];

// --- MODAL COMPONENT (WITH PORTAL) ---
interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlan: (plan: any) => void;
}

function NewPlanModal({ isOpen, onClose, onAddPlan }: NewPlanModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"Daily" | "Weekly" | "Monthly">(
    "Weekly",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedAsset(null);
      setAmount("");
      setFrequency("Weekly");
      setIsProcessing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const filteredAssets = AVAILABLE_ASSETS.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      onAddPlan({
        id: `dca_${Math.random().toString(36).substr(2, 9)}`,
        symbol: selectedAsset.symbol,
        name: selectedAsset.name,
        amount: parseFloat(amount),
        frequency,
        day:
          frequency === "Weekly"
            ? "Mondays"
            : frequency === "Monthly"
              ? "1st"
              : "Everyday",
        nextRun: new Date().toISOString().split("T")[0],
        status: "ACTIVE",
      });
      setIsProcessing(false);
      onClose();
    }, 1200);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-mono">
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-[#020617]/80 backdrop-blur-xl transition-all duration-300 cursor-pointer"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* TERMINAL CONTAINER */}
      <div className="relative w-full sm:max-w-md bg-gradient-to-b from-[#0b1b36]/95 to-[#040819] border-t sm:border border-blue-500/40 sm:rounded-xl p-4 sm:p-5 shadow-[0_0_50px_rgba(59,130,246,0.25)] backdrop-blur-2xl transition-all transform duration-300 ease-out z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

        {/* HEADER */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-500/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded text-[10px] font-black border bg-blue-500/10 border-blue-500/40 text-blue-400 uppercase tracking-widest">
              INIT ROUTINE
            </div>
            <h3 className="text-xs font-bold tracking-wider text-white uppercase">
              New Auto-Invest
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin space-y-4">
          {/* STEP 1: SEARCH ASSET */}
          <div className="space-y-2">
            <label className="text-[10px] text-blue-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                1
              </span>
              Target Asset
            </label>

            {!selectedAsset ? (
              <div className="space-y-2">
                <div className="relative group">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Search ticker or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#030712]/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-800/50 rounded-lg p-1 bg-black/20">
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <button
                        key={asset.symbol}
                        type="button"
                        onClick={() => setSelectedAsset(asset)}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                            {asset.symbol}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {asset.name}
                          </span>
                        </div>
                        <span className="text-[8px] uppercase border border-slate-700 bg-slate-800/50 px-1.5 py-0.5 rounded text-slate-400">
                          {asset.type}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No assets found.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-blue-950/30 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-[#020510] border border-blue-500/30 flex items-center justify-center font-black text-xs text-blue-400">
                    {selectedAsset.symbol[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">
                      {selectedAsset.symbol}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedAsset.name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="text-[9px] uppercase border border-slate-600 text-slate-300 px-2 py-1 rounded hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: CONFIGURATION */}
          <div
            className={`space-y-4 transition-all duration-300 ${selectedAsset ? "opacity-100" : "opacity-30 pointer-events-none"}`}
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent my-2" />

            <label className="text-[10px] text-blue-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                2
              </span>
              Parameters
            </label>

            <form id="dca-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 tracking-wider">
                  AMOUNT (USD)
                </span>
                <input
                  type="number"
                  required
                  disabled={isProcessing}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="5"
                  step="1"
                  className="w-full bg-[#030712]/80 border border-slate-700 rounded-lg pl-28 pr-3 py-3 text-sm font-bold text-white text-right focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                  Frequency
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["Daily", "Weekly", "Monthly"] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFrequency(freq)}
                      className={`py-2 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all duration-300 border ${
                        frequency === freq
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                          : "border-slate-800 text-slate-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="mt-4 pt-4 border-t border-slate-800 shrink-0">
          <button
            type="submit"
            form="dca-form"
            disabled={
              !selectedAsset ||
              !amount ||
              parseFloat(amount) <= 0 ||
              isProcessing
            }
            className="w-full py-3.5 rounded-lg font-black text-[11px] tracking-widest uppercase text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/50 active:scale-[0.98] disabled:opacity-30 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                CONFIGURING...
              </>
            ) : (
              <>
                <Check size={14} />
                DEPLOY ROUTINE
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// --- MAIN COMPONENT ---
export default function RecurringBuys() {
  const [dcaList, setDcaList] = useState(MOCK_DCA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState(""); // State pentru search-ul din modul

  const toggleStatus = (id: string) => {
    setDcaList(
      dcaList.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }
          : item,
      ),
    );
  };

  const handleAddPlan = (newPlan: any) => {
    setDcaList([newPlan, ...dcaList]);
  };

  // Filtrarea listei principale bazată pe input-ul din modul
  const filteredDcaList = dcaList.filter(
    (item) =>
      item.symbol.toLowerCase().includes(moduleSearchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()),
  );

  return (
    <div className="relative bg-[#0a1024] border border-blue-500/30 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group hover:border-blue-500/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col h-full font-mono min-h-[440px]">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full gap-4">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-2 border-b border-blue-500/10 shrink-0">
          <h2 className="text-blue-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <Repeat size={14} />
            DCA Auto-Pilot
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-white transition-all duration-300 px-3 py-1.5 rounded-md font-black text-[10px] tracking-widest uppercase cursor-pointer hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95"
          >
            <Plus size={14} /> New Plan
          </button>
        </div>

        {/* INFO BOX */}
        <div className="flex items-start gap-3 p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg shrink-0">
          <Bot size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[9px] text-blue-200/70 leading-relaxed uppercase tracking-wider">
            Automate your wealth. The engine will purchase fractional shares
            based on your recurring schedule using available buying power.
          </p>
        </div>

        {/* MODULE SEARCH BAR */}
        <div className="relative group shrink-0">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"
          />
          <input
            type="text"
            placeholder="Filter routines by ticker..."
            value={moduleSearchQuery}
            onChange={(e) => setModuleSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-blue-500/20 rounded pl-8 pr-7 py-1.5 text-[10px] font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_10px_rgba(59,130,246,0.1)] transition-all uppercase tracking-wider"
          />
          {moduleSearchQuery && (
            <button
              onClick={() => setModuleSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* DCA LIST */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>
              Active Routines (
              {dcaList.filter((d) => d.status === "ACTIVE").length})
            </span>
            {moduleSearchQuery && (
              <span className="text-blue-400 text-[9px] lowercase font-normal">
                found {filteredDcaList.length} matches
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredDcaList.length > 0 ? (
              filteredDcaList.map((item) => {
                const isActive = item.status === "ACTIVE";

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-all flex flex-col gap-2 ${isActive ? "bg-[#051124]/60 border-blue-500/20 hover:border-blue-500/50" : "bg-black/30 border-white/5 opacity-75"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded flex items-center justify-center font-black text-xs border ${isActive ? "bg-[#020510] text-blue-400 border-blue-500/30" : "bg-black text-slate-500 border-white/10"}`}
                        >
                          {item.symbol[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {item.symbol}
                            {!isActive && (
                              <span className="text-[8px] text-rose-400 border border-rose-500/30 bg-rose-950/30 px-1 rounded uppercase">
                                Paused
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase">
                            <strong className="text-white">
                              ${item.amount}
                            </strong>{" "}
                            / {item.frequency}
                          </span>
                        </div>
                      </div>

                      {/* TOGGLE/ACTION BUTTON */}
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                      >
                        {isActive ? (
                          <PauseCircle
                            size={18}
                            className="hover:text-amber-400"
                          />
                        ) : (
                          <PlayCircle
                            size={18}
                            className="hover:text-emerald-400"
                          />
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/5">
                      <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                        <Settings2 size={10} /> {item.day}
                      </span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">
                        Next:{" "}
                        <span className={isActive ? "text-cyan-400" : ""}>
                          {new Date(item.nextRun).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-600 border border-dashed border-slate-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  No plans match filter
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL INSTANCE */}
      <NewPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPlan={handleAddPlan}
      />
    </div>
  );
}
