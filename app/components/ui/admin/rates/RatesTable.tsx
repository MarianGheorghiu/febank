"use client";

import { useState, useMemo } from "react";
import {
    Search,
    X,
    ShieldAlert,
    SlidersHorizontal,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    FileSpreadsheet,
    Cpu,
    ShieldCheck,
    Fingerprint,
} from "lucide-react";
import { FeeRule } from "@/app/lib/admin/mockRates";
import { RateRow } from "./RateRow";

interface RatesTableProps {
    rules: FeeRule[];
    onActionClick: (rule: FeeRule, mode: "view" | "edit" | "toggle") => void;
    onExportRule: (rule: FeeRule) => void;
}

export default function RatesTable({
    rules = [],
    onActionClick,
    onExportRule,
}: RatesTableProps) {
    const [categoryFilter, setCategoryFilter] = useState<
        "ALL" | "PAY_IN" | "PAY_OUT" | "FX_SWAP" | "CRYPTO_TRADE"
    >("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredRules = useMemo(() => {
        return rules.filter((r) => {
            const matchesCategory =
                categoryFilter === "ALL" || r.category === categoryFilter;
            const query = searchQuery.toLowerCase();
            return (
                matchesCategory &&
                (r.id.toLowerCase().includes(query) ||
                    r.name.toLowerCase().includes(query) ||
                    r.channel.toLowerCase().includes(query) ||
                    r.currency.toLowerCase().includes(query))
            );
        });
    }, [rules, categoryFilter, searchQuery]);

    // Numărăm dinamic regulile care așteaptă aprobare duală pentru widget-ul din footer
    const pendingApprovalsCount = useMemo(() => {
        return rules.filter((r) => r.status === "PENDING_APPROVAL").length;
    }, [rules]);

    return (
        <div className="w-full flex flex-col bg-[#020617] border border-cyan-500/20 rounded-xl overflow-hidden font-mono shadow-xl relative transition-all duration-300">
            {/* TOP BAR / CONTROL CONFIGURATION DECK */}
            <div className="p-5 border-b border-cyan-500/20 bg-[#030922]/95 backdrop-blur-md flex flex-col xl:flex-row xl:items-center justify-between gap-4 z-10">
                <div>
                    <div className="flex items-center gap-2">
                        <Cpu
                            className="text-cyan-400 animate-pulse"
                            size={18}
                        />
                        <h2 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 tracking-widest uppercase">
                            FINANCIAL POLICY CONFIGURATION MATRIX
                        </h2>
                    </div>
                    <p className="text-[10px] text-cyan-400/60 mt-1 uppercase tracking-widest ml-6 font-bold">
                        Calcul Core Execution Protocol // Core Margins
                    </p>
                </div>

                {/* FILTERS PANEL */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full xl:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/50 font-bold"
                        />
                        <input
                            type="text"
                            placeholder="Search by Channel, ID or Gateway..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#050e2e] border border-cyan-500/30 rounded-lg pl-10 pr-9 py-2 text-xs text-white placeholder-cyan-400/30 focus:outline-none focus:border-cyan-400 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex overflow-x-auto bg-[#040c29] p-1 border border-cyan-500/20 rounded-lg gap-1 scrollbar-none">
                        {(
                            [
                                "ALL",
                                "PAY_IN",
                                "PAY_OUT",
                                "FX_SWAP",
                                "CRYPTO_TRADE",
                            ] as const
                        ).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`whitespace-nowrap px-2.5 py-1 text-[9px] font-black tracking-wider rounded transition-all cursor-pointer ${
                                    categoryFilter === cat
                                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                        : "text-cyan-400/70 hover:text-white"
                                }`}
                            >
                                {cat === "ALL" ? "All Rails" : cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* REAL DYNAMIC ENGINE DESKTOP HEADERS */}
            <div className="hidden lg:grid grid-cols-12 gap-4 py-3 border-b border-cyan-500/20 bg-cyan-950/20 text-[9px] font-black text-cyan-400 tracking-widest items-center px-5 uppercase">
                <div className="col-span-3">
                    Ruleset Identity & Gateway Channel
                </div>
                <div className="col-span-2 text-left">Base Fee Structure</div>
                <div className="col-span-2 text-left">FX Spread Markup</div>
                <div className="col-span-2 text-left">Safety Caps & Floors</div>
                <div className="col-span-2 text-center">
                    Volume Tiers & Allowances
                </div>
                <div className="col-span-1 text-right mr-3">Policy State</div>
            </div>

            {/* PIPELINE ROW MATRIX CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#020514]/60">
                {filteredRules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-cyan-400/80 text-xs font-bold h-full">
                        <ShieldAlert
                            size={36}
                            className="mb-4 text-rose-500 animate-pulse"
                        />
                        <p className="tracking-widest uppercase text-center">
                            ZERO VALID PRICING OPERANDS DEPLOYED FOR THIS SECTOR
                        </p>
                    </div>
                ) : (
                    filteredRules.map((rule) => (
                        <RateRow
                            key={rule.id}
                            rule={rule}
                            onActionClick={onActionClick}
                            onExportRule={onExportRule}
                        />
                    ))
                )}
            </div>

            {/* DUAL LAYER ENGINE GOVERNANCE FOOTER */}
            <div className="w-full grid grid-cols-1 md:grid-cols-12 bg-[#01061b] border-t border-cyan-500/20 text-[10px]">
                {/* INTERACTIVE COMPLIANCE PIPELINE STATUS */}
                <div className="md:col-span-8 p-4 border-b md:border-b-0 md:border-r border-cyan-500/20 flex items-center gap-3 bg-amber-950/5">
                    <div className="p-2 bg-amber-500/10 rounded border border-amber-500/30 text-amber-400 shrink-0 animate-pulse">
                        <ShieldCheck size={16} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <div className="text-amber-400 font-black uppercase tracking-widest text-[9px] flex items-center gap-2">
                            4-EYES GOVERNANCE PIPELINE // ACTIVE SECURITY LOCK
                        </div>
                        <p className="text-[11px] text-zinc-300 font-medium font-sans">
                            System requires{" "}
                            <span className="text-amber-400 font-bold font-mono">
                                CHECKER
                            </span>{" "}
                            clearance for any rate overrides. Direct production
                            mutations are hard-locked.
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] text-zinc-500 font-mono">
                            <span className="flex items-center gap-1">
                                <Fingerprint size={10} /> SESSION:{" "}
                                <span className="text-cyan-400 font-bold">
                                    SECURE_AUTH_NODE
                                </span>
                            </span>
                            <span>|</span>
                            <span>
                                PENDING QUEUE:{" "}
                                <span className="text-amber-400 font-bold">
                                    {pendingApprovalsCount} OPERANDS
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* SCHEMATIC DECK EXPORTS */}
                <div className="md:col-span-4 p-4 flex flex-col justify-center gap-2 bg-[#02071d]">
                    <div className="text-cyan-400/60 font-black uppercase text-[8px] tracking-widest">
                        Active Policy Schema Export
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() =>
                                alert("CSV Ruleset Packet Dispatched.")
                            }
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500 hover:text-black font-black text-[9px] tracking-widest uppercase transition-all cursor-pointer hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                        >
                            <FileSpreadsheet size={12} /> CSV Rules
                        </button>
                        <button
                            onClick={() =>
                                alert("JSON Policy Schema Dump Generated.")
                            }
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded border border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-black font-black text-[9px] tracking-widest uppercase transition-all cursor-pointer hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                        >
                            <SlidersHorizontal size={12} /> JSON Schema
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
