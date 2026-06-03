"use client";

import React, { useState, useMemo } from "react";
import { Search, X, ShieldAlert } from "lucide-react";
import { Friend } from "@/app/lib/mockFriends";

interface FriendsMobileTableProps {
  friends: Friend[];
  onTransferClick: (friend: Friend) => void;
  onSplitClick: (friend: Friend) => void;
  onRequestClick: (friend: Friend) => void; // ADAUGAT
  onGiftClick: (friend: Friend) => void; // ADAUGAT
  onMuteToggle: (friend: Friend) => void;
  onDeleteClick: (friend: Friend) => void;
}

export default function FriendsMobileTable({
  friends,
  onTransferClick,
  onSplitClick,
  onRequestClick,
  onGiftClick,
  onMuteToggle,
  onDeleteClick,
}: FriendsMobileTableProps) {
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
          f.email.toLowerCase().includes(query))
      );
    });
  }, [friends, filter, searchQuery]);

  return (
    <div className="w-full h-[540px] flex flex-col bg-[#0a1024] border border-blue-500/20 rounded-xl p-3 shadow-2xl overflow-hidden">
      {/* FILTRE */}
      <div className="flex flex-col gap-2 mb-3 pb-2 border-b border-blue-500/10 shrink-0">
        <div className="flex bg-[#02040f] p-1 border border-blue-500/20 rounded-lg w-full overflow-x-auto gap-1">
          {["all", "online", "owed_to_you", "you_owe"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 text-center py-2 px-2 rounded text-[10px] font-black font-mono uppercase tracking-wider ${
                filter === f ? "bg-blue-600 text-white" : "text-blue-400/60"
              }`}
            >
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative mb-3 shrink-0">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50"
        />
        <input
          type="text"
          placeholder="Search mobile network..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[36px] bg-[#030718] border border-blue-500/30 rounded-lg pl-9 pr-8 text-white text-xs font-mono placeholder-blue-300/30 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/50"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* LISTA CARDURI */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
        {filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-blue-400/40 font-mono text-xs">
            <ShieldAlert size={20} className="mb-1 opacity-50" />
            <p>No connections isolated.</p>
          </div>
        ) : (
          filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className={`bg-[#030718]/90 border border-blue-500/10 rounded-lg p-3 flex flex-col gap-2.5 transition-all ${
                friend.isMuted ? "opacity-40 grayscale-[20%]" : ""
              }`}
            >
              {/* TOP PROFILE BAR */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-[#02040f] border border-blue-500/10 flex items-center justify-center text-[11px] font-mono font-black text-cyan-400">
                    {friend.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                      {friend.name}
                      {friend.isMuted && (
                        <span className="text-[7px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 rounded">
                          MUTED
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] font-mono text-cyan-400/70">
                      {friend.username}
                    </p>
                  </div>
                </div>

                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border uppercase ${
                    friend.financialStatus === "owed_to_you"
                      ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/20"
                      : friend.financialStatus === "you_owe"
                        ? "text-rose-400 bg-rose-400/5 border-rose-400/20"
                        : "text-zinc-500 border-transparent"
                  }`}
                >
                  {friend.financialStatus === "owed_to_you" &&
                    `+${friend.balance}`}
                  {friend.financialStatus === "you_owe" && `-${friend.balance}`}
                  {friend.financialStatus === "neutral" && `0.00`}
                </div>
              </div>

              {/* TECHNICAL MID BLOCK */}
              <div className="py-1.5 px-2 bg-[#02040f]/60 rounded border border-white/[0.02] font-mono text-[10px] text-slate-300 space-y-0.5">
                <p>
                  <span className="text-blue-400/50">ID:</span> {friend.id}
                </p>
                <p className="truncate">
                  <span className="text-blue-400/50">MAIL:</span> {friend.email}
                </p>
                <p>
                  <span className="text-blue-400/50">TEL:</span> {friend.phone}
                </p>
              </div>

              {/* ACTION GRID - UPDATAT PENTRU A INCLUDE NOILE BUTOANE */}
              <div className="grid grid-cols-3 gap-1 pt-0.5 border-t border-blue-500/5">
                <button
                  onClick={() => onTransferClick(friend)}
                  className="py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded font-mono font-black text-[10px] uppercase cursor-pointer"
                >
                  Pay
                </button>
                <button
                  onClick={() => onSplitClick(friend)}
                  className="py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded font-mono font-black text-[10px] uppercase cursor-pointer"
                >
                  Split
                </button>
                <button
                  onClick={() => onRequestClick(friend)}
                  className="py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded font-mono font-black text-[10px] uppercase cursor-pointer"
                >
                  Request
                </button>
                <button
                  onClick={() => onGiftClick(friend)}
                  className="py-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded font-mono font-black text-[10px] uppercase cursor-pointer"
                >
                  Gift
                </button>

                <button
                  onClick={() => onMuteToggle(friend)}
                  className={`py-2 rounded font-mono text-[10px] cursor-pointer font-bold ${
                    friend.isMuted
                      ? "bg-white/10 text-white"
                      : "bg-zinc-900 text-amber-500/80"
                  }`}
                >
                  {friend.isMuted ? "Unmute" : "Mute"}
                </button>

                <button
                  onClick={() => onDeleteClick(friend)}
                  className="py-2 bg-zinc-900 text-rose-500/80 rounded font-mono font-bold text-[10px] cursor-pointer"
                >
                  Purge
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
