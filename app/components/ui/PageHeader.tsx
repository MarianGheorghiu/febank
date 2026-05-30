// app/components/ui/PageHeader.tsx
import React from "react";
import { Terminal } from "lucide-react"; // sau librăria de iconițe pe care o folosești

interface PageHeaderProps {
  children?: React.ReactNode; // Aici va veni conținutul din dreapta
  sessionId?: string;
  systemDate?: string;
  statusText?: string;
}

export default function PageHeader({
  children,
  sessionId = "MB-894X-2026",
  systemDate = "29 May 2026",
  statusText = "Secure Node Connected",
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 border-b border-white/5 pb-5 w-full">
      {/* SECȚIUNE STATUT NOD & SESIUNE (Rămâne fixă) */}
      <div className="space-y-2 w-full md:w-auto">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-400 uppercase font-black">
          <Terminal size={14} className="animate-pulse" />
          {statusText}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-400 w-full">
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-zinc-900/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/5 sm:border-0">
            <span className="text-zinc-500 font-bold font-mono text-[11px]">
              SESSION ID:
            </span>
            <span className="font-mono text-cyan-300 bg-cyan-950/60 sm:bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 sm:border-cyan-500/10 text-[11px] sm:text-xs">
              {sessionId}
            </span>
          </div>

          <div className="hidden sm:block text-zinc-700">•</div>

          <div className="flex items-center justify-between sm:justify-start gap-2 bg-zinc-900/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/5 sm:border-0">
            <span className="text-zinc-500 font-bold font-mono text-[11px]">
              SYSTEM DATE:
            </span>
            <span className="font-mono text-zinc-300 text-[11px] sm:text-xs">
              {systemDate}
            </span>
          </div>
        </div>
      </div>

      {/* PANOU DINAMIC ÎN DREAPTA (Randat doar dacă există copii) */}
      {children && (
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 w-full md:w-auto z-20">
          {children}
        </div>
      )}
    </div>
  );
}
