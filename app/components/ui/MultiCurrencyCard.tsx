// app/components/ui/MultiCurrencyCard.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ChevronDown, Search, Check } from "lucide-react";
import GlassCard from "./GlassCard";

interface CurrencyAccount {
  code: string;
  symbol: string;
  balance: number;
  flag: string;
  name: string;
  rateToEur: number;
}

export default function MultiCurrencyCard() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [accounts] = useState<CurrencyAccount[]>([
    {
      code: "EUR",
      symbol: "€",
      balance: 100.0,
      flag: "🇪🇺",
      name: "Euro Zone Clearing",
      rateToEur: 1,
    },
    {
      code: "USD",
      symbol: "$",
      balance: 200.0,
      flag: "🇺🇸",
      name: "US Federal Ledger",
      rateToEur: 0.92,
    },
    {
      code: "GBP",
      symbol: "£",
      balance: 450.5,
      flag: "🇬🇧",
      name: "UK Bank of England",
      rateToEur: 1.17,
    },
    {
      code: "RON",
      symbol: "lei",
      balance: 1250.0,
      flag: "🇷🇴",
      name: "Romanian Treasury",
      rateToEur: 0.2,
    },
    {
      code: "CHF",
      symbol: "₣",
      balance: 89.0,
      flag: "🇨🇭",
      name: "Swiss Custody Node",
      rateToEur: 1.03,
    },
    {
      code: "JPY",
      symbol: "¥",
      balance: 35000,
      flag: "🇯🇵",
      name: "Japan Settlement Node",
      rateToEur: 0.0059,
    },
    {
      code: "CAD",
      symbol: "$",
      balance: 310.2,
      flag: "🇨🇦",
      name: "Canadian Pool",
      rateToEur: 0.67,
    },
    {
      code: "AUD",
      symbol: "$",
      balance: 180.0,
      flag: "🇦🇺",
      name: "Australian Reserve",
      rateToEur: 0.61,
    },
    {
      code: "AED",
      symbol: "د.إ",
      balance: 1500.0,
      flag: "🇦🇪",
      name: "UAE Central Portal",
      rateToEur: 0.25,
    },
    {
      code: "SGD",
      symbol: "$",
      balance: 640.0,
      flag: "🇸🇬",
      name: "Singapore Hub",
      rateToEur: 0.68,
    },
  ]);

  const [activeCode, setActiveCode] = useState<string>("EUR");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const current = accounts.find((a) => a.code === activeCode) || accounts[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <GlassCard className="relative !p-6 space-y-4 border border-white/5 bg-[#0a0f1d]/60 backdrop-blur-2xl hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(30,64,175,0.15)] transition-all duration-300 group">
      {/* TOP LINE: Titlu + Selector Dynamic */}
      <div className="flex justify-between items-center h-7">
        <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest">
          Currencies Wallet
        </span>

        {/* REVOLUT DROPDOWN */}
        <div className="relative z-50" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setSearchQuery("");
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold font-mono transition-all cursor-pointer"
          >
            <span>{current.flag}</span>
            <span>{current.code}</span>
            <ChevronDown
              size={12}
              className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-[#070b14] border border-white/[0.08] shadow-2xl backdrop-blur-3xl p-1.5 animate-fade-in">
              <div className="relative mb-1 px-1">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-md pl-2 pr-2 py-1 text-[10px] font-mono text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {filteredAccounts.map((acc) => (
                  <button
                    key={acc.code}
                    onClick={() => {
                      setActiveCode(acc.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded-md text-left text-[11px] font-mono ${
                      acc.code === activeCode
                        ? "bg-blue-600/20 text-white font-bold"
                        : "hover:bg-white/5 text-zinc-400"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{acc.flag}</span>
                      <span>{acc.code}</span>
                    </span>
                    {/* AICI ESTE FIX-UL 👇 */}
                    <span>
                      {acc.symbol}
                      {acc.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER LINE: Suma mare */}
      <div>
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
          {current.symbol}
          {current.balance.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </h3>

        {/* SUBTEXT: Link direct spre dashboard/currencies */}
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <button
            onClick={() => router.push("/dashboard/currencies")}
            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={11} className="text-blue-500 animate-pulse" /> FX
            Exchange
          </button>
          <span className="text-[10px] text-gray-500 font-mono">
            1 {current.code} ≈ {current.rateToEur.toFixed(2)} EUR
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
