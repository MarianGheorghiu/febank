"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Ticker() {
  const assets = [
    { name: "BTC/USD", price: "$67,420.50", change: "+3.42%", up: true },
    { name: "ETH/USD", price: "$3,480.12", change: "+1.15%", up: true },
    { name: "EUR/USD", price: "1.0842", change: "-0.22%", up: false },
    { name: "GBP/USD", price: "1.2655", change: "+0.08%", up: true },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-3 bg-gradient-to-r from-white/[0.04] to-transparent backdrop-blur-md border-y border-white/[0.06] overflow-hidden rounded-xl">
      <div className="flex items-center justify-around gap-6 overflow-x-auto no-scrollbar px-4">
        {assets.map((asset, i) => (
          <div
            key={i}
            className="flex items-center gap-2 flex-shrink-0 min-w-[140px] justify-center"
          >
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
              {asset.name}
            </span>
            <span className="text-xs font-black text-white">{asset.price}</span>
            <span
              className={`text-[10px] font-bold flex items-center ${asset.up ? "text-emerald-400" : "text-rose-500"}`}
            >
              {asset.up ? (
                <ArrowUpRight size={10} />
              ) : (
                <ArrowDownRight size={10} />
              )}
              {asset.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
