'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import DialogCloseButton from '../../DialogCloseButton';
export default function HealthDialog({title, busy, onClose, children}: {title: string; busy: boolean; onClose: () => void; children: ReactNode}) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => {const dialog = ref.current, focus = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow; dialog?.showModal(); document.body.style.overflow = 'hidden'; return () => {dialog?.close(); document.body.style.overflow = overflow; focus?.focus();};}, []);
  return <dialog ref={ref} aria-labelledby={id} onCancel={e => {e.preventDefault(); if (!busy) onClose();}} onClick={e => {if (busy || e.target !== e.currentTarget) return; const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();}} className="scrollbar-thin m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-b from-[#101d35] to-[#080f20] p-5 font-mono text-white shadow-2xl backdrop:bg-black/80 sm:p-6"><header className="mb-5 flex items-start justify-between gap-3"><h2 id={id} className="text-lg font-semibold">{title}</h2><DialogCloseButton disabled={busy} onClick={onClose}/></header>{children}</dialog>;
}
