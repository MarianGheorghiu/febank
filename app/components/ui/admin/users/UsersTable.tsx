"use client";

import React, { useState, useMemo } from "react";
import {
    Search,
    X,
    ShieldAlert,
    Mail,
    Phone,
    Terminal,
    Eye,
    Edit3,
    Ban,
    Download,
    UserCheck,
} from "lucide-react";
import { User } from "@/app/lib/admin/mockUsers";

interface UsersTableProps {
    users: User[];
    onActionClick: (user: User, mode: "view" | "edit" | "block") => void;
    onExportUser: (user: User) => void;
}

export default function UsersTable({
    users,
    onActionClick,
    onExportUser,
}: UsersTableProps) {
    const [filter, setFilter] = useState<"all" | "ACTIVE" | "BLOCKED">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesFilter = filter === "all" || u.status === filter;
            const query = searchQuery.toLowerCase();
            return (
                matchesFilter &&
                (u.name.toLowerCase().includes(query) ||
                    u.username.toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query) ||
                    u.phone.includes(query) ||
                    u.id.toLowerCase().includes(query))
            );
        });
    }, [users, filter, searchQuery]);

    return (
        <div className="w-full flex h-[520px] flex-col bg-gradient-to-br from-[#020617] to-[#040e29] border border-cyan-500/40 rounded-xl overflow-hidden relative transition-all duration-300 group/table hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(34,211,238,0.2)]">
            {/* Cyberpunk Neon Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-100 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-cyan-400 blur-[15px] pointer-events-none" />

            {/* CONTROL PANEL: HEADER & HIGH-CONTRAST SEARCH */}
            <div className="p-4 sm:p-5 border-b border-cyan-500/30 bg-[#020816]/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 relative z-10">
                <div>
                    <div className="flex items-center gap-2">
                        <Terminal
                            size={18}
                            className="text-cyan-400 animate-pulse"
                        />
                        <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-widest uppercase">
                            User Grid Matrix
                        </h2>
                    </div>
                    <p className="text-[10px] text-cyan-400 font-mono mt-1 uppercase tracking-widest ml-6 font-bold">
                        System Registry • Directory Clearance
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
                    {/* High-Contrast Search Input */}
                    <div className="relative flex-1 sm:w-64 md:w-72">
                        <Search
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold"
                        />
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#03091e] border border-cyan-500/60 rounded-lg pl-10 pr-9 py-2.5 text-xs font-mono text-white placeholder-cyan-400/60 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-white cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Segmented Filter Buttons */}
                    <div className="flex bg-[#03091e] p-1 border border-cyan-500/40 rounded-lg gap-1">
                        {(["all", "ACTIVE", "BLOCKED"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                                    filter === f
                                        ? "bg-cyan-500 text-black border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                        : "text-cyan-400 bg-cyan-950/40 hover:text-white hover:bg-cyan-900/50 border border-cyan-500/20"
                                }`}
                            >
                                {f === "all" ? "All Nodes" : f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* DESKTOP TABLE HEADERS (Perfectly Configured Layout) */}
            <div className="hidden lg:grid grid-cols-12 gap-4 py-3 border-b border-cyan-500/30 bg-cyan-950/40 text-[11px] font-mono font-black text-cyan-400 uppercase tracking-widest shrink-0 items-center relative z-10 px-5">
                <div className="col-span-3 ml-12">Identity Node</div>
                <div className="col-span-3 ml-8">Contact Vector</div>
                <div className="col-span-1 text-center">Authority</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-right mr-6">Balance</div>
                <div className="col-span-2 text-right mr-12">Actions</div>
            </div>

            {/* DATA CONTENT AREA */}
            <div className="flex-1 min-h-0 overflow-y-auto max-h-[55vh] p-2 sm:p-3 space-y-3 scrollbar-thin relative z-10 bg-[#020512]/60">
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-cyan-400 font-mono text-xs font-bold">
                        <ShieldAlert
                            size={32}
                            className="mb-3 text-rose-500 animate-pulse"
                        />
                        <p className="tracking-widest uppercase">
                            ZERO MATCHING NODES DETECTED
                        </p>
                    </div>
                ) : (
                    filteredUsers.map((user) => {
                        const isBlocked = user.status === "BLOCKED";

                        return (
                            <div
                                key={user.id}
                                className={`group/row flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-center bg-[#050b1a]/90 p-4 rounded-lg border transition-all duration-300 shadow-sm ${
                                    isBlocked
                                        ? "border-rose-500/40 bg-rose-950/20 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                                        : "border-cyan-500/20 hover:border-cyan-400 hover:bg-[#071128] hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                                }`}
                            >
                                {/* MOBILE OVERLAY HEADCODE */}
                                <div className="w-full flex lg:hidden justify-between items-center border-b border-cyan-500/20 pb-2 mb-1">
                                    <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">
                                        NODE REGISTRY //{" "}
                                        <span className="text-white font-black bg-black/60 px-1.5 py-0.5 rounded border border-cyan-500/40">
                                            {user.id}
                                        </span>
                                    </span>
                                    <span
                                        className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                                            !isBlocked
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                                : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                        }`}
                                    >
                                        {user.status}
                                    </span>
                                </div>

                                {/* COL 1: IDENTITY NODE */}
                                <div className="w-full lg:w-auto col-span-3 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded border border-cyan-500/40 bg-[#020510] flex flex-col items-center justify-center shrink-0 font-mono">
                                        <span className="text-[7px] text-cyan-400 font-bold -mb-0.5">
                                            CLR
                                        </span>
                                        <span className="text-xs font-black text-cyan-300">
                                            {user.clearanceLevel}
                                        </span>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-white tracking-wide truncate">
                                            {user.name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1 font-mono text-[10px]">
                                            <span className="text-cyan-400 font-bold truncate">
                                                @{user.username}
                                            </span>
                                            {/* ID ALB PUR - COMPLET VIZIBIL */}
                                            <span className="hidden lg:inline text-white font-black bg-[#020510] px-2 py-0.5 rounded border border-cyan-500/50 tracking-wider">
                                                {user.id}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* COL 2: CONTACT VECTOR */}
                                <div className="w-full lg:w-auto col-span-3 grid grid-cols-2 lg:flex lg:flex-col gap-1 text-[11px] font-mono text-cyan-100 bg-black/30 lg:bg-transparent p-2 lg:p-0 rounded border border-cyan-500/20 lg:border-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Mail
                                            size={12}
                                            className="text-cyan-400 shrink-0"
                                        />
                                        <span className="truncate font-medium">
                                            {user.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 lg:mt-0.5">
                                        <Phone
                                            size={12}
                                            className="text-cyan-400 shrink-0"
                                        />
                                        <span className="text-cyan-300 font-medium">
                                            {user.phone}
                                        </span>
                                    </div>
                                </div>

                                {/* COL 3: ACCESS AUTHORITY */}
                                <div className="w-full lg:w-auto col-span-1 flex items-center justify-between lg:justify-center font-mono text-xs">
                                    <span className="lg:hidden text-[9px] text-cyan-400 font-bold uppercase tracking-widest">
                                        Authority
                                    </span>
                                    <span className="text-[10px] font-black tracking-widest text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded uppercase">
                                        {user.role}
                                    </span>
                                </div>

                                {/* COL 4: DESKTOP STATUS */}
                                <div className="hidden lg:flex col-span-1 justify-center font-mono">
                                    <span
                                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest ${
                                            !isBlocked
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                                : "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                                        }`}
                                    >
                                        {user.status}
                                    </span>
                                </div>

                                {/* COL 5: BALANCE (Separata complet pe 2 coloane desktop) */}
                                <div className="w-full lg:w-auto col-span-2 flex items-center justify-between lg:block text-right font-mono">
                                    <span className="lg:hidden text-[9px] text-cyan-400 font-bold uppercase tracking-widest">
                                        Balance
                                    </span>
                                    <span className="text-xs font-black text-emerald-400 tracking-wider">
                                        ${" "}
                                        {user.balance.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>

                                {/* COL 6: ACTIONS (Aliniata complet la dreapta fara coliziuni) */}
                                <div className="w-full lg:w-auto col-span-2 flex items-center justify-between lg:justify-end gap-1.5 pt-2 lg:pt-0 border-t border-cyan-500/20 lg:border-t-0">
                                    <span className="lg:hidden text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest">
                                        Actions
                                    </span>
                                    <div className="flex items-center gap-1.5 pr-0 lg:pr-1">
                                        <button
                                            onClick={() =>
                                                onActionClick(user, "view")
                                            }
                                            className="cursor-pointer p-1.5 rounded border font-mono font-black text-[9px] uppercase tracking-wider transition-all duration-200 text-cyan-400 border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                            title="Diagnostics"
                                        >
                                            <Eye size={12} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                onActionClick(user, "edit")
                                            }
                                            className="cursor-pointer p-1.5 rounded border font-mono font-black text-[9px] uppercase tracking-wider transition-all duration-200 text-amber-400 border-amber-500/50 bg-amber-500/10 hover:bg-amber-400 hover:text-black hover:shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                            title="Override"
                                        >
                                            <Edit3 size={12} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                onActionClick(user, "block")
                                            }
                                            className={`cursor-pointer p-1.5 rounded border font-mono font-black text-[9px] uppercase tracking-wider transition-all duration-200 ${
                                                !isBlocked
                                                    ? "text-rose-400 border-rose-500/50 bg-rose-500/10 hover:bg-rose-500 hover:text-black hover:shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                                                    : "text-emerald-400 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            }`}
                                            title={
                                                !isBlocked
                                                    ? "Terminate"
                                                    : "Reinstate"
                                            }
                                        >
                                            {!isBlocked ? (
                                                <Ban size={12} />
                                            ) : (
                                                <UserCheck size={12} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => onExportUser(user)}
                                            className="cursor-pointer p-1.5 rounded border font-mono font-black text-[9px] uppercase tracking-wider transition-all duration-200 text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-500/10 hover:bg-gradient-to-r hover:from-fuchsia-500 hover:to-cyan-500 hover:text-white hover:border-transparent hover:shadow-[0_0_10px_rgba(217,70,239,0.5)]"
                                            title="Dump Binary"
                                        >
                                            <Download size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
