"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { analyticsButton, analyticsPrimaryButton } from "../business-analytics/presentation";
import { panelClass as sharedPanelClass } from "../cards/presentation";
import { AuditSelect, auditInputClass } from "../audit/presentation";
import { X } from "lucide-react";
import type { ConfigModule, ConfigValue, FlagDefinition, FlagRule, SettingDefinition } from "@/app/lib/types/admin/flags-config";

export const modules:Record<ConfigModule,{name:string;description:string}>={
  platform:{name:"Platform",description:"Availability & global defaults"}, identity:{name:"Identity & security",description:"Access, sessions & verification"},
  accounts:{name:"Accounts & currencies",description:"Account lifecycle & eligibility"}, transfers:{name:"Transfers & social",description:"Payment rails & transaction limits"},
  cards:{name:"Cards & issuing",description:"Card lifecycle & payment controls"}, crypto:{name:"Crypto",description:"Trading & blockchain operations"},
  stocks:{name:"Stocks & markets",description:"Equity execution & investing"}, loans:{name:"Loans & capital",description:"Credit applications & collateral"},
  subscriptions:{name:"Subscriptions",description:"Billing, trials & collections"}, growth:{name:"Offers & referrals",description:"Rewards, cashback & experiences"},
  communications:{name:"Communications",description:"Messages, notifications & insights"}, operations:{name:"Operations & audit",description:"API, reconciliation & retention"},
};
export const actionClass=analyticsButton;
export const primaryClass=analyticsPrimaryButton.replace("text-slate-950", "text-white").replace("bg-cyan-400", "bg-cyan-500/20").replace("hover:bg-cyan-300", "hover:bg-cyan-500/30");
export const ConfigSelect=AuditSelect;
export const inputClass=`${auditInputClass} [color-scheme:dark]`;
export const panelClass=sharedPanelClass;
export function Badge({children,tone="cyan"}:{children:ReactNode;tone?:"cyan"|"amber"|"green"}) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] font-semibold ${tone==="amber"?"border-amber-300/30 bg-amber-400/10 text-amber-200":tone==="green"?"border-emerald-300/30 bg-emerald-400/10 text-emerald-200":"border-cyan-300/30 bg-cyan-400/10 text-cyan-200"}`}>{children}</span>;
}
export function Toggle({checked,onChange,label,disabled=false}:{checked:boolean;onChange:(value:boolean)=>void;label:string;disabled?:boolean}) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={()=>onChange(!checked)} className={`relative h-5 w-9 shrink-0 rounded-full border transition disabled:opacity-50 ${checked?"border-cyan-200/60 bg-cyan-400/35":"border-slate-400/50 bg-slate-600/40"}`}><span className={`absolute top-0.5 h-[14px] w-[14px] rounded-full shadow transition-all ${checked?"left-[18px] bg-cyan-100":"left-0.5 bg-slate-200"}`}/></button>;
}
export function SettingEditor({definition,value,onChange}:{definition:SettingDefinition;value:ConfigValue;onChange:(value:ConfigValue)=>void}) {
  const id=useId();
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3">
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><label htmlFor={definition.type==="boolean"?undefined:id} className="text-[11px] font-semibold text-white">{definition.name}</label>{definition.critical&&<span className="text-[9px] text-amber-200">CRITICAL</span>}</div><p className="mt-1 text-[10px] leading-relaxed text-slate-200">{definition.description}</p></div>
    <div className={definition.type==="boolean"?"flex items-center gap-2":"w-28 sm:w-32"}>
      {definition.type==="boolean"?<Toggle checked={value===true} onChange={onChange} label={definition.name}/>:definition.type==="select"?<ConfigSelect id={id} value={String(value)} onChange={e=>onChange(e.target.value)} className={inputClass}>{definition.options?.map(option=><option key={option}>{option}</option>)}</ConfigSelect>:<input id={id} type="number" step={1} min={definition.min} max={definition.max} value={typeof value==="number"&&Number.isFinite(value)?value:""} onChange={e=>onChange(e.target.value===""?"":Number(e.target.value))} className={inputClass}/>}
      {definition.unit&&<p className="mt-1 text-right text-[9px] text-cyan-200">{definition.unit}</p>}
    </div>
    {definition.type==="number"&&<p className="col-span-2 text-[9px] text-slate-200">Range: {definition.min?.toLocaleString("en-GB")} – {definition.max?.toLocaleString("en-GB")}</p>}
  </div>;
}

export function FlagEditor({definition,rule,onChange,expanded=false}:{definition:FlagDefinition;rule:FlagRule;onChange:(value:FlagRule)=>void;expanded?:boolean}) {
  return <div className="min-w-0 space-y-2 rounded-lg border border-cyan-500/20 bg-[#03091e]/60 p-3">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] uppercase tracking-wider text-cyan-200">{modules[definition.module].name}</p><h3 className="mt-1 text-[11px] font-bold text-white">{definition.name}</h3></div><Toggle checked={rule.enabled} onChange={enabled=>onChange({...rule,enabled})} label={definition.name}/></div>
    <p className="text-[10px] leading-relaxed text-slate-300">{definition.description}</p>
    <div className="flex flex-wrap gap-2"><Badge tone={rule.enabled?"green":"amber"}>{rule.enabled?"Enabled":"Disabled"}</Badge><Badge>{rule.rollout_pct}% rollout</Badge><Badge>{rule.audience}</Badge>{definition.critical&&<Badge tone="amber">Critical</Badge>}</div>
    {expanded&&<div className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2"><label className="space-y-2 text-[10px] text-slate-200"><span>Rollout percentage</span><input aria-label={`${definition.name} rollout percentage`} className={inputClass} type="number" step={1} min={0} max={100} value={Number.isFinite(rule.rollout_pct)?rule.rollout_pct:""} onChange={e=>onChange({...rule,rollout_pct:e.target.value===""?NaN:Number(e.target.value)})}/></label><label className="space-y-2 text-[10px] text-slate-200"><span>Eligible audience</span><ConfigSelect aria-label={`${definition.name} audience`} className={inputClass} value={rule.audience} onChange={e=>onChange({...rule,audience:e.target.value as FlagRule["audience"]})}>{["all","premium","business","internal"].map(a=><option key={a}>{a}</option>)}</ConfigSelect></label></div>}
    {definition.depends_on&&<p className="text-[10px] text-amber-200">Requires: {definition.depends_on.replaceAll("_"," ")}</p>}
    {expanded&&<code className="block break-all text-[11px] text-slate-300">{definition.key}</code>}
  </div>;
}
export function ConfigDialog({title,subtitle,onClose,children,footer}:{title:string;subtitle:string;onClose:()=>void;children:ReactNode;footer?:ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const dialog=ref.current;
    dialog?.showModal();
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return ()=>{document.body.style.overflow=previous;dialog?.close();};
  },[]);
  return <dialog ref={ref} aria-label={title} onCancel={onClose} className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-5xl overflow-hidden rounded-2xl border border-cyan-200/25 bg-[#091321] p-0 text-white shadow-2xl backdrop:bg-[#02050d]/85 [&_button]:cursor-pointer [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-cyan-200">
    <div className="flex max-h-[92dvh] flex-col"><div className="flex items-start justify-between gap-4 border-b border-white/15 p-4"><div><h2 className="text-sm font-bold">{title}</h2><p className="mt-2 text-[10px] leading-relaxed text-slate-300">{subtitle}</p></div><button type="button" autoFocus aria-label="Close dialog" className={actionClass} onClick={onClose}><X size={18}/></button></div><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 p-4 sm:px-4">{footer??<><p className="text-[10px] text-slate-300">Edits remain in your draft until you review and publish.</p><button className={primaryClass} onClick={onClose}>Done editing</button></>}</div></div>
  </dialog>;
}
export function displayValue(value:ConfigValue|FlagRule) {
  if (typeof value==="object") return `${value.enabled?"On":"Off"} · ${Number.isFinite(value.rollout_pct)?value.rollout_pct:"Invalid"}% · ${value.audience}`;
  if (typeof value==="boolean") return value?"Enabled":"Disabled";
  return typeof value==="number"?value.toLocaleString("en-GB"):value||"Empty";
}
