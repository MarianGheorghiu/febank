"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Layers,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  Briefcase,
} from "lucide-react";

import PageHeader from "@/app/components/ui/PageHeader";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";

// Importurile componentelor noastre reparate și complete
import TransferForm from "@/app/components/ui/transfers/TransferForm";
import TransferTable from "@/app/components/ui/transfers/TransferTable";

import { INITIAL_TRANSFERS, Transfer } from "@/app/lib/mockTransfers";
import InfoCard from "@/app/components/ui/transfers/InfoCard";
import TransferBottomWidgets from "@/app/components/ui/transfers/TransferBottomWidgets";

const TransferModal = dynamic(
  () => import("@/app/components/ui/dashboard/TransferModal"),
  { ssr: false },
);

export default function TransfersPage() {
  const [transfers] = useState<Transfer[]>(INITIAL_TRANSFERS);
  const [modalType, setModalType] = useState<
    "deposit" | "withdraw" | "transfer" | null
  >(null);

  const stats = useMemo(() => {
    return {
      total: transfers.length,
      accepted: transfers.filter((t) => t.status === "accepted").length,
      pending: transfers.filter((t) => t.status === "pending").length,
      denied: transfers.filter((t) => t.status === "denied").length,
    };
  }, [transfers]);

  return (
    // Simplificăm containerul principal. Nu mai forțăm h-screen sau overflow aici.
    <div className="w-full flex flex-col bg-[#02050e] text-white antialiased">
      {/* HEADER ZONE */}
      <div className="w-full shrink-0">
        <PageHeader systemDate="01 Jun 2026" statusText="Ledger Network Active">
          <div className="grid grid-cols-2 min-[420px]:grid-cols-4 sm:flex items-center p-1 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md w-full sm:w-auto gap-1 sm:gap-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-zinc-400 font-bold">
              <Layers size={14} className="text-blue-500/50" />
              <span>
                TOTAL:{" "}
                <span className="text-white font-black">{stats.total}</span>
              </span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-emerald-400 font-bold sm:border-l sm:border-white/[0.06]">
              <CheckCircle2 size={14} />
              <span>
                ACCEPTED:{" "}
                <span className="text-white font-black">{stats.accepted}</span>
              </span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-amber-400 font-bold sm:border-l sm:border-white/[0.06]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>
                PENDING:{" "}
                <span className="text-white font-black">{stats.pending}</span>
              </span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-rose-400 font-bold sm:border-l sm:border-white/[0.06]">
              <XCircle size={14} />
              <span>
                DENIED:{" "}
                <span className="text-white font-black">{stats.denied}</span>
              </span>
            </div>
          </div>

          <ActionButton
            variant="purple"
            icon={<ArrowLeftRight size={15} />}
            onClick={() => setModalType("transfer")}
          >
            QUICK TRANSFER
          </ActionButton>
        </PageHeader>
      </div>

      {/* CONTINUT PAGINA - RESPONSIVE WORKSPACE */}
      {/* Eliminăm: overflow-y-auto, flex-1. Lăsăm conținutul să curgă natural. */}
      <div className="w-full flex flex-col space-y-6">
        {/* CELE 3 CARDURI SOLICITATE: BANI, CRYPTO, STOCKS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          <InfoCard
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

          <InfoCard
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

          <InfoCard
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
        </div>

        {/* GRID COMPLET ADAPTIV: FORMULAR (STANGA) vs TABEL COMPLEX (DREAPTA) */}
        {/* Eliminăm: flex-1, mb-6. Lăsăm să curgă natural. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          {/* Zona Stânga - Formularul Dinamic */}
          <div className="lg:col-span-5 xl:col-span-4 w-full">
            <TransferForm />
          </div>

          <div className="lg:col-span-7 xl:col-span-8 w-full h-full">
            <TransferTable />
          </div>
        </div>

        {/* WIDGET-URILE DE JOS PENTRU A COMPLETA SPAȚIUL GOL */}
        <div className="w-full">
          <TransferBottomWidgets />
        </div>
      </div>

      {/* MODAL SYSTEM */}
      <TransferModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType}
      />
    </div>
  );
}
