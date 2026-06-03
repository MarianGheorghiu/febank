"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Trash2,
  Ban,
  ArrowLeftRight,
  Receipt,
  X,
  ShieldAlert,
  Mail,
  Phone,
  Hash,
  Volume2,
  HandCoins,
  Gift,
} from "lucide-react";
import { Friend } from "@/app/lib/mockFriends";

interface FriendsTableProps {
  friends: Friend[];
  onTransferClick: (friend: Friend) => void;
  onSplitClick: (friend: Friend) => void;
  onRequestClick: (friend: Friend) => void; // ADAUGAT
  onGiftClick: (friend: Friend) => void; // ADAUGAT
  onMuteToggle: (friend: Friend) => void;
  onDeleteClick: (friend: Friend) => void;
}

export default function FriendsTable({
  friends,
  onTransferClick,
  onSplitClick,
  onRequestClick,
  onGiftClick,
  onMuteToggle,
  onDeleteClick,
}: FriendsTableProps) {
  const [filter, setFilter] = useState<
    "all" | "online" | "owed_to_you" | "you_owe"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "online" && f.status === "online") ||
        f.financialStatus === filter;

      const query = searchQuery.toLowerCase();
      return (
        matchesFilter &&
        (f.name.toLowerCase().includes(query) ||
          f.username.toLowerCase().includes(query) ||
          f.email.toLowerCase().includes(query) ||
          f.phone.includes(query) ||
          f.id.toLowerCase().includes(query))
      );
    });
  }, [friends, filter, searchQuery]);

  const getLedgerColor = (status: string) => {
    if (status === "owed_to_you")
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (status === "you_owe")
      return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    return "text-blue-100 bg-blue-500/10 border-blue-500/20";
  };

  return (
    <div className="w-full h-[540px] flex flex-col relative bg-[#0a1024] border border-blue-500/20 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 shadow-2xl">
      {/* HEADER & FILTRE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-blue-500/10">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Network Contacts
          </h2>
          <p className="text-[11px] text-blue-200/70 font-mono mt-0.5 uppercase tracking-widest">
            P2P Social Ledger
          </p>
        </div>

        <div className="flex bg-[#02040f] p-1 border border-blue-500/20 rounded-lg w-full sm:w-auto overflow-x-auto">
          {["all", "online", "owed_to_you", "you_owe"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 cursor-pointer sm:flex-none py-1.5 px-3 rounded-md text-[11px] font-bold font-mono uppercase tracking-wider transition-all duration-200 ${
                filter === f
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-blue-200/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50"
        />
        <input
          type="text"
          placeholder="Search by name, handle, email or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[42px] bg-[#030718] border border-blue-500/30 rounded-lg pl-10 pr-4 py-2 text-white text-sm font-mono placeholder-white/30 focus:outline-none focus:border-blue-400 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* LISTA CONTACTE */}
      <div className="flex-1 overflow-y-auto pr-1.5 space-y-2.5 scrollbar-thin">
        {filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/40 font-mono text-sm">
            <ShieldAlert size={28} className="mb-2 opacity-50 text-white/40" />
            <p>No connections found.</p>
          </div>
        ) : (
          filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className={`group flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-[#030718]/80 border border-blue-500/10 hover:border-blue-500/30 rounded-lg p-3 sm:p-4 transition-all ${
                friend.isMuted
                  ? "opacity-40 hover:opacity-75 grayscale-[30%]"
                  : ""
              }`}
            >
              {/* INFO STÂNGA */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-md bg-blue-700 border border-white/10 flex items-center justify-center font-mono font-bold text-sm text-white shrink-0">
                  {friend.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white truncate">
                      {friend.name}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                        friend.status === "online"
                          ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                          : "text-zinc-300 bg-red-800 border-white/10"
                      }`}
                    >
                      <span
                        className={`h-1.5 mb-1 w-1.5 rounded-full ${friend.status === "online" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
                      />
                      {friend.status}
                    </span>

                    {friend.isMuted && (
                      <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-black px-1 rounded uppercase tracking-widest">
                        MUTED
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <span className="inline-block text-[10px] font-mono text-white bg-blue-800 px-1.5 py-0.5 rounded border border-white/20">
                      {friend.username}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] font-mono text-white">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-white/60" />
                      <span className="truncate">{friend.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-white/60" />
                      <span>{friend.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50 mt-0.5">
                      <Hash size={10} className="text-white/30" />
                      <span className="text-[10px] truncate">{friend.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* INFO DREAPTA */}
              <div className="flex flex-col sm:items-end justify-between gap-3 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-white/5 sm:border-0 shrink-0 h-full">
                <div className="text-left sm:text-right">
                  <div
                    className={`inline-block text-[11px] font-mono font-bold px-2 py-1 rounded border uppercase tracking-wider ${getLedgerColor(friend.financialStatus)}`}
                  >
                    {friend.financialStatus === "owed_to_you" &&
                      `Owes: +${friend.balance.toFixed(2)} ${friend.asset}`}
                    {friend.financialStatus === "you_owe" &&
                      `Debt: -${friend.balance.toFixed(2)} ${friend.asset}`}
                    {friend.financialStatus === "neutral" && `Settled`}
                  </div>
                  <div className="text-[10px] font-mono text-white/40 mt-1 sm:text-right">
                    Sync: {friend.dateAdded}
                  </div>
                </div>

                {/* ACTION ACTIONS BAR */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button
                    onClick={() => onTransferClick(friend)}
                    title="Direct Transfer"
                    className="p-1.5 text-cyan-300 hover:text-white bg-white/5 border border-white/10 hover:bg-cyan-600 rounded-md transition-all cursor-pointer"
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                  <button
                    onClick={() => onSplitClick(friend)}
                    title="Split Bill"
                    className="p-1.5 text-purple-300 hover:text-white bg-white/5 border border-white/10 hover:bg-purple-600 rounded-md transition-all cursor-pointer"
                  >
                    <Receipt size={14} />
                  </button>
                  <button
                    onClick={() => onRequestClick(friend)}
                    title="Request Money"
                    className="p-1.5 text-emerald-300 hover:text-white bg-white/5 border border-white/10 hover:bg-emerald-600 rounded-md transition-all cursor-pointer"
                  >
                    <HandCoins size={14} />
                  </button>
                  <button
                    onClick={() => onGiftClick(friend)}
                    title="Send Gift"
                    className="p-1.5 text-pink-300 hover:text-white bg-white/5 border border-white/10 hover:bg-pink-600 rounded-md transition-all cursor-pointer"
                  >
                    <Gift size={14} />
                  </button>

                  <div className="w-[1px] h-4 bg-white/20 mx-1 hidden sm:block" />

                  <button
                    onClick={() => onMuteToggle(friend)}
                    title={
                      friend.isMuted ? "Unmute Node Alert" : "Mute Node Alert"
                    }
                    className={`p-1.5 rounded-md border border-transparent transition-all cursor-pointer ${
                      friend.isMuted
                        ? "text-slate-400 hover:text-white bg-white/10"
                        : "text-amber-300/80 hover:text-amber-300 hover:bg-amber-400/20"
                    }`}
                  >
                    {friend.isMuted ? <Volume2 size={14} /> : <Ban size={14} />}
                  </button>

                  <button
                    onClick={() => onDeleteClick(friend)}
                    title="Purge Contact"
                    className="p-1.5 text-rose-400/80 hover:text-rose-400 hover:bg-rose-400/20 border border-transparent rounded-md transition-all cursor-pointer"
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
