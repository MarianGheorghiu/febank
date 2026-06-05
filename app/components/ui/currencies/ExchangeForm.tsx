"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRightLeft,
  Cpu,
  RefreshCw,
  ChevronDown,
  Search,
} from "lucide-react";

const ASSET_PRICES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  RON: 0.22,
  BTC: 67500.0,
  ETH: 3500.0,
  AAPL: 190.0,
  NVDA: 950.0,
};

const ASSET_TYPES: Record<string, "FIAT" | "CRYPTO" | "STOCK"> = {
  RON: "FIAT",
  EUR: "FIAT",
  USD: "FIAT",
  BTC: "CRYPTO",
  ETH: "CRYPTO",
  AAPL: "STOCK",
  NVDA: "STOCK",
};

export default function ExchangeForm() {
  const [payAsset, setPayAsset] = useState("RON");
  const [receiveAsset, setReceiveAsset] = useState("BTC");

  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [paySearch, setPaySearch] = useState("");
  const payRef = useRef<HTMLDivElement>(null);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveSearch, setReceiveSearch] = useState("");
  const receiveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (payRef.current && !payRef.current.contains(event.target as Node)) {
        setPayOpen(false);
        setPaySearch("");
      }
      if (
        receiveRef.current &&
        !receiveRef.current.contains(event.target as Node)
      ) {
        setReceiveOpen(false);
        setReceiveSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const pricePay = ASSET_PRICES[payAsset];
    const priceReceive = ASSET_PRICES[receiveAsset];

    if (pricePay && priceReceive) {
      const rate = pricePay / priceReceive;
      setExchangeRate(rate);

      if (payAmount && !isNaN(Number(payAmount))) {
        const calculated = Number(payAmount) * rate;
        const decimals = ASSET_TYPES[receiveAsset] === "CRYPTO" ? 6 : 2;
        setReceiveAmount(calculated.toFixed(decimals));
      } else {
        setReceiveAmount("");
      }
    }
  }, [payAsset, receiveAsset, payAmount]);

  const handleInvert = () => {
    const temp = payAsset;
    setPayAsset(receiveAsset);
    setReceiveAsset(temp);
    setPayAmount(receiveAmount);
  };

  const handleExecuteSwap = () => {
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0)
      return;
    setIsSwapping(true);
    setTimeout(() => {
      setIsSwapping(false);
      setPayAmount("");
      alert(
        `TRANSMISSION SUCCESSFUL: Swapped ${payAmount} ${payAsset} to ${receiveAmount} ${receiveAsset}`,
      );
    }, 1200);
  };

  const colorAssetTag = (asset: string) => {
    const type = ASSET_TYPES[asset];
    if (type === "FIAT")
      return "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
    if (type === "CRYPTO")
      return "text-cyan-400 bg-cyan-500/5 border-cyan-500/10";
    return "text-amber-400 bg-amber-500/5 border-amber-500/10";
  };

  const filteredPayAssets = Object.keys(ASSET_PRICES).filter((asset) =>
    asset.toLowerCase().includes(paySearch.toLowerCase()),
  );

  const filteredReceiveAssets = Object.keys(ASSET_PRICES).filter((asset) =>
    asset.toLowerCase().includes(receiveSearch.toLowerCase()),
  );

  const isValidInput =
    payAmount && !isNaN(Number(payAmount)) && Number(payAmount) > 0;

  return (
    // Păstrat structura exterioară neschimbată (w-full, h-full, p-4 sm:p-5)
    <div className="relative border border-cyan-500/30  bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 flex flex-col w-full h-full transition-all duration-300 group hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-blue-500/10 shrink-0">
          <h2 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-blue-500/10 text-blue-400">
              <ArrowRightLeft size={14} />
            </div>
            Quantum Swap Engine
          </h2>
          <span className="flex items-center gap-1.5 text-[9px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-500/20 font-bold tracking-wider">
            <Cpu
              size={10}
              className={isSwapping ? "animate-spin" : "animate-pulse"}
            />
            {isSwapping ? "PROCESSING" : "ENGINE ONLINE"}
          </span>
        </div>

        {/* CORP CONVERSIE (Fluid, se adaptează la înălțimea containerului tău) */}
        <div className="flex flex-col gap-1 relative flex-1 justify-center my-auto">
          {/* SECȚIUNE PAY */}
          <div className="bg-[#02040f]/60 border border-blue-500/10 rounded-xl p-4 flex flex-col gap-2 hover:border-blue-500/20 transition-colors">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Source Asset (Pay)
              </label>
              <span
                className={`text-[9px] font-mono px-1 rounded border uppercase tracking-widest ${colorAssetTag(payAsset)}`}
              >
                {ASSET_TYPES[payAsset]}
              </span>
            </div>
            <div className="flex gap-2 items-center justify-between">
              {/* SELECT CUSTOM - PAY */}
              <div className="relative shrink-0" ref={payRef}>
                <button
                  type="button"
                  onClick={() => setPayOpen(!payOpen)}
                  className="bg-[#02040f] border border-blue-500/20 hover:border-blue-500/40 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white flex items-center justify-between gap-2 w-[95px] sm:w-[105px] transition-all active:scale-95 shadow-md"
                >
                  <span>{payAsset}</span>
                  <ChevronDown
                    size={12}
                    className={`text-slate-500 transition-transform duration-200 ${payOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {payOpen && (
                  <div className="absolute left-0 top-full mt-1 w-[140px] bg-[#02040f] border border-blue-500/30 rounded-lg shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="relative border-b border-blue-500/10 p-1 bg-[#0a1024]/80 rounded-t-lg">
                      <Search
                        size={10}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600"
                      />
                      <input
                        type="text"
                        placeholder="SEARCH..."
                        value={paySearch}
                        onChange={(e) => setPaySearch(e.target.value)}
                        className="w-full bg-transparent pl-5 pr-2 py-1 font-mono text-[10px] text-cyan-400 placeholder-slate-600 outline-none uppercase tracking-wider"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[140px] overflow-y-auto scrollbar-thin p-1 space-y-0.5 bg-[#02040f] rounded-b-lg">
                      {filteredPayAssets.map((asset) => (
                        <button
                          key={asset}
                          type="button"
                          onClick={() => {
                            setPayAsset(asset);
                            setPayOpen(false);
                            setPaySearch("");
                          }}
                          className={`w-full text-left font-mono text-xs px-2 py-1.5 rounded transition-colors flex items-center justify-between ${payAsset === asset ? "bg-blue-500/10 text-blue-400 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                        >
                          <span>{asset}</span>
                          <span className="text-[8px] opacity-40 uppercase">
                            {ASSET_TYPES[asset].slice(0, 3)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input tip Revolut (Mare și curat) */}
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="bg-transparent text-right font-sans text-2xl sm:text-3xl text-white outline-none w-full min-w-0 flex-1 placeholder-slate-700 truncate font-semibold"
              />
            </div>
          </div>

          {/* INVERT BUTTON (Bula curată poziționată la mijloc) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <button
              onClick={handleInvert}
              type="button"
              className="w-8 h-8 bg-[#02040f] border border-blue-500/20 rounded-full text-blue-400 hover:text-white hover:border-blue-500/40 transition-all flex items-center justify-center cursor-pointer active:scale-90 shadow-md"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {/* SECȚIUNE RECEIVE */}
          <div className="bg-[#02040f]/60 border border-blue-500/10 rounded-xl p-4 flex flex-col gap-2 hover:border-blue-500/20 transition-colors">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Target Asset (Receive)
              </label>
              <span
                className={`text-[9px] font-mono px-1 rounded border uppercase tracking-widest ${colorAssetTag(receiveAsset)}`}
              >
                {ASSET_TYPES[receiveAsset]}
              </span>
            </div>
            <div className="flex gap-2 items-center justify-between">
              {/* SELECT CUSTOM - RECEIVE */}
              <div className="relative shrink-0" ref={receiveRef}>
                <button
                  type="button"
                  onClick={() => setReceiveOpen(!receiveOpen)}
                  className="bg-[#02040f] border border-blue-500/20 hover:border-blue-500/40 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white flex items-center justify-between gap-2 w-[95px] sm:w-[105px] transition-all active:scale-95 shadow-md"
                >
                  <span>{receiveAsset}</span>
                  <ChevronDown
                    size={12}
                    className={`text-slate-500 transition-transform duration-200 ${receiveOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {receiveOpen && (
                  <div className="absolute left-0 top-full mt-1 w-[140px] bg-[#02040f] border border-blue-500/30 rounded-lg shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="relative border-b border-blue-500/10 p-1 bg-[#0a1024]/80 rounded-t-lg">
                      <Search
                        size={10}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600"
                      />
                      <input
                        type="text"
                        placeholder="SEARCH..."
                        value={receiveSearch}
                        onChange={(e) => setReceiveSearch(e.target.value)}
                        className="w-full bg-transparent pl-5 pr-2 py-1 font-mono text-[10px] text-cyan-400 placeholder-slate-600 outline-none uppercase tracking-wider"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[140px] overflow-y-auto scrollbar-thin p-1 space-y-0.5 bg-[#02040f] rounded-b-lg">
                      {filteredReceiveAssets.map((asset) => (
                        <button
                          key={asset}
                          type="button"
                          onClick={() => {
                            setReceiveAsset(asset);
                            setReceiveOpen(false);
                            setReceiveSearch("");
                          }}
                          className={`w-full text-left font-mono text-xs px-2 py-1.5 rounded transition-colors flex items-center justify-between ${receiveAsset === asset ? "bg-blue-500/10 text-blue-400 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                        >
                          <span>{asset}</span>
                          <span className="text-[8px] opacity-40 uppercase">
                            {ASSET_TYPES[asset].slice(0, 3)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Rezultat tip Revolut */}
              <input
                type="text"
                value={receiveAmount}
                readOnly
                placeholder="0"
                className="bg-transparent text-right font-sans text-2xl sm:text-3xl text-blue-400 font-semibold outline-none w-full min-w-0 flex-1 select-all truncate placeholder-slate-700/50"
              />
            </div>
          </div>
        </div>

        {/* FOOTER (Păstrat pe rând sau stivuit frumos, lipit de fundul containerului) */}
        <div className="mt-3 pt-3 border-t border-blue-500/10 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex flex-col font-mono text-[10px] tracking-wide text-center sm:text-left">
            <span className="text-slate-500 uppercase">
              Index Exchange Rate
            </span>
            <span className="text-slate-300 font-bold mt-0.5">
              1 {payAsset} ≈{" "}
              {exchangeRate < 0.01
                ? exchangeRate.toFixed(7)
                : exchangeRate.toFixed(4)}{" "}
              {receiveAsset}
            </span>
          </div>

          {/* Buton intuitiv adaptat stilului tău de acțiune original */}
          <button
            onClick={handleExecuteSwap}
            disabled={isSwapping || !isValidInput}
            className={`w-full sm:w-auto font-sans font-bold text-xs px-5 py-2.5 rounded-xl transition-all tracking-wider uppercase active:scale-95 cursor-pointer border
              ${
                isValidInput
                  ? "bg-blue-500 text-white border-blue-400 hover:bg-blue-600 shadow-md"
                  : "bg-blue-500/5 text-blue-400/30 border-blue-500/10 cursor-not-allowed"
              }`}
          >
            {isSwapping
              ? "Executing..."
              : isValidInput
                ? "Execute Swap"
                : "Exchange"}
          </button>
        </div>
      </div>
    </div>
  );
}
