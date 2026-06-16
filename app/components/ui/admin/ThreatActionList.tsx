"use client";

import React, { useState, useMemo } from "react";
import { ShieldAlert, ChevronRight, Search, Trash2, X } from "lucide-react";
import { FLAGGED_ENTITIES, RiskLevel } from "@/app/lib/admin/mockDashboard";

interface ThreatActionListProps {
    selectedId: string;
    onSelectId: (id: string) => void;
    riskColors: Record<RiskLevel, string>;
}

export default function ThreatActionList({
    selectedId,
    onSelectId,
    riskColors,
}: ThreatActionListProps) {
    // 1. Stare locală pentru a permite ștergerea elementelor din listă
    const [entities, setEntities] = useState(FLAGGED_ENTITIES);
    // 2. Stare pentru termenul de căutare
    const [searchTerm, setSearchTerm] = useState("");

    // Funcția de ștergere locală (Purge Record)
    const handleDeleteEntity = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Previne selectarea rândului la click pe ștergere

        setEntities((prev) => prev.filter((item) => item.id !== id));

        // Dacă entitatea ștersă era cea selectată activ, resetăm selecția în părinte
        if (selectedId === id) {
            onSelectId("");
        }
    };

    // Filtrarea reactivă prin useMemo (după ID, Motiv sau Tip)
    const filteredEntities = useMemo(() => {
        return entities.filter(
            (entity) =>
                entity.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entity.reason
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                entity.type.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [entities, searchTerm]);

    return (
        <div className="lg:col-span-5 bg-[#060b18] border border-cyan-500/30 rounded-xl flex flex-col overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:border-cyan-400/50 h-[343px]">
            {/* Header Principal */}
            <div className="p-4 border-b border-cyan-500/20 bg-[#030712] flex items-center justify-between shrink-0">
                <span className="text-cyan-400 font-black text-[11px] tracking-widest uppercase flex items-center gap-1.5">
                    <ShieldAlert
                        size={14}
                        className="text-pink-500 animate-pulse"
                    />
                    THREAT::ACTION_REQUIRED
                </span>
                <span className="text-[9px] text-pink-400 font-black bg-pink-500/5 border border-pink-500/20 px-2 py-0.5 rounded tracking-wider transition-all">
                    {entities.length} PENDING_ANOMALIES
                </span>
            </div>

            {/* Sub-Header: Modul de Căutare (Search Input) */}
            <div className="p-2 border-b border-cyan-500/10 bg-[#040916] flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                    <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-500/40"
                    />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="FILTER_BY_ID_OR_SIGNATURE..."
                        className="w-full bg-[#030712] border border-cyan-500/20 rounded px-2 pl-8 py-1.5 text-[10px] font-mono text-cyan-400 placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400/50 uppercase transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-500/40 hover:text-cyan-400 transition-colors"
                        >
                            <X size={11} />
                        </button>
                    )}
                </div>
            </div>

            {/* Corpul Listei / Zona de Afișare */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 divide-y divide-cyan-500/10 bg-[#040814]">
                {filteredEntities.length > 0 ? (
                    filteredEntities.map((entity) => {
                        const isSelected = entity.id === selectedId;
                        const currentAccent = riskColors[entity.risk];

                        return (
                            <div
                                key={entity.id}
                                onClick={() => onSelectId(entity.id)}
                                className={`flex items-center justify-between px-4 py-3.5 transition-all duration-200 cursor-pointer group relative ${
                                    isSelected
                                        ? "bg-gradient-to-r from-cyan-950/40 to-transparent"
                                        : "bg-transparent hover:bg-cyan-950/10"
                                }`}
                            >
                                <div
                                    className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-200 ${
                                        isSelected
                                            ? "bg-cyan-400 shadow-[0_0_10px_#00f0ff]"
                                            : "bg-transparent group-hover:bg-cyan-500/20"
                                    }`}
                                />

                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-8 h-8 rounded text-[9px] font-black flex items-center justify-center border transition-all shrink-0"
                                        style={{
                                            borderColor: `${currentAccent}30`,
                                            color: currentAccent,
                                            backgroundColor: `${currentAccent}0a`,
                                            boxShadow: isSelected
                                                ? `0 0 8px ${currentAccent}20`
                                                : undefined,
                                        }}
                                    >
                                        {entity.type.slice(0, 3)}
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white font-bold text-xs tracking-wider uppercase group-hover:text-cyan-300 transition-colors">
                                            {entity.id}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5 truncate">
                                            {entity.reason}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-slate-100 font-black text-xs tracking-wide">
                                            {entity.amount > 0
                                                ? `$${entity.amount.toLocaleString()}`
                                                : "CRIT_DATA"}
                                        </span>
                                        <span
                                            className="text-[9px] font-extrabold mt-1 px-1.5 py-0.2 rounded text-center border"
                                            style={{
                                                color: currentAccent,
                                                borderColor: `${currentAccent}30`,
                                                backgroundColor: `${currentAccent}0a`,
                                            }}
                                        >
                                            {entity.status}
                                        </span>
                                    </div>

                                    {/* Zona de Acțiuni: Butonul de Ștergere apare vizibil la hover pe rând */}
                                    <div className="flex items-center gap-1.5 min-w-[20px] justify-end">
                                        <button
                                            onClick={(e) =>
                                                handleDeleteEntity(e, entity.id)
                                            }
                                            title="PURGE_RECORD"
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all duration-150"
                                        >
                                            <Trash2 size={12} />
                                        </button>

                                        <ChevronRight
                                            size={14}
                                            className={`transition-all duration-200 group-hover:opacity-0 ${
                                                isSelected
                                                    ? "text-cyan-400 translate-x-0.5"
                                                    : "text-slate-600"
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    /* Mesaje dinamice pentru stările goale */
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center font-mono gap-1">
                        {entities.length === 0 ? (
                            <>
                                <span className="text-emerald-400 text-[11px] font-black tracking-widest uppercase">
                                    // THREATS_CLEARED
                                </span>
                                <span className="text-slate-500 text-[9px]">
                                    ALL SYSTEM ANOMALIES PURGED AND SOLVED.
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-amber-500/70 text-[11px] font-black tracking-widest uppercase">
                                    // NO_MATCHES_FOUND
                                </span>
                                <span className="text-slate-600 text-[9px]">
                                    SIGNATURE NOT MATCHING UNRESOLVED THREATS.
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
