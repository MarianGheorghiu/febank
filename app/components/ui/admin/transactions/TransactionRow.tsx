"use client";

import {
    ArrowRight,
    CheckCircle2,
    Edit3,
    Eye,
    Ban,
    Download,
} from "lucide-react";
import { Transaction } from "@/app/lib/admin/mockTransactions"; // Asigură-te că path-ul este corect

interface TransactionRowProps {
    tx: Transaction;
    onActionClick: (tx: Transaction, mode: "view" | "edit" | "block") => void;
    onExportTx: (tx: Transaction) => void;
}

export function TransactionRow({
    tx,
    onActionClick,
    onExportTx,
}: TransactionRowProps) {
    const isFlagged = tx.status === "FLAGGED";
    const isPending = tx.status === "PENDING";
    const isCompleted = tx.status === "COMPLETED";

    return (
        <div
            className={`group/row flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-center bg-[#050b1a]/70 p-4 lg:p-3 rounded-lg border transition-all duration-200 ${
                isFlagged
                    ? "border-blue-500/30 bg-blue-950/10 hover:border-blue-500 hover:shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                    : isPending
                      ? "border-amber-500/20 bg-amber-950/5 hover:border-amber-400/60"
                      : isCompleted
                        ? "border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-400/60"
                        : "border-cyan-500/10 hover:border-cyan-400/50 hover:bg-[#071128]/50"
            }`}
        >
            {/* MOBILE RECOGNITION NOTCH */}
            <div className="w-full flex lg:hidden justify-between items-center border-b border-cyan-500/10 pb-2 mb-0.5">
                <span className="text-[9px] font-bold text-cyan-400/60 tracking-wider">
                    SIGNATURE //{" "}
                    <span className="text-white font-black">{tx.id}</span>
                </span>
                <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isFlagged
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                >
                    {tx.status}
                </span>
            </div>

            {/* COL 1: ID & TIMESTAMP */}
            <div className="w-full lg:col-span-2 flex flex-col min-w-0">
                <span className="text-xs font-black text-white tracking-wide truncate hidden lg:block">
                    {tx.id}
                </span>
                <span className="text-[9px] text-cyan-500/90 mt-0.5 lg:mt-0">
                    {tx.timestamp}
                </span>
            </div>

            {/* COL 2: VECTOR PATH */}
            <div className="w-full lg:col-span-3 flex flex-col min-w-0 text-xs">
                <span className="text-cyan-100/90 font-bold truncate">
                    {tx.sender}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] mt-0.5 text-cyan-500/40">
                    <ArrowRight
                        size={10}
                        className="text-cyan-500/60 shrink-0"
                    />
                    <span className="truncate text-cyan-400/60">
                        {tx.receiver}
                    </span>
                </div>
            </div>

            {/* COL 3: MATRIX CLASS (Modificat din lg:col-span-2 în lg:col-span-1) */}
            <div className="w-full lg:col-span-1 flex flex-row lg:flex-col justify-between lg:justify-start min-w-0">
                <span className="lg:hidden text-[10px] font-bold text-cyan-500/40 uppercase">
                    Class:
                </span>
                <div className="text-right lg:text-left truncate">
                    <span className="block text-[9px] font-black tracking-widest text-cyan-400 uppercase truncate">
                        {tx.type}
                    </span>
                    <span className="block text-xs text-white/70 truncate mt-0.5 font-medium">
                        {tx.subType}
                    </span>
                </div>
            </div>

            {/* COL 4: VALUE MAPPING */}
            <div className="w-full lg:col-span-2 flex flex-row lg:flex-col justify-between items-center lg:items-end text-right">
                <span className="lg:hidden text-[10px] font-bold text-cyan-500/40 uppercase">
                    Amount:
                </span>
                <div className="flex flex-col items-end">
                    <span
                        className={`text-xs font-black tracking-wider ${
                            tx.type === "SYSTEM"
                                ? "text-cyan-300"
                                : "text-emerald-400"
                        }`}
                    >
                        {tx.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                        })}{" "}
                        {tx.currency}
                    </span>
                    <span className="text-[9px] text-white font-medium mt-0.5">
                        Fee: {tx.feeCollected}
                    </span>
                </div>
            </div>

            {/* COL 5: DESKTOP STATUS */}
            <div className="hidden lg:flex lg:col-span-1 justify-center">
                <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest ${
                        isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isFlagged
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                >
                    {tx.status}
                </span>
            </div>

            {/* COL 6: RISK VECTOR */}
            <div className="w-full lg:col-span-1 flex items-center justify-between lg:justify-center">
                <span className="lg:hidden text-[10px] font-bold text-cyan-500/40 uppercase">
                    Risk Factor:
                </span>
                <span
                    className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded border uppercase ${
                        tx.riskScore === "HIGH"
                            ? "bg-blue-950/40 text-blue-400 border-blue-500/30"
                            : tx.riskScore === "MEDIUM"
                              ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                              : "bg-cyan-950/40 text-cyan-400 border-cyan-500/30"
                    }`}
                >
                    {tx.riskScore}
                </span>
            </div>

            {/* COL 7: ACTIONS (Modificat din lg:col-span-1 în lg:col-span-2) */}
            <div className="w-full lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-2 pt-3 mt-1 lg:pt-0 lg:mt-0 border-t border-cyan-500/10 lg:border-t-0">
                <span className="lg:hidden text-[10px] font-bold text-cyan-400/50 uppercase">
                    Intercept:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-nowrap lg:gap-1.5">
                    <button
                        onClick={() => onActionClick(tx, "view")}
                        className="cursor-pointer p-1.5 rounded border flex justify-center text-cyan-400 border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500 hover:text-black transition-colors"
                        title="Telemetry"
                    >
                        <Eye size={14} className="lg:w-[12px] lg:h-[12px]" />
                    </button>
                    <button
                        onClick={() => onActionClick(tx, "edit")}
                        className="cursor-pointer p-1.5 rounded border flex justify-center text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-400 hover:text-black transition-colors"
                        title="Override Core"
                    >
                        <Edit3 size={14} className="lg:w-[12px] lg:h-[12px]" />
                    </button>
                    <button
                        onClick={() => onActionClick(tx, "block")}
                        className={`cursor-pointer p-1.5 rounded border flex justify-center transition-colors ${
                            isFlagged
                                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500"
                                : "text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500"
                        } hover:text-black`}
                        title={isFlagged ? "Authorize" : "Sovereign Hold"}
                    >
                        {isFlagged ? (
                            <CheckCircle2
                                size={14}
                                className="lg:w-[12px] lg:h-[12px]"
                            />
                        ) : (
                            <Ban
                                size={14}
                                className="lg:w-[12px] lg:h-[12px]"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => onExportTx(tx)}
                        className="cursor-pointer p-1.5 rounded border flex justify-center text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/5 hover:bg-fuchsia-500 hover:text-black transition-colors"
                        title="Binary Dump"
                    >
                        <Download
                            size={14}
                            className="lg:w-[12px] lg:h-[12px]"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}
