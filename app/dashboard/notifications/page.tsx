"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, ChevronLeft, ChevronRight, Inbox, Mail, MailOpen, Search, Send, Square, SquareCheck, SquareMinus, Trash2, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import CardSurface from "@/app/components/ui/CardSurface";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import MessageIconButton from "@/app/components/ui/messageCenter/MessageIconButton";
import MessageTabs from "@/app/components/ui/messageCenter/MessageTabs";
import MessageCard from "@/app/components/ui/messageCenter/MessageCard";
import MessageDetail from "@/app/components/ui/messageCenter/MessageDetail";
import MessageDeleteDialog from "@/app/components/ui/messageCenter/MessageDeleteDialog";
import { filterMessages, messageCounts } from "@/app/lib/messages/engine";
import { createMessageRepository, messageStorageKey } from "@/app/lib/messages/repository";
import { useSessionMetadata } from "@/app/lib/session/use-session-metadata";
import type { MessageCommand, MessageFilters, MessageFolder, MessagesSnapshot } from "@/app/lib/types/messages";
const PAGE_SIZE = 8;
const initialFilters: MessageFilters = { folder: "inbox", category: "all", query: "", unread_only: false };
const actionLabels: Record<MessageCommand["kind"], string> = { mark_read: "Marked as read", mark_unread: "Marked as unread", archive: "Moved to Archive", unarchive: "Moved to Inbox", trash: "Moved to Trash", restore: "Conversations restored", purge: "Permanently deleted", reply: "Reply sent", save_draft: "Draft saved" };
function MessagesWorkspace({ clientId }: { clientId: string }) {
  const repository = useMemo(() => createMessageRepository(clientId), [clientId]);
  const session = useSessionMetadata(clientId);
  const [snapshot, setSnapshot] = useState<MessagesSnapshot | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isReplying, setIsReplying] = useState(false);
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [purgeIds, setPurgeIds] = useState<string[] | null>(null);
  const load = useCallback(async () => {
    try { const next = await repository.getSnapshot(); setSnapshot(next); setError(""); }
    catch { setError("Unable to load messages. Please retry."); }
  }, [repository]);
  useEffect(() => {
    let cancelled = false;
    repository.getSnapshot().then(next => { if (!cancelled) setSnapshot(next); }).catch(() => { if (!cancelled) setError("Unable to load messages. Please retry."); });
    const changed = (event: StorageEvent) => { if (event.key === messageStorageKey(clientId) || event.key === null) void load(); };
    window.addEventListener("storage", changed);
    return () => { cancelled = true; window.removeEventListener("storage", changed); };
  }, [repository, clientId, load]);
  const filtered = useMemo(() => snapshot ? filterMessages(snapshot, filters) : [], [snapshot, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeIds = selectedIds.filter(id => visible.some(message => message.id === id));
  const allSelected = visible.length > 0 && activeIds.length === visible.length;
  const current = snapshot?.messages.find(message => message.id === selectedId) ?? null;
  const counts = snapshot ? messageCounts(snapshot) : { inbox: 0, unread: 0, bank: 0, replied: 0, archived: 0, deleted: 0 };
  const categoryRows = snapshot ? filterMessages(snapshot, { ...filters, category: "all" }) : [];
  const tabCounts = { all: categoryRows.length, bank: categoryRows.filter(message => message.type === "bank").length, friend: categoryRows.filter(message => message.type === "friend").length };
  function changeFilters(patch: Partial<MessageFilters>) { setFilters(previous => ({ ...previous, ...patch })); setPage(1); setSelectedIds([]); setSelectedId(null); setIsReplying(false); }
  const saveDraft = useCallback(async (id: string, body: string) => {
    const next = await repository.execute({ kind: "save_draft", id, body });
    setSnapshot(next);
  }, [repository]);
  async function run(command: MessageCommand, quiet = false) {
    setPending(true); setError("");
    try {
      const next = await repository.execute(command);
      setSnapshot(next);
      if ("ids" in command && ["archive", "unarchive", "trash", "restore", "purge"].includes(command.kind)) {
        setSelectedIds([]);
        if (selectedId && command.ids.includes(selectedId)) { setSelectedId(null); setIsReplying(false); }
      }
      if (!quiet) notifyOperation(actionLabels[command.kind], command.kind === "reply" ? "Your reply has been saved in this mock conversation." : `${"ids" in command ? command.ids.length : 1} conversation(s) updated in your mock account.`, false, "Message Center");
      return true;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The operation could not be completed.";
      setError(message);
      if (!purgeIds) notifyOperation("Message operation failed", message, true, "Message Center");
      return false;
    } finally { setPending(false); }
  }
  if (!snapshot) return <div role={error ? "alert" : "status"} className="p-6 text-sm text-slate-300">{error || "Loading your messages…"}{error && <ActionButton variant="blue" onClick={() => void load()}>Retry</ActionButton>}</div>;
  const folders: { id: MessageFolder; label: string; count: number; Icon: typeof Inbox }[] = [
    { id: "inbox", label: "Inbox", count: counts.inbox, Icon: Inbox },
    { id: "replied", label: "Replied", count: counts.replied, Icon: Send },
    { id: "archived", label: "Archive", count: counts.archived, Icon: Archive },
    { id: "deleted", label: "Trash", count: counts.deleted, Icon: Trash2 },
  ];
  return <div data-mail-workspace style={{ containerType: "inline-size", containerName: "mailbox" }} className="flex h-full min-h-0 min-w-0 w-full flex-col gap-3 overflow-hidden">
    <h1 className="sr-only">Message Center</h1>
    <div className="shrink-0"><PageHeader sessionId={session.id} lastLogin={session.lastLogin}>
      <dl aria-label="Message summary" className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono">
        {[{ label: "Inbox", value: counts.inbox, Icon: Inbox }, { label: "Unread", value: counts.unread, Icon: Mail }, { label: "Replied", value: counts.replied, Icon: Send }].map(({ label, value, Icon }) => <div key={label} className="flex items-center gap-2">
          <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Icon size={13} className="text-blue-300/70" aria-hidden="true" />{label}</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-200">{value}</dd>
        </div>)}
      </dl>
    </PageHeader></div>
    <CardSurface data-mail-filters tone="blue" className="shrink-0 p-2.5 space-y-2">
      <div data-mail-folders className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-thin" role="group" aria-label="Message folder">
        {folders.map(({ id, label, count, Icon }) => <ActionButton key={id} variant={filters.folder === id ? "cyan" : "blue"} size="medium" iconGap="tight" autoWidth className="shrink-0 whitespace-nowrap" aria-pressed={filters.folder === id} disabled={pending} icon={<Icon size={14} />} onClick={() => changeFilters({ folder: id })}>{label}<span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-md border border-white/10 bg-white/5 px-1 py-0.5 text-[11px] tabular-nums text-slate-200">{count}</span></ActionButton>)}
      </div>
      <div data-mail-search className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0"><Search size={15} className="absolute left-2.5 top-2.5 text-slate-500" aria-hidden="true" /><input type="text" role="searchbox" enterKeyHint="search" aria-label="Search messages" placeholder="Search sender, subject or conversation…" value={filters.query} onChange={event => changeFilters({ query: event.target.value })} className="w-full h-9 rounded-lg border border-white/10 bg-[#060d1b] pl-8 pr-9 text-base sm:text-sm text-slate-100 outline-none focus:border-cyan-400/40" />{filters.query && <button type="button" aria-label="Clear message search" onClick={() => changeFilters({ query: "" })} className="absolute right-0 top-0 p-2.5 text-slate-400 cursor-pointer"><X size={14} /></button>}</div>
      </div>
    </CardSurface>
    {error && !purgeIds && <p role="alert" className="shrink-0 rounded-xl border border-rose-500/20 p-2 text-xs text-rose-300">{error}</p>}
    <div className="grid flex-1 min-w-0 min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className={`min-w-0 min-h-0 flex-col gap-2 ${current ? "hidden lg:flex" : "flex"}`}>
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto scrollbar-thin rounded-xl border border-white/10 bg-blue-400/5 p-1.5">
          <ActionButton variant={activeIds.length ? "cyan" : "blue"} size="medium" iconGap="tight" autoWidth className="shrink-0 whitespace-nowrap" role="checkbox" aria-label="Select all messages on this page" aria-checked={allSelected ? true : activeIds.length ? "mixed" : false} disabled={!visible.length || pending} icon={allSelected ? <SquareCheck size={14} /> : activeIds.length ? <SquareMinus size={14} /> : <Square size={14} />} onClick={() => setSelectedIds(allSelected ? [] : visible.map(message => message.id))}>Select all</ActionButton>
          <ActionButton variant={filters.unread_only ? "cyan" : "blue"} size="medium" iconGap="tight" autoWidth className="shrink-0 whitespace-nowrap" role="checkbox" aria-checked={filters.unread_only} disabled={pending} icon={filters.unread_only ? <SquareCheck size={14} /> : <Square size={14} />} onClick={() => changeFilters({ unread_only: !filters.unread_only })}>Unread only</ActionButton>
          {activeIds.length > 0 ? <>
            <span aria-label={`${activeIds.length} selected`} title={`${activeIds.length} selected`} className="mr-auto px-1 text-[11px] tabular-nums text-slate-400">{activeIds.length}</span>
            <MessageIconButton label="Mark selected messages as read" icon={<MailOpen size={14} />} disabled={pending} onClick={() => void run({ kind: "mark_read", ids: activeIds })} />
            <MessageIconButton label="Mark selected messages as unread" icon={<Mail size={14} />} disabled={pending} onClick={() => void run({ kind: "mark_unread", ids: activeIds })} />
            {filters.folder === "deleted" ? <MessageIconButton label="Restore selected messages" icon={<ArchiveRestore size={14} />} disabled={pending} onClick={() => void run({ kind: "restore", ids: activeIds })} /> : <MessageIconButton label={filters.folder === "archived" ? "Move selected messages to Inbox" : "Archive selected messages"} icon={<Archive size={14} />} disabled={pending} onClick={() => void run({ kind: filters.folder === "archived" ? "unarchive" : "archive", ids: activeIds })} />}
            <MessageIconButton label={filters.folder === "deleted" ? "Delete selected messages permanently" : "Move selected messages to Trash"} icon={<Trash2 size={14} />} danger disabled={pending} onClick={() => filters.folder === "deleted" ? (setError(""), setPurgeIds(activeIds)) : void run({ kind: "trash", ids: activeIds })} />
            <MessageIconButton label="Clear message selection" icon={<X size={14} />} disabled={pending} onClick={() => setSelectedIds([])} />
          </> : <MessageTabs activeTab={filters.category} onChange={category => changeFilters({ category })} counts={tabCounts} disabled={pending} />}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 scrollbar-thin" aria-label="Message list">
          {visible.map(message => <MessageCard key={message.id} message={message} isActive={selectedId === message.id} isSelected={activeIds.includes(message.id)} disabled={pending} onToggleSelect={id => setSelectedIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id])} onClick={id => { setSelectedId(id); setIsReplying(false); if (message.read_at === null) void run({ kind: "mark_read", ids: [id] }, true); }} />)}
          {!visible.length && <CardSurface tone="blue" className="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 p-6 text-center"><Inbox size={24} className="text-blue-300/50" /><p className="text-sm text-slate-300">No messages match this view.</p>{(filters.query || filters.unread_only || filters.category !== "all") && <ActionButton variant="blue" onClick={() => changeFilters({ query: "", unread_only: false, category: "all" })}>Clear filters</ActionButton>}</CardSurface>}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 text-[10px] text-slate-500"><p>{filtered.length ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}` : "0 messages"}</p><nav aria-label="Message pagination" className="flex items-center gap-1"><MessageIconButton label="Previous message page" disabled={pending || currentPage === 1} icon={<ChevronLeft size={13} />} compact onClick={() => { setPage(currentPage - 1); setSelectedIds([]); }} /><span className="px-1 tabular-nums">{currentPage}/{pageCount}</span><MessageIconButton label="Next message page" disabled={pending || currentPage === pageCount} icon={<ChevronRight size={13} />} compact onClick={() => { setPage(currentPage + 1); setSelectedIds([]); }} /></nav></div>
      </div>
      <div className={`min-w-0 min-h-0 ${current ? "block" : "hidden lg:block"}`}>
        <MessageDetail message={current} draft={current ? snapshot.drafts[current.id] ?? "" : ""} isReplying={isReplying} onReplyingChange={setIsReplying} pending={pending} onClose={() => { const id = selectedId; setSelectedId(null); setIsReplying(false); window.requestAnimationFrame(() => document.getElementById(`message-open-${id}`)?.focus({ preventScroll: true })); }} onCommand={run} onPurge={ids => { setError(""); setPurgeIds(ids); }} onSaveDraft={saveDraft} onSendReply={async (id, body, reply_id) => { const success = await run({ kind: "reply", id, reply_id, body }); if (!success) throw new Error("Reply was not saved. Please retry."); setIsReplying(false); }} />
      </div>
    </div>
    {purgeIds && <MessageDeleteDialog count={purgeIds.length} pending={pending} error={error} onCancel={() => { setPurgeIds(null); setError(""); }} onConfirm={() => void run({ kind: "purge", ids: purgeIds }).then(success => { if (success) setPurgeIds(null); })} />}
  </div>;
}
export default function MessageCenter() {
  const { user } = useUser();
  return user ? <MessagesWorkspace key={user.email} clientId={user.email} /> : <p role="status" className="p-6 text-sm text-slate-400">Loading your messages…</p>;
}
