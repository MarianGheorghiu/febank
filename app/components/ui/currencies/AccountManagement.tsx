"use client";

import React, { useState } from "react";
import { Wallet, Plus, Trash2, Search, X } from "lucide-react";
import { FiatAccount } from "@/app/lib/mockCurrencies";
import AddFiatAccount from "./AddFiatAccount";

export default function AccountManagement({
  accounts,
}: {
  accounts: FiatAccount[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localAccounts, setLocalAccounts] = useState<FiatAccount[]>(accounts);
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddAccount = (newAccount: FiatAccount) => {
    setLocalAccounts((prev) => [newAccount, ...prev]);
  };

  const handleDeleteAccount = (idToRemove: string) => {
    setLocalAccounts((prev) => prev.filter((acc) => acc.id !== idToRemove));
  };

  const filteredAccounts = localAccounts.filter(
    (acc) =>
      acc.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.iban.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <div className="relative border border-cyan-500/30  bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col h-full overflow-hidden">
        {/* Neon Glow Efekt la Hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-emerald-500/10 shrink-0">
            <div className="flex flex-col">
              <h2 className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-[#02040f] border border-emerald-500/10 text-emerald-400">
                  <Wallet size={14} />
                </div>
                Fiat Ledger
              </h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {filteredAccounts.length} / {localAccounts.length} Active
                Accounts
              </span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all font-mono font-bold text-[10px] tracking-wider uppercase active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add new</span>
            </button>
          </div>

          {/* SEARCH INPUT INTEGRAT IN CARD */}
          <div className="relative mb-4 shrink-0">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="SEARCH BY CURRENCY / IBAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#02040f]/60 border border-blue-500/10 focus:border-emerald-500/30 rounded-lg pl-8 pr-7 py-1.5 font-mono text-[10px] text-emerald-400 placeholder-slate-600 uppercase tracking-wider focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* LISTA DE CONTURI */}
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto scrollbar-thin pr-2">
            {filteredAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex justify-between items-center p-3 rounded-lg bg-[#02040f]/50 border border-blue-500/10 hover:border-emerald-500/30 hover:bg-[#02040f]/90 group/item transition-all shrink-0 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                    {acc.symbol}
                  </div>
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-mono font-bold text-xs text-white uppercase truncate flex items-center gap-2">
                      {acc.currency}
                      <span className="px-1.5 py-0.5 rounded bg-[#02040f] text-[9px] text-slate-400 border border-blue-500/10">
                        {acc.region}
                      </span>
                    </span>
                    <span
                      className="font-mono text-[10px] text-slate-500 truncate mt-0.5"
                      title={acc.iban}
                    >
                      {acc.iban}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-mono font-black text-white text-sm">
                      {acc.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="w-7 h-7 rounded bg-rose-500/10 text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/20 flex items-center justify-center border border-transparent hover:border-rose-500/20 transition-all sm:opacity-0 group-hover/item:opacity-100"
                    title="Close Account"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {filteredAccounts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                <Wallet size={32} className="mb-3 opacity-20" />
                <p className="text-xs font-mono">No active transmissions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddFiatAccount
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddAccount={handleAddAccount}
      />
    </>
  );
}
