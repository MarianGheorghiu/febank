"use client";

import React, { useState, useMemo } from "react";
import {
    ShieldAlert,
    Activity,
    Terminal,
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    Server,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    CartesianGrid,
    BarChart,
    Bar,
    Line,
    ComposedChart,
} from "recharts";
import {
    SYSTEM_LOGS,
    API_TRAFFIC_DATA,
    FLAGGED_ENTITIES,
} from "@/app/lib/admin/mockDashboard";

export default function AdminCommandCenter() {
    const [selectedEntityId, setSelectedEntityId] = useState<string>(
        FLAGGED_ENTITIES[0].id,
    );

    const currentEntity = useMemo(() => {
        return (
            FLAGGED_ENTITIES.find((e) => e.id === selectedEntityId) ||
            FLAGGED_ENTITIES[0]
        );
    }, [selectedEntityId]);

    return (
        <div className="flex flex-col gap-4 font-mono w-full m-0 p-0 bg-[#02040a] text-slate-200">
            {/* RANDUL 1: MACRO VIEW (Traffic + Logs) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch h-[300px]">
                {/* CHART 1: API TRAFFIC (Col 8) */}
                <div className="lg:col-span-8 bg-[#060b18] border border-cyan-500/30 rounded-xl p-4 flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-4">
                        <span className="text-cyan-400 font-black text-[11px] tracking-widest uppercase flex items-center gap-2">
                            <Server size={14} /> GLOBAL_API_TELEMETRY
                        </span>
                        <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded">
                            SYSTEM_STABLE
                        </span>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={API_TRAFFIC_DATA}
                                margin={{
                                    top: 5,
                                    right: 0,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="trafficGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#00f0ff"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#00f0ff"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="errorGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#ff0055"
                                            stopOpacity={0.5}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#ff0055"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(6, 182, 212, 0.05)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="time"
                                    stroke="rgba(6, 182, 212, 0.2)"
                                    tick={{ fill: "#64748b", fontSize: 9 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="rgba(6, 182, 212, 0.2)"
                                    tick={{ fill: "#64748b", fontSize: 9 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: "#030712",
                                        borderColor: "rgba(6,182,212,0.4)",
                                        borderRadius: "6px",
                                        fontSize: "10px",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="success"
                                    stroke="#00f0ff"
                                    strokeWidth={2}
                                    fill="url(#trafficGrad)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="errors"
                                    stroke="#ff0055"
                                    strokeWidth={2}
                                    fill="url(#errorGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TABEL 1: SYSTEM LOGS (Col 4) */}
                <div className="lg:col-span-4 bg-[#060b18] border border-cyan-500/30 rounded-xl flex flex-col overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                    <div className="p-3 border-b border-cyan-500/20 bg-[#030712] flex items-center gap-2">
                        <Terminal size={14} className="text-cyan-400" />
                        <span className="text-cyan-400 font-black text-[11px] tracking-widest uppercase">
                            LIVE_AUDIT_LOGS
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-cyan-500/10 p-2">
                        {SYSTEM_LOGS.map((log) => (
                            <div
                                key={log.id}
                                className="py-2 px-2 flex flex-col gap-1 hover:bg-cyan-950/20 transition-colors rounded"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-400">
                                        {log.time}
                                    </span>
                                    <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                            log.severity === "CRITICAL"
                                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                                : log.severity === "WARNING"
                                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                  : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                        }`}
                                    >
                                        {log.severity}
                                    </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-200">
                                    {log.type}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                    {log.target}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RANDUL 2: MICRO VIEW (Actionable Entities & Interactive Chart) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch h-[360px]">
                {/* TABEL 2: FLAGGED ENTITIES (Lista Interactiva - Col 5) */}
                <div className="lg:col-span-5 bg-[#060b18] border border-rose-500/30 rounded-xl flex flex-col overflow-hidden shadow-[0_0_20px_rgba(244,63,94,0.05)]">
                    <div className="p-4 border-b border-rose-500/20 bg-[#030712] flex items-center justify-between">
                        <span className="text-rose-400 font-black text-[11px] tracking-widest uppercase flex items-center gap-2 animate-pulse">
                            <ShieldAlert size={14} /> ACTION_REQUIRED
                        </span>
                        <span className="text-[10px] text-rose-400 font-bold">
                            {FLAGGED_ENTITIES.length} PENDING
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-rose-500/10 bg-[#040814]">
                        {FLAGGED_ENTITIES.map((entity) => {
                            const isSelected = entity.id === selectedEntityId;
                            return (
                                <div
                                    key={entity.id}
                                    onClick={() =>
                                        setSelectedEntityId(entity.id)
                                    }
                                    className={`px-4 py-3 cursor-pointer group relative transition-all ${
                                        isSelected
                                            ? "bg-gradient-to-r from-rose-950/40 to-transparent"
                                            : "hover:bg-rose-950/10"
                                    }`}
                                >
                                    <div
                                        className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all ${
                                            isSelected
                                                ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                                                : "bg-transparent group-hover:bg-rose-500/20"
                                        }`}
                                    />

                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-[11px] group-hover:text-rose-300">
                                                {entity.id}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {entity.reason}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-200 font-bold text-[11px]">
                                                {entity.amount > 0
                                                    ? `$${entity.amount.toLocaleString()}`
                                                    : "N/A"}
                                            </span>
                                            <span className="text-[9px] text-rose-400 border border-rose-500/20 px-1 rounded mt-0.5">
                                                {entity.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CHART 2: ENTITY RISK ANALYSIS (Col 7 - Reactioneaza la click) */}
                <div className="lg:col-span-7 bg-[#060b18] border border-cyan-500/30 rounded-xl p-4 flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                    <div className="flex items-start justify-between border-b border-cyan-500/20 pb-3 mb-4">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-2">
                                <Activity size={16} className="text-cyan-400" />
                                ENTITY_ANALYSIS // {currentEntity.id}
                            </h3>
                            <span className="text-[10px] text-slate-400 mt-1 uppercase">
                                TRIGGER:{" "}
                                <span className="text-rose-400">
                                    {currentEntity.reason}
                                </span>
                            </span>
                        </div>

                        {/* Action Buttons pentru admin */}
                        <div className="flex gap-2">
                            <button className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1">
                                <AlertTriangle size={12} /> RESTRICT
                            </button>
                            <button className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1">
                                <CheckCircle size={12} /> CLEAR
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            {/* Composed Chart: Bare pentru Volum, Linie rosie pentru Risk Score */}
                            <ComposedChart
                                data={currentEntity.history}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="4 4"
                                    stroke="rgba(6, 182, 212, 0.05)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(6, 182, 212, 0.2)"
                                    tick={{ fill: "#64748b", fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke="rgba(6, 182, 212, 0.2)"
                                    tick={{ fill: "#64748b", fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="rgba(244, 63, 94, 0.2)"
                                    tick={{ fill: "#f43f5e", fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: "#030712",
                                        borderColor: "rgba(6,182,212,0.4)",
                                        borderRadius: "6px",
                                        fontFamily: "monospace",
                                        fontSize: "11px",
                                    }}
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="volume"
                                    fill="#00f0ff"
                                    fillOpacity={0.2}
                                    stroke="#00f0ff"
                                    radius={[2, 2, 0, 0]}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="riskScore"
                                    stroke="#f43f5e"
                                    strokeWidth={3}
                                    dot={{
                                        r: 4,
                                        fill: "#030712",
                                        stroke: "#f43f5e",
                                        strokeWidth: 2,
                                    }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
