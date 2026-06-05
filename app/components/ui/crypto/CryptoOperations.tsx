"use client";

import React, { useState, useEffect, useRef } from "react";
import { Landmark, ChevronDown, Search } from "lucide-react";

const ASSET_PRICES: Record<string, number> = {
  EUR: 1.0,
  RON: 0.2,
  BTC: 87000.0,
  ETH: 3200.0,
};

export default function CryptoOperations() {
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [fiatAsset, setFiatAsset] = useState("EUR");
  const [cryptoAsset, setCryptoAsset] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionText, setConversionText] = useState(
    "0.00 EUR = 0.000000 BTC",
  );

  const fiatRef = useRef<HTMLDivElement>(null);
  const [fiatOpen, setFiatOpen] = useState(false);
  const [fiatSearch, setFiatSearch] = useState("");

  const cryptoRef = useRef<HTMLDivElement>(null);
  const [cryptoOpen, setCryptoOpen] = useState(false);
  const [cryptoSearch, setCryptoSearch] = useState("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fiatRef.current && !fiatRef.current.contains(event.target as Node)) {
        setFiatOpen(false);
        setFiatSearch("");
      }
      if (
        cryptoRef.current &&
        !cryptoRef.current.contains(event.target as Node)
      ) {
        setCryptoOpen(false);
        setCryptoSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setConversionText(
        tradeType === "BUY"
          ? `0.00 ${fiatAsset} = 0.000000 ${cryptoAsset}`
          : `0.000000 ${cryptoAsset} = 0.00 ${fiatAsset}`,
      );
      return;
    }

    const fiatPriceInEur = ASSET_PRICES[fiatAsset];
    const cryptoPriceInEur = ASSET_PRICES[cryptoAsset];

    if (tradeType === "BUY") {
      const totalEur = numAmount * fiatPriceInEur;
      const cryptoReceived = totalEur / cryptoPriceInEur;
      setConversionText(
        `${numAmount.toLocaleString()} ${fiatAsset} = ${cryptoReceived.toFixed(6)} ${cryptoAsset}`,
      );
    } else {
      const totalEur = numAmount * cryptoPriceInEur;
      const fiatReceived = totalEur / fiatPriceInEur;
      setConversionText(
        `${numAmount.toFixed(6)} ${cryptoAsset} = ${fiatReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fiatAsset}`,
      );
    }
  }, [amount, tradeType, fiatAsset, cryptoAsset]);

  const handleExecuteSubmit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setAmount("");
      alert(`TRANSMISSION SUCCESSFUL: Settled trade sequence via core router.`);
    }, 1250);
  };

  const filteredFiat = ["EUR", "RON"].filter((acc) =>
    acc.toLowerCase().includes(fiatSearch.toLowerCase()),
  );

  const filteredCrypto = ["BTC", "ETH"].filter((coin) =>
    coin.toLowerCase().includes(cryptoSearch.toLowerCase()),
  );

  const isValidInput = amount && !isNaN(Number(amount)) && Number(amount) > 0;

  return (
    /* INTEGRAT: Fundalul nou, blur-ul și efectul de hover pe Cyan potrivit pentru BUY */
    <div className="relative bg-[#0a1024] sm:backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 flex flex-col w-full h-full justify-between font-mono text-white select-none shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300 group overflow-hidden">
      {/* Neon Glow Cyberpunk Activat pe Hover potrivit cu stilul formei tale */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-3.5">
        {/* HEADER CONSOLE */}
        <div className="flex justify-between items-center bg-[#02040f] border border-blue-500/10 p-1.5 rounded-lg shrink-0 gap-4">
          <h2 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-white">
            <Landmark size={14} className="text-cyan-400 shrink-0" />
            <span>Operations</span>
          </h2>

          {/* CYBERPUNK TOGGLE SELECTOR */}
          <div className="flex bg-[#0a1024] border border-blue-500/10 p-0.5 rounded gap-0.5 shrink-0 w-36 h-7 items-center">
            <button
              type="button"
              onClick={() => {
                setTradeType("BUY");
                setAmount("");
              }}
              className={`flex-1 text-[11px] h-full font-black tracking-widest transition-all rounded text-center cursor-pointer uppercase ${
                tradeType === "BUY"
                  ? "bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)] font-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => {
                setTradeType("SELL");
                setAmount("");
              }}
              className={`flex-1 text-[11px] h-full font-black tracking-widest transition-all rounded text-center cursor-pointer uppercase ${
                tradeType === "SELL"
                  ? "bg-[#ff007f] text-white shadow-[0_0_10px_rgba(255,0,127,0.4)] font-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        {/* COMPARTIMENT CENTRAL CONTROALE */}
        <div className="bg-[#02040f]/40 border border-blue-500/10 rounded-xl p-3 flex flex-col gap-3 flex-1 justify-center">
          {/* SELECTOARE ASSETS */}
          <div className="flex items-center justify-between gap-3">
            {/* FIAT SELECTION */}
            <div className="flex flex-col gap-1 w-1/2 relative" ref={fiatRef}>
              <span className="text-white text-[9px] font-black tracking-widest uppercase pl-0.5">
                {tradeType === "BUY" ? "PAY ASSET" : "RCV ASSET"}
              </span>
              <button
                type="button"
                onClick={() => setFiatOpen(!fiatOpen)}
                className="relative bg-[#02040f]/60 border border-blue-500/10 hover:border-cyan-500/30 rounded-lg pl-3 pr-8 py-2.5 text-xs font-bold text-white flex items-center justify-between transition-all w-full min-w-0"
              >
                <span className="truncate tracking-wider text-white">
                  {fiatAsset}
                </span>
                <ChevronDown
                  size={13}
                  className="text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none"
                />
              </button>

              {fiatOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-[#02040f] rounded-lg shadow-2xl z-50 flex flex-col p-1 border border-cyan-500/30">
                  <div className="relative p-1 bg-[#0a1024] border border-blue-500/10 rounded mb-1">
                    <Search
                      size={11}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-cyan-400/40"
                    />
                    <input
                      type="text"
                      placeholder="FIND..."
                      value={fiatSearch}
                      onChange={(e) => setFiatSearch(e.target.value)}
                      className="w-full bg-transparent pl-4 pr-1 py-0.5 text-[10px] text-white outline-none uppercase tracking-wider"
                      autoFocus
                    />
                  </div>
                  {filteredFiat.map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => {
                        setFiatAsset(acc);
                        setFiatOpen(false);
                        setFiatSearch("");
                      }}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${fiatAsset === acc ? "bg-cyan-500/20 text-[#00f0ff] font-black" : "text-white hover:bg-[#0a1024]"}`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CRYPTO SELECTION */}
            <div className="flex flex-col gap-1 w-1/2 relative" ref={cryptoRef}>
              <span className="text-white text-[9px] font-black tracking-widest uppercase pl-0.5">
                {tradeType === "BUY" ? "GET CRYPTO" : "OUT CRYPTO"}
              </span>
              <button
                type="button"
                onClick={() => setCryptoOpen(!cryptoOpen)}
                className="relative bg-[#02040f]/60 border border-blue-500/10 hover:border-cyan-500/30 rounded-lg pl-3 pr-8 py-2.5 text-xs font-bold text-white flex items-center justify-between transition-all w-full min-w-0"
              >
                <span className="truncate tracking-wider text-white">
                  {cryptoAsset}
                </span>
                <ChevronDown
                  size={13}
                  className="text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none"
                />
              </button>

              {cryptoOpen && (
                <div className="absolute right-0 top-full mt-1 w-full bg-[#02040f] rounded-lg shadow-2xl z-50 flex flex-col p-1 border border-cyan-500/30">
                  <div className="relative p-1 bg-[#0a1024] border border-blue-500/10 rounded mb-1">
                    <Search
                      size={11}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-cyan-400/40"
                    />
                    <input
                      type="text"
                      placeholder="FIND..."
                      value={cryptoSearch}
                      onChange={(e) => setCryptoSearch(e.target.value)}
                      className="w-full bg-transparent pl-4 pr-1 py-0.5 text-[10px] text-white outline-none uppercase tracking-wider"
                      autoFocus
                    />
                  </div>
                  {filteredCrypto.map((coin) => (
                    <button
                      key={coin}
                      type="button"
                      onClick={() => {
                        setCryptoAsset(coin);
                        setCryptoOpen(false);
                        setCryptoSearch("");
                      }}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${cryptoAsset === coin ? "bg-cyan-500/20 text-[#00f0ff] font-black" : "text-white hover:bg-[#0a1024]"}`}
                    >
                      {coin}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ZONE INPUT EXCHANGE */}
          <div className="flex flex-col gap-1">
            <span className="text-white text-[9px] font-black tracking-widest uppercase pl-0.5">
              VOLUME AMOUNT
            </span>
            <div className="relative bg-[#02040f]/60 border border-blue-500/10 focus-within:border-cyan-500/30 rounded-xl p-1.5 flex items-center shadow-inner transition-all">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent text-left font-sans text-2xl text-white outline-none w-full px-2 py-1.5 font-bold placeholder-slate-600 truncate tracking-wide"
              />
              <span className="text-[10px] font-black text-[#00f0ff] bg-[#02040f] border border-blue-500/10 px-3 py-1.5 rounded-lg mr-0.5 tracking-widest">
                {tradeType === "BUY" ? fiatAsset : cryptoAsset}
              </span>
            </div>
          </div>
        </div>

        {/* CONSOLE METRICS & ACTION */}
        <div className="flex flex-col gap-2.5 shrink-0">
          <div className="flex justify-between items-center bg-[#02040f] border border-blue-500/10 px-3 py-2 rounded-lg">
            <span className="text-white font-black text-[9px] uppercase tracking-widest">
              INDEX RATE
            </span>
            <span className="text-white font-mono text-xs font-bold tracking-wide block truncate">
              {conversionText}
            </span>
          </div>

          {/* MAIN TRANSACTION TRIGGER */}
          <button
            type="button"
            onClick={handleExecuteSubmit}
            disabled={isProcessing || !isValidInput}
            className={`w-full font-black text-xs py-3.5 rounded-xl transition-all tracking-widest uppercase active:scale-[0.99] cursor-pointer block text-center text-white
              ${
                isValidInput
                  ? tradeType === "BUY"
                    ? "bg-[#00bc6c] hover:bg-[#00df81] shadow-[0_0_15px_rgba(0,188,108,0.25)]"
                    : "bg-[#ff007f] hover:bg-[#ff2b93] shadow-[0_0_15px_rgba(255,0,127,0.25)]"
                  : "bg-[#02040f] text-slate-600 border border-blue-500/5 cursor-not-allowed shadow-none"
              }`}
          >
            {isProcessing
              ? "PROCESSING QUANTUM LINK..."
              : `EXECUTE ${tradeType}`}
          </button>
        </div>
      </div>
    </div>
  );
}
