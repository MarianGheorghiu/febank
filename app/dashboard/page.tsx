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
  Plus,
  Minus,
  ArrowLeftRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import MetricCard from "@/app/components/ui/MetricCard";
import MultiCurrencyCard from "@/app/components/ui/MultiCurrencyCard";
import DashboardChart from "@/app/components/ui/dashboard/DashboardChart";
import GlassCard from "@/app/components/ui/GlassCard";
import { showMbankToast } from "../lib/toast";
import { useRouter } from "next/navigation";

import {
  cryptoHistory,
  stocksHistory,
  expensesHistory,
} from "@/app/lib/mockData";
import MarketNewsTable from "../components/ui/dashboard/MarketNewsTable";
import TransfersTable from "../components/ui/dashboard/TransfersTable";
import { ActionButton } from "../components/ui/dashboard/ActionButton";
import PageHeader from "../components/ui/PageHeader";

// Încărcare dinamică modal
const TransferModal = dynamic(
  () => import("@/app/components/ui/dashboard/TransferModal"),
  { ssr: false },
);

function ClientDashboard() {
  const router = useRouter();
  const [modalType, setModalType] = useState<
    "deposit" | "withdraw" | "transfer" | null
  >(null);

  return (
    <div className="space-y-4 animate-fade-in w-full p-0">
      {/* SCOS PADDING-UL P6 DE AICI - Acum header-ul se aliniază perfect la margini */}
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
            onClick={() => router.push("/dashboard/loans?action=apply")}
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

      {/* METRICS GRID - Spațiere eficientă full width */}
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

      {/* CHARTS ROW - Aliniat la fix */}
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

      {/* TABLES ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
        <MarketNewsTable />
        <TransfersTable />
      </div>
    </div>
  );
}

function AdminDashboard({ name }: { name: string }) {
  return (
    <div className="space-y-4 animate-fade-in w-full p-0">
      <div className="flex items-center justify-between border-b border-white/5 pb-3 w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-red-400 flex items-center gap-3">
            <ShieldAlert size={22} /> System Root Access
          </h1>
          <p className="text-[11px] font-mono text-zinc-400 tracking-wide mt-1">
            Operator ID: {name.toUpperCase()} • Global Core Ledger
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <GlassCard className="!p-5 space-y-3 border-l-2 border-red-500/50 bg-slate-950/20">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Active Corporate Nodes
            </span>
            <Users size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              1,240
            </h3>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">
              14 pipelines pending verification
            </p>
          </div>
        </GlassCard>

        <GlassCard className="!p-5 space-y-3 bg-slate-950/20">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Network Liquidity Status
            </span>
            <Server size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">
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
