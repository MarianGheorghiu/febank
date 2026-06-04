"use client";

import React, { useState } from "react";
import { Coins, Fingerprint, Copy, Check, Search, X } from "lucide-react";
import { CryptoAsset } from "@/app/lib/mockCurrencies";

export default function CryptoManagement({
  cryptos,
}: {
  cryptos: CryptoAsset[];
}) {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Extragem adresa primului asset ca adresă master
  const masterWalletAddress =
    cryptos[0]?.walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d631";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(masterWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Nu s-a putut copia adresa:", err);
    }
  };

  // Filtrarea monedelor după nume sau simbol (ex: BTC / Bitcoin)
  const filteredCryptos = cryptos.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative bg-[#0a1024] border border-cyan-500/40 sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-full overflow-hidden">
      {/* Neon Glow Cyberpunk (Strict Cyan/Blue) */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* HEADER CARD */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Coins size={14} />
            </div>
            Crypto Network
          </h2>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
            {filteredCryptos.length} / {cryptos.length} ASSETS
          </span>
        </div>

        {/* SECȚIUNE MASTER WALLET */}
        <div className="mb-3 p-3 rounded-lg bg-[#02040f]/50 border border-blue-500/10 flex flex-col gap-2 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Master Wallet Core
            </span>
            <span className="text-[8px] font-mono text-cyan-400 bg-cyan-500/5 border border-cyan-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
              Multi-Chain
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-[#02040f] border border-blue-500/10 p-2 rounded-md overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Fingerprint size={14} className="text-cyan-400 shrink-0" />
              <span className="font-mono text-[10px] text-slate-300 truncate tracking-wide select-all">
                {masterWalletAddress}
              </span>
            </div>

            <button
              onClick={handleCopy}
              title="Copy Address"
              className={`p-1.5 rounded transition-all cursor-pointer active:scale-95 shrink-0 ${
                copied
                  ? "bg-cyan-400 text-[#02040f] font-bold border border-cyan-400"
                  : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:text-white"
              }`}
            >
              {copied ? (
                <Check size={12} strokeWidth={3} />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
        </div>

        {/* SEARCH BAR INTEGRAT PENTRU SIFTING ASSETS */}
        <div className="relative mb-4 shrink-0">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="SEARCH BY COIN OR TICKER..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#02040f]/60 border border-blue-500/10 focus:border-cyan-500/40 rounded-lg pl-8 pr-7 py-1.5 font-mono text-[10px] text-cyan-400 placeholder-slate-600 uppercase tracking-wider focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* LISTA DE MONEDE FILTRATE */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-thin pr-1">
          {filteredCryptos.map((crypto) => (
            <div
              key={crypto.id}
              className="flex justify-between items-center p-3 rounded-lg bg-[#02040f]/50 border border-blue-500/10 hover:border-cyan-500/30 hover:bg-[#02040f]/80 transition-all shrink-0 animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar Monedă în tematică Cyan */}
                <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-black text-xs shrink-0">
                  {crypto.symbol.slice(0, 3)}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="font-mono font-bold text-xs text-white uppercase truncate flex items-center gap-2">
                    {crypto.name}
                    <span className="px-1 rounded bg-[#02040f] text-[8px] text-cyan-400 border border-cyan-500/10 font-bold">
                      {crypto.symbol}
                    </span>
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-black text-white text-xs">
                  {crypto.balance}
                </span>
              </div>
            </div>
          ))}

          {filteredCryptos.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono text-xs py-8">
              No matching assets inside core.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
