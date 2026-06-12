"use client";

import React, { useState } from "react";
import PageHeader from "@/app/components/ui/PageHeader";

// Core mock schema dataset mapping
import { mockPremiumOffers } from "@/app/lib/mockOffers";

// Neon Tokyo components list
import LifestyleTravelConsole from "@/app/components/ui/offers/LifestyleTravelConsole";
import ConciergeTerminal from "@/app/components/ui/offers/ConciergeTerminal";
import IntelligentAssistantWidget from "@/app/components/ui/offers/IntelligentAssistantWidget";
import FinancialLoyaltyMatrix from "@/app/components/ui/offers/FinancialLoyaltyMatrix";
import PointsConversionHub from "@/app/components/ui/offers/PointsConversionHub"; // IMPORT NOU UTENTIC

interface ToastState {
  message: string;
  type: "success" | "info";
  id: number;
}

export default function PremiumOffersPage() {
  // LIFTED OPERATIONAL STATES - CREIERUL CENTRAL DYNAMIC
  const [pointsBalance, setPointsBalance] = useState(
    mockPremiumOffers.userPointsBalance,
  );
  const [eventsList, setEventsList] = useState(mockPremiumOffers.events);
  const [assetsList, setAssetsList] = useState(
    mockPremiumOffers.restrictedInvestments,
  );
  const [toast, setToast] = useState<ToastState | null>(null);

  const triggerToast = (message: string, type: "success" | "info") => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 5000);
  };

  // CALLBACK: Gestionează rezervările de evenimente exclusive cu return de puncte
  const handleUpdateEventStatus = (
    id: string,
    newStatus: "AVAILABLE" | "RESERVED",
    pointCost: number,
  ) => {
    if (newStatus === "RESERVED" && pointsBalance < pointCost) {
      triggerToast(
        "TRANSACTION DENIED: Insufficient tokens balance allocation.",
        "info",
      );
      return;
    }

    setEventsList((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, status: newStatus } : evt)),
    );

    if (newStatus === "RESERVED") {
      setPointsBalance((prev) => prev - pointCost);
      triggerToast(
        `VIP ACCESS LOCKED: Successfully reserved entry. Deducted ${pointCost.toLocaleString()} Pts.`,
        "success",
      );
    } else {
      setPointsBalance((prev) => prev + pointCost);
      triggerToast(
        `RESERVATION REVOKED: Entry ticket cancelled. Refunded ${pointCost.toLocaleString()} Pts to pool.`,
        "info",
      );
    }
  };

  // CALLBACK: Ștergere de tranzacție din extrasul de cont
  const handlePurgeCharges = (costAmount: number, brandName: string) => {
    setPointsBalance((prev) => prev - costAmount);
    triggerToast(
      `LEDGER PURGED: Erased active statement charges at ${brandName}. Spent ${costAmount.toLocaleString()} Pts.`,
      "success",
    );
  };

  // CALLBACK: Deblocare active restricționate
  const handleUnlockAssetNode = (id: string) => {
    setAssetsList((prev) =>
      prev.map((as) => (as.id === id ? { ...as, isLocked: false } : as)),
    );
    const targetAsset = assetsList.find((a) => a.id === id);
    triggerToast(
      `SECURITY CLEARANCE UNLOCKED: Access granted for ${targetAsset?.name || "Asset node"}.`,
      "success",
    );
  };

  // CALLBACK NOU INTERACTIV: Conversia de puncte în Air Miles / Crypto direct executabilă
  const handleExecutePointsSwap = (
    pointsDeducted: number,
    successText: string,
  ) => {
    setPointsBalance((prev) => prev - pointsDeducted);
    triggerToast(successText, "success");
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#02050e] text-white antialiased m-0 p-0 overflow-x-hidden relative">
      {/* GLOBAL TOASTR LAYOUT */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full font-mono text-[11px] p-4 rounded-xl border border-cyan-400 bg-[#020816]/95 backdrop-blur-md shadow-[0_0_25px_rgba(34,211,238,0.45)] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span
                className={`font-black uppercase tracking-widest text-[9px] ${toast.type === "success" ? "text-emerald-400" : "text-cyan-400"}`}
              >
                • TERMINAL NOTICE •
              </span>
              <p className="text-white uppercase tracking-wide leading-normal font-bold">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* HEADER NODES SYSTEM */}
      <div className="w-full shrink-0 m-0 p-0 overflow-hidden border-b border-cyan-500/10">
        <PageHeader systemDate="09 Jun 2026" statusText="Elite Core Synced">
          <div className="flex flex-wrap items-center justify-between gap-4 mt-3 lg:mt-0 w-full font-mono">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                OPERATIONAL ACCESS RANK
              </span>
              <span className="text-xs font-black text-white tracking-wider uppercase mt-0.5">
                {mockPremiumOffers.premiumTier} •{" "}
                <strong className="text-cyan-400">
                  ${pointsBalance.toLocaleString()} PTS POOL
                </strong>
              </span>
            </div>
          </div>
        </PageHeader>
      </div>

      {/* MAIN BODY GRID - EXTENDED METRICS SPLIT */}
      <div className="w-full flex flex-col m-0 p-0 mt-6 flex-1 gap-6">
        {/* DECK 1: LIFESTYLE & TERMINAL SYSTEM (484px) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 m-0 p-0 items-start animate-in fade-in duration-200">
          <div className="lg:col-span-2 w-full m-0 p-0">
            <LifestyleTravelConsole
              lounge={mockPremiumOffers.lounge}
              events={eventsList}
              pointsBalance={pointsBalance}
              onUpdateEventStatus={handleUpdateEventStatus}
            />
          </div>
          <div className="flex flex-col gap-6 w-full m-0 p-0">
            <ConciergeTerminal />
            <IntelligentAssistantWidget onTriggerToast={triggerToast} />
          </div>
        </div>

        {/* DECK 2: FINANCIAL MATRICES LAYER & UNIVERSAL HUB CONVERTER (484px SIMETRIC) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 m-0 p-0 items-start animate-in fade-in duration-300">
          {/* STÂNGA: REWARDS & ASSETS TABLE */}
          <div className="lg:col-span-2 w-full m-0 p-0">
            <FinancialLoyaltyMatrix
              cashbackOffers={mockPremiumOffers.cashback}
              restrictedAssets={assetsList}
              pointsBalance={pointsBalance}
              onDeductPoints={handlePurgeCharges}
              onUnlockAsset={handleUnlockAssetNode}
            />
          </div>

          {/* DREAPTA: SWAP CONVERTER COMPLET SECURE (Reutilizat în loc de placeholder) */}
          <div className="w-full m-0 p-0">
            <PointsConversionHub
              pointsBalance={pointsBalance}
              onExecuteConversion={handleExecutePointsSwap}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
