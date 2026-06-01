"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/app/components/ui/PageHeader";
import MessageTabs from "@/app/components/ui/messageCenter/MessageTabs";
import MessageCard from "@/app/components/ui/messageCenter/MessageCard";
import MessageDetail from "@/app/components/ui/messageCenter/MessageDetail";
import {
  Mail,
  Bell,
  Layers,
  Inbox,
  Trash2,
  CheckSquare,
  Square,
  Check,
  ArchiveRestore,
  EyeOff,
} from "lucide-react";
import { Message, MessageFolder } from "@/app/components/ui/types";
import { INITIAL_MESSAGES } from "@/app/lib/mockMessages";

export default function MessageCenter() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState<"all" | "bank" | "friend">("all");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [currentFolder, setCurrentFolder] = useState<MessageFolder>("inbox");
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [isReplying, setIsReplying] = useState(false);

  // Filtrare bază folder
  const folderMessages = useMemo(() => {
    return messages.filter((m) => m.folder === currentFolder);
  }, [messages, currentFolder]);

  // Filtrare secundară sub-tab
  const filteredMessages = useMemo(() => {
    if (activeTab === "all") return folderMessages;
    return folderMessages.filter((msg) => msg.type === activeTab);
  }, [activeTab, folderMessages]);

  const handleMessageSelect = (id: string) => {
    setSelectedMessageId(id);
    setIsReplying(false);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isUnread: false } : msg)),
    );
  };

  const handleToggleSelect = (id: string) => {
    setSelectedBulkIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // LOGICĂ EXCLUSIVĂ SELECT / DESELECT DINAMIC (Outlook Native)
  const isAllSelected =
    filteredMessages.length > 0 &&
    filteredMessages.every((m) => selectedBulkIds.includes(m.id));

  const handleSelectAllToggle = () => {
    if (selectedBulkIds.length > 0) {
      // Dacă există orice fel de selecție activă, butonul acționează ca Deselect / Deselect All
      setSelectedBulkIds([]);
    } else {
      // Dacă nu e nimic selectat, selectăm tot din view-ul curent
      setSelectedBulkIds(filteredMessages.map((m) => m.id));
    }
  };

  const selectButtonText = useMemo(() => {
    const count = selectedBulkIds.length;
    if (count === 0) return "Select All";
    if (count === 1) return `Deselect (${count})`;
    return `Deselect All (${count})`;
  }, [selectedBulkIds]);

  // LOGICĂ DINAMICĂ MARK READ / UNMARK ALL (Se uita la starea mesajelor selectate)
  const isSelectedUnread = useMemo(() => {
    const selectedMsgs = messages.filter((m) => selectedBulkIds.includes(m.id));
    return selectedMsgs.some((m) => m.isUnread);
  }, [messages, selectedBulkIds]);

  const readButtonText = useMemo(() => {
    const count = selectedBulkIds.length;
    if (count === 1) {
      return isSelectedUnread ? "Mark Read" : "Unmark";
    }
    return isSelectedUnread ? "Mark All Read" : "Unmark All";
  }, [selectedBulkIds, isSelectedUnread]);

  const handleBulkMarkReadToggle = () => {
    setMessages((prev) =>
      prev.map((msg) =>
        selectedBulkIds.includes(msg.id)
          ? { ...msg, isUnread: isSelectedUnread ? false : true }
          : msg,
      ),
    );
    setSelectedBulkIds([]);
  };

  // Ștergeri & Restaurări
  const handleDeleteSingle = (id: string) => {
    setMessages((prev) =>
      prev
        .map((msg) => {
          if (msg.id === id) {
            return { ...msg, folder: "deleted" as MessageFolder };
          }
          return msg;
        })
        .filter((msg) => !(msg.id === id && currentFolder === "deleted")),
    );
    if (selectedMessageId === id) setSelectedMessageId(null);
    setSelectedBulkIds((prev) => prev.filter((item) => item !== id));
    setIsReplying(false);
  };

  const handleBulkDelete = () => {
    setMessages((prev) =>
      prev
        .map((msg) => {
          if (selectedBulkIds.includes(msg.id)) {
            return { ...msg, folder: "deleted" as MessageFolder };
          }
          return msg;
        })
        .filter(
          (msg) =>
            !(selectedBulkIds.includes(msg.id) && currentFolder === "deleted"),
        ),
    );
    setSelectedBulkIds([]);
    setSelectedMessageId(null);
  };

  const handleBulkRestore = () => {
    setMessages((prev) =>
      prev.map((msg) =>
        selectedBulkIds.includes(msg.id)
          ? { ...msg, folder: "inbox" as MessageFolder }
          : msg,
      ),
    );
    setSelectedBulkIds([]);
    setSelectedMessageId(null);
  };

  const handleTriggerReplySubmit = (text: string) => {
    if (!selectedMessageId) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === selectedMessageId
          ? {
              ...msg,
              folder: "replied" as MessageFolder,
              replyPayload: { body: text, timestamp: "Today, Just Now" },
            }
          : msg,
      ),
    );
    setIsReplying(false);
    setCurrentFolder("replied");
  };

  const totalMessagesCount = messages.filter(
    (m) => m.folder === "inbox",
  ).length;
  const unreadMessagesCount = messages.filter(
    (m) => m.isUnread && m.folder === "inbox",
  ).length;
  const notificationCount = messages.filter(
    (m) => m.type === "bank" && m.isUnread && m.folder === "inbox",
  ).length;

  const tabCounts = useMemo(
    () => ({
      all: folderMessages.length,
      bank: folderMessages.filter((m) => m.type === "bank").length,
      friend: folderMessages.filter((m) => m.type === "friend").length,
    }),
    [folderMessages],
  );

  const currentMessage = useMemo(() => {
    return messages.find((m) => m.id === selectedMessageId) || null;
  }, [selectedMessageId, messages]);

  return (
    /* ECONOMISIRE SPAȚIU: Schimbat din p-2 md:p-4 în px-1.5 py-2 pentru zero irosire de spațiu pe laterale */
    <div className="px-1.5 py-2 space-y-3 h-[calc(100vh-50px)] flex flex-col bg-[#02050e] text-white overflow-hidden w-full antialiased">
      {/* HEADER CONTROLS */}
      <div
        className={`${selectedMessageId ? "hidden lg:block" : "block"} flex-shrink-0`}
      >
        <PageHeader systemDate="30 May 2026" statusText="Secure Node Connected">
          <div className="flex flex-wrap items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-white/[0.02] backdrop-blur-md w-full sm:w-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-zinc-400 font-bold">
              <Layers size={14} className="text-zinc-500" />
              <span>
                ALL INBOX:{" "}
                <span className="text-zinc-200 font-black">
                  {totalMessagesCount}
                </span>
              </span>
            </div>
            <div className="hidden sm:block h-3 w-[1px] bg-white/[0.05]" />
            <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-blue-400 bg-blue-950/30 rounded-lg border border-blue-500/10">
              <Mail size={14} />
              <span>
                UNREAD:{" "}
                <span className="text-blue-300 font-black">
                  {unreadMessagesCount}
                </span>
              </span>
            </div>
            <div className="hidden sm:block h-3 w-[1px] bg-white/[0.05]" />
            <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-amber-400 bg-amber-950/10 rounded-lg">
              <Bell size={14} className="text-amber-500" />
              <span>
                NOTIFICATIONS:{" "}
                <span className="text-amber-300 font-bold">
                  {notificationCount}
                </span>
              </span>
            </div>
          </div>
        </PageHeader>
      </div>

      {/* OUTLOOK TOOLBAR - COMPACT, FĂRĂ BORDER ALB SÂCÂITOR */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-zinc-950/40 p-1.5 border border-white/[0.02] rounded-xl flex-shrink-0 backdrop-blur-md">
        {/* SWITCHER FOLDERE FLUID */}
        <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-white/[0.01]">
          <button
            onClick={() => {
              setCurrentFolder("inbox");
              setSelectedBulkIds([]);
              setSelectedMessageId(null);
            }}
            className={`cursor-pointer flex items-center gap-2 h-7 px-3.5 font-mono text-[11px] font-bold rounded-md uppercase tracking-wider transition-all duration-200 border ${
              currentFolder === "inbox"
                ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/10"
                : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >
            <Inbox size={12} />
            Secure Inbox
          </button>

          <button
            onClick={() => {
              setCurrentFolder("replied");
              setSelectedBulkIds([]);
              setSelectedMessageId(null);
            }}
            className={`cursor-pointer flex items-center gap-2 h-7 px-3.5 font-mono text-[11px] font-bold rounded-md uppercase tracking-wider transition-all duration-200 border ${
              currentFolder === "replied"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/10"
                : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >
            <Mail size={12} />
            Replied Streams
          </button>

          <button
            onClick={() => {
              setCurrentFolder("deleted");
              setSelectedBulkIds([]);
              setSelectedMessageId(null);
            }}
            className={`cursor-pointer flex items-center gap-2 h-7 px-3.5 font-mono text-[11px] font-bold rounded-md uppercase tracking-wider transition-all duration-200 border ${
              currentFolder === "deleted"
                ? "bg-rose-950/60 text-rose-400 border-rose-500/20 shadow-md shadow-rose-950/10"
                : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >
            <Trash2 size={12} />
            Trash Bin
          </button>
        </div>

        {/* CONTROALE DINAMICE CU ELEMENTE DE CULOARE ȘI IDENTIFICARE RAPIDĂ */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-h-[28px]">
          {filteredMessages.length > 0 && (
            <button
              onClick={handleSelectAllToggle}
              className={`cursor-pointer flex items-center gap-1.5 h-7 px-3 rounded-lg font-mono text-[10px] uppercase font-black border transition-all duration-150 whitespace-nowrap ${
                selectedBulkIds.length > 0
                  ? "bg-cyan-950/50 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                  : "bg-zinc-900/60 border-white/[0.04] text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {selectedBulkIds.length > 0 ? (
                <CheckSquare size={12} />
              ) : (
                <Square size={12} />
              )}
              <span>{selectButtonText}</span>
            </button>
          )}

          {selectedBulkIds.length > 0 && (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1 duration-150">
              {/* CULOARE PURPLE/AMBER PENTRU CITIT/NECITIT */}
              {currentFolder !== "deleted" && (
                <button
                  onClick={handleBulkMarkReadToggle}
                  className={`cursor-pointer flex items-center gap-1.5 h-7 px-3 rounded-lg font-mono text-[10px] font-black uppercase border transition-all whitespace-nowrap ${
                    isSelectedUnread
                      ? "bg-amber-950/50 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                      : "bg-indigo-950/50 border-indigo-500/40 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                  }`}
                >
                  {isSelectedUnread ? (
                    <Check size={12} />
                  ) : (
                    <EyeOff size={12} />
                  )}
                  <span>{readButtonText}</span>
                </button>
              )}

              {currentFolder === "deleted" && (
                <button
                  onClick={handleBulkRestore}
                  className="cursor-pointer flex items-center gap-1.5 h-7 px-3 rounded-lg font-mono text-[10px] font-black uppercase bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40 transition whitespace-nowrap shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                >
                  <ArchiveRestore size={12} />
                  Restore
                </button>
              )}

              {/* DYNAMIC TEXT SYSTEM (Delete vs Delete All) CU VARIANTĂ ROȘU ELECTRIC */}
              <button
                onClick={handleBulkDelete}
                className="cursor-pointer flex items-center gap-1.5 h-7 px-3 rounded-lg font-mono text-[10px] font-black uppercase bg-rose-950/50 border border-rose-500/40 text-rose-400 hover:bg-rose-900/40 transition-all duration-150 whitespace-nowrap shadow-[0_0_10px_rgba(244,63,94,0.15)]"
              >
                <Trash2 size={12} />
                <span>
                  {currentFolder === "deleted"
                    ? selectedBulkIds.length === 1
                      ? "Purge"
                      : "Purge All"
                    : selectedBulkIds.length === 1
                      ? "Delete"
                      : "Delete All"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch flex-1 min-h-0 overflow-hidden">
        {/* LISTA DIN STÂNGA */}
        <div
          className={`lg:col-span-5 flex flex-col gap-2 h-full min-h-0 ${selectedMessageId ? "hidden lg:flex" : "flex"}`}
        >
          <MessageTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            counts={tabCounts}
          />

          <div
            className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 min-h-0
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent 
            [&::-webkit-scrollbar-thumb]:bg-zinc-800 
            hover:[&::-webkit-scrollbar-thumb]:bg-blue-600/30 
            [&::-webkit-scrollbar-thumb]:rounded-md"
          >
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  isActive={message.id === selectedMessageId}
                  isSelected={selectedBulkIds.includes(message.id)}
                  onClick={handleMessageSelect}
                  onToggleSelect={handleToggleSelect}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/[0.02] rounded-xl bg-zinc-950/10 h-full">
                <Inbox size={20} className="text-zinc-700 mb-2" />
                <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">
                  No vectors found in this secure array
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PANOUL DE DETALIU DIN DREAPTA */}
        <div
          className={`lg:col-span-7 h-full min-h-0 ${selectedMessageId ? "block" : "hidden lg:block"}`}
        >
          <MessageDetail
            message={currentMessage}
            isReplying={isReplying}
            setIsReplying={setIsReplying}
            onClose={() => {
              setSelectedMessageId(null);
              setIsReplying(false);
            }}
            onDeleteMessage={handleDeleteSingle}
            onTriggerReplySubmit={handleTriggerReplySubmit}
          />
        </div>
      </div>
    </div>
  );
}
