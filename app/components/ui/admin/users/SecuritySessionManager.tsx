"use client";

import React, { useMemo, useState } from "react";
import {
    ShieldAlert,
    KeyRound,
    RefreshCw,
    Smartphone,
    Laptop,
    Database,
    ShieldCheck,
    Search,
} from "lucide-react";
import { User, UserSession, AuditLog } from "@/app/lib/admin/mockUsers";

interface SecuritySessionManagerProps {
    selectedUser: User | null;
    selectedLog: AuditLog | null;
    sessions: UserSession[];
    onRevokeAllSessions: (userId: string) => void;
    onResetMFA: (userId: string) => void;
    onForcePasswordReset: (userId: string) => void;
}

export default function SecuritySessionManager({
    selectedUser,
    selectedLog,
    sessions,
    onRevokeAllSessions,
    onResetMFA,
    onForcePasswordReset,
}: SecuritySessionManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const userSessions = useMemo(() => {
        if (!selectedUser) return [];
        return sessions.filter((s) => s.userId === selectedUser.id);
    }, [selectedUser, sessions]);

    // Filter sessions based on search bar input
    const filteredSessions = useMemo(() => {
        return userSessions.filter((session) => {
            const search = searchTerm.toLowerCase();
            return (
                session.device.toLowerCase().includes(search) ||
                session.browser.toLowerCase().includes(search) ||
                session.location.toLowerCase().includes(search) ||
                session.ip.toLowerCase().includes(search)
            );
        });
    }, [userSessions, searchTerm]);

    // State when no user is selected
    if (!selectedUser) {
        return (
            <div className="w-full h-[500px] flex flex-col items-center justify-center bg-gradient-to-br from-[#020617] to-[#040e29] border border-cyan-500/40 rounded-xl p-6 text-center">
                <ShieldAlert size={24} className="text-cyan-400 mb-2" />
                <span className="text-cyan-400 font-mono text-xs font-bold tracking-widest uppercase">
                    [ INDETERMINATE SECURITY CONTEXT ]
                </span>
                <p className="text-xs text-slate-400 mt-2 max-w-xs">
                    Select a user or an audit log from the left panel to begin
                    investigation.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-[500px] flex flex-col bg-[#020617] border border-cyan-500/40 rounded-xl overflow-hidden relative shadow-[0_0_20px_rgba(6,182,212,0.08)]">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-500" />

            {/* HEADER */}
            <div className="p-4 border-b border-cyan-500/30 bg-[#020816]/95 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                    <div className="flex items-center gap-2">
                        <KeyRound size={16} className="text-cyan-400" />
                        <h2 className="text-sm font-bold text-white tracking-wider uppercase">
                            Security Inspector
                        </h2>
                    </div>
                    <p className="text-xs font-mono text-cyan-400/80 mt-0.5">
                        Active Node:{" "}
                        <span className="text-white font-medium bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            {selectedUser.name}
                        </span>
                    </p>
                </div>

                <button
                    onClick={() => onRevokeAllSessions(selectedUser.id)}
                    className="cursor-pointer px-3 py-1.5 rounded-lg border font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 text-rose-400 border-rose-500/40 bg-rose-500/10 hover:bg-rose-600 hover:text-white self-start sm:self-auto active:scale-95 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                >
                    Revoke All Sessions
                </button>
            </div>

            {/* CONTENT AREA (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {/* 1. MUTATION INSPECTOR */}
                <div className="space-y-2 bg-[#040d26]/40 p-3 rounded-lg border border-cyan-500/30">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-cyan-500/20">
                        <Database size={14} className="text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide">
                            {selectedLog
                                ? `Decrypted Mutation Sector // ID: ${selectedLog.id}`
                                : "Decrypted Mutation Sector // Unspecified"}
                        </span>
                    </div>

                    {selectedLog ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider block pl-1">
                                    [-] Before Modification
                                </span>
                                <pre className="bg-[#01040f] text-rose-300 p-3 rounded-lg border border-rose-500/40 overflow-x-auto text-xs font-mono max-h-32 scrollbar-thin">
                                    {selectedLog.before
                                        ? JSON.stringify(
                                              selectedLog.before,
                                              null,
                                              2,
                                          )
                                        : `"INITIAL_NULL_START"`}
                                </pre>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block pl-1">
                                    [+] After Modification
                                </span>
                                <pre className="bg-[#01040f] text-emerald-300 p-3 rounded-lg border border-emerald-500/40 overflow-x-auto text-xs font-mono max-h-32 scrollbar-thin">
                                    {selectedLog.after
                                        ? JSON.stringify(
                                              selectedLog.after,
                                              null,
                                              2,
                                          )
                                        : `"TERMINATED_NULL_END"`}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="py-5 px-2 bg-[#020617]/60 border border-dashed border-cyan-500/30 rounded-lg text-center text-xs font-mono text-cyan-500/50 uppercase tracking-wide">
                            Click a row from the left audit log to inspect JSON
                            states.
                        </div>
                    )}
                </div>

                {/* 2. QUICK ACTIONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 2FA Matrix */}
                    <div className="flex items-center justify-between p-3 bg-cyan-950/10 border border-cyan-500/30 rounded-lg">
                        <div className="flex items-center gap-2.5">
                            <Smartphone size={16} className="text-cyan-400" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">
                                    2FA Matrix
                                </span>
                                <span className="text-[11px] text-slate-400">
                                    Google Auth
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => onResetMFA(selectedUser.id)}
                            className="cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded border border-cyan-400/50 bg-cyan-500/10 text-cyan-400 font-mono font-bold text-xs uppercase tracking-wider hover:bg-cyan-500 hover:text-black transition-all"
                        >
                            <RefreshCw size={10} /> Reset Setup
                        </button>
                    </div>

                    {/* Force Reset */}
                    <div className="flex items-center justify-between p-3 bg-amber-950/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-center gap-2.5">
                            <KeyRound size={16} className="text-amber-400" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">
                                    Next Login
                                </span>
                                <span className="text-[11px] text-slate-400">
                                    Force Reset
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() =>
                                onForcePasswordReset(selectedUser.id)
                            }
                            className="cursor-pointer px-3 py-1 rounded border border-amber-400/50 bg-amber-500/10 text-amber-400 font-mono font-bold text-xs uppercase tracking-wider hover:bg-amber-500 hover:text-black transition-all"
                        >
                            Enforce
                        </button>
                    </div>
                </div>

                {/* 3. ACTIVE SESSIONS LIST WITH SEARCHBAR */}
                <div className="space-y-2">
                    <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-center sm:justify-between px-1">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-cyan-400" />
                            <span className="text-xs font-mono font-bold text-cyan-400/90 uppercase tracking-wider">
                                Active Login Contexts ({filteredSessions.length}
                                )
                            </span>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-48">
                            <Search
                                size={12}
                                className="absolute left-2.5 top-2.5 text-cyan-500/80"
                            />
                            <input
                                type="text"
                                placeholder="Filter sessions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2.5 py-1.5 bg-[#01040f] border border-cyan-500/80 rounded-md text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(6,182,212,0.1)] transition-all"
                            />
                        </div>
                    </div>

                    {filteredSessions.length === 0 ? (
                        <div className="text-xs font-mono text-cyan-500/50 p-4 text-center border border-dashed border-cyan-500/30 bg-black/20 rounded-lg uppercase tracking-wide">
                            {userSessions.length === 0
                                ? "No active sessions detected for this node."
                                : "No sessions match your search criteria."}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredSessions.map((session) => {
                                const isMobile = /iphone|android|phone/i.test(
                                    session.device,
                                );
                                return (
                                    <div
                                        key={session.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#040d26]/30 p-3 rounded-lg border border-cyan-500/30 transition-all hover:bg-[#040d26]/60"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-[#01040f] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                                                {isMobile ? (
                                                    <Smartphone size={14} />
                                                ) : (
                                                    <Laptop size={14} />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white">
                                                        {session.device}
                                                    </span>
                                                    {session.isCurrent && (
                                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold uppercase">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    {session.browser} &bull;{" "}
                                                    {session.location}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-cyan-500/20 pt-1.5 sm:pt-0 font-mono">
                                            <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                                {session.ip}
                                            </span>
                                            <span className="text-[11px] text-slate-400 mt-1">
                                                {session.lastActive}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
