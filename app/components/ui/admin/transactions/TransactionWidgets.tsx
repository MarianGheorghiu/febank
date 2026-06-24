// app/components/ui/admin/transactions/TransactionWidgets.tsx
"use client";

import React from "react";
import InfoCard from "@/app/components/ui/MetricCard";
import {
    ShieldAlert,
    Activity,
    Scale,
    Wallet,
    BarChart3,
    Coins,
} from "lucide-react";
import { mockAdminStats } from "@/app/lib/admin/mockTransactions";

export default function TransactionWidgets() {
    const { amlCompliance, systemHealth, financialPerformance } =
        mockAdminStats;

    return (
        <div className="w-full">
            {/* Responsive Unified Grid:
              - 1 column on mobile
              - 2 columns on small tablets (sm)
              - 3 columns on standard desktops (lg) -> Makes 3 top / 3 bottom
              - 6 columns on wide screen/ultrawide (xl) -> Makes all 6 inline on top
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* 1. FLAGGED TRANSACTIONS (AML) */}
                <InfoCard
                    title="Flagged Transactions (Red Alerts)"
                    value={amlCompliance.flaggedCount}
                    icon={ShieldAlert}
                    iconColor="text-rose-400"
                    glowColor="hover:border-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                    href="/admin/aml-alerts"
                    subtext={
                        <span className="text-rose-400/80 font-medium">
                            {amlCompliance.flaggedSubtext}
                        </span>
                    }
                />

                {/* 2. FAILURE RATE */}
                <InfoCard
                    title="Failure Rate"
                    value={amlCompliance.failureRate}
                    icon={Activity}
                    iconColor="text-amber-400"
                    glowColor="hover:border-amber-500/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    subtext={
                        <span className="text-zinc-400 font-mono">
                            {amlCompliance.failureSubtext}
                        </span>
                    }
                />

                {/* 3. OMNIBUS BALANCES (FIAT) */}
                <InfoCard
                    title="Omnibus Accounts Balance (Fiat)"
                    value={systemHealth.omnibusFiat}
                    icon={Scale}
                    iconColor="text-emerald-400"
                    glowColor="hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    subtext={
                        <span className="text-emerald-400/80 font-mono">
                            {systemHealth.omnibusSubtext}
                        </span>
                    }
                />

                {/* 4. CRYPTO LIQUIDITY */}
                <InfoCard
                    title="Crypto Liquidity (Hot & Cold)"
                    value={systemHealth.cryptoLiquidity}
                    icon={Wallet}
                    iconColor="text-cyan-400"
                    glowColor="hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    subtext={
                        <span className="text-zinc-400 font-mono">
                            {systemHealth.cryptoSubtext}
                        </span>
                    }
                />

                {/* 5. TRANSACTION VOLUME */}
                <InfoCard
                    title="Total Transaction Volume"
                    value={financialPerformance.totalVolume}
                    icon={BarChart3}
                    iconColor="text-blue-400"
                    glowColor="hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    subtext={
                        <span className="text-zinc-400 font-mono">
                            {financialPerformance.volumeSubtext}
                        </span>
                    }
                />

                {/* 6. FEES COLLECTED */}
                <InfoCard
                    title="Fees Collected (Revenue)"
                    value={financialPerformance.feesCollected}
                    icon={Coins}
                    iconColor="text-purple-400"
                    glowColor="hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    subtext={
                        <span className="text-purple-400/80 font-mono">
                            {financialPerformance.feesSubtext}
                        </span>
                    }
                />
            </div>
        </div>
    );
}
