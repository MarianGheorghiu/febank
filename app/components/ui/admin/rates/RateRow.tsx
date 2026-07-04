"use client";

import {
    Eye,
    Edit3,
    CheckCircle2,
    Ban,
    Code,
    ShieldCheck,
    UserCheck,
} from "lucide-react";
import { FeeRule } from "@/app/lib/admin/mockRates";

interface RateRowProps {
    rule: FeeRule;
    onActionClick: (rule: FeeRule, mode: "view" | "edit" | "toggle") => void;
    onExportRule: (rule: FeeRule) => void;
}

export function RateRow({ rule, onActionClick, onExportRule }: RateRowProps) {
    const isActive = rule.status === "ACTIVE";
    const isPending = rule.status === "PENDING_APPROVAL";
    const isPaused = rule.status === "PAUSED";

    return (
        <div
            className={`w-full flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-stretch lg:items-center bg-[#040a24]/80 p-4 rounded-lg border transition-all duration-200 ${
                isPending
                    ? "border-amber-500/40 bg-amber-950/5 hover:border-amber-400"
                    : isPaused
                      ? "border-blue-500/30 bg-blue-950/5 hover:border-blue-400"
                      : "border-cyan-500/10 hover:border-cyan-400/40 hover:bg-[#06123a]"
            }`}
        >
            {/* COL 1-3: RULE META & CHANNEL RAILS */}
            <div className="w-full lg:col-span-3 flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest ${
                            rule.category === "PAY_IN"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : rule.category === "PAY_OUT"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : rule.category === "FX_SWAP"
                                    ? "bg-cyan-500/20 text-cyan-400"
                                    : "bg-purple-500/20 text-purple-400"
                        }`}
                    >
                        {rule.category}
                    </span>
                    <span className="text-[10px] text-cyan-400/50 font-bold">
                        {rule.id}
                    </span>
                </div>
                <span className="text-xs font-black text-white tracking-wide mt-1 truncate">
                    {rule.name}
                </span>
                <span className="text-[10px] text-zinc-400/80 mt-0.5 italic font-sans">
                    {rule.channel}
                </span>
            </div>

            {/* COL 4-5: BASE FEE CORE ARCHITECTURE */}
            <div className="w-full lg:col-span-2 flex justify-between lg:flex-col min-w-0 text-xs">
                <span className="lg:hidden text-[9px] font-bold text-cyan-400/40 uppercase font-mono">
                    Base Pricing:
                </span>
                <div>
                    {rule.basePercentageFee === 0 && rule.baseFixedFee === 0 ? (
                        <span className="text-emerald-400 font-bold tracking-widest uppercase text-[11px]">
                            FLAT FREE
                        </span>
                    ) : (
                        <div className="flex flex-col">
                            <span className="text-white font-black tracking-wide">
                                {rule.basePercentageFee > 0
                                    ? `${rule.basePercentageFee}%`
                                    : ""}
                                {rule.basePercentageFee > 0 &&
                                rule.baseFixedFee > 0
                                    ? " + "
                                    : ""}
                                {rule.baseFixedFee > 0
                                    ? `${rule.baseFixedFee.toFixed(2)} ${rule.currency}`
                                    : ""}
                            </span>
                            <span className="text-[8px] text-zinc-500 tracking-wider font-mono">
                                FIXED + VARIABLE BASE
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* COL 6-7: FX SPREAD MARKUP */}
            <div className="w-full lg:col-span-2 flex justify-between lg:flex-col min-w-0 text-xs">
                <span className="lg:hidden text-[9px] font-bold text-cyan-400/40 uppercase font-mono">
                    FX Spread:
                </span>
                <div className="flex flex-col">
                    <span
                        className={
                            rule.fxSpreadMarkup > 0
                                ? "text-cyan-400 font-bold"
                                : "text-zinc-500"
                        }
                    >
                        {rule.fxSpreadMarkup > 0
                            ? `+${rule.fxSpreadMarkup.toFixed(2)}%`
                            : "0.00% (No Markup)"}
                    </span>
                    <span className="text-[8px] text-zinc-500 tracking-wider font-mono">
                        INTERBANK OVERRIDE SPREAD
                    </span>
                </div>
            </div>

            {/* COL 8-9: SAFETY BOUNDS (FLOOR & CEILING CAPS) */}
            <div className="w-full lg:col-span-2 flex justify-between lg:flex-col min-w-0 text-xs">
                <span className="lg:hidden text-[9px] font-bold text-cyan-400/40 uppercase font-mono">
                    Safety Caps:
                </span>
                <div className="flex flex-col lg:items-start">
                    <span className="text-zinc-300 font-medium">
                        Min:{" "}
                        <span className="text-white font-black">
                            {rule.minFeeCap.toFixed(2)} {rule.currency}
                        </span>
                    </span>
                    <span className="text-zinc-300 font-medium mt-0.5">
                        Max:{" "}
                        <span className="text-white font-black">
                            {rule.maxFeeCap === 0
                                ? "None"
                                : `${rule.maxFeeCap.toFixed(2)} ${rule.currency}`}
                        </span>
                    </span>
                </div>
            </div>

            {/* COL 10-11: TIERED PRICING BRACKETS & LIMITS */}
            <div className="w-full lg:col-span-2 flex justify-between lg:flex-col min-w-0 text-xs">
                <span className="lg:hidden text-[9px] font-bold text-cyan-400/40 uppercase font-mono">
                    Tiers & Free Allow:
                </span>
                <div className="flex flex-col lg:items-center w-full">
                    <span className="text-emerald-400 text-[10px] font-bold tracking-wide">
                        {rule.monthlyFreeAllowance > 0
                            ? `Free up to ${rule.monthlyFreeAllowance} ${rule.currency}/mo`
                            : "No Free Allowance"}
                    </span>
                    <span className="text-[9px] bg-cyan-950/40 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 font-mono mt-1 text-center truncate max-w-full">
                        {rule.volumeBrackets.length > 0
                            ? `${rule.volumeBrackets.length} Volume Brackets`
                            : "Flat Volume Ruleset"}
                    </span>
                </div>
            </div>

            {/* COL 12: POLICY SECURITY OPERATIONS CONTROLS */}
            <div className="w-full lg:col-span-1 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-3 lg:pt-0 border-t border-cyan-500/10 lg:border-t-0">
                <div className="hidden lg:flex flex-col items-end mb-1">
                    {/* MAKER / CHECKER HUD LABELS */}
                    <span
                        className={`text-[8px] font-black px-1 py-0.5 rounded ${
                            isActive
                                ? "text-emerald-400 bg-emerald-950/50 border border-emerald-500/30"
                                : isPending
                                  ? "text-amber-400 bg-amber-950/50 border border-amber-500/30 animate-pulse"
                                  : "text-blue-400 bg-blue-950/50 border border-blue-500/30"
                        }`}
                    >
                        {rule.status}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
                    <button
                        onClick={() => onActionClick(rule, "view")}
                        className="cursor-pointer p-1.5 rounded border text-cyan-400 border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500 hover:text-black transition-colors"
                        title="Inspect Calculator Specs"
                    >
                        <Eye size={12} />
                    </button>

                    <button
                        onClick={() => onActionClick(rule, "edit")}
                        className="cursor-pointer p-1.5 rounded border text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-400 hover:text-black transition-colors"
                        title="Maker Change Request"
                    >
                        <Edit3 size={12} />
                    </button>

                    {isPending ? (
                        <button
                            onClick={() => onActionClick(rule, "toggle")}
                            className="cursor-pointer p-1.5 rounded border text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all animate-pulse"
                            title="Compliance Authorization (Checker Click)"
                        >
                            <UserCheck size={12} />
                        </button>
                    ) : (
                        <button
                            onClick={() => onActionClick(rule, "toggle")}
                            className={`cursor-pointer p-1.5 rounded border ${isPaused ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500" : "text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500"} hover:text-black transition-colors`}
                            title={
                                isPaused
                                    ? "Activate Live Calculations"
                                    : "Emergency Halt Pipeline"
                            }
                        >
                            {isPaused ? (
                                <CheckCircle2 size={12} />
                            ) : (
                                <Ban size={12} />
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => onExportRule(rule)}
                        className="cursor-pointer p-1.5 rounded border text-purple-400 border-purple-500/30 bg-purple-500/5 hover:bg-purple-500 hover:text-black transition-colors"
                        title="Export Structural Policy Map"
                    >
                        <Code size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
