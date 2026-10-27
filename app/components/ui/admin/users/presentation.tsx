import type { ReactNode } from "react";
export const userInput = "w-full min-w-0 min-h-11 rounded-xl border border-white/10 bg-[#060d1b] px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50";
export const userLabel = "flex min-w-0 flex-col gap-2 text-[11px] font-medium text-slate-300";
export function UserBadge({value}:{value:string}) {
  const tone=["BLOCKED","REJECTED","HIGH"].includes(value)?"border-rose-400/25 bg-rose-400/5 text-rose-300":["IN_REVIEW","MEDIUM","UNKNOWN","OPERATOR","COMPLIANCE"].includes(value)?"border-amber-400/25 bg-amber-400/5 text-amber-200":["ACTIVE","VERIFIED","LOW","ENABLED"].includes(value)?"border-cyan-400/25 bg-cyan-400/5 text-cyan-200":"border-purple-400/25 bg-purple-400/5 text-purple-200";
  return <span className={`inline-flex min-h-6 items-center rounded-md border px-2 py-1 text-[9px] font-bold tracking-wide ${tone}`}>{value.replaceAll("_"," ")}</span>;
}
export function UserField({label,children}:{label:string;children:ReactNode}){return <div className="min-w-0"><dt className="text-[10px] text-slate-400">{label}</dt><dd className="mt-1.5 break-words text-xs leading-relaxed text-slate-200">{children || "Not provided"}</dd></div>;}
export const userDate=(value:string|null)=>value?new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Bucharest"}).format(new Date(value)):"Not recorded";
export const userMoney=(value:string)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number(value));
