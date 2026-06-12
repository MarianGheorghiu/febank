"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ChevronDown, Search } from "lucide-react";

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
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className={`relative bg-slate-900 border border-blue-500/20  rounded-xl p-3.5 sm:p-4 transition-all duration-300 flex flex-col justify-between min-h-[115px] overflow-visible ${
        isOpen ? "z-50 ring-1 ring-blue-700" : "z-10"
      }`}
    >
      <div className="relative z-10 flex justify-between items-center h-7 mb-2">
        <h3 className="text-[11px] font-bold font-mono text-blue-300 uppercase tracking-widest">
          Currencies Wallet
        </h3>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              setSearchQuery("");
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black border border-blue-800 text-blue-300 text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer hover:border-blue-600 hover:text-white select-none"
          >
            <span>{current.flag}</span>
            <span>{current.code}</span>
            <ChevronDown
              size={12}
              className={`text-blue-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-400" : ""}`}
            />
          </button>

          {isOpen && (
            <div
              /* Modificat fundalul în bg-slate-950 solid din Tailwind și poziționare nativă absolută sub buton */
              className="absolute right-0 top-full mt-2 w-60 rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] p-2 bg-slate-950 z-50 block"
            >
              <div className="relative mb-2">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search currency"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-black rounded-md pl-8 pr-2 py-1.5 text-[10px] font-mono text-white placeholder-gray-400 focus:outline-none focus:border-blue-200 focus:ring-1 focus:ring-blue-700"
                />
              </div>

              <div
                className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-cyan
                [&::-webkit-scrollbar-thumb]:bg-blue-800
                [&::-webkit-scrollbar-thumb]:rounded-full
                hover:[&::-webkit-scrollbar-thumb]:bg-cyan-700"
              >
                {filteredAccounts.length === 0 ? (
                  <div className="text-[10px] text-gray-500 text-center py-2 font-mono">
                    Nicio valută găsită
                  </div>
                ) : (
                  filteredAccounts.map((acc) => {
                    const isSelected = acc.code === activeCode;
                    return (
                      <button
                        key={acc.code}
                        type="button"
                        onClick={() => {
                          setActiveCode(acc.code);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-md text-left text-[11px] font-mono cursor-pointer transition-colors ${
                          isSelected
                            ? " border border-blue-700 text-white font-bold"
                            : "hover:bg-slate-900 border border-transparent text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{acc.flag}</span>
                          <span
                            className={
                              isSelected ? "text-cyan-400" : "text-white"
                            }
                          >
                            {acc.code}
                          </span>
                        </span>
                        <span className="text-white">
                          {acc.symbol}
                          {acc.balance.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono mb-1">
          {current.symbol}
          {current.balance.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </h3>

        <div className="mt-1 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => router.push("/dashboard/currencies")}
            className="text-cyan-400 cursor-pointer hover:text-cyan-300 font-bold font-mono text-[11px] flex items-center gap-1 transition-colors group/fx"
          >
            <RefreshCw
              size={11}
              className="text-cyan-500 transition-transform group-hover/fx:rotate-180 duration-500"
            />
            FX Exchange
          </button>
          <span className="text-[10px] text-gray-200 font-mono">
            1 {current.code} ≈ {current.rateToEur.toFixed(2)} EUR
          </span>
        </div>
      </div>
    </div>
  );
}
