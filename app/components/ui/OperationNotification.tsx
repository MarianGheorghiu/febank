"use client";

import { toast } from "sonner";
import { CheckCircle2, ShieldAlert, X } from "lucide-react";

type OperationTone = "cyan" | "rose" | "purple";
const themes = {
  cyan: { surface: "border-cyan-500/40 bg-[#070d19]/95", icon: "text-cyan-400", label: "text-cyan-300" },
  rose: { surface: "border-rose-500/40 bg-[#1d0c17]/95", icon: "text-rose-400", label: "text-rose-300" },
  purple: { surface: "border-purple-500/40 bg-[#140d24]/95", icon: "text-purple-400", label: "text-purple-300" },
};

export function notifyOperation(title: string, description: string, error = false, scope = "Bank operations", tone: OperationTone = "cyan", duration = error ? 8000 : 5000) {
  const theme = themes[error ? "rose" : tone];
  const Icon = error ? ShieldAlert : CheckCircle2;
  toast.custom(id => <div role={error ? "alert" : "status"} className={`flex w-full items-start gap-3 rounded-xl border p-4 font-mono shadow-xl backdrop-blur-xl ${error ? "border-rose-500/40 bg-rose-950/95" : theme.surface}`}>
    <Icon size={19} className={`shrink-0 ${theme.icon}`} />
    <div className="min-w-0 flex-1">
      <p className={`mb-1 text-[9px] font-bold uppercase tracking-widest ${theme.label}`}>{scope}</p>
      <p className="text-xs font-bold text-white">{title}</p>
      <p className="mt-1 break-words text-[11px] leading-relaxed text-slate-300">{description}</p>
    </div>
    <button onClick={() => toast.dismiss(id)} className="cursor-pointer text-slate-400 hover:text-white" aria-label="Dismiss notification"><X size={14} /></button>
  </div>, { duration });
}
