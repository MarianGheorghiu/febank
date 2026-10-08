"use client";
import { MOCK_ADMIN_SUMMARY } from "@/app/lib/mock/summaries";

import { useRouter } from "next/navigation";
import {
    Lock,
    Sliders,
    FileText,
    RefreshCw,
    ShieldAlert,
    Database,
    Server,
    LineChart,
} from "lucide-react";
import { showMbankToast } from "@/app/lib/toast";

// Common UI Components
import MetricCard from "@/app/components/ui/MetricCard";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import PageHeader from "@/app/components/ui/PageHeader";

// IMPORTĂM NOUA COMPONENTĂ DE ANALIZĂ
import AdminCommandCenter from "@/app/components/ui/admin/AdminCommandCenter";

interface AdminDashboardProps {
    name: string;
}

export default function AdminDashboard({ name }: AdminDashboardProps) {
    const router = useRouter();

    const handleSystemAction = (actionName: string) => {
        showMbankToast({
            category: "institutional",
            title: "System Command Executed",
            description: `[${actionName.toUpperCase()}] broadcasted to production cluster.`,
            isUrgent: true,
            router: router,
        });
    };

    return (
        // Containerul principal cu flex dens și gap-3 pentru separare curată
        <div className="flex flex-col gap-3 animate-fade-in w-full h-full m-0 p-0">
            {/* 1. MANAGEMENT ACTIONS HEADER */}
            <div className="w-full">
                <PageHeader>
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                        <ActionButton
                            variant="rose"
                            icon={<Lock size={14} />}
                            onClick={() =>
                                handleSystemAction("toggle_maintenance")
                            }
                        >
                            MAINTENANCE
                        </ActionButton>

                        <ActionButton
                            variant="amber"
                            icon={<Sliders size={14} />}
                            onClick={() => handleSystemAction("run_aml_sweep")}
                        >
                            AML SCAN
                        </ActionButton>

                        <ActionButton
                            variant="cyan"
                            icon={<RefreshCw size={14} />}
                            onClick={() =>
                                handleSystemAction("reconcile_ledgers")
                            }
                        >
                            RECONCILE
                        </ActionButton>

                        <ActionButton
                            variant="purple"
                            icon={<FileText size={14} />}
                            onClick={() =>
                                handleSystemAction("export_audit_log")
                            }
                        >
                            AUDIT LOGS
                        </ActionButton>

                        <div className="hidden md:block h-4 w-[1px] bg-white/20 mx-1" />
                    </div>
                </PageHeader>
            </div>

            {/* 2. REAL-WORLD SYSTEM METRICS - Grid ultra-compact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full shrink-0">
                <MetricCard
                    title="24H Transaction Volume"
                    value={MOCK_ADMIN_SUMMARY.volume}
                    icon={LineChart}
                    iconColor="text-blue-400"
                    glowColor="hover:border-blue-500/20"
                    subtext={
                        <span className="text-zinc-400 font-mono text-[10px]">
                            {MOCK_ADMIN_SUMMARY.transactionCount}{" "}
                            <span className="text-emerald-400">
                                {MOCK_ADMIN_SUMMARY.successRate}
                            </span>
                        </span>
                    }
                />

                <MetricCard
                    title="AML & Fraud Engine"
                    value={MOCK_ADMIN_SUMMARY.activeFlags}
                    icon={ShieldAlert}
                    iconColor="text-rose-400"
                    glowColor="hover:border-rose-500/20"
                    subtext={
                        <span className="text-zinc-400 font-mono text-[10px]">
                            <span className="text-rose-400 font-bold">
                                {MOCK_ADMIN_SUMMARY.criticalFlags}
                            </span>{" "}
                            {MOCK_ADMIN_SUMMARY.blockedValue}
                        </span>
                    }
                />

                <MetricCard
                    title="Core Database I/O"
                    value={MOCK_ADMIN_SUMMARY.databaseOps}
                    icon={Database}
                    iconColor="text-amber-400"
                    glowColor="hover:border-amber-500/20"
                    subtext={
                        <span className="text-zinc-400 font-mono text-[10px]">
                            {MOCK_ADMIN_SUMMARY.databaseThroughput}
                        </span>
                    }
                />

                <MetricCard
                    title="Production Cluster"
                    value={MOCK_ADMIN_SUMMARY.cluster}
                    icon={Server}
                    iconColor="text-emerald-400"
                    glowColor="hover:border-emerald-500/20"
                    subtext={
                        <span className="text-zinc-400 font-mono text-[10px]">
                            {MOCK_ADMIN_SUMMARY.resources}
                        </span>
                    }
                />
            </div>

            {/* 3. COMMAND CENTER INTERACTIV (Loguri + Grafice + Tabelul de Actiuni) */}
            <div className="w-full">
                <AdminCommandCenter />
            </div>
        </div>
    );
}
