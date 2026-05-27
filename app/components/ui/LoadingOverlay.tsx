"use client";

import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export default function LoadingOverlay({
  isLoading,
  message = "Securing connection...",
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-[#030712]/60 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 animate-fade-in">
      <div className="flex flex-col items-center gap-3 scale-up-smooth">
        {/* Spinner premium cu gradient/glow */}
        <div className="relative p-3 rounded-full bg-white/[0.02] border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>

        {/* Text subtil, uppercase, tipic platformelor instituționale */}
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400/90 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
          {message}
        </span>
      </div>
    </div>
  );
}
