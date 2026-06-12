"use client";

import React, { useState } from "react";
import {
  Globe,
  Trash2,
  Search,
  Power,
  ShieldCheck,
  Monitor,
} from "lucide-react";
import { ActiveSession } from "@/app/lib/securityMock";

export default function SessionManager({
  initialSessions,
}: {
  initialSessions: ActiveSession[];
}) {
  const [sessions, setSessions] = useState<ActiveSession[]>(initialSessions);
  const [searchQuery, setSearchQuery] = useState("");

  // Funcție pentru a închide o singură sesiune
  const killSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  // Funcție critică de panică: Închide TOATE sesiunile în afară de cea curentă (Utilitate Bancară)
  const killAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.activeNow));
  };

  // Filtrare inteligentă în timp real
  const filteredSessions = sessions.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      s.device.toLowerCase().includes(query) ||
      s.location.toLowerCase().includes(query) ||
      s.ip.toLowerCase().includes(query)
    );
  });

  return (
    <div className="font-mono antialiased bg-[#111827] border border-slate-700 rounded-xl p-5 flex flex-col h-full justify-between transition-all duration-200 shadow-lg">
      <div className="flex flex-col h-full">
        {/* HEADER COMPACT */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#1e293b] border border-slate-600 text-cyan-400 shrink-0">
              <Globe size={14} />
            </div>
            <div>
              <h2 className="text-white text-xs font-black uppercase tracking-widest">
                SESSION_RELAYS
              </h2>
            </div>
          </div>

          <div className="text-xs font-black px-3 py-1 rounded-md border-2 text-cyan-400 border-cyan-500/40 bg-cyan-500/10 tracking-widest">
            {sessions.length} ACTIVE_CHANNELS
          </div>
        </div>

        {/* BARA DE CĂUTARE INDUSTRIALĂ MĂRITĂ */}
        <div className="relative mb-3.5">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="SEARCH_NODE_IP_OR_DEVICE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e293b] border border-slate-600 focus:border-cyan-400 text-white placeholder:text-slate-500 rounded-lg pl-9 pr-3 py-2.5 text-xs font-bold uppercase tracking-wider focus:outline-none transition-all shadow-inner"
          />
        </div>

        {/* LISTĂ SESIUNI RACK-STYLE - LIZIBILĂ ȘI ÎNALTĂ */}
        <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[260px] pr-1 custom-scrollbar">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((s) => (
              <div
                key={s.id}
                className={`flex justify-between items-center p-3.5 rounded-lg border transition-all duration-150 ${
                  s.activeNow
                    ? "bg-[#1e293b] border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.05)]"
                    : "bg-[#1e293b]/60 border-slate-700 hover:border-slate-600"
                }`}
              >
                {/* INFO DISPOZITIV */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`p-2 rounded-md border ${
                      s.activeNow
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}
                  >
                    <Monitor size={15} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white uppercase truncate tracking-wide">
                        {s.device}
                      </span>
                      {s.activeNow && (
                        <span className="text-[9px] font-black bg-emerald-500/20 border border-emerald-400 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {s.location} •{" "}
                      <span className="text-cyan-400 select-all font-black">
                        {s.ip}
                      </span>
                    </span>
                  </div>
                </div>

                {/* TIMESTAMPS / MANAGEMENT BUTOANE */}
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[10px] font-black text-slate-300 bg-slate-900/80 px-2.5 py-1.5 border border-slate-700 rounded uppercase tracking-wider">
                    {s.activeNow ? "SYNCED" : s.lastActive}
                  </span>

                  {!s.activeNow && (
                    <button
                      onClick={() => killSession(s.id)}
                      title="TERMINATE RELAY CONNECTIONS"
                      className="p-2 cursor-pointer text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-[#111827] border border-red-500/30 hover:border-transparent rounded-md transition-all active:scale-95"
                    >
                      <Trash2 size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg bg-slate-900/30">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                NO ACTIVE RELAYS MATCHING QUERY
              </span>
            </div>
          )}
        </div>
      </div>

      {/* COMPACT BULK POWER ACTION BUTTON */}
      {sessions.length > 1 && (
        <div className="pt-4 border-t border-slate-700 mt-4">
          <button
            onClick={killAllOtherSessions}
            className="w-full cursor-pointer rounded-lg font-black text-xs py-3 tracking-widest uppercase transition-all duration-150 flex items-center justify-center gap-2 border-2 bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500 hover:text-[#111827] hover:border-transparent shadow-md shadow-red-950/20 active:scale-[0.99]"
          >
            <Power size={13} strokeWidth={2.5} />
            TERMINATE ALL OTHER SESSION RELAYS
          </button>
        </div>
      )}
    </div>
  );
}
