"use client";

import React, { useState } from "react";
import { Server } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

// Structura de date Mock adaptată pentru fiecare interval de timp
const MOCK_TELEMETRY_DATA = {
    "1W": [
        { time: "Mon", success: 2400, errors: 120 },
        { time: "Tue", success: 1398, errors: 98 },
        { time: "Wed", success: 9800, errors: 450 },
        { time: "Thu", success: 3908, errors: 210 },
        { time: "Fri", success: 4800, errors: 180 },
        { time: "Sat", success: 3800, errors: 50 },
        { time: "Sun", success: 4300, errors: 90 },
    ],
    "1M": [
        { time: "W1", success: 12000, errors: 600 },
        { time: "W2", success: 19000, errors: 1200 },
        { time: "W3", success: 32000, errors: 850 },
        { time: "W4", success: 27000, errors: 400 },
    ],
    "3M": [
        { time: "Month 1", success: 78000, errors: 3100 },
        { time: "Month 2", success: 95000, errors: 4200 },
        { time: "Month 3", success: 110000, errors: 2800 },
    ],
    "6M": [
        { time: "Jan", success: 85000, errors: 2900 },
        { time: "Feb", success: 92000, errors: 3100 },
        { time: "Mar", success: 115000, errors: 4200 },
        { time: "Apr", success: 128000, errors: 1900 },
        { time: "May", success: 142000, errors: 5100 },
        { time: "Jun", success: 165000, errors: 2300 },
    ],
    "1Y": [
        { time: "H1", success: 620000, errors: 18000 },
        { time: "H2", success: 890000, errors: 24000 },
    ],
    ALL: [
        { time: "2024", success: 1200000, errors: 45000 },
        { time: "2025", success: 2100000, errors: 62000 },
        { time: "2026", success: 3400000, errors: 51000 },
    ],
};

type TimeRange = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

export default function ApiTelemetryChart() {
    const [timeRange, setTimeRange] = useState<TimeRange>("1M");

    const timeOptions: TimeRange[] = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

    return (
        <div className="lg:col-span-8 bg-[#060b18] border border-cyan-500/30 rounded-xl p-4 flex flex-col relative overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:border-cyan-400/50 h-[320px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cyan-500/20 pb-3 mb-4 bg-[#030712] -mx-4 px-4 -mt-4 pt-4 shrink-0 gap-3 sm:gap-0">
                <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-black text-[11px] tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        GLOBAL_API_USAGE_v2.6
                    </span>
                </div>

                {/* Filtre de timp custom integrate în stilul cyber */}
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="flex items-center bg-[#060b18] border border-cyan-500/20 rounded p-0.5 font-mono text-[9px]">
                        {timeOptions.map((option) => (
                            <button
                                key={option}
                                onClick={() => setTimeRange(option)}
                                className={`px-2 py-0.5 cursor-pointer rounded transition-all duration-150 ${
                                    timeRange === option
                                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold"
                                        : "text-slate-200 hover:text-slate-300 border border-transparent"
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zonă Chart */}
            <div className="flex-1 w-full min-h-0 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={MOCK_TELEMETRY_DATA[timeRange]}
                        margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
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
                                    stopOpacity={0.2}
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
                                    stopOpacity={0.2}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#ff0055"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="rgba(6, 182, 212, 0.04)"
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
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#030712",
                                borderColor: "rgba(6,182,212,0.4)",
                                borderRadius: "6px",
                                fontFamily: "monospace",
                                fontSize: "10px",
                                boxShadow: "0 0 15px rgba(0,240,255,0.1)",
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="success"
                            stroke="#00f0ff"
                            strokeWidth={1.5}
                            fill="url(#trafficGrad)"
                            name="SUCCESS_REQ"
                        />
                        <Area
                            type="monotone"
                            dataKey="errors"
                            stroke="#ff0055"
                            strokeWidth={1.5}
                            fill="url(#errorGrad)"
                            name="FAILED_REQ"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
