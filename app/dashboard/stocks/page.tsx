"use client";

import { useState } from "react";
import { Download, Landmark, TrendingUp, BarChart3 } from "lucide-react";
import PageHeader from "@/app/components/ui/PageHeader";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";

// Componentele Modul Stocks
import BuyingPowerCard from "@/app/components/ui/stocks/BuyingPowerCard";
import StockAnalytics from "@/app/components/ui/stocks/StockAnalytics";
import StockHoldingsTable from "@/app/components/ui/stocks/StockHoldingsTable";
import MarketExplorerTable from "@/app/components/ui/stocks/MarketExplorerTable"; // NOU: Importul Market Explorer
import RecurringBuys from "@/app/components/ui/stocks/RecurringBuys";
import DividendTracker from "@/app/components/ui/stocks/DividendTracker";
import StockAnalyticsHub from "@/app/components/ui/stocks/StockAnalyticsHub";

export default function StocksPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>("NVDA");

  const handleDownloadReport = () => {
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 1500);
  };

  return (
    <div className="w-full flex flex-col bg-[#02050e] text-white antialiased">
      {/* HEADER ZONE */}
      <div className="w-full shrink-0 m-0 p-0 overflow-hidden">
        <PageHeader systemDate="08 Jun 2026" statusText="Equity Engine Active">
          <div className="flex flex-wrap items-center justify-center lg:justify-between gap-3 mt-3 lg:mt-0">
            {/* STÂNGA (Breadcrumb/Titlu Modul) */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md text-cyan-400 font-mono text-[11px] font-bold max-w-full">
              <BarChart3 size={12} />
              <span>STOCKS TRADING desk v2.4</span>
            </div>

            {/* DREAPTA: Informații Cruciale Modul Stocks */}
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 lg:ml-auto max-w-full">
              {/* TOTAL PORTFOLIO VALUE */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md text-emerald-400 font-mono text-[11px] font-bold max-w-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">
                  PORTFOLIO VALUE:{" "}
                  <span className="text-white font-black">$248,510.42</span>
                </span>
              </div>

              {/* CASH YIELD CHIP */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md text-purple-400 font-mono text-[11px] font-bold max-w-full">
                <Landmark size={12} className="text-purple-400 shrink-0" />
                <span className="truncate">
                  CASH INTEREST:{" "}
                  <span className="text-white font-black">5.25% APY</span>
                </span>
              </div>

              {/* S&P 500 INDEX REFERENCE */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md text-cyan-400 font-mono text-[11px] font-bold max-w-full">
                <TrendingUp size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">
                  S&P 500: <span className="text-white font-black">+1.24%</span>
                </span>
              </div>

              {/* DOWNLOAD REPORT */}
              <ActionButton
                variant="cyan"
                icon={<Download size={15} />}
                onClick={handleDownloadReport}
                disabled={isDownloading}
              >
                {isDownloading ? "GENERATING..." : "DOWNLOAD REPORT"}
              </ActionButton>
            </div>
          </div>
        </PageHeader>
      </div>

      {/* MATRIX GRID SPA */}
      <div className="w-full flex flex-col space-y-4 mt-4">
        {/* ROW 1: BUYING POWER (STÂNGA) + LINE & PIE ANALYTICS (DREAPTA) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-start min-w-0">
          <div className="lg:col-span-1 w-full h-auto lg:h-[450px] min-w-0">
            <BuyingPowerCard />
          </div>
          <div className="lg:col-span-2 w-full h-auto lg:h-[450px] min-w-0">
            <StockAnalytics />
          </div>
        </div>

        {/* ROW 2: MARKET EXPLORER & SCREENER (Piața liberă) */}
        <div className="w-full min-h-[500px] min-w-0">
          <MarketExplorerTable />
        </div>

        {/* ROW 3: ACTIVE HOLDINGS TABLE (Portofoliul tău) */}
        <div className="w-full h-[650px] lg:h-[500px] min-w-0">
          <StockHoldingsTable />
        </div>

        {/* ROW 4: AUTO-PILOT & PASSIVE INCOME (Noile tale panouri Killer) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full items-start min-w-0">
          <div className="w-full h-[450px] min-w-0">
            <RecurringBuys />
          </div>
          <div className="w-full h-[450px] min-w-0">
            <DividendTracker />
          </div>
        </div>

        {/* COMPONENTA LA FINAL: DYNAMIC STOCK DETAILED ANALYTICS HUB */}
        {selectedStock && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300 min-w-0 pt-2">
            <StockAnalyticsHub symbol={selectedStock} />
          </div>
        )}
      </div>
    </div>
  );
}
