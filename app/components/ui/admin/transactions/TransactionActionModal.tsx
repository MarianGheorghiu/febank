"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Shield,
    Eye,
    Edit3,
    ShieldAlert,
    Hash,
    HardDrive,
} from "lucide-react";
import { Transaction } from "@/app/lib/admin/mockTransactions";

type ModalMode = "view" | "edit" | "block";

interface TransactionActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    mode: ModalMode | null;
    onConfirmEdit?: (updatedFields: Partial<Transaction>) => void;
    onConfirmBlock?: () => void;
}

export default function TransactionActionModal({
    isOpen,
    onClose,
    transaction,
    mode,
    onConfirmEdit,
    onConfirmBlock,
}: TransactionActionModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [editStatus, setEditStatus] =
        useState<Transaction["status"]>("PENDING");
    const [editRisk, setEditRisk] = useState<Transaction["riskScore"]>("LOW");

    useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false);
        } else if (transaction && mode === "edit") {
            setEditStatus(transaction.status);
            setEditRisk(transaction.riskScore);
        }
    }, [isOpen, transaction, mode]);

    if (!isOpen || !transaction || !mode) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        setTimeout(() => {
            if (mode === "edit" && onConfirmEdit) {
                onConfirmEdit({ status: editStatus, riskScore: editRisk });
            } else if (mode === "block" && onConfirmBlock) {
                onConfirmBlock();
            }
            setIsProcessing(false);
            onClose();
        }, 1200);
    };

    // Color configurations - "block" mode is now fully migrated to a clean cobalt blue spectrum
    const config = {
        view: {
            title: "Transaction Telemetry Readout",
            subtitle: "Deep Payload Cryptographic Inspection",
            icon: <Eye size={18} />,
            colorClass: "text-cyan-400",
            borderClass: "border-cyan-500/60",
            bgGradient: "from-[#020617] to-[#04163a]",
            shadowClass: "shadow-[0_0_40px_rgba(6,182,212,0.25)]",
            accentBorder: "border-cyan-500/40",
            accentBg: "bg-cyan-500",
            accentBgDim: "bg-cyan-500/10",
            accentTextMuted: "text-cyan-400/70",
            rowBorder: "border-cyan-500/20",
            notchBg: "bg-cyan-500/30",
            buttonHover: "hover:bg-cyan-500",
            alertBg: "bg-cyan-950/40",
        },
        edit: {
            title: "Override Ledger Status Parameters",
            subtitle: "State Mutation & Pipeline Realignment",
            icon: <Edit3 size={18} />,
            colorClass: "text-amber-400",
            borderClass: "border-amber-500/60",
            bgGradient: "from-[#020617] to-[#2a1405]",
            shadowClass: "shadow-[0_0_40px_rgba(245,158,11,0.25)]",
            accentBorder: "border-amber-500/40",
            accentBg: "bg-amber-500",
            accentBgDim: "bg-amber-500/10",
            accentTextMuted: "text-amber-400/70",
            rowBorder: "border-amber-500/20",
            notchBg: "bg-amber-500/30",
            buttonHover: "hover:bg-amber-400",
            alertBg: "bg-amber-950/40",
        },
        block: {
            title: "Sovereign Asset Enforcement Hold",
            subtitle: "Cryptographic Node Quarantine Freeze",
            icon: <ShieldAlert size={18} />,
            colorClass: "text-blue-400", // Nice cyan-blue replacement
            borderClass: "border-blue-500/60",
            bgGradient: "from-[#020617] to-[#051e54]", // Deep cyber blue background
            shadowClass: "shadow-[0_0_40px_rgba(59,130,246,0.25)]",
            accentBorder: "border-blue-500/40",
            accentBg: "bg-blue-500",
            accentBgDim: "bg-blue-500/10",
            accentTextMuted: "text-blue-400/70",
            rowBorder: "border-blue-500/20",
            notchBg: "bg-blue-500/30",
            buttonHover: "hover:bg-blue-500",
            alertBg: "bg-blue-950/40",
        },
    }[mode];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-md"
                onClick={!isProcessing ? onClose : undefined}
            />

            <div
                className={`relative w-full sm:max-w-md bg-gradient-to-br ${config.bgGradient} border-t sm:border-2 ${config.borderClass} rounded-t-[20px] sm:rounded-xl p-5 sm:p-7 ${config.shadowClass} z-10 max-h-[92vh] overflow-y-auto text-white font-mono`}
            >
                <div
                    className={`w-12 h-1 rounded-full mx-auto mb-5 sm:hidden ${config.notchBg}`}
                />

                {/* MODAL TOP BRANDING */}
                <div
                    className={`flex items-center justify-between mb-5 pb-3 border-b ${config.rowBorder}`}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded border bg-[#020510] ${config.accentBorder} ${config.colorClass}`}
                        >
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-xs font-black tracking-widest uppercase text-white">
                                {config.title}
                            </h3>
                            <p
                                className={`${config.colorClass}/80 text-[9px] font-bold tracking-wider uppercase mt-0.5`}
                            >
                                {config.subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className={`p-1.5 rounded border bg-[#03091e] ${config.accentBorder} ${config.colorClass} hover:text-white transition-all disabled:opacity-30 cursor-pointer`}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* LEDGER ID MATRIX */}
                <div
                    className={`mb-5 bg-[#03091e] border ${config.accentBorder} rounded-lg p-3 flex items-center justify-between shadow-md relative overflow-hidden`}
                >
                    <div
                        className={`absolute top-0 left-0 w-1 h-full ${config.accentBg}`}
                    />
                    <div className="min-w-0 ml-1">
                        <span
                            className={`block text-[8px] font-black ${config.accentTextMuted} uppercase tracking-widest`}
                        >
                            OPERATION PIPELINE SIGNATURE
                        </span>
                        <span className="text-sm font-black text-white truncate block tracking-wide">
                            {transaction.id}
                        </span>
                    </div>
                    <span
                        className={`text-[10px] font-black text-white bg-[#020510] border ${config.accentBorder} px-2 py-0.5 rounded tracking-wider`}
                    >
                        {transaction.currency} Matrix
                    </span>
                </div>

                {/* MODE VIEW */}
                {mode === "view" && (
                    <div className="space-y-4 text-xs">
                        <div
                            className={`space-y-2.5 bg-[#020510]/90 border ${config.accentBorder} rounded-lg p-4`}
                        >
                            <div
                                className={`flex items-center justify-between border-b ${config.rowBorder} pb-2`}
                            >
                                <span
                                    className={`${config.colorClass} font-bold flex items-center gap-1.5 uppercase text-[10px]`}
                                >
                                    <Hash size={12} /> Payload Hash:
                                </span>
                                <span
                                    className={`text-white font-black tracking-wide bg-black/40 px-2 py-0.5 rounded border ${config.rowBorder} text-[10px]`}
                                >
                                    {transaction.payloadHash || "N/A"}
                                </span>
                            </div>
                            <div
                                className={`flex items-center justify-between border-b ${config.rowBorder} pb-2`}
                            >
                                <span
                                    className={`${config.colorClass} font-bold flex items-center gap-1.5 uppercase text-[10px]`}
                                >
                                    <HardDrive size={12} /> Origin Vector IP:
                                </span>
                                <span className="text-white font-bold">
                                    {transaction.networkIp || "Internal Node"}
                                </span>
                            </div>
                            <div
                                className={`flex items-center justify-between border-b ${config.rowBorder} pb-2`}
                            >
                                <span
                                    className={`${config.colorClass} font-bold uppercase text-[10px]`}
                                >
                                    Source Ledger Entity:
                                </span>
                                <span className="text-white font-bold truncate max-w-[200px]">
                                    {transaction.sender}
                                </span>
                            </div>
                            <div
                                className={`flex items-center justify-between border-b ${config.rowBorder} pb-2`}
                            >
                                <span
                                    className={`${config.colorClass} font-bold uppercase text-[10px]`}
                                >
                                    Destination Vault:
                                </span>
                                <span className="text-white font-bold truncate max-w-[200px]">
                                    {transaction.receiver}
                                </span>
                            </div>
                            <div
                                className={`flex items-center justify-between border-b ${config.rowBorder} pb-2`}
                            >
                                <span
                                    className={`${config.colorClass} font-bold flex items-center gap-1.5 uppercase text-[10px]`}
                                >
                                    <Shield size={12} /> AML Risk Vector:
                                </span>
                                <span
                                    className={`font-black px-2 py-0.5 rounded border text-[10px] ${config.colorClass} ${config.accentBorder} ${config.accentBgDim}`}
                                >
                                    {transaction.riskScore}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`w-full mt-2 py-3 rounded-lg border font-mono font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${config.colorClass} ${config.accentBorder} ${config.accentBgDim} ${config.buttonHover} hover:text-black cursor-pointer`}
                        >
                            Acknowledge Quantum Readout
                        </button>
                    </div>
                )}

                {/* MODE EDIT */}
                {mode === "edit" && (
                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                            <label
                                className={`block text-[10px] font-black ${config.colorClass} uppercase tracking-widest`}
                            >
                                Force State Overwrite
                            </label>
                            <select
                                value={editStatus}
                                onChange={(e) =>
                                    setEditStatus(
                                        e.target.value as Transaction["status"],
                                    )
                                }
                                disabled={isProcessing}
                                className={`w-full bg-[#03091e] border ${config.accentBorder} focus:border-amber-400 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none cursor-pointer`}
                            >
                                <option
                                    value="COMPLETED"
                                    className="bg-[#020617]"
                                >
                                    COMPLETED (Commit to Immutable Ledger)
                                </option>
                                <option
                                    value="PENDING"
                                    className="bg-[#020617]"
                                >
                                    PENDING (Re-queue Processing Pipeline)
                                </option>
                                <option value="FAILED" className="bg-[#020617]">
                                    FAILED (Trigger Hard Rejection Trace)
                                </option>
                                <option
                                    value="FLAGGED"
                                    className="bg-[#020617]"
                                >
                                    FLAGGED (Quarantine to Security Control)
                                </option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label
                                className={`block text-[10px] font-black ${config.colorClass} uppercase tracking-widest`}
                            >
                                Adjust Risk Classification
                            </label>
                            <select
                                value={editRisk}
                                onChange={(e) =>
                                    setEditRisk(
                                        e.target
                                            .value as Transaction["riskScore"],
                                    )
                                }
                                disabled={isProcessing}
                                className={`w-full bg-[#03091e] border ${config.accentBorder} focus:border-amber-400 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none cursor-pointer`}
                            >
                                <option value="LOW" className="bg-[#020617]">
                                    LOW RISK (Standard System Vectors)
                                </option>
                                <option value="MEDIUM" className="bg-[#020617]">
                                    MEDIUM RISK (Unusual Volume Boundary)
                                </option>
                                <option value="HIGH" className="bg-[#020617]">
                                    HIGH RISK (Potential Exploit/AML Trigger)
                                </option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`w-full py-3 rounded-lg border font-mono font-black text-[10px] uppercase tracking-widest transition-all ${config.colorClass} ${config.accentBorder} ${config.accentBgDim} ${config.buttonHover} hover:text-black cursor-pointer`}
                        >
                            {isProcessing
                                ? "MUTATING TRANSACTION BLOCK..."
                                : "COMMIT MUTATION OVERRIDE"}
                        </button>
                    </form>
                )}

                {/* MODE BLOCK */}
                {mode === "block" && (
                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div
                            className={`p-4 rounded-lg ${config.alertBg} border ${config.accentBorder} text-white leading-relaxed text-[11px] relative overflow-hidden shadow-inner`}
                        >
                            <div
                                className={`absolute top-0 left-0 w-1 h-full ${config.accentBg} animate-pulse`}
                            />
                            <span
                                className={`font-black ${config.colorClass} block mb-1.5 uppercase tracking-widest`}
                            >
                                ⚠️ IMMEDIATE REGULATORY OVERRIDE:
                            </span>
                            You are about to freeze or revoke the selected
                            financial operation under sovereign authority. This
                            enforcement protocol will suspend the active
                            pipeline or fiat settlement, securely isolating and
                            retaining the underlying assets within the platform
                            treasury repository.
                        </div>
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`w-full py-3.5 rounded-lg font-black text-[10px] tracking-widest uppercase text-white shadow-lg transition-all border ${config.colorClass} ${config.accentBorder} ${config.accentBgDim} ${config.buttonHover} hover:text-black cursor-pointer`}
                        >
                            {isProcessing
                                ? "SYNCHRONIZING SECURE REPOSITORIES..."
                                : transaction.status === "FLAGGED"
                                  ? "RELEASE ENFORCEMENT FREEZE"
                                  : "EXECUTE SOVEREIGN ASSET FREEZE"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
