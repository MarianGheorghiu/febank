"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./OverviewControls.module.css";

export default function OptionSelect({ value, onChange, label, options, disabled = false, className = "w-full" }: { value: string; onChange: (value: string) => void; label: string; options: readonly { value: string; label: string }[]; disabled?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const initialIndex = useRef(0);
  useEffect(() => {
    if (!open) return;
    items.current[initialIndex.current]?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const focusOutside = (event: FocusEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", focusOutside);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", focusOutside); };
  }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const show = (index: number) => { if (disabled || !options.length) return; initialIndex.current = index; setOpen(true); };
  return <div ref={root} className={`relative min-w-0 ${className} ${open ? "z-50" : ""}`}>
    <button ref={trigger} type="button" disabled={disabled} aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => open ? close() : show(Math.max(0, options.findIndex(option => option.value === value)))}
      onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(event.key === "ArrowUp" ? options.length - 1 : Math.max(0, options.findIndex(option => option.value === value))); } }}
      className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 border px-3 py-1.5 text-left font-mono text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed ${styles.action}`}>
      <span>{options.find(option => option.value === value)?.label}</span><ChevronDown aria-hidden size={13} className={`shrink-0 text-cyan-400 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}/>
    </button>
    {open && <div id={id} role="menu" aria-label={label} className={`absolute right-0 top-full mt-1 w-full space-y-0.5 border p-1 ${styles.menu}`} onKeyDown={event => {
      const index = items.current.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
      else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
        items.current[next]?.focus();
      }
    }}>{options.map((option, index) => <button key={option.value} ref={element => { items.current[index] = element; }} type="button" role="menuitemradio" aria-checked={value === option.value} tabIndex={-1} onClick={() => { onChange(option.value); close(); }} className={`flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 px-2 text-left font-mono text-[11px] ${styles.option} ${value === option.value ? "font-black text-cyan-200 ring-1 ring-inset ring-cyan-400/30" : ""}`}><span>{option.label}</span>{value === option.value && <Check size={13} aria-hidden className="shrink-0 text-cyan-300"/>}</button>)}</div>}
  </div>;
}
