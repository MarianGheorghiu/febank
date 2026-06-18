"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Loader2,
    Shield,
    Eye,
    Edit3,
    ShieldAlert,
    Mail,
    Phone,
    Hash,
    DollarSign,
} from "lucide-react";
import { User } from "@/app/lib/admin/mockUsers";

type ModalMode = "view" | "edit" | "block";

interface UserActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    mode: ModalMode | null;
    onConfirmEdit?: (updatedFields: Partial<User>) => void;
    onConfirmBlock?: () => void;
}

export default function UserActionModal({
    isOpen,
    onClose,
    user,
    mode,
    onConfirmEdit,
    onConfirmBlock,
}: UserActionModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const [editName, setEditName] = useState("");
    const [editRole, setEditRole] = useState<User["role"]>("CLIENT");
    const [editClearance, setEditClearance] = useState(1);

    useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false);
        } else if (user && mode === "edit") {
            setEditName(user.name);
            setEditRole(user.role);
            setEditClearance(user.clearanceLevel);
        }
    }, [isOpen, user, mode]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen || !user || !mode) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        setTimeout(() => {
            if (mode === "edit" && onConfirmEdit) {
                onConfirmEdit({
                    name: editName,
                    role: editRole,
                    clearanceLevel: editClearance,
                });
            } else if (mode === "block" && onConfirmBlock) {
                onConfirmBlock();
            }
            setIsProcessing(false);
            onClose();
        }, 1200);
    };

    // CONFIGURĂRI CYBERPUNK DE ÎNALT CONTRAST PENTRU FIECARE MODAL
    const config = {
        view: {
            title: "Node Diagnostics Readout",
            subtitle: "Secure Core Metadata Inspection",
            icon: <Eye size={18} />,
            colorClass: "text-cyan-400",
            borderClass: "border-cyan-500/60",
            bgGradient: "from-[#020617] to-[#04163a]",
            shadowClass: "shadow-[0_0_40px_rgba(6,182,212,0.25)]",
            accentBorder: "border-cyan-500/40",
        },
        edit: {
            title: "Override Core Access Parameters",
            subtitle: "Security Clearance and Role Mutation",
            icon: <Edit3 size={18} />,
            colorClass: "text-amber-400",
            borderClass: "border-amber-500/60",
            bgGradient: "from-[#020617] to-[#2a1405]",
            shadowClass: "shadow-[0_0_40px_rgba(245,158,11,0.25)]",
            accentBorder: "border-amber-500/40",
        },
        block: {
            title: "Access Enforcement Override",
            subtitle: "Cryptographic Node Connection Freeze",
            icon: <ShieldAlert size={18} />,
            colorClass: "text-rose-400",
            borderClass: "border-rose-500/60",
            bgGradient: "from-[#020617] to-[#2d0505]",
            shadowClass: "shadow-[0_0_40px_rgba(244,63,94,0.25)]",
            accentBorder: "border-rose-500/40",
        },
    }[mode];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            {/* Dark Backdrop Matrix Blur */}
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-md transition-all duration-300 cursor-pointer"
                onClick={!isProcessing ? onClose : undefined}
            />

            {/* Container Modal Principal */}
            <div
                className={`
                    relative w-full sm:max-w-md 
                    bg-gradient-to-br ${config.bgGradient}
                    border-t sm:border-2 ${config.borderClass}
                    rounded-t-[20px] sm:rounded-xl 
                    p-5 sm:p-7
                    ${config.shadowClass}
                    transition-all transform duration-300 ease-out
                    z-10 max-h-[92vh] overflow-y-auto
                    animate-in slide-in-from-bottom sm:zoom-in-95
                    text-white font-mono
                `}
            >
                {/* Mobile Handle Bar */}
                <div className="w-12 h-1 bg-cyan-500/30 rounded-full mx-auto mb-5 sm:hidden" />

                {/* MODAL TOP BRANDING */}
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-cyan-500/20">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded border bg-[#020510] ${config.accentBorder} ${config.colorClass} shadow-[0_0_10px_rgba(6,182,212,0.1)]`}
                        >
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-xs font-black tracking-widest uppercase text-white">
                                {config.title}
                            </h3>
                            <p className="text-[9px] text-cyan-400/80 font-bold tracking-wider uppercase mt-0.5">
                                {config.subtitle}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-1.5 rounded border bg-[#03091e] border-cyan-500/40 text-cyan-400 hover:text-white hover:border-cyan-400 transition-all active:scale-95 disabled:opacity-30 cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* TARGET IDENTITY NODE CONTEXT CARD */}
                <div className="mb-5 bg-[#03091e] border border-cyan-500/30 rounded-lg p-3 flex items-center justify-between shadow-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                    <div className="flex items-center gap-3 min-w-0 ml-1">
                        <div className="h-8 w-8 rounded bg-[#020510] border border-cyan-500/40 flex items-center justify-center font-black text-xs text-cyan-300 shrink-0">
                            {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[8px] font-black text-cyan-400/70 uppercase tracking-widest">
                                TARGET REGISTRY NODE
                            </span>
                            <span className="text-sm font-black text-white truncate block tracking-wide">
                                {user.name}
                            </span>
                        </div>
                    </div>
                    {/* ID COMPLET VIZIBIL - ALB CU BORDER NEON */}
                    <span className="text-[10px] font-black text-white bg-[#020510] border border-cyan-400 px-2 py-0.5 rounded tracking-wider shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                        {user.id}
                    </span>
                </div>

                {/* --- MODAL LOGIC ROUTING CORES --- */}

                {/* 1. VIEW MODE */}
                {mode === "view" && (
                    <div className="space-y-4 text-xs">
                        <div className="space-y-2.5 bg-[#020510]/90 border border-cyan-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                                <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                    <Hash size={12} /> System Tag:
                                </span>
                                <span className="text-white font-black tracking-wide bg-black/40 px-2 py-0.5 rounded border border-cyan-500/10">
                                    {user.username}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                                <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                    <Mail size={12} /> Routing Vector:
                                </span>
                                <span className="text-white font-bold truncate max-w-[220px]">
                                    {user.email}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                                <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                    <Phone size={12} /> Secure Endpoint:
                                </span>
                                <span className="text-white font-bold tracking-wide">
                                    {user.phone}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                                <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                    <Shield size={12} /> Cluster Role:
                                </span>
                                <span className="text-cyan-300 font-black tracking-widest bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded uppercase text-[10px]">
                                    {user.role}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                                <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                                    Access Gate Clearance:
                                </span>
                                <span className="text-amber-400 font-black tracking-widest bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded text-[10px]">
                                    LEVEL_0{user.clearanceLevel}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                                <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                    <DollarSign size={12} /> Vault Balance:
                                </span>
                                <span className="text-emerald-400 font-black tracking-widest text-sm">
                                    ${" "}
                                    {user.balance.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 text-[9px] uppercase tracking-wider font-bold">
                                <span className="text-cyan-500/60">
                                    Last Handshake Telemetry:
                                </span>
                                <span className="text-cyan-300 font-black">
                                    {user.lastActive}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full mt-2 py-3 rounded-lg border font-mono font-black text-[10px] uppercase tracking-widest transition-all duration-300 text-cyan-400 border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                        >
                            Acknowledge System Readout
                        </button>
                    </div>
                )}

                {/* 2. EDIT FORM MODE */}
                {mode === "edit" && (
                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                Overridden Full Name Signature
                            </label>
                            <input
                                type="text"
                                required
                                disabled={isProcessing}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-[#03091e] border border-amber-500/50 focus:border-amber-400 rounded-lg px-3 py-2.5 text-white font-mono placeholder-amber-500/30 focus:outline-none transition-all focus:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                Network Cluster Role Privilege
                            </label>
                            <select
                                disabled={isProcessing}
                                value={editRole}
                                onChange={(e) =>
                                    setEditRole(e.target.value as User["role"])
                                }
                                className="w-full bg-[#03091e] border border-amber-500/50 focus:border-amber-400 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none transition-all cursor-pointer"
                            >
                                <option value="CLIENT" className="bg-[#020617]">
                                    CLIENT (External Account Node)
                                </option>
                                <option
                                    value="OPERATOR"
                                    className="bg-[#020617]"
                                >
                                    OPERATOR (Internal Support Desk)
                                </option>
                                <option
                                    value="COMPLIANCE"
                                    className="bg-[#020617]"
                                >
                                    COMPLIANCE (Risk & Governance Auditor)
                                </option>
                                <option value="ADMIN" className="bg-[#020617]">
                                    ADMIN (Full Core Infrastructure Access)
                                </option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                Clearance Gate Threshold (Level 1-5)
                            </label>
                            <input
                                type="number"
                                required
                                disabled={isProcessing}
                                min="1"
                                max="5"
                                value={editClearance}
                                onChange={(e) =>
                                    setEditClearance(
                                        parseInt(e.target.value) || 1,
                                    )
                                }
                                className="w-full bg-[#03091e] border border-amber-500/50 focus:border-amber-400 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none transition-all focus:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            />
                        </div>

                        <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent my-2" />

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full py-3 rounded-lg border font-mono font-black text-[10px] uppercase tracking-widest transition-all duration-300 text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-400 hover:text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2
                                        size={13}
                                        className="animate-spin text-amber-400 group-hover:text-black"
                                    />
                                    COMMITTING CORE MUTATION...
                                </span>
                            ) : (
                                <span>COMMIT MUTATION OVERRIDE</span>
                            )}
                        </button>
                    </form>
                )}

                {/* 3. BLOCK ENFORCEMENT MODE */}
                {mode === "block" && (
                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/50 text-white font-medium leading-relaxed text-[11px] relative overflow-hidden shadow-inner">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 animate-pulse" />
                            <span className="font-black text-rose-400 block mb-1.5 uppercase tracking-widest text-[11px]">
                                ⚠️ CRITICAL ENFORCEMENT ACTION:
                            </span>
                            Ești pe cale de a schimba starea de autorizare din
                            nucleu. Acest lucru va bloca/debloca instantaneu
                            toate tranzacțiile, cardurile atașate și sesiunile
                            active pentru utilizatorul{" "}
                            <span className="text-rose-400 font-black underline tracking-wide bg-black/40 px-1 rounded">
                                {user.name}
                            </span>
                            .
                        </div>

                        <div className="flex bg-[#03091e] border border-rose-500/30 p-3.5 rounded-lg justify-between items-center shadow-md">
                            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                                Current Status Parameter:
                            </span>
                            <span
                                className={`font-black uppercase tracking-widest px-2.5 py-0.5 rounded text-[10px] border ${
                                    user.status === "ACTIVE"
                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                                        : "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                                }`}
                            >
                                {user.status}
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`w-full py-3.5 rounded-lg font-black text-[10px] tracking-widest uppercase text-white shadow-lg transition-all duration-300 cursor-pointer border ${
                                user.status === "ACTIVE"
                                    ? "text-rose-400 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500 hover:text-black hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                                    : "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                            }`}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2
                                        size={13}
                                        className="animate-spin"
                                    />
                                    SYNCHRONIZING REPOSITORIES...
                                </span>
                            ) : (
                                <span>
                                    {user.status === "ACTIVE"
                                        ? "EXECUTE HARD ACCESS FREEZE"
                                        : "REINSTATE SYSTEM ACCESS"}
                                </span>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
