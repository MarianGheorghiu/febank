"use client";

import React, { useState } from "react";
import {
  Cpu,
  Search,
  X,
  FileText,
  Zap,
  Check,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

type SubModule = "REVENUE_BASED" | "FACTORING";

interface InvoiceB2B {
  id: string;
  invoiceIndex: string;
  debtor: string;
  amount: number;
  advanceAllowed: number; // 90%
  dueDate: string;
  status: "SYNCED" | "FUNDED";
}

const MOCK_E_FAKTURA: InvoiceB2B[] = [
  {
    id: "inv-01",
    invoiceIndex: "RO-2026-991",
    debtor: "DANTE INTERNATIONAL SA",
    amount: 45000,
    advanceAllowed: 40500,
    dueDate: "2026-07-15",
    status: "SYNCED",
  },
  {
    id: "inv-02",
    invoiceIndex: "RO-2026-992",
    debtor: "ENDAVA ROMANIA SRL",
    amount: 120000,
    advanceAllowed: 108000,
    dueDate: "2026-08-01",
    status: "SYNCED",
  },
  {
    id: "inv-03",
    invoiceIndex: "RO-2026-840",
    debtor: "ORANGE ROMANIA SA",
    amount: 32000,
    advanceAllowed: 28800,
    dueDate: "2026-06-25",
    status: "FUNDED",
  },
];

export default function BusinessLiquidityMatrix() {
  const [activeTab, setActiveTab] = useState<SubModule>("REVENUE_BASED");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // RBF States
  const [rbfCapital, setRbfCapital] = useState(150000);
  const [dailyPercentage, setDailyPercentage] = useState(8);

  const filteredInvoices = MOCK_E_FAKTURA.filter(
    (inv) =>
      inv.debtor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceIndex.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleInvoice = (id: string, status: string) => {
    if (status === "FUNDED") return;
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const factoringTotalAdvance = MOCK_E_FAKTURA.filter((inv) =>
    selectedInvoices.includes(inv.id),
  ).reduce((sum, inv) => sum + inv.advanceAllowed, 0);

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[484px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* CONTROL COMPONENT TABS SWITCH */}
        <div className="flex justify-between items-center pb-3 border-b border-cyan-500/10 shrink-0">
          <div className="flex gap-2 items-center">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Cpu size={14} />
            </div>
            <div className="flex gap-1 bg-[#02040f] border border-cyan-500/20 p-0.5 rounded">
              <button
                onClick={() => {
                  setActiveTab("REVENUE_BASED");
                  setSearchQuery("");
                }}
                className={`cursor-pointer px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${activeTab === "REVENUE_BASED" ? "bg-cyan-400 text-[#02040f]" : "text-slate-400 hover:text-cyan-400"}`}
              >
                REVENUE FINANCING
              </button>
              <button
                onClick={() => {
                  setActiveTab("FACTORING");
                  setSearchQuery("");
                }}
                className={`cursor-pointer px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${activeTab === "FACTORING" ? "bg-cyan-400 text-[#02040f]" : "text-slate-400 hover:text-cyan-400"}`}
              >
                RO E-FACTURA FACTORING
              </button>
            </div>
          </div>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest uppercase">
            {activeTab === "REVENUE_BASED" ? "SaaS/Shopify Core" : "B2B Ledger"}
          </span>
        </div>

        {/* CONDITION-BASED DYNAMIC RENDERING PANEL */}
        {activeTab === "REVENUE_BASED" ? (
          /* =======================================
             REVENUE-BASED FINANCING SUB-MODULE 
             ======================================= */
          <div className="flex-1 flex flex-col justify-between my-3 gap-4 animate-in fade-in duration-150">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wide bg-[#02040f]/40 p-2 rounded border border-blue-500/5">
              • Linked Nodes: Stripe API, Adyen Node • Repayment expands/shrinks
              dynamically based on your actual transactional day volume.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#02040f]/30 border border-blue-500/5 p-4 rounded-lg flex-1">
              <div className="flex flex-col justify-center gap-4 font-mono">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold uppercase">
                      Growth Capital
                    </span>
                    <span className="text-cyan-400 font-black">
                      ${rbfCapital.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10000}
                    max={500000}
                    step={10000}
                    value={rbfCapital}
                    onChange={(e) => setRbfCapital(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold uppercase">
                      Daily Turnover Dedux
                    </span>
                    <span className="text-cyan-400 font-black">
                      {dailyPercentage}% of Sales
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={20}
                    step={1}
                    value={dailyPercentage}
                    onChange={(e) => setDailyPercentage(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-cyan-500/10 pt-4 md:pt-0 md:pl-4 font-mono text-xs flex flex-col justify-center space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">FACTOR RATE COMISION:</span>
                  <span className="text-white font-bold">
                    {dailyPercentage > 10 ? "1.06x" : "1.09x"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TOTAL COST REPAYMENT:</span>
                  <span className="text-cyan-400 font-black">
                    $
                    {Math.round(
                      rbfCapital * (dailyPercentage > 10 ? 1.06 : 1.09),
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="p-2 bg-[#02040f] border border-cyan-500/20 text-center rounded text-[9px] text-slate-400 uppercase">
                  Zero fixed monthly constraints. Pays out instantly.
                </div>
              </div>
            </div>

            <button className="cursor-pointer w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-[#02040f] font-mono font-black text-[11px] uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              DISPATCH INSTANT RBF INJECTION
            </button>
          </div>
        ) : (
          /* =======================================
             INSTANT FACTORING (E-FACTURA RO) SUB-MODULE
             ======================================= */
          <div className="flex-1 flex flex-col justify-between my-3 gap-3 animate-in fade-in duration-150">
            {/* INVOICE SEARCH BAR */}
            <div className="relative shrink-0">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="FILTER BY RO E-FACTURA INDEX OR B2B DEBTOR COMP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#02040f]/60 border border-cyan-500/30 focus:border-cyan-400 rounded-lg pl-8 pr-7 py-1.5 font-mono text-[10px] text-cyan-400 placeholder-slate-500 uppercase tracking-wider focus:outline-none transition-all"
              />
            </div>

            {/* INVOICE LIST LEDGER */}
            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-0.5 bg-black/10 rounded border border-blue-500/5 p-1">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedInvoices.includes(inv.id);
                const isFunded = inv.status === "FUNDED";
                return (
                  <div
                    key={inv.id}
                    onClick={() => toggleInvoice(inv.id, inv.status)}
                    className={`flex justify-between items-center p-2 rounded font-mono text-[10px] border transition-all ${
                      isFunded
                        ? "opacity-35 bg-[#02040f]/10 border-transparent cursor-not-allowed"
                        : isSelected
                          ? "bg-[#02040f] border-cyan-400 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)] cursor-pointer"
                          : "bg-[#02040f]/50 border-blue-500/10 hover:border-cyan-500/30 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-6 h-6 rounded border flex items-center justify-center font-bold text-[9px] shrink-0 ${
                          isFunded
                            ? "bg-slate-900 text-slate-600 border-transparent"
                            : isSelected
                              ? "bg-cyan-400 text-black border-transparent shadow-[0_0_5px_#22d3ee]"
                              : "bg-cyan-950/20 border-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {isFunded ? "OK" : "RO"}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-white uppercase truncate tracking-wide">
                          {inv.debtor}
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-tighter">
                          {inv.invoiceIndex} • Due: {inv.dueDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="font-black text-white text-xs">
                          ${inv.amount.toLocaleString()}
                        </span>
                        <span className="text-[8px] text-cyan-400/80">
                          90% Adv: ${inv.advanceAllowed.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          isFunded
                            ? "bg-white/5 text-slate-500 border-transparent"
                            : isSelected
                              ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                              : "bg-[#02040f] text-slate-400 border-blue-500/10"
                        }`}
                      >
                        {isFunded
                          ? "COLLECTED"
                          : isSelected
                            ? "SELECTED"
                            : "UNLOCK 90%"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACTION ANCHOR AREA FOR FACTORING */}
            <div className="p-2.5 rounded bg-[#02040f] border border-cyan-500/20 flex justify-between items-center font-mono text-[11px] shrink-0">
              <div>
                <span className="text-[8px] text-slate-500 font-bold block uppercase">
                  Factor Liquidity Release
                </span>
                <span className="text-xs font-black text-cyan-400">
                  ${factoringTotalAdvance.toLocaleString()}
                </span>
              </div>
              <button
                disabled={selectedInvoices.length === 0}
                className="cursor-pointer px-4 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-[#02040f] font-black text-[10px] uppercase tracking-widest shadow-[0_0_12px_rgba(34,211,238,0.3)] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                LIQUIDATE SELECTED FACTORING
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
