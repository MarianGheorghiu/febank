'use client';
import { useRef } from 'react';
import { Search, X } from 'lucide-react';
export default function SearchField({value, onChange, label, placeholder}: {value: string; onChange: (value: string) => void; label: string; placeholder: string}) {
  const ref = useRef<HTMLInputElement>(null);
  return <label className="flex min-w-0 flex-col gap-2 text-[11px] font-medium text-slate-300">{label}<span className="relative"><Search size={14} aria-hidden className="pointer-events-none absolute left-3 top-3.5 text-slate-400"/><input ref={ref} aria-label={label} type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#060d1d] py-2 pl-9 pr-12 text-xs text-white outline-none placeholder:text-slate-400 focus:border-cyan-400/60 [&::-webkit-search-cancel-button]:hidden"/>{value && <button type="button" aria-label={`Clear ${label.toLowerCase()}`} className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-white focus-visible:outline-2 focus-visible:outline-cyan-300" onClick={() => {onChange(''); ref.current?.focus();}}><X size={15} aria-hidden/></button>}</span></label>;
}
