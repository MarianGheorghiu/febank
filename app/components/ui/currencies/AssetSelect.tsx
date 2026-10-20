"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { CurrencyAsset } from "@/app/lib/currencies/contracts";

const ROW_HEIGHT = 52;
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** Searchable, keyboard-operated picker with a bounded rendered list for large catalogs. */
export default function AssetSelect({ label, value, assets, disabled, onChange, align = "left", className = "w-24" }: { align?: "left" | "right"; className?: string; label: string; value: string; assets: CurrencyAsset[]; disabled: boolean; onChange: (symbol: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [placement, setPlacement] = useState({ above: false, listHeight: 240 });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const pointerInside = useRef(false);
  const index = useMemo(() => assets.map(asset => ({ asset, terms: normalize(`${asset.symbol} ${asset.name} ${asset.kind === "fiat" ? "currency" : asset.kind}`) })), [assets]);
  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    return index.filter(item => item.terms.includes(query)).map(item => item.asset);
  }, [index, search]);
  const start = Math.max(0, Math.floor(scroll / ROW_HEIGHT) - 3);
  const visible = filtered.slice(start, start + 12);
  const positionPicker = useCallback(() => {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const viewport = window.visualViewport;
    let top = viewport?.offsetTop ?? 0;
    let bottom = top + (viewport?.height ?? window.innerHeight);
    for (let parent = root.current?.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      if (/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY)) {
        const bounds = parent.getBoundingClientRect();
        top = Math.max(top, bounds.top); bottom = Math.min(bottom, bounds.bottom); break;
      }
    }
    const below = bottom - rect.bottom - 8;
    const above = rect.top - top - 8;
    const showAbove = below < Math.min(assets.length * ROW_HEIGHT, 240) + 94 && above > below;
    setPlacement({ above: showAbove, listHeight: Math.max(ROW_HEIGHT, Math.min(240, (showAbove ? above : below) - 94)) });
  }, [assets.length]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus({ preventScroll: true });
    function outside(event: PointerEvent) {
      pointerInside.current = !!root.current?.contains(event.target as Node);
      if (!pointerInside.current) setOpen(false);
    }
    // A native scrollbar can focus the enclosing dialog/body. Keep the picker
    // open while dragging it; an actual outside pointer or keyboard Tab closes it.
    function focusOutside(event: FocusEvent) { if (!pointerInside.current && !root.current?.contains(event.target as Node)) setOpen(false); }
    function keyboard(event: KeyboardEvent) { if (event.key === "Tab") pointerInside.current = false; }
    function reposition(event: Event) { if (!root.current?.contains(event.target as Node)) positionPicker(); }
    window.addEventListener("resize", positionPicker);
    window.visualViewport?.addEventListener("resize", positionPicker);
    document.addEventListener("scroll", reposition, true);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", focusOutside);
    document.addEventListener("keydown", keyboard, true);
    return () => { window.removeEventListener("resize", positionPicker); window.visualViewport?.removeEventListener("resize", positionPicker); document.removeEventListener("scroll", reposition, true); document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", focusOutside); document.removeEventListener("keydown", keyboard, true); };
  }, [open, positionPicker]);
  function close() { setOpen(false); trigger.current?.focus({ preventScroll: true }); }
  function select(symbol: string) { onChange(symbol); close(); }
  function move(index: number) {
    const next = Math.min(Math.max(index, 0), filtered.length - 1);
    setActive(next);
    const viewport = list.current;
    if (viewport && next >= 0) {
      if (next * ROW_HEIGHT < viewport.scrollTop) viewport.scrollTop = next * ROW_HEIGHT;
      else if ((next + 1) * ROW_HEIGHT > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = (next + 1) * ROW_HEIGHT - viewport.clientHeight;
      setScroll(viewport.scrollTop);
    }
  }
  return <div ref={root} className={`relative shrink-0 ${className} ${open ? "z-50" : ""}`} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <button ref={trigger} type="button" disabled={disabled} aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${id}-picker` : undefined} onClick={() => { pointerInside.current = true; setSearch(""); setActive(0); setScroll(0); positionPicker(); setOpen(value => !value); }} className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-blue-800/70 bg-[#050b17] px-3 font-mono text-sm font-semibold text-blue-100 transition-colors hover:border-blue-500 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"><span className="truncate">{value}</span><ChevronDown aria-hidden size={13} className={`shrink-0 text-blue-400 transition-transform ${open ? "rotate-180" : ""}`} /></button>
    {open && <div id={`${id}-picker`} role="dialog" aria-label={`Select ${label.toLowerCase()} asset`} className={`absolute ${align === "right" ? "right-0" : "left-0"} z-50 w-[min(19rem,calc(100vw-3rem))] rounded-xl border border-blue-400/20 bg-slate-950 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.65)] ${placement.above ? "bottom-full mb-2" : "top-full mt-2"}`}>
      <div className="relative mb-2"><Search aria-hidden size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cyan-500" /><input ref={input} role="combobox" aria-label={`Search ${label.toLowerCase()} asset`} aria-expanded aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={filtered[active] && active >= start && active < start + 12 ? `${id}-option-${active}` : undefined} value={search} placeholder="Search name or symbol" onChange={event => { setSearch(event.target.value); setActive(0); setScroll(0); if (list.current) list.current.scrollTop = 0; }} onKeyDown={event => {
        if (event.key === "ArrowDown") { event.preventDefault(); move(active + 1); }
        else if (event.key === "ArrowUp") { event.preventDefault(); move(active - 1); }
        else if (event.key === "Home") { event.preventDefault(); move(0); }
        else if (event.key === "End") { event.preventDefault(); move(filtered.length - 1); }
        else if (event.key === "Enter") { event.preventDefault(); if (filtered[active]) select(filtered[active].symbol); }
      }} className="min-h-11 w-full rounded-lg border border-blue-400/15 bg-black py-2 pr-10 pl-9 text-base text-white outline-none placeholder:text-slate-500 focus:border-blue-400/50 sm:text-sm" /><button type="button" aria-label="Close asset picker" onClick={close} className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300"><X size={14} /></button></div>
      <div ref={list} id={`${id}-list`} role="listbox" aria-label="Matching assets" onPointerDown={() => { pointerInside.current = true; }} onScroll={event => setScroll(event.currentTarget.scrollTop)} className="max-h-60 overflow-y-auto overscroll-contain scrollbar-thin" style={{ height: Math.min(filtered.length * ROW_HEIGHT, placement.listHeight) || 64 }}>
        {filtered.length ? <div className="relative" style={{ height: filtered.length * ROW_HEIGHT }}>{visible.map((asset, offset) => {
          const index = start + offset;
          return <button id={`${id}-option-${index}`} key={asset.symbol} type="button" role="option" aria-selected={value === asset.symbol} aria-posinset={index + 1} aria-setsize={filtered.length} tabIndex={-1} onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => select(asset.symbol)} className={`absolute left-0 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-cyan-300 ${active === index || value === asset.symbol ? "border-blue-700/70 bg-blue-500/10 text-white" : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"}`} style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT - 2 }}><span className="min-w-0"><span className="block font-mono text-xs font-bold text-cyan-300">{asset.symbol}</span><span className="mt-1 block truncate text-[11px]">{asset.name}</span></span>{value === asset.symbol ? <Check aria-hidden size={15} className="shrink-0 text-blue-300" /> : <span className="shrink-0 text-[9px] uppercase text-slate-500">{asset.kind === "fiat" ? "Currency" : asset.kind}</span>}</button>;
        })}</div> : <p role="status" className="py-5 text-center text-xs text-slate-500">No matching assets.</p>}
      </div>
      <p aria-live="polite" className="px-2 pt-2 pb-1 text-[10px] text-slate-500">{filtered.length.toLocaleString()} {filtered.length === 1 ? "asset" : "assets"}</p>
    </div>}
  </div>;
}
