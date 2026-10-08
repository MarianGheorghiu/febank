"use client";

import { toast } from "sonner";
import { CheckCircle2, ShieldAlert, X } from "lucide-react";

export function notifyOperation(title: string, description: string, error = false, scope = "Bank operations") {
  toast.custom(id => <div role={error ? "alert" : "status"} className={`flex w-full items-start gap-3 rounded-xl border p-4 font-mono shadow-xl backdrop-blur-xl ${error ? "border-rose-500/40 bg-rose-950/95" : "border-cyan-500/40 bg-[#070d19]/95"}`}>
    {error ? <ShieldAlert size={19} className="shrink-0 text-rose-400" /> : <CheckCircle2 size={19} className="shrink-0 text-cyan-400" />}<div className="min-w-0 flex-1"><p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-cyan-300">{scope}</p><p className="text-xs font-bold text-white">{title}</p><p className="mt-1 break-words text-[11px] leading-relaxed text-slate-300">{description}</p></div><button onClick={() => toast.dismiss(id)} className="cursor-pointer text-slate-400 hover:text-white" aria-label="Dismiss notification"><X size={14} /></button>
  </div>, { duration: error ? 8000 : 5000 });
}
