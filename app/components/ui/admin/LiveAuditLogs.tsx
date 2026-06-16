"use client";

import React, { useState, useMemo } from "react";
import { Terminal, Search, SlidersHorizontal, X } from "lucide-react";

// Date Mock complete pentru a putea testa instant căutarea și filtrele
const MOCK_SYSTEM_LOGS = [
    {
        id: "1",
        time: "16:14:02",
        severity: "CRITICAL",
        type: "AUTH_BYPASS_ATTEMPT",
        target: "usr_mgr_v2 / IP: 185.220.101.5",
    },
    {
        id: "2",
        time: "16:12:45",
        severity: "WARNING",
        type: "DB_LATENCY_SPIKE",
        target: "cluster_eu_west / 450ms query delay",
    },
    {
        id: "3",
        time: "16:10:11",
        severity: "INFO",
        type: "SSL_RENEWAL_SUCCESS",
        target: "gateway.api.internal",
    },
    {
        id: "4",
        time: "16:08:59",
        severity: "CRITICAL",
        type: "RATE_LIMIT_EXCEEDED",
        target: "endpoint: /v1/auth/token",
    },
    {
        id: "5",
        time: "16:05:23",
        severity: "INFO",
        type: "CACHE_PURGE_COMMAND",
        target: "redis_node_04 / manual_trigger",
    },
    {
        id: "6",
        time: "16:01:12",
        severity: "WARNING",
        type: "DISK_SPACE_LOW",
        target: "node_storage_02 / 88% capacity",
    },
];

export default function LiveAuditLogs() {
    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState("ALL");

    // Logică eficientă de filtrare combinată (Search + Dropdown)
    const filteredLogs = useMemo(() => {
        return MOCK_SYSTEM_LOGS.filter((log) => {
            const matchesSearch =
                log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.target.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSeverity =
                severityFilter === "ALL" || log.severity === severityFilter;

            return matchesSearch && matchesSeverity;
        });
    }, [searchTerm, severityFilter]);

    return (
        <div className="lg:col-span-4 bg-[#060b18] border border-cyan-500/30 rounded-xl flex flex-col overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:border-cyan-400/50 h-[320px]">
            {/* Header Principal */}
            <div className="p-3 border-b border-cyan-500/20 bg-[#030712] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal
                        size={13}
                        className="text-cyan-400 animate-pulse"
                    />
                    <span className="text-cyan-400 font-black text-[11px] tracking-widest uppercase">
                        LIVE_AUDIT_LOGS
                    </span>
                </div>
                <div className="text-[9px] text-cyan-400/80 font-mono font-bold">
                    COUNT: {filteredLogs.length}
                </div>
            </div>

            {/* Bara Utilitară: Search & Filter Inputs */}
            <div className="p-2 border-b border-cyan-500/10 bg-[#040916] flex items-center gap-2 shrink-0">
                {/* Input de Căutare */}
                <div className="relative flex-1">
                    <Search
                        size={11}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400/70"
                    />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="SEARCH LOGS..."
                        className="w-full bg-[#030712] border border-cyan-500/30 rounded px-2 pl-7 py-1 text-[10px] font-mono text-cyan-300 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 uppercase transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400/70 hover:text-cyan-300"
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>

                {/* Dropdown Severitate */}
                <div className="relative">
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-[#030712] border border-cyan-500/30 rounded px-2 pr-5 py-1 text-[10px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer appearance-none uppercase transition-all"
                    >
                        <option value="ALL">ALL_SEV</option>
                        <option value="CRITICAL">CRIT</option>
                        <option value="WARNING">WARN</option>
                        <option value="INFO">INFO</option>
                    </select>
                    <SlidersHorizontal
                        size={9}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400/70 pointer-events-none"
                    />
                </div>
            </div>

            {/* Zona de Afișare Date / Corpul Tabelului */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/30 divide-y divide-cyan-500/20 bg-[#040814]">
                {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="p-3 flex flex-col gap-1 hover:bg-cyan-900/30 transition-colors group cursor-pointer"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-300 font-mono font-bold tracking-tight">
                                    [{log.time}]
                                </span>
                                <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-black tracking-wider border ${
                                        log.severity === "CRITICAL"
                                            ? "bg-rose-500/10 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                                            : log.severity === "WARNING"
                                              ? "bg-amber-500/10 text-amber-300 border-amber-500/40"
                                              : "bg-cyan-500/10 text-cyan-300 border-cyan-500/40"
                                    }`}
                                >
                                    {log.severity}
                                </span>
                            </div>
                            <div className="text-[11px] font-extrabold text-white tracking-wide uppercase font-mono group-hover:text-cyan-300 transition-colors">
                                {log.type}
                            </div>
                            <div className="text-[10px] text-cyan-300/90 font-mono font-medium truncate">
                                &gt; {log.target}
                            </div>
                        </div>
                    ))
                ) : (
                    /* Cyber Empty State în cazul în care nu sunt rezultate la filtrare */
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center font-mono gap-1">
                        <span className="text-rose-400/80 text-[11px] font-black tracking-wider uppercase">
                            // NO_RECORDS_FOUND
                        </span>
                        <span className="text-slate-400 text-[10px]">
                            FILTER_CRITERIA_YIELDED_0_RESULTS
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
