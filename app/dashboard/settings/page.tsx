"use client";

import React from "react";
import PageHeader from "@/app/components/ui/PageHeader";
import { ShieldCheck } from "lucide-react";
import UserProfile from "@/app/components/ui/security/UserProfile";
import SecurityControls from "@/app/components/ui/security/SecurityControls";
import SessionManager from "@/app/components/ui/security/SessionManager";
import AuditLogs from "@/app/components/ui/security/AuditLogs";
import {
  initialSecurityStatus,
  mockSessions,
  mockAuditLogs,
  mockUserProfile,
} from "@/app/lib/securityMock";

export default function SecuritySettingsPage() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#02040f] text-white antialiased font-mono m-0 p-0 overflow-x-hidden relative">
      {/* ULTRA-INLINE HEADER CONSOLE NODE (FLUSH EDGE) */}
      <div className="w-full shrink-0 border-b border-cyan-500/10 bg-[#02040f] m-0 p-0 overflow-hidden">
        <PageHeader systemDate="12 JUN 2026" statusText="PROTECTED">
          <div className="flex flex-row items-center justify-between gap-4 w-full mt-3 lg:mt-0">
            {/* ALINIERE STÂNGA: Info Securitate / Mainframe (Compact) */}
            <div className="flex items-center gap-2 font-mono shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                INTEGRITY:
              </span>
              <span className="text-sm font-bold text-white tracking-tight">
                SECURE_MAINFRAME
              </span>
            </div>

            {/* ALINIERE DREAPTA: Buton compact de acțiune rapidă */}
            <div className="flex justify-end shrink-0">
              <button className="group cursor-pointer relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-[#02040f] text-[11px] sm:text-xs font-bold tracking-tight transition-all duration-200 ease-out shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 border border-transparent">
                <ShieldCheck
                  size={13}
                  className="stroke-[2.5] transition-transform duration-200 group-hover:-translate-y-[1px]"
                />
                <span>System Audit</span>
              </button>
            </div>
          </div>
        </PageHeader>
      </div>

      {/* CORE FRAME LAYOUT - FULL HIGH DENSITY GAP SYSTEM */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 m-0 p-2 gap-2.5 flex-grow">
        {/* CARD 01: IDENTITY MATRIX */}
        <div className="h-full">
          <UserProfile initialProfile={mockUserProfile} />
        </div>

        {/* CARD 02: CORE DEFENSE */}
        <div className="h-full">
          <SecurityControls initialStatus={initialSecurityStatus} />
        </div>

        {/* CARD 03: ACTIVE CHANNELS */}
        <div className="h-full">
          <SessionManager initialSessions={mockSessions} />
        </div>

        {/* CARD 04: TERMINAL AUDIT */}
        <div className="h-full">
          <AuditLogs initialLogs={mockAuditLogs} />
        </div>
      </div>
    </div>
  );
}
