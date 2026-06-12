"use client";

import React from "react";
import { Wallet, Coins, LineChart } from "lucide-react";

interface StatsProps {
  fiat: number;
  crypto: number;
  stocks: number;
}

export default function AssetSummaryCards({
  fiat,
  crypto,
  stocks,
}: StatsProps) {
  const cards = [
    {
      title: "FIAT_RESERVE_POOL",
      value: fiat,
      icon: Wallet,
      iconColor: "text-emerald-400",
      labelColor: "text-emerald-300/80",
      borderColor: "border-emerald-500/20 group-hover:border-emerald-500/50",
      glowColor:
        "hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:-translate-y-0.5",
      gradientFromTo: "from-emerald-600/10 to-teal-500/5",
    },
    {
      title: "CRYPTO_VAULT_NODE",
      value: crypto,
      icon: Coins,
      iconColor: "text-cyan-400",
      labelColor: "text-cyan-300/80",
      borderColor: "border-cyan-500/20 group-hover:border-cyan-500/50",
      glowColor:
        "hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] hover:-translate-y-0.5",
      gradientFromTo: "from-cyan-600/10 to-blue-500/5",
    },
    {
      title: "EQUITY_STOCKS_MATRIX",
      value: stocks,
      icon: LineChart,
      iconColor: "text-fuchsia-400",
      labelColor: "text-fuchsia-300/80",
      borderColor: "border-fuchsia-500/20 group-hover:border-fuchsia-500/50",
      glowColor:
        "hover:shadow-[0_0_20px_rgba(217,70,239,0.12)] hover:-translate-y-0.5",
      gradientFromTo: "from-fuchsia-600/10 to-purple-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full font-mono">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`relative bg-[#0a1024] border sm:backdrop-blur-xl rounded-xl px-3.5 py-2.5 sm:py-3 transition-all duration-300 ease-out group ${card.borderColor} ${card.glowColor} flex flex-col justify-between min-h-[85px] overflow-hidden`}
        >
          {/* Neon Glow pe fundal - activat la hover */}
          <div
            className={`absolute -inset-1 bg-gradient-to-r ${card.gradientFromTo} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
          />

          {/* HEADER: Titlu și Iconiță */}
          <div className="relative z-10 flex items-center justify-between mb-1">
            <h3
              className={`text-[10px] font-bold font-mono ${card.labelColor} uppercase tracking-widest`}
            >
              {card.title}
            </h3>
            <div className="p-1 rounded-lg bg-[#02040f] border border-blue-500/10 transition-transform duration-300 group-hover:scale-105 group-hover:border-current/30">
              <span className={`${card.iconColor} block`}>
                <card.icon size={13} />
              </span>
            </div>
          </div>

          {/* BODY: Valoarea numerică */}
          <div className="relative z-10 mt-auto">
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-zinc-100 transition-colors">
              $
              {card.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
