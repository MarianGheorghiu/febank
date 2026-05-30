// app/components/ui/MultiCurrencyCard.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ChevronDown } from "lucide-react";
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
    <GlassCard
      className={`relative !p-6 space-y-4 border border-white/5 bg-[#0a0f1d]/60 backdrop-blur-2xl hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(30,64,175,0.15)] transition-all duration-300 group overflow-visible ${
        isOpen ? "z-30" : "z-10"
      }`}
    >
      {/* TOP LINE: Titlu + Selector Dynamic */}
      <div className="flex justify-between items-center h-7">
        <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest">
          Currencies Wallet
        </span>

        {/* REVOLUT DROPDOWN PREMIUM (Dimensiuni originale păstrate) */}
        <div className="relative z-50" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setSearchQuery("");
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/30 text-blue-100 text-[11px] font-bold font-mono transition-all duration-300 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-blue-400"
          >
            <span>{current.flag}</span>
            <span>{current.code}</span>
            <ChevronDown
              size={12}
              className={`text-blue-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-300" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-[#091126]/80 border border-blue-500/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),_0_0_30px_rgba(37,99,235,0.15),_inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl p-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="relative mb-1 px-1">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-blue-950 rounded-md pl-2 pr-2 py-1 text-[10px] font-mono text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              {/* Scrollbar Premium Ultra-Slim */}
              <div
                className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-blue-500/20
                [&::-webkit-scrollbar-thumb]:rounded-full
                hover:[&::-webkit-scrollbar-thumb]:bg-blue-500/50"
              >
                {filteredAccounts.map((acc) => {
                  const isSelected = acc.code === activeCode;
                  return (
                    <button
                      key={acc.code}
                      onClick={() => {
                        setActiveCode(acc.code);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-1.5 rounded-md text-left text-[11px] font-mono transition-all duration-150 group/item ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/15 border border-blue-500/30 text-white font-bold"
                          : "hover:bg-blue-500/10 border border-transparent text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="transition-transform group-hover/item:scale-105 duration-150">
                          {acc.flag}
                        </span>
                        <span className={isSelected ? "text-blue-300" : ""}>
                          {acc.code}
                        </span>
                      </span>
                      <span
                        className={
                          isSelected
                            ? "text-white"
                            : "text-zinc-500 group-hover/item:text-zinc-300"
                        }
                      >
                        {acc.symbol}
                        {acc.balance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER LINE: Suma mare (Restaurat la dimensiunile/marginile originale) */}
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
            className="text-blue-400 cursor-pointer hover:text-blue-300 font-bold flex items-center gap-1 transition-colors group/fx"
          >
            <RefreshCw
              size={11}
              className="text-blue-500 cursor-pointer transition-transform group-hover/fx:rotate-180 duration-500"
            />{" "}
            FX Exchange
          </button>
          <span className="text-[10px] text-gray-500 font-mono授">
            1 {current.code} ≈ {current.rateToEur.toFixed(2)} EUR
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
