// app/components/ui/transfers/TransferTable.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Trash2,
  XCircle,
  Clock,
  CheckCircle2,
  Landmark,
  Wallet,
  ArrowLeftRight,
  X,
} from "lucide-react";

// Tipul pentru o tranzacție (îl poți importa din mock-ul tău dacă preferi)
export type Transfer = {
  id: string;
  recipient: string;
  amount: number;
  asset: string;
  type: "fiat" | "crypto" | "stock";
  status: "accepted" | "pending" | "denied";
  date: string;
};

// Date de test ca să vezi cum arată direct
const MOCK_TRANSFERS: Transfer[] = [
  {
    id: "TRX-001",
    recipient: "John Doe",
    amount: 1500,
    asset: "EUR",
    type: "fiat",
    status: "accepted",
    date: "2026-06-01 10:30",
  },
  {
    id: "TRX-002",
    recipient: "0x7F...A2B",
    amount: 0.25,
    asset: "BTC",
    type: "crypto",
    status: "pending",
    date: "2026-06-01 14:15",
  },
  {
    id: "TRX-003",
    recipient: "Tesla Motors",
    amount: 10,
    asset: "TSLA",
    type: "stock",
    status: "accepted",
    date: "2026-05-30 09:00",
  },
  {
    id: "TRX-004",
    recipient: "Alice Smith",
    amount: 500,
    asset: "RON",
    type: "fiat",
    status: "denied",
    date: "2026-05-29 16:45",
  },
  {
    id: "TRX-005",
    recipient: "Vitalik B.",
    amount: 5.5,
    asset: "ETH",
    type: "crypto",
    status: "pending",
    date: "2026-06-02 08:20",
  },
];

export default function TransferTable() {
  const [transfers, setTransfers] = useState<Transfer[]>(MOCK_TRANSFERS);
  const [filter, setFilter] = useState<"all" | "fiat" | "crypto" | "stock">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Funcții pentru acțiuni
  const handleDelete = (id: string) => {
    setTransfers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCancel = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "denied" } : t)),
    );
  };

  // Filtrare activă
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchesFilter = filter === "all" || t.type === filter;
      const matchesSearch =
        t.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [transfers, filter, searchQuery]);

  // Helpers pentru UI
  const getIcon = (type: string) => {
    if (type === "fiat")
      return <Landmark size={14} className="text-blue-400" />;
    if (type === "crypto")
      return <Wallet size={14} className="text-purple-400" />;
    return <ArrowLeftRight size={14} className="text-cyan-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "accepted")
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (status === "pending")
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    return "text-rose-400 bg-rose-400/10 border-rose-400/20";
  };

  const getStatusIcon = (status: string) => {
    if (status === "accepted") return <CheckCircle2 size={12} />;
    if (status === "pending")
      return <Clock size={12} className="animate-pulse" />;
    return <XCircle size={12} />;
  };

  return (
    // Folosim h-full ca să se întindă, dar punem un height minim/maxim flexibil
    <div className="w-full h-[520px] flex flex-col relative bg-[#0a1024] border border-blue-500/20 sm:backdrop-blur-xl rounded-xl p-4 sm:p-6 shadow-2xl">
      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-blue-500/10">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Ledger
          </h2>
          <p className="text-[10px] text-blue-400/70 font-mono mt-0.5 uppercase tracking-widest">
            Transaction History
          </p>
        </div>

        {/* Tabs - Identice cu cele din TransferForm */}
        <div className="flex bg-[#02040f] p-1 border border-blue-500/20 rounded-lg w-full sm:w-auto">
          {["all", "fiat", "crypto", "stock"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 cursor-pointer sm:flex-none py-1.5 px-3 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider transition-all duration-200 ${
                filter === f
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-blue-400/60 hover:text-blue-200 hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50"
        />
        <input
          type="text"
          placeholder="Search by ID, Recipient or Asset..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[42px] bg-[#030718] border border-blue-500/30 rounded-lg pl-10 pr-4 py-2 text-white text-sm font-mono placeholder-blue-300/40 focus:outline-none focus:border-blue-400 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/50 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* LISTA TRANZACȚII - Cu scroll intern (overflow-y-auto) ca să nu strice înălțimea formei */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
        {filteredTransfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-blue-400/40 font-mono text-sm">
            <Search size={32} className="mb-2 opacity-50" />
            <p>No transfers found.</p>
          </div>
        ) : (
          filteredTransfers.map((t) => (
            <div
              key={t.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#030718]/80 border border-blue-500/10 hover:border-blue-500/30 rounded-lg p-3 transition-colors"
            >
              {/* Info Stânga */}
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-md bg-[#02040f] border border-blue-500/10 shrink-0">
                  {getIcon(t.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {t.recipient}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${getStatusColor(t.status)}`}
                    >
                      {getStatusIcon(t.status)} {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-blue-300/50">
                    <span>{t.id}</span>
                    <span>•</span>
                    <span>{t.date}</span>
                  </div>
                </div>
              </div>

              {/* Info Dreapta & Acțiuni */}
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-blue-500/10 sm:border-0">
                <div className="text-right flex-1 sm:flex-none">
                  <div className="text-sm font-black text-white font-mono">
                    {t.amount.toLocaleString("en-US", {
                      maximumFractionDigits: 4,
                    })}{" "}
                    <span className="text-blue-400/70">{t.asset}</span>
                  </div>
                </div>

                {/* Acțiuni */}
                <div className="flex items-center gap-1">
                  {t.status === "pending" && (
                    <button
                      onClick={() => handleCancel(t.id)}
                      title="Cancel Transfer"
                      className="p-1.5 text-amber-400/60 hover:text-amber-400 cursor-pointer hover:bg-amber-400/10 rounded-md transition-colors"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(t.id)}
                    title="Delete Record"
                    className="p-1.5 cursor-pointer text-rose-400/60 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
