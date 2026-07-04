"use client";

import React, { useState } from "react";
import {
    Globe,
    ShieldAlert,
    Percent,
    Moon,
    Radio,
    Sliders,
} from "lucide-react";
import { LiveFxPair, WeekendShieldConfig } from "@/app/lib/admin/mockRates";

interface RatesSpreadsPanelProps {
    fxPairs: LiveFxPair[];
    weekendConfig: WeekendShieldConfig;
    onUpdateMarkup: (pair: string, currentMarkup: number) => void;
    onToggleWeekendShield: () => void;
}

export default function RatesSpreadsPanel({
    fxPairs,
    weekendConfig,
    onUpdateMarkup,
    onToggleWeekendShield,
}: RatesSpreadsPanelProps) {
    return (
        <div className="w-full flex flex-col bg-[#020617] border border-cyan-500/20 rounded-xl overflow-hidden font-mono shadow-xl p-4 sm:p-5 gap-5">
            {/* HEADER PANEL */}
            <div className="border-b border-cyan-500/10 pb-3">
                <div className="flex items-center gap-2">
                    <Globe className="text-cyan-400" size={16} />
                    <h3 className="text-xs font-black tracking-widest text-white uppercase">
                        FX RATES & PLATFORM MARKUP ENGINE
                    </h3>
                </div>
                <p className="text-[9px] text-cyan-400/50 mt-0.5 uppercase tracking-wider font-bold">
                    Liquidity Spreads & Automated Execution Defenses
                </p>
            </div>

            {/* LIVE BASE RATES FEED (READ ONLY MARKET TRUTH) */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[9px] font-black text-cyan-400/60 uppercase tracking-widest px-1">
                    <span>Active Pair Matrix</span>
                    <span className="flex items-center gap-1">
                        <Radio
                            size={10}
                            className="text-emerald-400 animate-pulse"
                        />{" "}
                        Live Oracle Stream
                    </span>
                </div>

                <div className="space-y-2">
                    {fxPairs.map((fx) => (
                        <div
                            key={fx.pair}
                            className="bg-[#040a24]/60 border border-cyan-500/10 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/30 transition-all"
                        >
                            <div>
                                <span className="text-sm font-black text-white tracking-wide block">
                                    {fx.pair}
                                </span>
                                <span className="text-[9px] text-zinc-500 font-sans block">
                                    {fx.sourceNode} // Volatility:{" "}
                                    <span
                                        className={
                                            fx.volatility === "HIGH"
                                                ? "text-rose-400"
                                                : "text-emerald-400"
                                        }
                                    >
                                        {fx.volatility}
                                    </span>
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-right sm:w-auto w-full border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
                                <div>
                                    <span className="block text-[8px] text-zinc-500 uppercase font-bold">
                                        Market Base
                                    </span>
                                    <span className="text-xs font-medium text-zinc-400">
                                        {fx.baseRate.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 4,
                                        })}
                                    </span>
                                </div>
                                <div
                                    className="cursor-pointer group/markup"
                                    onClick={() =>
                                        onUpdateMarkup(
                                            fx.pair,
                                            fx.markupPercentage,
                                        )
                                    }
                                >
                                    <span className="block text-[8px] text-amber-400 font-bold uppercase flex items-center justify-end gap-0.5">
                                        Markup <Sliders size={8} />
                                    </span>
                                    <span className="text-xs font-black text-amber-400 group-hover:underline">
                                        +{fx.markupPercentage.toFixed(2)}%
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[8px] text-emerald-400 font-bold uppercase">
                                        Client Rate
                                    </span>
                                    <span className="text-xs font-black text-white bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                        {fx.clientRate.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 4,
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* WEEKEND RULES CARD (AUTOMATED DEFENSE SYSTEM) */}
            <div
                className={`mt-2 border rounded-xl p-4 bg-gradient-to-br transition-all relative overflow-hidden ${
                    weekendConfig.isProtocolActive
                        ? "border-purple-500/30 from-[#020617] to-[#17052e] shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                        : "border-zinc-800 from-[#020617] to-[#0d111c]"
                }`}
            >
                <div className="absolute top-0 right-0 p-2 text-purple-500/20 pointer-events-none">
                    <Moon size={40} />
                </div>

                <div className="flex items-center justify-between border-b border-purple-500/10 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                        <Moon
                            className={
                                weekendConfig.isProtocolActive
                                    ? "text-purple-400 animate-pulse"
                                    : "text-zinc-500"
                            }
                            size={14}
                        />
                        <span className="text-[10px] font-black uppercase text-white tracking-widest">
                            WEEKEND SHIELD PROTOCOL
                        </span>
                    </div>

                    {/* TOGGLE SWITCH */}
                    <button
                        onClick={onToggleWeekendShield}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${weekendConfig.isProtocolActive ? "bg-purple-500" : "bg-zinc-800"}`}
                    >
                        <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${weekendConfig.isProtocolActive ? "translate-x-4" : "translate-x-0"}`}
                        />
                    </button>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
                        Protejează platforma de volatilitatea masivă de
                        deschidere a piețelor de luni dimineață prin aplicarea
                        unei marje de siguranță suplimentare automate în timpul
                        închiderii burselor globale.
                    </p>
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-purple-500/10">
                        <span className="text-zinc-500 font-mono">
                            Automated Engine Node:
                        </span>
                        <span className="text-purple-300 font-bold font-mono">
                            {weekendConfig.autoTriggerNode}
                        </span>
                    </div>
                    <div className="flex items-center justify-between bg-black/40 border border-purple-500/20 p-2 rounded-lg">
                        <span className="text-[9px] text-zinc-400 font-bold flex items-center gap-1 uppercase">
                            <Percent size={10} className="text-purple-400" />{" "}
                            Additional Safety Spread:
                        </span>
                        <span
                            className={`font-black text-xs ${weekendConfig.isProtocolActive ? "text-purple-400 animate-pulse" : "text-zinc-500"}`}
                        >
                            +{weekendConfig.additionalWeekendMarkup.toFixed(2)}%
                            MARGIN
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
