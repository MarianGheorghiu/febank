"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Loader2, Plus } from "lucide-react";
import { FiatAccount } from "@/app/lib/mockCurrencies";

const AVAILABLE_CURRENCIES = [
  {
    code: "RON",
    name: "Romanian Leu",
    flag: "🇷🇴",
    region: "RO",
    symbol: "RON",
  },
  { code: "EUR", name: "Euro", flag: "🇪🇺", region: "EU", symbol: "€" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸", region: "US", symbol: "$" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", region: "UK", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", region: "JP", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭", region: "EU", symbol: "CHF" },
  {
    code: "AUD",
    name: "Australian Dollar",
    flag: "🇦🇺",
    region: "AU",
    symbol: "A$",
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    flag: "🇨🇦",
    region: "CA",
    symbol: "C$",
  },
] as const;

const generateMockAccountRef = (region: string) => {
  const randomDigits = (len: number) =>
    Math.random()
      .toString()
      .slice(2, 2 + len);
  switch (region) {
    case "RO":
      return `RO${randomDigits(2)} REVO ${randomDigits(16)}`;
    case "EU":
      return `LT${randomDigits(2)} 1010 0${randomDigits(11)}`;
    case "US":
      return `US Acc: ${randomDigits(12)}`;
    case "UK":
      return `Sort: 20-45-${randomDigits(2)} | Acc: ${randomDigits(8)}`;
    default:
      return `${region}${randomDigits(2)} XXXX ${randomDigits(10)}`;
  }
};

interface AddFiatAccountProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: FiatAccount) => void;
}

export default function AddFiatAccount({
  isOpen,
  onClose,
  onAddAccount,
}: AddFiatAccountProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [processingCurrency, setProcessingCurrency] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setProcessingCurrency(null);
    } else {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCurrency = (
    curr: (typeof AVAILABLE_CURRENCIES)[number],
  ) => {
    setProcessingCurrency(curr.code);
    setTimeout(() => {
      const newAccount: FiatAccount = {
        id: `f-${Date.now()}`,
        currency: curr.code,
        balance: 0,
        symbol: curr.symbol,
        iban: generateMockAccountRef(curr.region),
        region: curr.region as any,
      };
      onAddAccount(newAccount);
      onClose();
    }, 600);
  };

  const filteredCurrencies = AVAILABLE_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      <div
        className="absolute inset-0 bg-[#02040f]/80 backdrop-blur-md transition-all duration-300 cursor-pointer"
        onClick={!processingCurrency ? onClose : undefined}
      />

      <div
        className={`
          relative w-full max-w-md 
          bg-[#0a1024] border border-blue-500/20 
          rounded-xl shadow-[0_0_50px_rgba(34,211,238,0.15)] 
          backdrop-blur-2xl transition-all transform duration-300 ease-out z-10 
          flex flex-col animate-in zoom-in-95
        `}
      >
        {/* HEADER MODAL */}
        <div className="p-4 border-b border-blue-500/10 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black font-mono tracking-widest text-emerald-400 uppercase">
              Open new account
            </h3>
            <button
              onClick={onClose}
              disabled={!!processingCurrency}
              className="p-1 rounded bg-[#02040f] text-slate-400 hover:text-white hover:border-blue-500/30 transition-all border border-blue-500/10 disabled:opacity-50"
            >
              <X size={14} />
            </button>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="SEARCH ASSET..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!!processingCurrency}
              className="w-full bg-[#02040f]/80 border border-blue-500/10 focus:border-emerald-500/40 rounded-lg pl-9 pr-4 py-2 font-mono text-xs text-white placeholder-slate-600 uppercase tracking-wider focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* CORP LISTĂ: Inaltime fixa stabilita la 5 itemi x 56px rândul = h-[280px] */}
        <div className="h-[280px] overflow-y-auto scrollbar-thin p-2 space-y-1 bg-[#02040f]/30">
          {filteredCurrencies.length > 0 ? (
            filteredCurrencies.map((c) => (
              <button
                key={c.code}
                onClick={() => handleSelectCurrency(c)}
                disabled={!!processingCurrency}
                className="w-full h-14 flex items-center justify-between px-3 rounded-lg bg-[#02040f]/40 border border-transparent hover:border-emerald-500/20 hover:bg-[#02040f]/90 transition-all group disabled:opacity-50 text-left shrink-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl select-none">{c.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-white text-xs uppercase tracking-wider">
                      {c.code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase truncate max-w-[240px]">
                      {c.name}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {processingCurrency === c.code ? (
                    <Loader2
                      size={14}
                      className="text-emerald-400 animate-spin"
                    />
                  ) : (
                    <Plus
                      size={14}
                      className="text-slate-600 group-hover:text-emerald-400 transition-colors"
                    />
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] font-mono text-slate-600 uppercase tracking-wider">
              No matching assets.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
