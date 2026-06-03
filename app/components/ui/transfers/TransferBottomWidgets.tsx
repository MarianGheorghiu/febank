// app/components/ui/transfers/TransferBottomWidgets.tsx
"use client";

import {
  ShieldAlert,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";

export default function TransferBottomWidgets() {
  const cardClass =
    "relative bg-[#0a1024] border border-blue-500/20 sm:backdrop-blur-xl rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/30 transition-colors shadow-lg h-full min-h-[130px]";
  const titleClass =
    "text-[10px] font-bold font-mono text-blue-300/80 uppercase tracking-widest flex items-center gap-1.5 mb-3";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {/* 1. TRANSFER LIMITS */}
      <div className={cardClass}>
        <h3 className={titleClass}>
          <ShieldAlert size={14} className="text-purple-400" />
          Daily Volume Limit
        </h3>
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-2 font-mono">
            <span className="text-xl font-black text-white tracking-tight">
              $14,500
            </span>
            <span className="text-xs text-blue-400/60 mb-0.5">/ $50,000</span>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-[#030718] rounded-full overflow-hidden border border-blue-500/10">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-500 w-[29%] shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          </div>
          <p className="text-[9px] font-mono text-blue-300/50 mt-2 uppercase tracking-wider text-right">
            Tier 3 Verified
          </p>
        </div>
      </div>

      {/* 2. NETWORK STATUS & FEES */}
      <div className={cardClass}>
        <h3 className={titleClass}>
          <Activity size={14} className="text-cyan-400" />
          Network & Routing
        </h3>
        <div className="space-y-2 mt-auto font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-blue-400/60">ETH Gas Fee</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Zap size={10} /> 12 Gwei
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-400/60">SEPA Instant</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 size={10} /> Operational
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-400/60">SWIFT Global</span>
            <span className="flex items-center gap-1 text-amber-400">
              <AlertCircle size={10} /> 1-2 Days
            </span>
          </div>
        </div>
      </div>

      {/* 3. LAST TRANSFERS (Înlocuiește Quick Send) */}
      <div className={cardClass}>
        <h3 className={titleClass}>
          <Clock size={14} className="text-blue-400" />
          Last Transfers
        </h3>
        <div className="flex flex-col gap-1.5 mt-auto">
          {[
            {
              name: "0x7F...A2B",
              amount: "-0.25",
              asset: "BTC",
              statusColor: "text-amber-400",
            },
            {
              name: "Tesla Motors",
              amount: "+10",
              asset: "TSLA",
              statusColor: "text-emerald-400",
            },
          ].map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-2 py-1.5 bg-[#030718] border border-blue-500/10 rounded-md hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ArrowUpRight size={12} className={t.statusColor} />
                <span className="text-[10px] font-mono text-white truncate max-w-[90px] sm:max-w-[70px] lg:max-w-[100px]">
                  {t.name}
                </span>
              </div>
              <div className="text-[10px] font-mono font-bold text-white whitespace-nowrap">
                {t.amount}{" "}
                <span className="text-blue-400/60 font-normal">{t.asset}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
