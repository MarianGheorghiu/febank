"use client";

import { useState, useMemo } from "react";
import {
    Search,
    X,
    ShieldAlert,
    Terminal,
    Eye,
    Edit3,
    Ban,
    Download,
    CheckCircle2,
    ArrowRight,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    FileSpreadsheet,
    FileText,
    Mail,
    Activity,
    Wifi,
} from "lucide-react";
import { Transaction } from "@/app/lib/admin/mockTransactions";

interface TransactionsTableProps {
    transactions: Transaction[];
    onActionClick: (tx: Transaction, mode: "view" | "edit" | "block") => void;
    onExportTx: (tx: Transaction) => void;
}

export default function TransactionsTable({
    transactions = [],
    onActionClick,
    onExportTx,
}: TransactionsTableProps) {
    const [filter, setFilter] = useState<
        "all" | "PENDING" | "FLAGGED" | "COMPLETED"
    >("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Mock internal audit logs for the view component
    const auditLogs = [
        {
            id: 1,
            time: "14:28:01",
            text: "SECURE_NODE // Access clearance confirmed for asset pipeline telemetry.",
        },
        {
            id: 2,
            time: "14:15:22",
            text: "AML_ENGINE // Automated threshold check verified across external nodes.",
        },
        {
            id: 3,
            time: "13:55:10",
            text: "CLEARING_HOUSE // System ledger synchronization event processed.",
        },
    ];

    const filteredTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const matchesFilter = filter === "all" || t.status === filter;
            const query = searchQuery.toLowerCase();
            return (
                matchesFilter &&
                (t.id.toLowerCase().includes(query) ||
                    t.sender.toLowerCase().includes(query) ||
                    t.receiver.toLowerCase().includes(query) ||
                    t.subType.toLowerCase().includes(query) ||
                    t.currency.toLowerCase().includes(query))
            );
        });
    }, [transactions, filter, searchQuery]);

    return (
        <div className="w-full flex h-[810px] flex-col bg-gradient-to-br from-[#020617] to-[#040e29] border-y lg:border border-cyan-500/30 lg:rounded-xl overflow-hidden relative transition-all duration-300 group/table hover:border-cyan-400/60 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)] font-mono">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-100 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-cyan-400/80 blur-[15px] pointer-events-none" />

            {/* CONTROL PANEL */}
            <div className="p-4 sm:p-5 border-b border-cyan-500/30 bg-[#020816]/95 backdrop-blur-md flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 relative z-10">
                <div>
                    <div className="flex items-center gap-2">
                        <Terminal
                            className="text-cyan-400 animate-pulse"
                            size={18}
                        />
                        <h2 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-widest uppercase">
                            Ledger Stream Matrix
                        </h2>
                    </div>
                    <p className="text-[10px] text-cyan-400/80 font-mono mt-1 uppercase tracking-widest ml-6 font-bold">
                        Real-time Transaction Audit Clearance
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full xl:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold"
                        />
                        <input
                            type="text"
                            placeholder="Search hash, entity, ledger..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#03091e] border border-cyan-500/50 rounded-lg pl-10 pr-9 py-2 text-xs text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
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

                    <div className="flex flex-wrap sm:flex-nowrap bg-[#03091e] p-1 border border-cyan-500/30 rounded-lg gap-1">
                        {(
                            ["all", "PENDING", "FLAGGED", "COMPLETED"] as const
                        ).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded transition-all cursor-pointer text-center ${
                                    filter === f
                                        ? "bg-cyan-500 text-black border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                        : "text-cyan-400 bg-cyan-950/20 hover:text-white hover:bg-cyan-900/40 border border-cyan-500/10"
                                }`}
                            >
                                {f === "all" ? "All" : f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* DESKTOP TABLE HEADERS */}
            <div className="hidden lg:grid grid-cols-12 gap-4 py-3 border-b border-cyan-500/20 bg-cyan-950/20 text-[10px] font-black text-cyan-400/90 uppercase tracking-widest shrink-0 items-center relative z-10 px-5">
                <div className="col-span-2 ml-2">Transaction ID</div>
                <div className="col-span-3 ml-2">Transfer Vector</div>
                <div className="col-span-2">Matrix Class</div>
                <div className="col-span-2 text-right mr-4">Value Mapping</div>
                <div className="col-span-1 text-center mr-8">Status</div>
                <div className="col-span-1 text-center mr-8">Risk Vector</div>
                <div className="col-span-1 text-right mr-14">Actions</div>
            </div>

            {/* DATA CONTENT AREA */}
            <div className="flex-1 min-h-0 overflow-y-auto h-[80px] p-2 sm:p-4 space-y-2.5 scrollbar-thin relative z-10 bg-[#020512]/40">
                {filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-cyan-400/80 text-xs font-bold">
                        <ShieldAlert
                            size={28}
                            className="mb-3 text-cyan-500/60 animate-pulse"
                        />
                        <p className="tracking-widest uppercase">
                            ZERO MATCHING SYSTEM OPERANDS FOUND
                        </p>
                    </div>
                ) : (
                    filteredTransactions.map((tx) => {
                        const isFlagged = tx.status === "FLAGGED";
                        const isPending = tx.status === "PENDING";
                        const isCompleted = tx.status === "COMPLETED";

                        return (
                            <div
                                key={tx.id}
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
                                        <span className="text-white font-black">
                                            {tx.id}
                                        </span>
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
                                    <span className="text-xs font-black text-white tracking-wide truncate">
                                        {tx.id}
                                    </span>
                                    <span className="text-[9px] text-cyan-500/90 mt-0.5">
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
                                            className="text-cyan-500/60"
                                        />
                                        <span className="truncate text-cyan-400/60">
                                            {tx.receiver}
                                        </span>
                                    </div>
                                </div>

                                {/* COL 3: MATRIX CLASS */}
                                <div className="w-full lg:col-span-2 flex flex-col min-w-0">
                                    <span className="text-[9px] font-black tracking-widest text-cyan-400 uppercase">
                                        {tx.type}
                                    </span>
                                    <span className="text-xs text-white/70 truncate mt-0.5 font-medium">
                                        {tx.subType}
                                    </span>
                                </div>

                                {/* COL 4: VALUE MAPPING */}
                                <div className="w-full lg:col-span-2 flex flex-row lg:flex-col justify-between items-center lg:items-end text-right">
                                    <span className="lg:hidden text-[10px] font-bold text-cyan-500/40 uppercase">
                                        Amount:
                                    </span>
                                    <div className="flex flex-col items-end">
                                        <span
                                            className={`text-xs font-black tracking-wider ${tx.type === "SYSTEM" ? "text-cyan-300" : "text-emerald-400"}`}
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

                                {/* COL 7: ACTIONS */}
                                <div className="w-full lg:col-span-1 flex items-center justify-between lg:justify-end gap-1.5 pt-2 lg:pt-0 border-t border-cyan-500/10 lg:border-t-0 w-full">
                                    <span className="lg:hidden text-[10px] font-bold text-cyan-400/50 uppercase">
                                        Intercept:
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() =>
                                                onActionClick(tx, "view")
                                            }
                                            className="cursor-pointer p-1.5 rounded border text-cyan-400 border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500 hover:text-black transition-colors"
                                            title="Telemetry"
                                        >
                                            <Eye size={11} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                onActionClick(tx, "edit")
                                            }
                                            className="cursor-pointer p-1.5 rounded border text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-400 hover:text-black transition-colors"
                                            title="Override Core"
                                        >
                                            <Edit3 size={11} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                onActionClick(tx, "block")
                                            }
                                            className={`cursor-pointer p-1.5 rounded border transition-colors ${
                                                isFlagged
                                                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500"
                                                    : "text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500"
                                            } hover:text-black`}
                                            title={
                                                isFlagged
                                                    ? "Authorize"
                                                    : "Sovereign Hold"
                                            }
                                        >
                                            {isFlagged ? (
                                                <CheckCircle2 size={11} />
                                            ) : (
                                                <Ban size={11} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => onExportTx(tx)}
                                            className="cursor-pointer p-1.5 rounded border text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/5 hover:bg-fuchsia-500 hover:text-black transition-colors"
                                            title="Binary Dump"
                                        >
                                            <Download size={11} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 1. COMPACT NAVIGATION & PAGINATION BAR */}
            <div className="w-full bg-[#020816]/95 border-t border-cyan-500/20 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] shrink-0 relative z-10">
                <div className="text-cyan-400/70 font-bold text-center md:text-left">
                    SHOWING <span className="text-white font-black">1-24</span>{" "}
                    OF <span className="text-white font-black">14,205</span>{" "}
                    OPERANDS
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-cyan-400/50 uppercase font-bold tracking-wider">
                        Rows:
                    </span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        className="bg-[#03091e] border border-cyan-500/30 rounded px-2 py-1 text-white focus:outline-none focus:border-cyan-400 cursor-pointer text-[10px]"
                    >
                        <option value={25}>25 Rows</option>
                        <option value={50}>50 Rows</option>
                        <option value={100}>100 Rows</option>
                    </select>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        className="p-1.5 rounded border border-cyan-500/20 text-cyan-400/40 bg-cyan-950/10 cursor-not-allowed"
                        disabled
                    >
                        <ChevronsLeft size={12} />
                    </button>
                    <button
                        className="p-1.5 rounded border border-cyan-500/20 text-cyan-400/40 bg-cyan-950/10 cursor-not-allowed"
                        disabled
                    >
                        <ChevronLeft size={12} />
                    </button>
                    <span className="px-2.5 py-0.5 bg-cyan-500 text-black font-black border border-cyan-400 rounded text-[10px]">
                        1
                    </span>
                    <button className="p-1.5 rounded border border-cyan-500/20 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-500 hover:text-black cursor-pointer transition-colors">
                        <ChevronRight size={12} />
                    </button>
                    <button className="p-1.5 rounded border border-cyan-500/20 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-500 hover:text-black cursor-pointer transition-colors">
                        <ChevronsRight size={12} />
                    </button>
                </div>
            </div>

            {/* 2 & 3. DUAL FOOTER PANEL: AUDIT RECENT TRAIL & VIEWPORT EXTRACTION DECK */}
            <div className="w-full grid grid-cols-1 md:grid-cols-12 bg-[#010514]/90 border-t border-cyan-500/20 shrink-0 relative z-10">
                {/* AUDIT LOGS */}
                <div className="md:col-span-7 p-3 border-b md:border-b-0 md:border-r border-cyan-500/20 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-black text-[10px] uppercase tracking-widest">
                        <Activity size={12} className="animate-pulse" /> Live
                        Security Audit Log
                    </div>
                    <div className="bg-[#020617]/90 border border-cyan-500/10 rounded p-2 space-y-1 h-[72px] overflow-y-auto scrollbar-thin">
                        {auditLogs.map((log) => (
                            <div
                                key={log.id}
                                className="text-[10px] flex items-start gap-1.5 truncate"
                            >
                                <span className="text-cyan-500/100 font-black">
                                    [{log.time}]
                                </span>
                                <span className="text-white/80">
                                    {log.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EXTRACTION TOOLS */}
                <div className="md:col-span-5 p-3 flex flex-col justify-between gap-2">
                    <div className="text-cyan-400 font-black text-[10px] uppercase tracking-widest">
                        Viewport Extraction Deck
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            onClick={() => alert("CSV data packet generated")}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500 hover:text-black font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <FileSpreadsheet size={11} /> CSV
                        </button>
                        <button
                            onClick={() => alert("Excel data packet generated")}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500 hover:text-black font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <FileText size={11} /> Excel
                        </button>
                    </div>
                    <button
                        onClick={() =>
                            alert("PDF dispatched to security vault address")
                        }
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-black font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                        <Mail size={11} /> Dispatch PDF Report to Compliance
                        Vault
                    </button>
                </div>
            </div>

            {/* 4. ULTRATHIN SYSTEM HEALTH FOOTER BAR */}
            <div className="w-full bg-[#00020a] border-t border-cyan-500/20 px-4 py-2 flex flex-col sm:flex-row justify-between items-center text-[9px] tracking-wider text-cyan-400/60 gap-2 shrink-0 relative z-10">
                <div className="flex items-center gap-3 text-center sm:text-left flex-wrap justify-center">
                    <span className="flex items-center gap-1.5 font-bold">
                        <Wifi
                            size={11}
                            className="text-emerald-400 animate-pulse"
                        />
                        Live WebSocket Link Connected
                    </span>
                    <span className="text-cyan-500/30 hidden sm:inline">|</span>
                    <span className="uppercase font-bold tracking-widest text-[8px]">
                        Last Sync Event:{" "}
                        <span className="text-white font-black">Just now</span>
                    </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Stripe: <span className="text-white">Active</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        Plaid: <span className="text-white">Stable (+12%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Ledger Engine:{" "}
                        <span className="text-white">Synchronized</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
