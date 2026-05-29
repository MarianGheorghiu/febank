"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  ShieldAlert,
  Users,
  Server,
  Coins,
  Briefcase,
  Terminal,
  Plus,
  Minus,
  ArrowLeftRight,
} from "lucide-react";
import MetricCard from "@/app/components/ui/MetricCard";
import MultiCurrencyCard from "@/app/components/ui/MultiCurrencyCard";
import DashboardChart from "@/app/components/ui/DashboardChart";
import GlassCard from "@/app/components/ui/GlassCard";
import { showMbankToast } from "../lib/toast";
import { useRouter } from "next/navigation";

import {
  cryptoHistory,
  stocksHistory,
  expensesHistory,
} from "@/app/lib/mockData";
import MarketNewsTable from "../components/ui/MarketNewsTable";
import TransfersTable from "../components/ui/TransfersTable";

function ClientDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* HEADER RECONSTRUIT COMPLET: ULTRA RESPONSIVE */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 border-b border-white/5 pb-5 w-full">
        {/* SECȚIUNE STATUT NOD & SESIUNE */}
        <div className="space-y-2 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-400 uppercase font-black">
            <Terminal size={14} className="animate-pulse" />
            Secure Node Connected
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-400 w-full">
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-zinc-900/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/5 sm:border-0">
              <span className="text-zinc-500 font-bold font-mono text-[11px]">
                SESSION ID:
              </span>
              <span className="font-mono text-cyan-300 bg-cyan-950/60 sm:bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 sm:border-cyan-500/10 text-[11px] sm:text-xs">
                MB-894X-2026
              </span>
            </div>

            <div className="hidden sm:block text-zinc-700">•</div>

            <div className="flex items-center justify-between sm:justify-start gap-2 bg-zinc-900/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/5 sm:border-0">
              <span className="text-zinc-500 font-bold font-mono text-[11px]">
                SYSTEM DATE:
              </span>
              <span className="font-mono text-zinc-300 text-[11px] sm:text-xs">
                29 May 2026
              </span>
            </div>
          </div>
        </div>

        {/* PANOU ACȚIUNI: GRILĂ PE MOBIL, FLEX PE DESKTOP */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 w-full md:w-auto z-20">
          {/* Button 1: Add Money */}
          <button
            onClick={() => router.push("/dashboard/transfers?action=deposit")}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:px-4 sm:py-2.5 text-xs sm:text-[11px] font-black font-mono tracking-wide text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400/40 rounded-xl transition-all active:scale-[0.98] sm:active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.02)] cursor-pointer w-full sm:w-auto"
          >
            <Plus size={15} />
            ADD MONEY
          </button>

          {/* Button 2: Withdraw */}
          <button
            onClick={() => router.push("/dashboard/transfers?action=withdraw")}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:px-4 sm:py-2.5 text-xs sm:text-[11px] font-black font-mono tracking-wide text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-400/40 rounded-xl transition-all active:scale-[0.98] sm:active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.02)] cursor-pointer w-full sm:w-auto"
          >
            <Minus size={15} />
            WITHDRAW
          </button>

          {/* Button 3: Make a Loan */}
          <button
            onClick={() => router.push("/dashboard/loans?action=apply")}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:px-4 sm:py-2.5 text-xs sm:text-[11px] font-black font-mono tracking-wide text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-400/40 rounded-xl transition-all active:scale-[0.98] sm:active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.02)] cursor-pointer w-full sm:w-auto"
          >
            <Coins size={15} />
            MAKE A LOAN
          </button>

          {/* Button: Transfer */}
          <button
            onClick={() => router.push("/dashboard/transfers")}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:px-4 sm:py-2.5 text-xs sm:text-[11px] font-black font-mono tracking-wide text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-400/40 rounded-xl transition-all active:scale-[0.98] sm:active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.02)] cursor-pointer w-full sm:w-auto"
          >
            <ArrowLeftRight size={15} />
            TRANSFER
          </button>

          {/* Separator Vizual Adaptiv */}
          <div className="hidden sm:block h-5 w-[1px] bg-white/10 mx-1" />

          {/* Sistem Status Core Ledger */}
          <div className="bg-zinc-950/60 border border-white/5 px-4 py-3 sm:px-2.5 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-[10px] font-bold text-zinc-100 sm:text-zinc-200 font-mono shadow-inner w-full sm:w-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            V2.4
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

      {/* CHARTS LAYER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
      {/* 4. NOUL LAYER: DATA & CORE TRANSACTIONS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full">
        <MarketNewsTable />
        <TransfersTable />
      </div>
    </div>
  );
}

function AdminDashboard({ name }: { name: string }) {
  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-red-400 flex items-center gap-3">
            <ShieldAlert size={24} /> System Root Access
          </h1>
          <p className="text-[11px] font-mono text-zinc-400 tracking-wide mt-1">
            Operator ID: {name.toUpperCase()} • Global Core Ledger
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <GlassCard className="!p-6 space-y-4 border-l-2 border-red-500/50 bg-slate-950/20">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Active Corporate Nodes
            </span>
            <Users size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight font-mono">
              1,240
            </h3>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">
              14 pipelines pending verification
            </p>
          </div>
        </GlassCard>

        <GlassCard className="!p-6 space-y-4 bg-slate-950/20">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Network Liquidity Status
            </span>
            <Server size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
              99.98%
            </h3>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">
              All infrastructure layers operational
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<{
    name: string;
    role: "client" | "admin";
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    setUser({
      name: "Alexandru Rădulescu",
      role: "client",
    });

    const socialTimeout = setTimeout(() => {
      showMbankToast({
        category: "social",
        title: "Split Bill Received",
        description:
          "Matei Dan requested $24.50 USD for 'Private Dinner & Drinks'.",
        router: router,
      });
    }, 2000);

    const bankTimeout = setTimeout(() => {
      showMbankToast({
        category: "institutional",
        title: "New Terminal Authorized",
        description:
          "A secure session was opened from an unrecognized IP in Frankfurt, DE.",
        isUrgent: true,
        router: router,
      });
    }, 5000);

    return () => {
      clearTimeout(socialTimeout);
      clearTimeout(bankTimeout);
    };
  }, [router]);

  if (!user) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
          Decrypting Security Profile...
        </p>
      </div>
    );
  }

  return user.role === "admin" ? (
    <AdminDashboard name={user.name} />
  ) : (
    <ClientDashboard />
  );
}
