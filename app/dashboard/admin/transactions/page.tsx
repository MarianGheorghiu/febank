"use client";

import React, { useState } from "react";
import {
    Layers,
    CheckCircle2,
    XCircle,
    Download,
    RefreshCw,
} from "lucide-react";
import PageHeader from "@/app/components/ui/PageHeader";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import TransactionWidgets from "@/app/components/ui/admin/transactions/TransactionWidgets";
import TransactionsTable from "@/app/components/ui/admin/transactions/TransactionsTable";
import TransactionActionModal from "@/app/components/ui/admin/transactions/TransactionActionModal";

import {
    mockTransactions,
    mockAdminStats,
    Transaction,
} from "@/app/lib/admin/mockTransactions";

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] =
        useState<Transaction[]>(mockTransactions);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const stats = mockAdminStats.globalCounters;

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        transaction: Transaction | null;
        mode: "view" | "edit" | "block" | null;
    }>({
        isOpen: false,
        transaction: null,
        mode: null,
    });

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleActionClick = (
        tx: Transaction,
        mode: "view" | "edit" | "block",
    ) => {
        setModalConfig({
            isOpen: true,
            transaction: tx,
            mode: mode,
        });
    };

    const handleExportTx = (tx: Transaction) => {
        alert(`Telemetry Registry Dump descărcat pentru: ${tx.id}`);
    };

    const handleConfirmEdit = (updatedFields: Partial<Transaction>) => {
        if (!modalConfig.transaction) return;
        setTransactions((prev) =>
            prev.map((t) =>
                t.id === modalConfig.transaction!.id
                    ? { ...t, ...updatedFields }
                    : t,
            ),
        );
    };

    const handleConfirmBlock = () => {
        if (!modalConfig.transaction) return;
        setTransactions((prev) =>
            prev.map((t) =>
                t.id === modalConfig.transaction!.id
                    ? {
                          ...t,
                          status:
                              t.status === "FLAGGED" ? "COMPLETED" : "FLAGGED",
                      }
                    : t,
            ),
        );
    };

    return (
        /* 💡 Modificat: p-0, m-0, eliminat space-y-6 pentru layout edge-to-edge complet */
        <div className="w-full min-h-screen bg-[#020617] text-white flex flex-col p-0 m-0 overflow-x-hidden">
            {/* COMPONENTA DE HEADER */}
            <PageHeader
                systemDate="18 Jun 2026"
                statusText="System Admin Mode Active"
            >
                {/* COUNTERS GLOBALE PLATFORMĂ */}
                <div className="grid grid-cols-2 min-[420px]:grid-cols-4 sm:flex items-center p-1 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md w-full sm:w-auto gap-1 sm:gap-0">
                    {/* TOTAL TRANSFERS */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-zinc-400 font-bold">
                        <Layers size={14} className="text-blue-500/50" />
                        <span>
                            GLOBAL TOTAL:{" "}
                            <span className="text-white font-black">
                                {stats.total}
                            </span>
                        </span>
                    </div>

                    {/* PENDING ACTIONS */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-amber-400 font-bold sm:border-l sm:border-white/[0.06]">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>
                            PENDING:{" "}
                            <span className="text-white font-black">
                                {stats.pending}
                            </span>
                        </span>
                    </div>

                    {/* SETTLED */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-emerald-400 font-bold sm:border-l sm:border-white/[0.06]">
                        <CheckCircle2 size={14} />
                        <span>
                            SETTLED:{" "}
                            <span className="text-white font-black">
                                {stats.accepted}
                            </span>
                        </span>
                    </div>

                    {/* REJECTED */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-rose-400 font-bold sm:border-l sm:border-white/[0.06]">
                        <XCircle size={14} />
                        <span>
                            REJECTED:{" "}
                            <span className="text-white font-black">
                                {stats.denied}
                            </span>
                        </span>
                    </div>
                </div>

                {/* ACȚIUNI GLOBAL ADMIN */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <ActionButton
                        variant="cyan"
                        icon={
                            <RefreshCw
                                size={14}
                                className={isRefreshing ? "animate-spin" : ""}
                            />
                        }
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? "SYNCING..." : "REFRESH"}
                    </ActionButton>

                    <ActionButton
                        variant="purple"
                        icon={<Download size={14} />}
                        onClick={() => alert("Export global raport inițiat.")}
                    >
                        EXPORT REPORT
                    </ActionButton>
                </div>
            </PageHeader>

            <TransactionWidgets />

            <div className="w-full mt-3">
                <TransactionsTable
                    transactions={transactions}
                    onActionClick={handleActionClick}
                    onExportTx={handleExportTx}
                />
            </div>

            {/* MODALUL DE INTERCEPȚIE ȘI MUTAȚIE DATE */}
            <TransactionActionModal
                isOpen={modalConfig.isOpen}
                onClose={() =>
                    setModalConfig((prev) => ({ ...prev, isOpen: false }))
                }
                transaction={modalConfig.transaction}
                mode={modalConfig.mode}
                onConfirmEdit={handleConfirmEdit}
                onConfirmBlock={handleConfirmBlock}
            />
        </div>
    );
}
