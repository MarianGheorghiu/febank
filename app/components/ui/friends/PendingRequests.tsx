"use client";

import React, { useState } from "react";
import {
  UserCheck,
  UserX,
  Clock,
  X,
  ShieldAlert,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import {
  MOCK_RECEIVED_REQUESTS,
  MOCK_SENT_REQUESTS,
  PendingRequest,
} from "@/app/lib/mockFriends";

export default function PendingRequests() {
  const [received, setReceived] = useState<PendingRequest[]>(
    MOCK_RECEIVED_REQUESTS,
  );
  const [sent, setSent] = useState<PendingRequest[]>(MOCK_SENT_REQUESTS);

  const handleAccept = (id: string) => {
    setReceived((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDecline = (id: string) => {
    setReceived((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCancel = (id: string) => {
    setSent((prev) => prev.filter((r) => r.id !== id));
  };

  if (received.length === 0 && sent.length === 0) return null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
        {/* ========================================= */}
        {/* CARD 1: INBOUND REQUESTS (CERERI PRIMITE) */}
        {/* ========================================= */}
        <div className="relative bg-[#0a1024] border border-blue-500/20 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-500/10">
              <h2 className="text-sm font-black text-white tracking-tight uppercase flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#02040f] border border-blue-500/10 text-cyan-400">
                  <ArrowDownToLine size={14} />
                </div>
                Inbound Requests
              </h2>
              <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
                {received.length} PENDING
              </span>
            </div>

            {/* BODY (Scroll după al 3-lea item -> max-h-[200px]) */}
            <div className="flex-1 max-h-[150px] overflow-y-auto pr-2 space-y-2 scrollbar-thin">
              {received.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-white/30 font-mono text-xs h-full">
                  <ShieldAlert size={20} className="mb-2 opacity-40" />
                  <p>No incoming transmission.</p>
                </div>
              ) : (
                received.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-3 bg-[#02040f]/50 border border-blue-500/10 p-3 rounded-lg hover:border-cyan-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center font-mono font-black text-xs text-cyan-400 shrink-0">
                        {req.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate leading-tight">
                          {req.name}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          @{req.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAccept(req.id)}
                        title="Accept Connection"
                        className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-md transition-all cursor-pointer active:scale-95"
                      >
                        <UserCheck size={14} />
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        title="Decline Connection"
                        className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded-md transition-all cursor-pointer active:scale-95"
                      >
                        <UserX size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* CARD 2: OUTBOUND REQUESTS (CERERI TRIMISE) */}
        {/* ========================================= */}
        <div className="relative bg-[#0a1024] border border-blue-500/20 sm:backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 group hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] flex flex-col h-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/10 to-orange-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-500/10">
              <h2 className="text-sm font-black text-white tracking-tight uppercase flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#02040f] border border-blue-500/10 text-amber-400">
                  <ArrowUpFromLine size={14} />
                </div>
                Outbound Requests
              </h2>
              <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
                {sent.length} UNRESOLVED
              </span>
            </div>

            {/* BODY (Scroll după al 3-lea item -> max-h-[200px]) */}
            <div className="flex-1 max-h-[150px] overflow-y-auto pr-2 space-y-2 scrollbar-thin">
              {sent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-white/30 font-mono text-xs h-full">
                  <Clock size={20} className="mb-2 opacity-40" />
                  <p>No active outbound requests.</p>
                </div>
              ) : (
                sent.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-3 bg-[#02040f]/50 border border-blue-500/10 p-3 rounded-lg hover:border-amber-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded bg-zinc-900 border border-white/5 flex items-center justify-center font-mono font-bold text-xs text-slate-400 shrink-0">
                        {req.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate leading-tight">
                          {req.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400 truncate">
                            @{req.username}
                          </span>
                          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[8px] font-black text-amber-400/80 bg-amber-400/5 px-1 rounded border border-amber-500/10 uppercase tracking-widest shrink-0">
                            <span className="h-1 w-1 rounded-full bg-amber-400 animate-pulse" />
                            Awaiting
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCancel(req.id)}
                        title="Revoke Request"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-md transition-all cursor-pointer active:scale-95"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
