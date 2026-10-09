import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import type { ReactNode } from "react";
import { panelClass } from "../cards/presentation";
export function AuditPanel({title,subtitle,action,children,className=""}: {title:string;subtitle?:string;action?:ReactNode;children:ReactNode;className?:string}) {
  return <section className={`${panelClass} min-w-0 ${className}`}>
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-cyan-500/20 p-4">
      <div className="min-w-0 flex-1 basis-64"><h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300">{title}</h2>{subtitle && <p className="mt-2 max-w-3xl text-[10px] leading-relaxed text-slate-400">{subtitle}</p>}</div>{action}
    </header>{children}
  </section>;
}
export function auditBadge(value:string) {
  const tone=["CRITICAL","FAILED","DENIED","ERROR"].includes(value)?"border-rose-500/35 bg-rose-500/10 text-rose-300":["WARNING","DEMO","DEMO_ONLY"].includes(value)?"border-amber-500/30 bg-amber-500/10 text-amber-300":["SUCCESS","CONNECTED","LOCAL"].includes(value)?"border-emerald-500/30 bg-emerald-500/10 text-emerald-300":"border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  return `inline-flex h-6 shrink-0 self-center items-center justify-center whitespace-nowrap rounded-md border px-2 py-0 text-[9px] leading-none font-bold ${tone}`;
}
export function auditDate(value:string|number,timeZone:string="Europe/Bucharest") {
  return new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"medium",timeZone}).format(new Date(value));
}
export function EmptyAudit({text}: {text:string}) { return <p role="status" className="p-8 text-center text-xs text-slate-400">{text}</p>; }

export const auditControlClass = "w-full min-w-0 rounded-lg border border-cyan-500/40 bg-[#03091e] px-3 text-xs leading-normal text-white outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50";
export const auditInputClass = `${auditControlClass} h-9 py-0`;
export const auditTextareaClass = `${auditControlClass} py-2.5`;
export const auditFieldClass = "flex min-w-0 flex-col gap-1.5 text-[10px] text-slate-400";
export function AuditSelect({className="",children,...props}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className="relative block min-w-0"><select {...props} className={`${auditInputClass} appearance-none pr-9 cursor-pointer ${className}`}>{children}</select><ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300"/></span>;
}
