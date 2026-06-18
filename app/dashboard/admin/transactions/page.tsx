"use client";

import {
    Layers,
    CheckCircle2,
    XCircle,
    Download,
    RefreshCw,
} from "lucide-react";
import PageHeader from "@/app/components/ui/PageHeader";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";

interface AdminTransfersHeaderProps {
    stats?: {
        total: number;
        pending: number;
        accepted: number;
        denied: number;
    };
    isRefreshing?: boolean;
    onRefresh?: () => void;
    onExport?: () => void;
}

export default function AdminTransfersHeader({
    stats = { total: 0, pending: 0, accepted: 0, denied: 0 },
    isRefreshing = false,
    onRefresh,
    onExport,
}: AdminTransfersHeaderProps) {
    return (
        <div className="w-full shrink-0">
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

                    {/* PENDING ACTIONS (Prioritate pt. Admin) */}
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

                {/* ACȚIUNI ADMIN: REFRESH ȘI EXPORT */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <ActionButton
                        variant="cyan"
                        icon={
                            <RefreshCw
                                size={14}
                                className={isRefreshing ? "animate-spin" : ""}
                            />
                        }
                        onClick={onRefresh}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? "SYNCING..." : "REFRESH"}
                    </ActionButton>

                    <ActionButton
                        variant="purple"
                        icon={<Download size={14} />}
                        onClick={onExport}
                    >
                        EXPORT REPORT
                    </ActionButton>
                </div>
            </PageHeader>
        </div>
    );
}
