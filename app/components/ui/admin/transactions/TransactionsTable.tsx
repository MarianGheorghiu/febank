"use client";

import { useState, useMemo } from "react";
import {
    Search,
    X,
    ShieldAlert,
    Terminal,
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
import { TransactionRow } from "./TransactionRow"; // Ajustează calea importului dacă e necesar

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
        <div className="w-full flex h-[800px] lg:h-[810px] flex-col bg-gradient-to-br from-[#020617] to-[#040e29] border-y lg:border border-cyan-500/30 lg:rounded-xl overflow-hidden relative transition-all duration-300 group/table hover:border-cyan-400/60 font-mono shadow-lg hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]">
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

                    <div className="flex overflow-x-auto sm:flex-wrap sm:overflow-visible bg-[#03091e] p-1 border border-cyan-500/30 rounded-lg gap-1 scrollbar-none">
                        {(
                            ["all", "PENDING", "FLAGGED", "COMPLETED"] as const
                        ).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`whitespace-nowrap flex-1 sm:flex-none px-3 py-1.5 sm:py-1 text-[10px] font-black uppercase tracking-wider rounded transition-all cursor-pointer text-center ${
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
                <div className="col-span-1 text-right mr-4">Value Mapping</div>
                <div className="col-span-1 text-center mr-8">Status</div>
                <div className="col-span-1 text-center mr-8">Risk Vector</div>
                <div className="col-span-2 text-right mr-12">Actions</div>
            </div>

            {/* DATA CONTENT AREA (Fixed flex box sizing & scroll) */}
            <div className="flex-1 min-h-[300px] overflow-y-auto p-3 sm:p-4 space-y-3 lg:space-y-2.5 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent relative z-10 bg-[#020512]/40">
                {filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-cyan-400/80 text-xs font-bold h-full">
                        <ShieldAlert
                            size={36}
                            className="mb-4 text-cyan-500/60 animate-pulse"
                        />
                        <p className="tracking-widest uppercase text-center px-4">
                            ZERO MATCHING SYSTEM OPERANDS FOUND
                        </p>
                    </div>
                ) : (
                    filteredTransactions.map((tx) => (
                        <TransactionRow
                            key={tx.id}
                            tx={tx}
                            onActionClick={onActionClick}
                            onExportTx={onExportTx}
                        />
                    ))
                )}
            </div>

            {/* 1. COMPACT NAVIGATION & PAGINATION BAR */}
            <div className="w-full bg-[#020816]/95 border-t border-cyan-500/20 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] shrink-0 relative z-10">
                <div className="text-cyan-400/70 font-bold text-center md:text-left">
                    SHOWING{" "}
                    <span className="text-white font-black">
                        1-{Math.min(rowsPerPage, filteredTransactions.length)}
                    </span>{" "}
                    OF{" "}
                    <span className="text-white font-black">
                        {transactions.length}
                    </span>{" "}
                    OPERANDS
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-cyan-400/50 uppercase font-bold tracking-wider hidden sm:block">
                            Rows:
                        </span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) =>
                                setRowsPerPage(Number(e.target.value))
                            }
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
            </div>

            {/* 2 & 3. DUAL FOOTER PANEL: AUDIT RECENT TRAIL & VIEWPORT EXTRACTION DECK */}
            <div className="w-full grid grid-cols-1 md:grid-cols-12 bg-[#010514]/90 border-t border-cyan-500/20 shrink-0 relative z-10">
                {/* AUDIT LOGS */}
                <div className="md:col-span-7 p-3 md:p-4 border-b md:border-b-0 md:border-r border-cyan-500/20 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-black text-[10px] uppercase tracking-widest">
                        <Activity size={12} className="animate-pulse" /> Live
                        Security Audit Log
                    </div>
                    <div className="bg-[#020617]/90 border border-cyan-500/10 rounded p-2 space-y-1 h-[72px] overflow-y-auto scrollbar-thin">
                        {auditLogs.map((log) => (
                            <div
                                key={log.id}
                                className="text-[10px] flex items-start gap-1.5"
                            >
                                <span className="text-cyan-500/100 font-black shrink-0">
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
                <div className="md:col-span-5 p-3 md:p-4 flex flex-col justify-between gap-3">
                    <div className="text-cyan-400 font-black text-[10px] uppercase tracking-widest text-center md:text-left">
                        Viewport Extraction Deck
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => alert("CSV data packet generated")}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500 hover:text-black font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <FileSpreadsheet size={12} /> CSV
                        </button>
                        <button
                            onClick={() => alert("Excel data packet generated")}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500 hover:text-black font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <FileText size={12} /> Excel
                        </button>
                    </div>
                    <button
                        onClick={() =>
                            alert("PDF dispatched to security vault address")
                        }
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-black font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                        <Mail size={12} /> Dispatch PDF to Vault
                    </button>
                </div>
            </div>

            {/* 4. SYSTEM HEALTH FOOTER */}
            <div className="w-full bg-[#00020a] border-t border-cyan-500/20 px-4 py-2 flex flex-col sm:flex-row justify-between items-center text-[9px] tracking-wider text-cyan-400/60 gap-2 shrink-0 relative z-10">
                <div className="flex items-center gap-3 text-center sm:text-left flex-wrap justify-center">
                    <span className="flex items-center gap-1.5 font-bold">
                        <Wifi
                            size={11}
                            className="text-emerald-400 animate-pulse"
                        />
                        Live WebSocket Connected
                    </span>
                    <span className="text-cyan-500/30 hidden sm:inline">|</span>
                    <span className="uppercase font-bold tracking-widest text-[8px]">
                        Sync Event:{" "}
                        <span className="text-white font-black">Just now</span>
                    </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center mt-1 sm:mt-0">
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Stripe: <span className="text-white">Active</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        Plaid: <span className="text-white">Stable</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Ledger: <span className="text-white">In Sync</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
