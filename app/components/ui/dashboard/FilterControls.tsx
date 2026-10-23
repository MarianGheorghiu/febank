"use client";
import { Search, X } from "lucide-react";
import styles from "./OverviewControls.module.css";
export default function FilterControls({ query, onQueryChange, label, options, selected, onSelect }: {
  query: string; onQueryChange: (value: string) => void; label: string;
  options: readonly string[]; selected: string | null; onSelect: (value: string | null) => void;
}) {
  return <div className="space-y-2.5 mb-4 shrink-0 relative z-10">
    <div className="relative flex items-center bg-[#070b14] border border-zinc-700 rounded-lg focus-within:border-cyan-400">
      <Search size={14} className="absolute left-3 text-zinc-400" aria-hidden="true" />
      <input aria-label={label} placeholder={label} value={query} onChange={e => onQueryChange(e.target.value)} className="w-full min-w-0 bg-transparent pl-9 pr-11 py-3 text-xs text-white outline-none" />
      {query && <button type="button" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => onQueryChange("")} className={`absolute right-0 p-3 cursor-pointer ${styles.clear}`}><X size={16} /></button>}
    </div>
    <div className="flex flex-wrap gap-1" aria-label={`${label} filters`}>
      {options.map(option => <button type="button" key={option} aria-pressed={option === (selected ?? "ALL")} onClick={() => onSelect(option === "ALL" ? null : option)} className={`min-h-9 px-2.5 border text-[10px] font-mono font-bold cursor-pointer ${styles.action}`}>{option}</button>)}
    </div>
  </div>;
}
