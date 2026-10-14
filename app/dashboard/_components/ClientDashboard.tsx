"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Coins, ArrowLeftRight, Wallet, TrendingUp, Briefcase } from "lucide-react";
import dynamic from "next/dynamic";
import type { CardTone } from "@/app/components/ui/CardSurface";
import MetricCard from "@/app/components/ui/MetricCard";
import MultiCurrencyCard from "@/app/components/ui/MultiCurrencyCard";
import DashboardChart from "@/app/components/ui/dashboard/DashboardChart";
import MarketNewsTable from "@/app/components/ui/dashboard/MarketNewsTable";
import TransfersTable from "@/app/components/ui/dashboard/TransfersTable";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import { useSessionMetadata } from "@/app/lib/session/use-session-metadata";
import { createOverviewRepository } from "@/app/lib/overview/repository";
import PageHeader from "@/app/components/ui/PageHeader";
import { formatMoney, formatPercent } from "@/app/lib/overview/engine";
import type { OverviewOperation, OverviewSnapshot } from "@/app/lib/types/dashboard";
const TransferModal = dynamic(() => import("@/app/components/ui/dashboard/TransferModal"), { ssr: false });
export default function ClientDashboard({ name, clientId }: { name: string; clientId: string }) {
  const router = useRouter();
  const repository = useMemo(() => createOverviewRepository(clientId), [clientId]);
  const [snapshot, setSnapshot] = useState<OverviewSnapshot | null>(null);
  const session = useSessionMetadata(clientId);
  const [error, setError] = useState("");
  const [modalType, setModalType] = useState<OverviewOperation["type"] | null>(null);
  useEffect(() => {
    let cancelled = false;
    repository.getSnapshot().then(value => { if (!cancelled) setSnapshot(value); }).catch(() => { if (!cancelled) setError("Unable to load overview."); });
    return () => { cancelled = true; };
  }, [repository]);
  if (error) return <p role="alert" className="text-rose-300">{error}</p>;
  if (!snapshot) return <p role="status" className="p-6 text-cyan-300">Loading your overview…</p>;
  const summary = snapshot.summary;
  const metrics = [
    { title: "Available USD balance", value: formatMoney(summary.liquidity), icon: Wallet, color: "text-cyan-300", tone: "cyan", subtext: `${formatPercent(summary.monthly_change_percent)} this month` },
    { title: "Crypto Portfolio", value: `${Number(summary.crypto_quantity)} BTC`, icon: TrendingUp, color: "text-purple-300", tone: "purple", href: "/dashboard/crypto", subtext: `≈ ${formatMoney(summary.crypto_value)}` },
    { title: "Active Investments", value: formatMoney(summary.investments), icon: Briefcase, color: "text-blue-300", tone: "blue", href: "/dashboard/stocks", subtext: `${summary.stock_positions} stocks · ${summary.index_positions} indexes` },
    { title: "Loans & Capital", value: formatMoney(summary.credit), icon: Coins, color: "text-amber-300", tone: "amber", href: "/dashboard/loans", subtext: "Outstanding credit" },
  ];
  return <div className="w-full min-w-0 space-y-4 animate-fade-in">
    <h1 className="sr-only">Overview · {name}</h1>
    <PageHeader actionsPosition="right" sessionId={session.id} lastLogin={session.lastLogin}>
      <ActionButton variant="cyan" iconGap="tight" icon={<Plus size={15} />} onClick={() => setModalType("deposit")}>ADD MONEY</ActionButton>
      <ActionButton variant="rose" iconGap="tight" icon={<Minus size={15} />} onClick={() => setModalType("withdraw")}>WITHDRAW</ActionButton>
      <ActionButton variant="amber" icon={<Coins size={15} />} onClick={() => router.push("/dashboard/loans?action=apply")}>MAKE A LOAN</ActionButton>
      <ActionButton variant="purple" icon={<ArrowLeftRight size={15} />} onClick={() => setModalType("transfer")}>TRANSFER</ActionButton>
    </PageHeader>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3 min-w-0">
      {metrics.map(metric => <MetricCard key={metric.title} title={metric.title} value={metric.value} icon={metric.icon} iconColor={metric.color} tone={metric.tone as CardTone} href={metric.href} subtext={<p>{metric.subtext}</p>} />)}
      <div className="min-w-0 sm:col-span-2 xl:col-span-1"><MultiCurrencyCard accounts={snapshot.accounts} /></div>
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-w-0">
      <DashboardChart title="Crypto holdings" datasets={snapshot.histories.crypto} variant="crypto" />
      <DashboardChart title="Equity portfolio" datasets={snapshot.histories.stocks} variant="stocks" />
      <DashboardChart title="Spending overview" datasets={snapshot.histories.expenses} variant="expenses" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-w-0"><MarketNewsTable assets={snapshot.assets} /><TransfersTable transactions={snapshot.transactions} asOf={snapshot.as_of} /></div>
    {modalType && <TransferModal key={modalType} type={modalType} balance={summary.liquidity} onClose={() => setModalType(null)} onSubmit={async operation => {
      const next = await repository.submitOperation(operation);
      setSnapshot(next);
    }} />}
  </div>;
}
