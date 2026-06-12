"use client";

import PageHeader from "@/app/components/ui/PageHeader";
import { Download } from "lucide-react";
import TotalPortfolioChart from "@/app/components/ui/analytics/TotalPortfolioChart";
import AssetMatrix from "@/app/components/ui/analytics/AssetMatrix";
import TelemetryLedgerMatrix from "@/app/components/ui/analytics/TelemetryLedgerMatrix";
import AssetSummaryCards from "@/app/components/ui/analytics/AssetSummaryCards";

export default function AnalyticsMatrixPage() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#02050e] text-white antialiased font-mono m-0 p-0 overflow-x-hidden relative">
      {/* ULTRA-INLINE HEADER CONSOLE NODE (FLUSH EDGE) */}
      <div className="w-full shrink-0 border-b border-cyan-500/10 bg-[#02050e] m-0 p-0 overflow-hidden">
        <PageHeader systemDate="12 JUN 2026" statusText="MATRIX_LIVE">
          <div className="flex flex-row items-center justify-between gap-4 w-full mt-3 lg:mt-0">
            {/* ALINIERE STÂNGA: Text și valoare (Compacte) */}
            <div className="flex items-center gap-2 font-mono shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Assets:
              </span>
              <span className="text-sm font-bold text-white tracking-tight">
                $142,891.60
              </span>
            </div>

            {/* ALINIERE DREAPTA: Buton compact și proporționat */}
            <div className="flex justify-end shrink-0">
              <button className="group cursor-pointer relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-[#02050e] text-[11px] sm:text-xs font-bold tracking-tight transition-all duration-200 ease-out shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 border border-transparent">
                <Download
                  size={13}
                  className="stroke-[2.5] transition-transform duration-200 group-hover:-translate-y-[1px]"
                />
                <span>Download Analytics</span>
              </button>
            </div>
          </div>
        </PageHeader>
      </div>

      {/* CORE FRAME LAYOUT - FULL HIGH DENSITY GAP SYSTEM */}
      <div className="w-full flex flex-col m-0 p-2 gap-2.5 flex-grow">
        {/* ROW 1: NEO TOKYO LIQUID GLASS SUMMARY CARDS */}
        <AssetSummaryCards fiat={24500.0} crypto={90370.75} stocks={28020.85} />

        {/* ROW 2: REDUCED HEIGHT TOTAL PORTFOLIO CHART CONTAINER */}
        <TotalPortfolioChart />

        {/* ROW 3: ULTRA DENSE TABEL SPLIT & TARGET REALTIME ANALYSIS */}
        <AssetMatrix />

        {/* ROW 4: COMPLETE ADVANCED PERFORMANCE & RISK MATRIX */}
        <TelemetryLedgerMatrix />
      </div>
    </div>
  );
}
