"use client";
import CustomerMarketStatus from "@/app/components/ui/markets/CustomerMarketStatus";
import { MOCK_PAGE_DATES } from "@/app/lib/mock/page-dates";


import { Download } from "lucide-react";
import PageHeader from "@/app/components/ui/PageHeader";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import { useUser } from "@/app/context/UserContext";
import { downloadMarketOrders } from "@/app/lib/markets/report";
import { notifyOperation } from "@/app/components/ui/OperationNotification";

// Componente Modul Crypto
import CryptoManagement from "@/app/components/ui/currencies/CryptoManagement";
import CryptoPLAnalysis from "@/app/components/ui/crypto/CryptoPLAnalysis";
import CryptoOperations from "@/app/components/ui/crypto/CryptoOperations";

// Date Mock Crypto
import { useTradingPortfolio } from "@/app/lib/markets/projections";

import CryptoMarketTable from "@/app/components/ui/crypto/CryptoMarketTable";

export default function CryptoPage() {
  const { cryptos, cryptoValue, cryptoMarket, state } = useTradingPortfolio();
  const { user } = useUser();

  return (
    // REPARAT: Container curat, fără h-screen sau restricții de overflow dăunătoare
    <div className="w-full flex flex-col bg-[#02050e] text-white antialiased">
      {/* HEADER ZONE */}
      <div className="w-full shrink-0 m-0 p-0 overflow-hidden">
        <PageHeader systemDate={MOCK_PAGE_DATES.crypto} statusText="Crypto Terminal Live">
          {/* Am scos w-full de aici pentru a lăsa flexbox-ul să curgă natural */}
          <div className="flex flex-wrap items-center justify-center lg:justify-between gap-3 mt-3 lg:mt-0">
            {/* STÂNGA */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md text-indigo-400 font-mono text-[11px] font-bold max-w-full">
              {/* Adaugă conținutul tău aici */}
            </div>

            {/* DREAPTA */}
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 lg:ml-auto max-w-full">
              {/* PORTFOLIO: Am înlocuit whitespace-nowrap cu truncate și max-w-full */}
              {/* Dacă ecranul e extrem de mic, va pune "..." în loc să strice pagina */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md text-emerald-400 font-mono text-[11px] font-bold max-w-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">
                  PORTFOLIO:{" "}
                  <span className="text-white font-black">
                    {cryptoValue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </span>
                </span>
              </div>

              {/* BTC PRICE */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md text-amber-500 font-mono text-[11px] font-bold max-w-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="truncate">
                  BTC PRICE:{" "}
                  <span className="text-white font-black">{cryptoMarket.find(item => item.symbol === "BTC")?.price.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                </span>
              </div>

              {/* DOWNLOAD REPORT */}
              <ActionButton
                variant="cyan"
                icon={<Download size={15} />}
                onClick={() => { try { downloadMarketOrders(state, user?.email ?? "", "CRYPTO"); notifyOperation("Demo orders exported", "CSV includes your crypto orders recorded in this browser."); } catch { notifyOperation("Export failed", "The report could not be downloaded.", true); } }}
              >
                DOWNLOAD REPORT
              </ActionButton>
            </div>
          </div>
        </PageHeader>
      </div>

      <div className="mt-4"><CustomerMarketStatus domain="CRYPTO" /></div>
      {/* MATRIX GRID SPA */}
      {/* Folosim space-y-4 pentru o gestionare curată a spațiului pe verticală */}
      <div className="w-full flex flex-col space-y-4 mt-4">
        {/* ROW 1: PORTOFEL (STÂNGA) + CHART P&L (DREAPTA) */}
        {/* REPARAT: S-a eliminat înălțimea fixă de pe grid și s-a adăugat items-start */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-start min-w-0">
          {/* Înălțimile sunt acum controlate direct și sigur de containerele copiilor */}
          <div className="lg:col-span-1 w-full h-[400px] min-w-0 overflow-hidden">
            <CryptoManagement cryptos={cryptos} />
          </div>
          <div className="lg:col-span-2 w-full h-[400px] min-w-0 overflow-hidden">
            <CryptoPLAnalysis />
          </div>
        </div>

        {/* ROW 2: MODUL FIAT BRIDGE & TAXE (STÂNGA) + TABEL TRANZACȚII (DREAPTA) */}
        {/* REPARAT: Grid flexibil, lasă componentele să își păstreze dimensiunile proprii */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-start min-w-0">
          <div className="lg:col-span-1 w-full h-auto lg:h-[390px] min-w-0 relative z-30">
            <CryptoOperations />
          </div>

          <div className="lg:col-span-2 w-full h-[600px] lg:h-[390px] min-w-0">
            <CryptoMarketTable />
          </div>
        </div>
      </div>
    </div>
  );
}
