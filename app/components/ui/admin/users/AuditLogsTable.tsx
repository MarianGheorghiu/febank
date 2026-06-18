"use client";

import React, { useState, useMemo } from "react";
import { Search, Server, ChevronDown, ShieldAlert, X } from "lucide-react";
import { AuditLog } from "@/app/lib/admin/mockUsers";

interface AuditLogsTableProps {
    logs: AuditLog[];
    targetUserIdFilter?: string;
    selectedLogId: string | null;
    onSelectLog: (log: AuditLog) => void;
}

export default function AuditLogsTable({
    logs,
    targetUserIdFilter,
    selectedLogId,
    onSelectLog,
}: AuditLogsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAction, setSelectedAction] = useState<string>("ALL");
    const [selectedActor, setSelectedActor] = useState<string>("ALL");

    // Extragere dinamică valori unice pentru filtre
    const uniqueActions = useMemo(
        () => ["ALL", ...Array.from(new Set(logs.map((l) => l.action)))],
        [logs],
    );
    const uniqueActors = useMemo(
        () => ["ALL", ...Array.from(new Set(logs.map((l) => l.actor)))],
        [logs],
    );

    // Filtrare stabilă și sortare cronologică (Ultimele înregistrări sus)
    const filteredLogs = useMemo(() => {
        return logs
            .filter((log) => {
                if (
                    targetUserIdFilter &&
                    log.targetUserId !== targetUserIdFilter
                )
                    return false;
                if (selectedAction !== "ALL" && log.action !== selectedAction)
                    return false;
                if (selectedActor !== "ALL" && log.actor !== selectedActor)
                    return false;

                const query = searchQuery.toLowerCase().trim();
                if (!query) return true;

                return (
                    log.id.toLowerCase().includes(query) ||
                    log.actor.toLowerCase().includes(query) ||
                    log.targetUserId.toLowerCase().includes(query) ||
                    log.ip.includes(query)
                );
            })
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }, [logs, searchQuery, selectedAction, selectedActor, targetUserIdFilter]);

    return (
        <div className="w-full h-[500px] flex flex-col bg-gradient-to-br from-[#020617] to-[#040e29] border border-cyan-500/30 rounded-xl overflow-hidden relative transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-cyan-500/50 blur-[20px] pointer-events-none" />

            {/* HEADER PANEL & FILTRE HUD */}
            <div className="p-4 sm:p-5 border-b border-cyan-500/20 bg-[#020816]/80 backdrop-blur-md flex flex-col gap-4 shrink-0 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Server size={18} className="text-cyan-400" />
                            <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest uppercase">
                                Audit Ledger
                            </h2>
                        </div>
                        <p className="text-[10px] text-cyan-200/50 font-mono mt-1 uppercase tracking-widest ml-6">
                            WORM Storage Protocol • Millisecond Precision
                        </p>
                    </div>

                    {targetUserIdFilter && (
                        <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-md">
                            LOCK ID: {targetUserIdFilter}
                        </span>
                    )}
                </div>

                {/* CONTROALE FILTRARE */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                    {/* Input căutare globală */}
                    <div className="relative md:col-span-6">
                        <Search
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-500/80"
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#03091e] border border-cyan-500/60 rounded-lg pl-10 pr-8 py-2 text-xs font-mono text-cyan-600 placeholder-cyan-500/80 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500/50 hover:text-cyan-300"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Selector acțiuni */}
                    <div className="md:col-span-3 relative">
                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="w-full bg-[#03091e] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer"
                        >
                            <option value="ALL">All Actions</option>
                            {uniqueActions
                                .filter((a) => a !== "ALL")
                                .map((act) => (
                                    <option key={act} value={act}>
                                        {act.replace(/_/g, " ")}
                                    </option>
                                ))}
                        </select>
                        <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500/40 pointer-events-none"
                        />
                    </div>

                    {/* Selector operatori */}
                    <div className="md:col-span-3 relative">
                        <select
                            value={selectedActor}
                            onChange={(e) => setSelectedActor(e.target.value)}
                            className="w-full bg-[#03091e] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer"
                        >
                            <option value="ALL">All Operators</option>
                            {uniqueActors
                                .filter((a) => a !== "ALL")
                                .map((actor) => (
                                    <option key={actor} value={actor}>
                                        {actor}
                                    </option>
                                ))}
                        </select>
                        <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500/40 pointer-events-none"
                        />
                    </div>
                </div>
            </div>

            {/* HEADERS TABLE (Desktop) */}
            <div className="hidden lg:grid grid-cols-12 gap-4 py-2.5 border-b border-cyan-500/10 bg-cyan-950/20 text-[11px] font-mono font-bold text-cyan-400/90 uppercase tracking-widest shrink-0 items-center relative z-10">
                <div className="col-span-3 ml-8">Timestamp precision</div>
                <div className="col-span-2 ml-7">Tx Hash</div>
                <div className="col-span-3 ml-5">Operator Node</div>
                <div className="col-span-2 text-center mr-10">Action Area</div>
                <div className="col-span-2 text-right mr-8">Target Record</div>
            </div>

            {/* LISTĂ ÎNREGISTRĂRI JURNAL */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 space-y-2 scrollbar-thin relative z-10">
                {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-cyan-500/40 font-mono text-xs">
                        <ShieldAlert size={28} className="mb-2 opacity-40" />
                        <p>
                            SECURE LOGS SYSTEM // NO RESULTS MATCHING
                            DESIGNATION
                        </p>
                    </div>
                ) : (
                    filteredLogs.map((log) => {
                        const isSelected = selectedLogId === log.id;

                        // Mapare culori semantice sobre pe modelul Crypto
                        const tagColors: Record<string, string> = {
                            MUTATION_OVERRIDE:
                                "text-amber-400 border-amber-500/20 bg-amber-500/5",
                            HARD_ACCESS_FREEZE:
                                "text-rose-400 border-rose-500/20 bg-rose-500/5 font-extrabold",
                            SYSTEM_REINSTATE:
                                "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
                            BINARY_DUMP:
                                "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
                        };

                        return (
                            <div
                                key={log.id}
                                onClick={() => onSelectLog(log)}
                                className={`flex flex-col p-3 sm:px-5 sm:py-3 rounded-lg border cursor-pointer select-none transition-all duration-300 shadow-sm ${
                                    isSelected
                                        ? "border-cyan-500/80 bg-[#071128]/90 shadow-[0_0_15px_rgba(6,182,212,0.08)]"
                                        : "border-cyan-500/60 bg-[#050b1a]/60 hover:border-cyan-500/80 hover:bg-[#071128]/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                                }`}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 items-center w-full font-mono text-xs">
                                    {/* Timestamp */}
                                    <div className="lg:col-span-3 text-white font-medium">
                                        {log.timestamp}
                                    </div>

                                    {/* Tx ID */}
                                    <div className="lg:col-span-2 text-cyan-100 font-semibold tracking-wide">
                                        <span className="bg-[#020510] border border-cyan-500/20 px-1.5 py-0.5 rounded">
                                            {log.id}
                                        </span>
                                    </div>

                                    {/* Operator Node & IP */}
                                    <div className="lg:col-span-3 flex items-center gap-2">
                                        <span className="text-white font-semibold">
                                            {log.actor}
                                        </span>
                                        <span className="text-[10px] text-white bg-[#020510]/60 px-1 rounded border border-cyan-500/5">
                                            {log.ip}
                                        </span>
                                    </div>

                                    {/* Action Tag */}
                                    <div className="lg:col-span-2 flex lg:justify-center">
                                        <span
                                            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${tagColors[log.action] || "text-cyan-400 border-cyan-500/20"}`}
                                        >
                                            {log.action.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                    {/* Target User */}
                                    <div className="lg:col-span-2 text-left lg:text-right text-cyan-400 font-bold tracking-wide pr-1">
                                        <span className="bg-[#020510] border border-cyan-500/10 px-2 py-0.5 rounded">
                                            {log.targetUserId}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
