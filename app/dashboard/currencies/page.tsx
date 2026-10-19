"use client";
import { MOCK_PAGE_DATES } from "@/app/lib/mock/page-dates";

import { Wallet, TrendingUp, Coins, ArrowLeftRight } from "lucide-react";
import PageHeader from "@/app/components/ui/PageHeader";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";

// Componente
import AccountManagement from "@/app/components/ui/currencies/AccountManagement";
import CryptoManagement from "@/app/components/ui/currencies/CryptoManagement";
import StockManagement from "@/app/components/ui/currencies/StockManagement";
import ExchangeForm from "@/app/components/ui/currencies/ExchangeForm";
import EvolutionChart from "@/app/components/ui/currencies/EvolutionChart";

// Date Mock
import { useTradingPortfolio } from "@/app/lib/markets/projections";
import TransferModal from "@/app/components/ui/dashboard/TransferModal";
import { useState } from "react";

export default function CurrenciesPage() {
  const { cryptos, holdings, cashUsd, fiatAccounts } = useTradingPortfolio();
  const stocks = holdings.map(item => ({ id: item.symbol, symbol: item.symbol, name: item.name, shares: item.shares, value: item.shares * item.currentPrice }));
  const stats = {
    accounts: fiatAccounts.length,
    stocks: stocks.length,
    crypto: cryptos.length,
  };
  const [modalType, setModalType] = useState<"transfer" | null>(null);

  return (
    <div className="w-full flex flex-col bg-[#02050e] text-white antialiased p-0 m-0 overflow-x-hidden">
      {/* HEADER ZONE */}
      <div className="w-full shrink-0 m-0 p-0">
        <PageHeader
          systemDate={MOCK_PAGE_DATES.currencies}
          statusText="Currency Ledger Sync Active"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-1 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md w-full sm:w-auto gap-1 sm:gap-0 font-mono text-[11px]">
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 sm:py-2 text-emerald-400 font-bold min-w-0">
              <Wallet size={13} className="text-emerald-400/80 shrink-0" />
              <span className="truncate">
                ACCOUNTS:{" "}
                <span className="text-white font-black">{stats.accounts}</span>
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 sm:py-2 text-amber-400 font-bold border-t sm:border-t-0 sm:border-l border-white/[0.06] min-w-0">
              <TrendingUp size={13} className="text-amber-400/80 shrink-0" />
              <span className="truncate">
                STOCKS:{" "}
                <span className="text-white font-black">{stats.stocks}</span>
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 sm:py-2 text-cyan-400 font-bold border-t sm:border-t-0 sm:border-l border-white/[0.06] min-w-0">
              <Coins size={13} className="text-cyan-400/80 shrink-0" />
              <span className="truncate">
                CRYPTO:{" "}
                <span className="text-white font-black">{stats.crypto}</span>
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

      {/* MATRIX GRID */}
      <div className="w-full flex flex-col gap-4 m-0 p-0 mt-4">
        <p className="rounded-xl border border-cyan-500/20 p-3 font-mono text-[11px] text-slate-400">Available USD balance: <span className="text-cyan-300">${cashUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>. Shared across Overview, Transfers, Crypto, Stocks and Exchange.</p>
        {/* ROW 1: Cele 3 managere */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full h-auto lg:h-[420px] min-w-0">
          <div className="w-full h-[380px] lg:h-full min-w-0 overflow-hidden">
            <AccountManagement accounts={fiatAccounts} />
          </div>
          <div className="w-full h-[380px] lg:h-full min-w-0 overflow-hidden">
            <CryptoManagement cryptos={cryptos} />
          </div>
          <div className="w-full h-[380px] lg:h-full min-w-0 overflow-hidden">
            <StockManagement stocks={stocks} />
          </div>
        </div>

        {/* ROW 2: Formular Exchange + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full h-auto lg:h-[340px] min-w-0">
          <div className="lg:col-span-1 w-full h-auto lg:h-full min-w-0 overflow-hidden">
            <ExchangeForm />
          </div>

          {/* FIXED: Replaced h-full min-h-[300px] with h-[340px] lg:h-full */}
          <div className="lg:col-span-2 w-full h-[340px] lg:h-full min-w-0 overflow-hidden">
            <EvolutionChart />
          </div>
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
