"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import DialogCloseButton from "../../DialogCloseButton";
import { AuditSelect, auditInputClass, auditFieldClass } from "../audit/presentation";
import type { ConfigModule, ConfigValue, FlagRule, SettingDefinition } from "@/app/lib/types/admin/flags-config";

export const modules:Record<ConfigModule,{name:string;description:string}>={
  platform:{name:"Platform",description:"Availability & global defaults"}, identity:{name:"Identity & security",description:"Access, sessions & verification"},
  accounts:{name:"Accounts & currencies",description:"Account lifecycle & eligibility"}, transfers:{name:"Transfers & social",description:"Payment rails & transaction limits"},
  cards:{name:"Cards & issuing",description:"Card lifecycle & payment controls"}, crypto:{name:"Crypto",description:"Trading & blockchain operations"},
  stocks:{name:"Stocks & markets",description:"Equity execution & investing"}, loans:{name:"Loans & capital",description:"Credit applications & collateral"},
  subscriptions:{name:"Subscriptions",description:"Billing, trials & collections"}, growth:{name:"Offers & referrals",description:"Rewards, cashback & experiences"},
  communications:{name:"Communications",description:"Messages, notifications & insights"}, operations:{name:"Operations & audit",description:"API, reconciliation & retention"},
};

export const configScrollClass = 'scrollbar-thin h-[min(38rem,70dvh)] overflow-y-auto overscroll-contain [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:outline-cyan-300';
export function Badge({children, tone = 'cyan'}: {children: ReactNode; tone?: 'cyan' | 'amber' | 'green' | 'rose'}) {
  return <span className={`inline-flex min-h-6 items-center rounded-lg border px-2 py-1 text-[10px] ${tone === 'amber' ? 'border-amber-400/25 bg-amber-400/5 text-amber-200' : tone === 'green' ? 'border-teal-400/25 bg-teal-400/5 text-teal-200' : tone === 'rose' ? 'border-rose-400/25 bg-rose-400/5 text-rose-200' : 'border-cyan-400/25 bg-cyan-400/5 text-cyan-200'}`}>{children}</span>;
}
export function ConfigDialog({title, subtitle, onClose, children, footer, busy = false}: {title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; busy?: boolean}) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => {const dialog = ref.current, focus = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow; dialog?.showModal(); document.body.style.overflow = 'hidden'; return () => {dialog?.close(); document.body.style.overflow = overflow; focus?.focus();};}, []);
  return <dialog ref={ref} aria-labelledby={id} onCancel={e => {e.preventDefault(); if (!busy) onClose();}} onClick={e => {if (busy || e.target !== e.currentTarget) return; const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();}} className="m-auto w-[calc(100%_-_2rem)] max-w-3xl overflow-visible rounded-2xl border border-white/10 bg-gradient-to-b from-[#101d35] to-[#080f20] p-0 font-mono text-white shadow-2xl backdrop:bg-black/80"><div className="flex max-h-[90dvh] flex-col"><header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-5"><div><h2 id={id} className="text-lg font-semibold">{title}</h2>{subtitle && <p className="mt-2 text-xs leading-relaxed text-slate-300">{subtitle}</p>}</div><DialogCloseButton disabled={busy} onClick={onClose}/></header><div className="scrollbar-thin min-h-0 overflow-y-auto overscroll-contain p-5">{children}</div>{footer && <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/10 p-5">{footer}</footer>}</div></dialog>;
}
export function displayValue(value: ConfigValue | FlagRule, unit?: string) {
  if (typeof value === 'object') return `${value.enabled ? 'Enabled' : 'Disabled'} · ${value.rollout_pct}% · ${value.audience}`;
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (typeof value === 'number' && unit === 'EUR cents') return new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'EUR'}).format(value / 100);
  return `${typeof value === 'number' ? value.toLocaleString('en-GB') : value || 'Empty'}${unit && unit !== 'EUR cents' ? ` ${unit}` : ''}`;
}
export function SettingInput({definition: d, value, onChange, disabled = false}: {definition: SettingDefinition; value: ConfigValue; onChange: (value: ConfigValue) => void; disabled?: boolean}) {
  if (d.type === 'boolean') return <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-4"><span className="text-xs">{d.name}</span><button type="button" role="switch" aria-label={d.name} aria-checked={value === true} disabled={disabled} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed" onClick={() => onChange(value !== true)}><span className="text-xs text-slate-200">{value === true ? 'Enabled' : 'Disabled'}</span><span aria-hidden className={`relative h-5 w-9 rounded-full ${value === true ? 'bg-cyan-400/40' : 'bg-slate-600'}`}><span className={`absolute top-0.5 size-4 rounded-full bg-white ${value === true ? 'left-[18px]' : 'left-0.5'}`}/></span></button></div>;
  return <label className={auditFieldClass}>{d.name}{d.type === 'select' ? <AuditSelect aria-label={d.name} disabled={disabled} value={String(value)} onChange={e => onChange(e.target.value)}>{d.options?.map(option => <option key={option} value={option}>{option}</option>)}</AuditSelect> : <input autoFocus type="number" step={1} min={d.min} max={d.max} disabled={disabled} value={typeof value === 'number' && Number.isFinite(value) ? value : ''} className={auditInputClass} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}/>}<span className="text-[11px] leading-relaxed text-slate-400">{d.type === 'number' ? `Integer ${d.min?.toLocaleString('en-GB')}–${d.max?.toLocaleString('en-GB')}${d.unit ? ` · ${d.unit}` : ''}` : 'Choose an approved value.'}</span></label>;
}
