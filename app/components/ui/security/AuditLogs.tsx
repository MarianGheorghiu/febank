"use client";

import React, { useState } from "react";
import {
  Terminal,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  ShieldAlert,
  Check,
} from "lucide-react";
import { AuditLog } from "@/app/lib/securityMock";

export default function AuditLogs({
  initialLogs,
}: {
  initialLogs: AuditLog[];
}) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "SUCCESS" | "FAILED"
  >("ALL");

  // Adaugă un log live în stream fără să distrugă restul istoricului
  const triggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const liveLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        event: "SYS_MONITOR: SECURITY POLLING ENGINES SYNCED WITH CLUSTER CORE",
        status: "SUCCESS",
        ipAddress: "10.255.0.1",
        subSystem: "NET_CORE",
      };
      setLogs((prev) => [liveLog, ...prev]);
      setSyncing(false);
    }, 500);
  };

  // Ștergerea unui singur log din stream
  const deleteLog = (id: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  // Curățarea completă a consolei de audit
  const purgeAllLogs = () => {
    setLogs([]);
  };

  // Filtrare combinată în timp real (Search + Status Clicker)
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subSystem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="font-mono antialiased bg-[#111827] border border-slate-700 rounded-xl p-5 flex flex-col h-full justify-between transition-all duration-200 shadow-lg">
      <div className="flex flex-col h-full">
        {/* HEADER CONTROL COMPACT */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#1e293b] border border-slate-600 text-cyan-400 shrink-0">
              <Terminal size={14} />
            </div>
            <div>
              <h2 className="text-white text-xs font-black uppercase tracking-widest">
                AUDIT_STREAM
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerSync}
              disabled={syncing}
              title="POLL LIVE LOGS"
              className="cursor-pointer bg-[#1e293b] border border-slate-600 hover:border-cyan-400 text-cyan-400 hover:text-white p-2 rounded-md transition-all active:scale-95 disabled:opacity-40"
            >
              <RefreshCw
                size={13}
                className={syncing ? "animate-spin text-cyan-400" : ""}
              />
            </button>
            <div className="text-xs font-black px-3 py-1 rounded-md border-2 text-cyan-400 border-cyan-500/40 bg-cyan-500/10 tracking-widest">
              {filteredLogs.length} NODES
            </div>
          </div>
        </div>

        {/* UTILITIES LAYER: BARA DE CĂUTARE + FILTRE STATUS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="FILTER_BY_EVENT_SUBSYS_OR_IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-600 focus:border-cyan-400 text-white placeholder:text-slate-500 rounded-lg pl-9 pr-3 py-2.5 text-xs font-bold uppercase tracking-wider focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* QUICK STATUS CLICKERS */}
          <div className="grid grid-cols-3 gap-1 bg-[#1e293b] p-1 rounded-lg border border-slate-600 text-[10px] font-black tracking-wider">
            {(["ALL", "SUCCESS", "FAILED"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setStatusFilter(type)}
                className={`rounded md:px-1 py-1.5 uppercase transition-all cursor-pointer ${
                  statusFilter === type
                    ? "bg-cyan-500 text-[#111827] font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* MASSIVE NEO TOKYO AUDIT FEED */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[260px] pr-1 custom-scrollbar">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-[#1e293b]/60 border border-slate-700 hover:border-slate-600 transition-all duration-150 gap-3"
              >
                {/* STÂNGA: IDENTIFICATORI EVENIMENT */}
                <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-1.5 border border-slate-800 rounded shrink-0">
                    {log.subSystem}
                  </span>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-100 uppercase tracking-wide leading-tight break-words">
                      {log.event}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 mt-1">
                      TIMESTAMP: {log.timestamp} • ADDR:{" "}
                      <span className="text-cyan-400 select-all font-bold">
                        {log.ipAddress}
                      </span>
                    </span>
                  </div>
                </div>

                {/* DREAPTA: STATUS BADGE + ACCES BUTON DELETE */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 border-t border-slate-700/50 md:border-0 pt-2 md:pt-0">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 border-2 rounded uppercase tracking-widest ${
                      log.status === "SUCCESS"
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : "text-red-400 border-red-500/40 bg-red-500/10 animate-pulse"
                    }`}
                  >
                    {log.status}
                  </span>

                  <button
                    onClick={() => deleteLog(log.id)}
                    title="ERASE NODE LOG ENTRY"
                    className="p-2 cursor-pointer text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 rounded-md transition-all active:scale-95"
                  >
                    <Trash2 size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg bg-slate-900/30">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                NO BUFFER LOGS DETECTED MATCHING MATRIX REQUEST
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CRITICAL BULK WIPE SYSTEM */}
      {logs.length > 0 && (
        <div className="pt-4 border-t border-slate-700 mt-4">
          <button
            onClick={purgeAllLogs}
            className="w-full cursor-pointer rounded-lg font-black text-xs py-3 tracking-widest uppercase transition-all duration-150 flex items-center justify-center gap-2 border-2 bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500 hover:text-[#111827] hover:border-transparent shadow-md shadow-red-950/20 active:scale-[0.99]"
          >
            PURGE SECURITY AUDIT BUFFER
          </button>
        </div>
      )}
    </div>
  );
}
