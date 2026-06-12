"use client";

import { useState } from "react";
import { Download, User, Building } from "lucide-react";
import PageHeader from "@/app/components/ui/PageHeader";

// Core data mapping infrastructure
import { mockRetailLoans } from "@/app/lib/loans/mockData";

// Neon Tokyo UI Component Matrix
import LombardDashboard from "@/app/components/ui/loans/LombardDashboard";
import BufferLineWidget from "@/app/components/ui/loans/BufferLineWidget";
import SmartPricingEngine from "@/app/components/ui/loans/SmartPricingEngine";
import StandardLoansDashboard from "@/app/components/ui/loans/StandardLoansDashboard";
import RevenueFinancingDashboard from "@/app/components/ui/loans/RevenueFinancingDashboard";
import CorporateCreditMatrix from "@/app/components/ui/loans/CorporateCreditMatrix";
import BusinessHealthEngine from "@/app/components/ui/loans/BusinessHealthEngine";
import BusinessLiquidityMatrix from "@/app/components/ui/loans/BusinessLiquidityMatrix";
import SmartCapitalMatching from "@/app/components/ui/loans/SmartCapitalMatching";
import FlexibilityWowConsole from "@/app/components/ui/loans/FlexibilityWowConsole";

export default function LoansCapitalPage() {
  const [activeSegment, setActiveSegment] = useState<"retail" | "business">(
    "retail",
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadDocuments = () => {
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 1500);
  };

  const primaryActiveLombard = mockRetailLoans.activeLombardLoans[0] || null;

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#02050e] text-white antialiased m-0 p-0 overflow-x-hidden">
      {/* HEADER ZONE - FULL WIDTH FLUSH */}
      <div className="w-full shrink-0 m-0 p-0 overflow-hidden border-b border-indigo-500/10">
        <PageHeader systemDate="08 Jun 2026" statusText="Active">
          <div className="flex flex-wrap items-center justify-between gap-4 mt-3 lg:mt-0 w-full">
            {/* RIGHT: Premium Cyberpunk Controls */}
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 lg:ml-auto">
              {/* 1. Retail Switch */}
              <button
                onClick={() => setActiveSegment("retail")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-tight transition-all duration-150 cursor-pointer border ${
                  activeSegment === "retail"
                    ? "bg-[#5E5CE6] text-white border-white/[0.15] shadow-[0_4px_12px_rgba(94,92,230,0.4)]"
                    : "bg-[#5E5CE6]/10 text-[#9896FF] border-[#5E5CE6]/20 hover:bg-[#5E5CE6]/20"
                }`}
              >
                <User size={13} />
                <span>Retail & Wealth</span>
              </button>

              {/* 2. Business Switch */}
              <button
                onClick={() => setActiveSegment("business")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-tight transition-all duration-150 cursor-pointer border ${
                  activeSegment === "business"
                    ? "bg-[#64D2FF] text-black border-white/[0.15] shadow-[0_4px_12px_rgba(100,210,255,0.4)] font-bold"
                    : "bg-[#64D2FF]/10 text-[#64D2FF] border-[#64D2FF]/20 hover:bg-[#64D2FF]/20"
                }`}
              >
                <Building size={13} />
                <span>Business & SMEs</span>
              </button>

              {/* 3. Download Action */}
              <button
                onClick={handleDownloadDocuments}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-800 text-white text-xs font-semibold tracking-tight transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-transparent"
              >
                <Download size={13} className="stroke-[2.5]" />
                <span>
                  {isDownloading ? "Downloading..." : "Download Docs"}
                </span>
              </button>
            </div>
          </div>
        </PageHeader>
      </div>

      {/* DYNAMIC CONTENT AREA - FULL EDGE-TO-EDGE NO INDENTATION */}
      <div className="w-full flex flex-col m-0 p-0 mt-4 flex-1">
        {activeSegment === "retail" ? (
          <>
            {/* 1. TOP SECTION: THE WEALTH BENTO GRID (Lombard, Buffer, Pricing) */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 m-0 p-0 items-start animate-in fade-in duration-200">
              <div className="lg:col-span-2 w-full m-0 p-0">
                <LombardDashboard
                  portfolio={mockRetailLoans.collateralPortfolio}
                  activeLoan={primaryActiveLombard}
                  currency={mockRetailLoans.currency}
                />
              </div>
              <div className="flex flex-col gap-6 w-full m-0 p-0">
                <BufferLineWidget
                  bufferData={mockRetailLoans.bufferLine}
                  currency={mockRetailLoans.currency}
                />
                <SmartPricingEngine
                  pricingData={mockRetailLoans.smartPricing}
                />
              </div>
            </div>

            {/* 2. BOTTOM SECTION: THE STANDARD CREDIT MACHINE */}
            <div className="w-full mt-4 m-0 p-0 animate-in fade-in duration-300">
              <StandardLoansDashboard mode="RETAIL" />
            </div>
          </>
        ) : (
          /* BUSINESS SEGMENT - CLEAN MATRIX FALLBACK */
          <div className="w-full flex flex-col m-0 p-0 animate-in fade-in duration-200 gap-6">
            {/* DECK 1: REVENUE FLOW & OPERATIONAL RISK (Înălțime fixă: 484px) */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 m-0 p-0 items-start">
              {/* STÂNGA: REVENUE-BASED FINANCING ENGINE (Dedicated View) */}
              <div className="lg:col-span-2 w-full m-0 p-0">
                <RevenueFinancingDashboard />
              </div>

              {/* DREAPTA: FACILITĂȚI CORPORATE & OPTIMIZARE RISK RATINGS */}
              <div className="flex flex-col gap-6 w-full m-0 p-0">
                <CorporateCreditMatrix />
                <BusinessHealthEngine />
              </div>
            </div>

            {/* DECK 2: LIQUIDITY ROUTING & STRATEGIC EQUITY (Înălțime fixă: 484px) */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 m-0 p-0 items-start">
              {/* STÂNGA: LIQUIDITY ADVANCE ENGINE (Multi-Tab RBF + RO E-Factura Factoring) */}
              <div className="lg:col-span-2 w-full m-0 p-0">
                <BusinessLiquidityMatrix />
              </div>

              {/* DREAPTA: VENTURE MATCHING CORRIDOR & FLEXIBILITY SOLUTIONS */}
              <div className="flex flex-col gap-6 w-full m-0 p-0">
                <SmartCapitalMatching />
                <FlexibilityWowConsole />
              </div>
            </div>
            <div className="w-full m-0 p-0 animate-in fade-in duration-300">
              <StandardLoansDashboard mode="BUSINESS" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
