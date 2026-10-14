"use client";
import { useEffect, useId, useRef } from "react";
import { ActionButton } from "../dashboard/ActionButton";
export default function MessageDeleteDialog({ count, pending, error, onCancel, onConfirm }: { count: number; pending: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, []);
  return <dialog ref={dialog} aria-labelledby={title} onCancel={event => { event.preventDefault(); if (!pending) onCancel(); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-blue-300/15 bg-gradient-to-b from-[#101e3b] to-[#080f20] p-6 text-slate-200 shadow-2xl backdrop:bg-slate-950/80 backdrop:backdrop-blur-lg">
    <h2 id={title} className="text-lg font-semibold text-white">Delete {count === 1 ? "conversation" : `${count} conversations`} permanently?</h2>
    <p className="mt-3 text-sm leading-relaxed text-slate-400">This removes the selected conversations, their replies and saved drafts from the mock account. You can restore them from Trash if you cancel now.</p>
    {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
    <div className="mt-6 flex flex-wrap justify-end gap-2"><ActionButton variant="blue" disabled={pending} onClick={onCancel}>Cancel</ActionButton><ActionButton variant="red" disabled={pending} onClick={onConfirm}>{pending ? "Deleting…" : "Delete permanently"}</ActionButton></div>
  </dialog>;
}
