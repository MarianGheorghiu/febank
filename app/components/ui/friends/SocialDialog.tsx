"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, Users } from "lucide-react";
import styles from "./SocialDialog.module.css";

/** Native focus containment, with a bottom sheet on phones and a desktop dialog. */
export default function SocialDialog({ title, subtitle, busy, onClose, children }: { title: string; subtitle: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement as HTMLElement | null;
    const viewport = window.visualViewport;
    const fitViewport = () => {
      if (!element || !viewport) return;
      element.style.setProperty("--social-sheet-height", `${viewport.height}px`);
      element.style.setProperty("--social-sheet-bottom", `${Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)}px`);
    };
    fitViewport();
    element?.showModal();
    // Present the sheet before requesting keyboard input on a phone.
    if (window.matchMedia("(max-width: 767px)").matches) element?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    else element?.querySelector<HTMLInputElement>("input:not([type=checkbox])")?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    viewport?.addEventListener("resize", fitViewport);
    viewport?.addEventListener("scroll", fitViewport);
    return () => {
      viewport?.removeEventListener("resize", fitViewport);
      viewport?.removeEventListener("scroll", fitViewport);
      element?.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} className={styles.dialog}>
    <div className={styles.header}>
      <div aria-hidden="true" className={styles.handle} />
      <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="shrink-0 rounded-xl border border-purple-300/15 bg-purple-400/5 p-2.5 text-purple-300"><Users size={20} /></span><div className="min-w-0"><h2 tabIndex={-1} id={titleId} className="break-words text-lg font-bold outline-none">{title}</h2><p className="mt-1 break-words text-xs text-slate-400">{subtitle}</p></div></div><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-40"><X size={18} /></button></div>
    </div>
    <div className={styles.content}>{children}</div>
  </dialog>;
}
export const socialField = "w-full min-w-0 rounded-xl border border-white/10 bg-[#060d1b] px-4 py-3 text-base text-slate-100 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10 disabled:opacity-60 sm:text-sm";
export const socialLabel = "flex min-w-0 flex-col gap-2 text-xs text-slate-300";
