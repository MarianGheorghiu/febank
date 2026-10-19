"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

export function SocialSearch({ value, onChange, label, placeholder = "Search name or username" }: { value: string; onChange: (value: string) => void; label: string; placeholder?: string }) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="relative min-w-0 w-full sm:max-w-xs">
    <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-3.5 text-slate-500" />
    <input ref={input} aria-label={label} type="text" autoComplete="off" className="min-h-11 w-full rounded-xl border border-white/10 bg-[#060d1b] py-2 pl-10 pr-11 text-base text-white outline-none focus:border-cyan-300/40 sm:text-sm" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); if (e.key === "Escape" && value) { e.preventDefault(); e.stopPropagation(); onChange(""); } }} />
    {value && <button type="button" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { onChange(""); input.current?.focus(); }} className="absolute right-0.5 top-0.5 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300"><X size={15} /></button>}
  </div>;
}

export function SocialPagination({ total, page, pageSize, onPageChange, onPageSizeChange, label, compact = false }: { compact?: boolean; total: number; page: number; pageSize: number; onPageChange: (page: number) => void; onPageSizeChange?: (size: number) => void; label: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page, 1), pages);
  const button = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-30";
  if (compact) return <nav aria-label={label} className="grid grid-cols-2 items-center gap-x-3 gap-y-1 border-t border-white/10 px-3 py-2 text-xs text-slate-400 sm:flex sm:flex-wrap sm:px-4">
    <span role="status" aria-live="polite" className="sm:mr-auto">{total ? `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, total)}` : "0"} of {total.toLocaleString("en-GB")}</span>
    {onPageSizeChange && <label className="flex items-center justify-end gap-2 text-[10px] sm:text-xs">Rows<select aria-label={`${label} rows per page`} value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} className="h-10 rounded-lg border border-white/10 bg-[#060d1b] px-2 text-xs text-slate-200 outline-none focus:border-cyan-300">{[5, 10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label>}
    <div className="col-span-2 flex items-center justify-between gap-2 sm:justify-end">
      <button type="button" aria-label={`${label} previous page`} disabled={current <= 1} onClick={() => onPageChange(current - 1)} className="flex min-h-11 items-center gap-1 rounded-lg border border-white/10 px-2 text-slate-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-30"><ChevronLeft size={14} /><span>Prev</span></button>
      <label className="flex items-center gap-1.5"><span className="sr-only">{label} page</span><input key={current} aria-label={`${label} page`} type="number" min={1} max={pages} defaultValue={current} className="h-11 w-12 rounded-lg border border-white/10 bg-[#060d1b] px-1 text-center text-base text-slate-200 outline-none focus:border-cyan-300 sm:text-xs" onBlur={e => { const next = Number(e.target.value); const value = Number.isFinite(next) ? Math.min(pages, Math.max(1, Math.floor(next))) : current; onPageChange(value); e.target.value = String(value); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} /><span>/ {pages}</span></label>
      <button type="button" aria-label={`${label} next page`} disabled={current >= pages} onClick={() => onPageChange(current + 1)} className="flex min-h-11 items-center gap-1 rounded-lg border border-white/10 px-2 text-slate-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-30"><span>Next</span><ChevronRight size={14} /></button>
    </div>
  </nav>;
  return <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-white/10 px-4 py-3 text-xs text-slate-400 sm:px-5">
    <span role="status" aria-live="polite">{total ? `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, total)}` : "0"} of {total.toLocaleString("en-GB")}</span>
    <div className="flex flex-wrap items-center justify-end gap-2">
      {onPageSizeChange && <label className="flex items-center gap-2"><span className="hidden sm:inline">Rows</span><select aria-label={`${label} rows per page`} value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} className="h-11 rounded-xl border border-white/10 bg-[#060d1b] px-2 text-slate-200 outline-none focus:border-cyan-300">{[5, 10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label>}
      <button type="button" className={button} aria-label={`${label} previous page`} disabled={current <= 1} onClick={() => onPageChange(current - 1)}><ChevronLeft size={16} /></button>
      <label className="flex items-center gap-1.5"><span className="sr-only">{label} page</span><input key={current} aria-label={`${label} page`} type="number" min={1} max={pages} defaultValue={current} className="h-11 w-16 rounded-xl border border-white/10 bg-[#060d1b] px-2 text-center text-base text-slate-200 outline-none focus:border-cyan-300 sm:text-xs" onBlur={e => { const next = Number(e.target.value); onPageChange(Number.isFinite(next) ? Math.min(pages, Math.max(1, Math.floor(next))) : current); e.target.value = String(Number.isFinite(next) ? Math.min(pages, Math.max(1, Math.floor(next))) : current); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} /><span>/ {pages}</span></label>
      <button type="button" className={button} aria-label={`${label} next page`} disabled={current >= pages} onClick={() => onPageChange(current + 1)}><ChevronRight size={16} /></button>
    </div>
  </nav>;
}
