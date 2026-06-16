"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Minus,
    Coins,
    ArrowLeftRight,
    Wallet,
    TrendingUp,
    Briefcase,
} from "lucide-react";
import dynamic from "next/dynamic";

// Componente UI comune (Importuri Absolute)
import MetricCard from "@/app/components/ui/MetricCard";
import MultiCurrencyCard from "@/app/components/ui/MultiCurrencyCard";
import DashboardChart from "@/app/components/ui/dashboard/DashboardChart";
import MarketNewsTable from "@/app/components/ui/dashboard/MarketNewsTable";
import TransfersTable from "@/app/components/ui/dashboard/TransfersTable";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import PageHeader from "@/app/components/ui/PageHeader";

// Date statistice mockate
import {
    cryptoHistory,
    stocksHistory,
    expensesHistory,
} from "@/app/lib/mockData";

// Încărcare dinamică modal
const TransferModal = dynamic(
    () => import("@/app/components/ui/dashboard/TransferModal"),
    { ssr: false },
);

interface ClientDashboardProps {
    name: string;
}

export default function ClientDashboard({ name }: ClientDashboardProps) {
    const router = useRouter();
    const [modalType, setModalType] = useState<
        "deposit" | "withdraw" | "transfer" | null
    >(null);

    return (
        <div className="space-y-4 animate-fade-in w-full p-0">
            {/* Meniu acțiuni rapide */}
            <div className="w-full">
                <PageHeader>
                    <ActionButton
                        variant="cyan"
                        icon={<Plus size={15} />}
                        onClick={() => setModalType("deposit")}
                    >
                        ADD MONEY
                    </ActionButton>

                    <ActionButton
                        variant="rose"
                        icon={<Minus size={15} />}
                        onClick={() => setModalType("withdraw")}
                    >
                        WITHDRAW
                    </ActionButton>

                    <ActionButton
                        variant="amber"
                        icon={<Coins size={15} />}
                        onClick={() =>
                            router.push("/dashboard/loans?action=apply")
                        }
                    >
                        MAKE A LOAN
                    </ActionButton>

                    <ActionButton
                        variant="purple"
                        icon={<ArrowLeftRight size={15} />}
                        onClick={() => setModalType("transfer")}
                    >
                        TRANSFER
                    </ActionButton>

                    <div className="hidden sm:block h-5 w-[1px] bg-white/10 mx-1" />
                    <div className="bg-zinc-950/60 border border-white/5 px-4 py-3 sm:px-2.5 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-[10px] font-bold text-zinc-100 font-mono w-full sm:w-auto">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        V2.4
                    </div>
                </PageHeader>

                <TransferModal
                    isOpen={modalType !== null}
                    onClose={() => setModalType(null)}
                    type={modalType}
                />
            </div>

            {/* METRICS GRID - Client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full">
                <MetricCard
                    title="Total Liquidity"
                    value="$142,350.80"
                    icon={Wallet}
                    iconColor="text-cyan-400"
                    glowColor="hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                    subtext={
                        <p className="text-emerald-400 font-bold flex items-center gap-1 font-sans">
                            <span className="text-xs">↑</span> +4.2% this month
                        </p>
                    }
                />

                <MetricCard
                    title="Crypto Portfolio"
                    value="2.405 BTC"
                    icon={TrendingUp}
                    iconColor="text-purple-400"
                    glowColor="hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
                    href="/dashboard/crypto"
                    subtext={
                        <p className="text-purple-400 font-mono tracking-wider">
                            ~ $164,200.00 USD
                        </p>
                    }
                />

                <MetricCard
                    title="Active Investments"
                    value="$45,120.00"
                    icon={Briefcase}
                    iconColor="text-blue-400"
                    glowColor="hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)]"
                    href="/dashboard/stocks"
                    subtext={
                        <p className="text-zinc-400 font-medium font-sans">
                            12 Stocks & 3 Indexes
                        </p>
                    }
                />

                <MetricCard
                    title="Loans & Capital"
                    value="$12,500.00"
                    icon={Coins}
                    iconColor="text-amber-400"
                    glowColor="hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                    href="/dashboard/loans"
                    subtext={
                        <p className="text-zinc-400 font-medium font-sans">
                            Collateralized Credit Active
                        </p>
                    }
                />

                <MultiCurrencyCard />
            </div>

            {/* CHARTS ROW - Client */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                <DashboardChart
                    title="Crypto Node Velocity"
                    datasets={cryptoHistory}
                    variant="crypto"
                />
                <DashboardChart
                    title="Equity Market Index"
                    datasets={stocksHistory}
                    variant="stocks"
                />
                <DashboardChart
                    title="Capital Outflow / Spending"
                    datasets={expensesHistory}
                    variant="expenses"
                />
            </div>

            {/* TABLES ROW - Client */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
                <MarketNewsTable />
                <TransfersTable />
            </div>
        </div>
    );
}
