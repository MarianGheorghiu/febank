"use client";

import React from "react";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";
import {
    ComposedChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Bar,
    Line,
    ResponsiveContainer,
} from "recharts";
import { FlaggedEntity } from "@/app/lib/admin/mockDashboard";

interface VectorAnalysisChartProps {
    currentEntity: FlaggedEntity;
}

export default function VectorAnalysisChart({
    currentEntity,
}: VectorAnalysisChartProps) {
    return (
        <div className="lg:col-span-7 bg-[#060b18] border border-cyan-500/30 rounded-xl p-4 flex flex-col relative overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:border-cyan-400/50 h-[343px]">
            <div className="flex items-start justify-between border-b border-cyan-500/20 pb-3 mb-4 shrink-0 bg-[#030712] -mx-4 px-4 -mt-4 pt-4">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-2 leading-none">
                        <Activity
                            size={14}
                            className="text-cyan-400 animate-pulse"
                        />
                        VECTOR_ANALYSIS //{" "}
                        <span className="text-cyan-400">
                            {currentEntity.id}
                        </span>
                    </h3>
                    <span className="text-[9px] text-slate-200 uppercase tracking-wider mt-0.5">
                        TRIGGER:{" "}
                        <span className="text-pink-500 font-bold">
                            {currentEntity.reason}
                        </span>
                    </span>
                </div>

                <div className="flex gap-2 shrink-0">
                    <button className="bg-pink-500/5 hover:bg-pink-500/10 text-pink-400 border border-pink-500/30 px-2.5 py-1 rounded text-[9px] font-black tracking-wider uppercase transition-all flex items-center gap-1 active:scale-95 cursor-pointer">
                        <AlertTriangle size={11} /> TERMINATE
                    </button>
                    <button className="bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[9px] font-black tracking-wider uppercase transition-all flex items-center gap-1 active:scale-95 cursor-pointer">
                        <CheckCircle size={11} /> OVERRIDE
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={currentEntity.history}
                        margin={{ top: 10, right: -5, left: -25, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="rgba(6, 182, 212, 0.02)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(6, 182, 212, 0.15)"
                            tick={{
                                fill: "#475569",
                                fontSize: 9,
                                fontFamily: "monospace",
                            }}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="rgba(6, 182, 212, 0.15)"
                            tick={{
                                fill: "#475569",
                                fontSize: 9,
                                fontFamily: "monospace",
                            }}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="rgba(244, 63, 94, 0.15)"
                            tick={{
                                fill: "#ff0055",
                                fontSize: 9,
                                fontFamily: "monospace",
                            }}
                            tickLine={false}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#030712",
                                borderColor: "rgba(6,182,212,0.3)",
                                borderRadius: "4px",
                                fontFamily: "monospace",
                                fontSize: "11px",
                            }}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="volume"
                            fill="#00f0ff"
                            fillOpacity={0.08}
                            stroke="#00f0ff"
                            strokeWidth={1}
                            radius={[2, 2, 0, 0]}
                            barSize={20}
                            name="VOL_BURST"
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="riskScore"
                            stroke="#ff0055"
                            strokeWidth={2}
                            name="RISK_INDEX"
                            dot={{
                                r: 3,
                                fill: "#030712",
                                stroke: "#ff0055",
                                strokeWidth: 2,
                            }}
                            activeDot={{ r: 5, fill: "#ff0055" }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
