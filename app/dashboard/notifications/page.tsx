"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/app/components/ui/PageHeader";
import MessageTabs from "@/app/components/ui/MessageTabs";
import MessageCard from "@/app/components/ui/MessageCard";
import MessageDetail from "@/app/components/ui/MessageDetail";
import { Mail, Bell, Layers, Inbox } from "lucide-react";
import { Message } from "@/app/components/ui/types";

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-1",
    type: "bank",
    senderName: "LIQUID CORE SECURITY",
    title: "Quantum Biometric Override Blocked",
    previewText:
      "An unauthorized neural-link handshake was attempted from an unrecognized node in Tokyo. Liquid Shield automatically deployed cryptographic countermeasures. Vault parameters remain nominal.",
    timestamp: "14:32",
    isUnread: true,
  },
  {
    id: "msg-2",
    type: "friend",
    senderName: "Tudor Miron",
    title: "OTC Liquidity Pool Share",
    previewText:
      "Just dropped my part for the commercial real-estate smart contract. Verify the ledger on your end and let me know when you execute the swap.",
    timestamp: "11:15",
    isUnread: true,
    meta: { amount: "+$12,500.00 USDT" },
  },
  {
    id: "msg-3",
    type: "bank",
    senderName: "ASSET ROUTING DEPT",
    title: "Cross-Border Wire Dispatched Successfully",
    previewText:
      "Your corporate routing to London SW1 has cleared compliance. SWIFT-GPT token verification attached to your monthly statement.",
    timestamp: "Yesterday",
    isUnread: false,
    meta: { amount: "-$4,200.00 EUR" },
  },
  {
    id: "msg-4",
    type: "friend",
    senderName: "Elena Rostova",
    title: "P2P Node Access Granted",
    previewText:
      "Hey, I added you as a trusted node in my high-frequency vault. You can now pull short-term micro-loans without protocol validation.",
    timestamp: "28 May",
    isUnread: false,
  },
];

export default function MessageCenter() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState<"all" | "bank" | "friend">("all");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );

  // CLICK ACTION: Scoate starea de unread instantaneu
  const handleMessageSelect = (id: string) => {
    setSelectedMessageId(id);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isUnread: false } : msg)),
    );
  };

  const totalMessages = messages.length;
  const unreadMessages = useMemo(
    () => messages.filter((m) => m.isUnread).length,
    [messages],
  );
  const alertLogs = 3;

  const handleTabChange = (tab: "all" | "bank" | "friend") => {
    setActiveTab(tab);
    setSelectedMessageId(null);
  };

  const filteredMessages = useMemo(() => {
    if (activeTab === "all") return messages;
    return messages.filter((msg) => msg.type === activeTab);
  }, [activeTab, messages]);

  const tabCounts = useMemo(
    () => ({
      all: messages.length,
      bank: messages.filter((m) => m.type === "bank").length,
      friend: messages.filter((m) => m.type === "friend").length,
    }),
    [messages],
  );

  const currentMessage = useMemo(() => {
    return messages.find((m) => m.id === selectedMessageId) || null;
  }, [selectedMessageId, messages]);

  return (
    <div className="p-1 md:p-2 space-y-4 h-[calc(100vh-50px)] flex flex-col bg-[#02050e] text-white overflow-hidden w-full">
      {/* COMPACT TOP BAR */}
      <div
        className={`${selectedMessageId ? "hidden lg:block" : "block"} flex-shrink-0`}
      >
        <PageHeader
          systemDate="30 May 2026"
          statusText="SECURE COMMS CORE ACTIVE"
        >
          <div className="flex flex-wrap items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-white/[0.02] backdrop-blur-md w-full sm:w-auto">
            {/* ETICHETA MODIFICATĂ ÎN ALL MESSAGES */}
            <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-zinc-400 font-bold">
              <Layers size={14} className="text-zinc-500" />
              <span>
                ALL MESSAGES:{" "}
                <span className="text-zinc-200 font-black">
                  {totalMessages}
                </span>
              </span>
            </div>

            <div className="hidden sm:block h-3 w-[1px] bg-white/[0.05]" />

            <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-blue-400 bg-blue-950/30 rounded-lg">
              <Mail size={14} />
              <span>
                UNREAD:{" "}
                <span className="text-blue-300 font-black">
                  {unreadMessages}
                </span>
              </span>
            </div>

            <div className="hidden sm:block h-3 w-[1px] bg-white/[0.05]" />

            <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-purple-400">
              <Bell size={14} />
              <span>
                ALERTS:{" "}
                <span className="text-purple-300 font-bold">{alertLogs}</span>
              </span>
            </div>
          </div>
        </PageHeader>
      </div>

      {/* SPLIT ENGINE CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0 overflow-hidden">
        {/* STÂNGA LISTA */}
        <div
          className={`lg:col-span-5 flex flex-col gap-3 h-full min-h-0 ${selectedMessageId ? "hidden lg:flex" : "flex"}`}
        >
          <MessageTabs
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            counts={tabCounts}
          />

          <div
            className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 min-h-0
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
                  onClick={handleMessageSelect}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/[0.02] rounded-xl bg-zinc-950/10 h-full">
                <Inbox size={20} className="text-zinc-700 mb-2" />
                <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">
                  No signals in channel
                </p>
              </div>
            )}
          </div>
        </div>

        {/* DREAPTA DETALIU */}
        <div
          className={`lg:col-span-7 h-full min-h-0 ${selectedMessageId ? "block" : "hidden lg:block"}`}
        >
          <MessageDetail
            message={currentMessage}
            onClose={() => setSelectedMessageId(null)}
          />
        </div>
      </div>
    </div>
  );
}
