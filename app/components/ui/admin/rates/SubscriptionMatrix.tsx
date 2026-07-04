"use client";

import React from "react";
import { Layers, Edit3, ShieldAlert } from "lucide-react";
import { SubscriptionMatrixRow } from "@/app/lib/admin/mockRates";

interface SubscriptionMatrixProps {
    matrixRows: SubscriptionMatrixRow[];
    onCellEdit: (
        rowId: string,
        rowLabel: string,
        tierKey: "standard" | "premium" | "metal",
        currentFee: string,
    ) => void;
}

export default function SubscriptionMatrix({
    matrixRows,
    onCellEdit,
}: SubscriptionMatrixProps) {
    return (
        <div className="w-full flex flex-col bg-[#020617] border border-cyan-500/20 rounded-xl overflow-hidden font-mono shadow-xl p-4 sm:p-5 gap-4">
            {/* HEADER */}
            <div className="border-b border-cyan-500/10 pb-3">
                <div className="flex items-center gap-2">
                    <Layers className="text-cyan-400" size={16} />
                    <h3 className="text-xs font-black tracking-widest text-white uppercase">
                        SUBSCRIPTION TIERS POLICY MATRIX
                    </h3>
                </div>
                <p className="text-[9px] text-cyan-400/50 mt-0.5 uppercase tracking-wider font-bold">
                    Cross-Tier Fee Intersections & User Class Overrides
                </p>
            </div>

            {/* MATRIX GRID / TABLE */}
            <div className="w-full overflow-x-auto rounded-lg border border-cyan-500/10 bg-[#040a24]/20">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr className="border-b border-cyan-500/20 bg-cyan-950/20 text-[9px] font-black text-cyan-400 uppercase tracking-wider">
                            <th className="p-3">Financial Operand / Action</th>
                            <th className="p-3 text-center border-l border-cyan-500/10">
                                Standard Tier
                            </th>
                            <th className="p-3 text-center border-l border-cyan-500/10">
                                Premium Tier
                            </th>
                            <th className="p-3 text-center border-l border-cyan-500/10">
                                Metal Tier
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-500/5 text-xs">
                        {matrixRows.map((row) => (
                            <tr
                                key={row.actionId}
                                className="hover:bg-[#07113a]/30 transition-all group/row"
                            >
                                <td className="p-3 font-bold text-white tracking-wide">
                                    <span className="block text-[8px] text-cyan-500/60 font-mono font-bold mb-0.5">
                                        {row.actionId}
                                    </span>
                                    {row.actionLabel}
                                </td>

                                {/* STANDARD CELL */}
                                <td className="p-3 text-center border-l border-cyan-500/5 group/cell relative">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-zinc-300 font-mono font-medium">
                                            {row.standard.feeDisplay}
                                        </span>
                                        <button
                                            onClick={() =>
                                                onCellEdit(
                                                    row.actionId,
                                                    row.actionLabel,
                                                    "standard",
                                                    row.standard.feeDisplay,
                                                )
                                            }
                                            className="opacity-0 group-row-hover/row:opacity-100 hover:text-cyan-400 transition-all text-zinc-500 cursor-pointer"
                                        >
                                            <Edit3 size={11} />
                                        </button>
                                    </div>
                                </td>

                                {/* PREMIUM CELL */}
                                <td
                                    className={`p-3 text-center border-l border-cyan-500/5 relative ${row.premium.isCustomOverridden ? "bg-cyan-500/5" : ""}`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span
                                            className={`font-mono font-bold ${row.premium.isCustomOverridden ? "text-cyan-300" : "text-zinc-300"}`}
                                        >
                                            {row.premium.feeDisplay}
                                        </span>
                                        <button
                                            onClick={() =>
                                                onCellEdit(
                                                    row.actionId,
                                                    row.actionLabel,
                                                    "premium",
                                                    row.premium.feeDisplay,
                                                )
                                            }
                                            className="opacity-0 group-row-hover/row:opacity-100 hover:text-cyan-400 transition-all text-zinc-500 cursor-pointer"
                                        >
                                            <Edit3 size={11} />
                                        </button>
                                    </div>
                                    {row.premium.isCustomOverridden && (
                                        <div className="absolute top-0 right-0 w-1 h-1 bg-cyan-400 rounded-bl" />
                                    )}
                                </td>

                                {/* METAL CELL */}
                                <td
                                    className={`p-3 text-center border-l border-cyan-500/5 relative ${row.metal.isCustomOverridden ? "bg-emerald-500/5" : ""}`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span
                                            className={`font-mono font-black ${row.metal.feeDisplay === "FREE" ? "text-emerald-400" : "text-white"}`}
                                        >
                                            {row.metal.feeDisplay}
                                        </span>
                                        <button
                                            onClick={() =>
                                                onCellEdit(
                                                    row.actionId,
                                                    row.actionLabel,
                                                    "metal",
                                                    row.metal.feeDisplay,
                                                )
                                            }
                                            className="opacity-0 group-row-hover/row:opacity-100 hover:text-cyan-400 transition-all text-zinc-500 cursor-pointer"
                                        >
                                            <Edit3 size={11} />
                                        </button>
                                    </div>
                                    {row.metal.isCustomOverridden && (
                                        <div className="absolute top-0 right-0 w-1 h-1 bg-emerald-400 rounded-bl" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* DESCRIPTIVE MAP ADVISORY */}
            <div className="p-3 bg-zinc-950/40 border border-white/[0.04] rounded-lg text-[9px] text-zinc-400 leading-relaxed font-sans flex items-start gap-2">
                <ShieldAlert className="text-cyan-500 shrink-0" size={13} />
                <p>
                    Celulele marcate cu indicator de colț reprezintă modificări
                    de politici{" "}
                    <span className="text-white font-mono font-bold">
                        Overridden
                    </span>{" "}
                    manual care nu mai moștenesc ratele procentuale globale
                    calculate automat de nucleul principal.
                </p>
            </div>
        </div>
    );
}
