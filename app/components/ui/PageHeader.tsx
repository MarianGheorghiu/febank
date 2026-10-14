"use client";
import type { ReactNode } from "react";
import { Terminal } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { useSessionMetadata } from "@/app/lib/session/use-session-metadata";

interface PageHeaderProps {
  /** Legacy compatibility: all headers now use the same dimensions. */
  compact?: boolean;
  actionsPosition?: "left" | "right";
  children?: ReactNode;
  sessionId?: string;
  /** Legacy prop; login time comes from session metadata. */
  systemDate?: string;
  lastLogin?: string;
  statusText?: string;
}

export default function PageHeader({ children, actionsPosition = "right", sessionId, lastLogin, statusText = "Secure Node Connected" }: PageHeaderProps) {
  const { user } = useUser();
  const session = useSessionMetadata(user?.email ?? "demo");
  return (
    <div data-page-header className="flex w-full min-w-0 flex-col gap-5 border-b border-white/5 pb-5 xl:flex-row xl:items-center xl:justify-between">
      <div data-header-session className={`w-full min-w-0 space-y-2 xl:w-auto xl:shrink-0 ${actionsPosition === "left" ? "order-2" : "order-1"}`}>
        <div data-header-status className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-widest text-cyan-400">
          <Terminal size={14} aria-hidden="true" />{statusText}
        </div>
        <div className="flex flex-col gap-2 text-xs text-gray-400 sm:flex-row sm:items-center sm:gap-4 xl:flex-col xl:items-start xl:gap-2 2xl:flex-row 2xl:items-center 2xl:gap-4">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-zinc-900/40 p-2.5 sm:justify-start sm:border-0 sm:bg-transparent sm:p-0">
            <span className="text-[11px] font-bold font-mono text-zinc-500">SESSION ID:</span>
            <span className="rounded border border-cyan-500/20 bg-cyan-950/40 px-2 py-0.5 text-[11px] sm:text-xs font-mono text-cyan-300">{sessionId ?? session.id}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-zinc-900/40 p-2.5 sm:justify-start sm:border-0 sm:bg-transparent sm:p-0">
            <span className="text-[11px] font-bold font-mono text-zinc-500">LAST LOGIN:</span>
            <span className="text-[11px] sm:text-xs font-mono text-zinc-300">{lastLogin ?? session.lastLogin}</span>
          </div>
        </div>
      </div>
      {children && <div data-header-actions className={`flex h-11 w-full min-w-0 items-center gap-2 overflow-x-auto scrollbar-thin xl:w-auto ${actionsPosition === "left" ? "order-1" : "order-2"} [&>*]:shrink-0 [&>button]:w-auto`}>{children}</div>}
    </div>
  );
}
