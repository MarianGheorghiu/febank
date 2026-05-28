"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Users,
  Landmark,
  Wallet,
  Check,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  MessageSquare,
  Clock,
} from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";

// Structura mock-data pentru sistemul de mesaje mbank (Context temporal: Anul 2026)
const INITIAL_NOTIFICATIONS = [
  // --- NOTIFICĂRI INSTITUȚIONALE (BANCA) ---
  {
    id: "b1",
    type: "bank_security",
    category: "institutional",
    title: "New Terminal Authorization",
    description:
      "A new secure login session was detected from an unrecognized IP address in Frankfurt, DE. If this wasn't you, freeze your credentials immediately.",
    timestamp: "Today, 19:42",
    isUnread: true,
    severity: "high",
  },
  {
    id: "b2",
    type: "bank_loan",
    category: "institutional",
    title: "Premium Credit Line Approved",
    description:
      "Congratulations! Your instant capital request has been verified. A pre-approved credit line of $25,000.00 USD is ready for activation at a premium 3.12% fixed APY.",
    timestamp: "Today, 14:10",
    isUnread: true,
    severity: "promo",
  },
  {
    id: "b3",
    type: "bank_compliance",
    category: "institutional",
    title: "Identity Encryption Renewal (KYC)",
    description:
      "According to institutional European banking regulations, your secure identity encryption key expires in 6 days. Please re-verify your ID document.",
    timestamp: "Yesterday",
    isUnread: false,
    severity: "medium",
    actionRequired: { label: "Renew Encryption", type: "kyc" },
  },

  // --- NOTIFICĂRI SOCIALE (PRIETENI) ---
  {
    id: "s1",
    type: "social_request",
    category: "social",
    sender: "Matei Dan",
    title: "Split Bill Request",
    description:
      "Matei Dan requested $24.50 USD for 'Private Dinner & Drinks'.",
    timestamp: "Today, 21:05",
    isUnread: true,
    amount: "$24.50",
    actionRequired: { label: "Approve Payment", type: "p2p_pay" },
  },
  {
    id: "s2",
    type: "social_transfer",
    category: "social",
    sender: "Elena Roșu",
    title: "Funds Received",
    description:
      "Elena Roșu sent you $120.00 USD with the encrypted note: 'Thanks for the crypto tips! 🚀'",
    timestamp: "Today, 11:15",
    isUnread: false,
    amount: "$120.00",
  },
  {
    id: "s3",
    type: "social_invite",
    category: "social",
    sender: "Andrei Vlad",
    title: "Friend Request",
    description:
      "Andrei Vlad (Client Code: MB-4410-Y) wants to link accounts for instant zero-fee transfers.",
    timestamp: "3 days ago",
    isUnread: false,
    actionRequired: { label: "Accept Connection", type: "friend_accept" },
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<
    "all" | "institutional" | "social"
  >("all");

  // Filtrarea mesajelor în funcție de tab-ul ales
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.category === activeTab;
  });

  // Marcare mesaj ca citit
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n)),
    );
  };

  // Ștergere / Arhivare mesaj
  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Communication Hub
          </h1>
          <p className="text-xs text-zinc-400 tracking-wide mt-1">
            Secure Ledger Messages • Decrypted Institutional & P2P Feed
          </p>
        </div>

        {/* CONTOR NOTIFICĂRI NE CITITE */}
        <div className="flex gap-2 shrink-0">
          <span className="text-[10px] font-black bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-xl uppercase tracking-wider">
            {
              notifications.filter(
                (n) => n.category === "institutional" && n.isUnread,
              ).length
            }{" "}
            Bank Alerts
          </span>
          <span className="text-[10px] font-black bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-1.5 rounded-xl uppercase tracking-wider">
            {
              notifications.filter((n) => n.category === "social" && n.isUnread)
                .length
            }{" "}
            Social Prompts
          </span>
        </div>
      </div>

      {/* FILTRE PREMIUM (TABS) */}
      <div className="flex p-1 bg-black/40 border border-white/[0.06] rounded-xl max-w-md">
        {(["all", "institutional", "social"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-white/[0.07] text-white border border-white/[0.1] shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab === "all" ? "All Feeds" : tab}
          </button>
        ))}
      </div>

      {/* FEED DE NOTIFICĂRI */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <GlassCard className="!p-12 text-center border-dashed border-white/10">
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">
              Terminal Secure Base is Silent. No active messages.
            </p>
          </GlassCard>
        ) : (
          filteredNotifications.map((item) => {
            const isBank = item.category === "institutional";

            return (
              <GlassCard
                key={item.id}
                className={`!p-5 sm:!p-6 transition-all border-l-4 ${
                  item.isUnread
                    ? isBank
                      ? "border-l-cyan-400 bg-cyan-500/[0.02]"
                      : "border-l-purple-400 bg-purple-500/[0.02]"
                    : "border-l-zinc-700 bg-transparent"
                } ${item.severity === "high" ? "border-l-red-500 bg-red-500/[0.01]" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Iconiță stânga bazată pe tip */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 hidden sm:block ${
                        isBank
                          ? item.severity === "high"
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                          : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                      }`}
                    >
                      {isBank ? (
                        item.type === "bank_security" ? (
                          <ShieldAlert size={18} />
                        ) : (
                          <Landmark size={18} />
                        )
                      ) : item.type === "social_request" ? (
                        <Wallet size={18} />
                      ) : (
                        <MessageSquare size={18} />
                      )}
                    </div>

                    {/* Text Conținut */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-white uppercase tracking-wide truncate">
                          {item.title}
                        </h3>
                        {item.isUnread && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isBank ? "bg-cyan-400 animate-pulse" : "bg-purple-400 animate-pulse"}`}
                          />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-4xl font-medium">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {item.timestamp}
                        </span>
                        <span>•</span>
                        <span className="uppercase font-bold text-zinc-400">
                          {isBank
                            ? "System Gate"
                            : `P2P Network (${item.sender})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buton Dismiss dreapta */}
                  <button
                    onClick={() => dismissNotification(item.id)}
                    className="p-1 text-zinc-500 hover:text-white rounded-md hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
                    title="Dismiss message"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* ZONA DE ACȚIUNI DINAMICE (Dacă notificarea cere intervenție) */}
                {item.actionRequired && (
                  <div className="mt-4 pt-4 border-t border-white/[0.04] flex flex-wrap gap-2 justify-end">
                    {item.isUnread && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="px-3 py-1.5 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300 hover:text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}

                    {/* Butoane Contextuale Premium */}
                    {item.actionRequired.type === "p2p_pay" ? (
                      <>
                        <button
                          onClick={() => dismissNotification(item.id)}
                          className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <X size={12} /> Decline
                        </button>
                        <button
                          onClick={() =>
                            alert(`Plată efectuată: ${item.amount}`)
                          }
                          className="px-4 py-1.5 bg-purple-500 text-white hover:bg-purple-600 text-[11px] font-black uppercase tracking-wider rounded-lg shadow-[0_4px_10px_rgba(168,85,247,0.3)] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check size={12} /> Pay {item.amount}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          alert(`Rulare modul: ${item.actionRequired?.type}`)
                        }
                        className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          isBank
                            ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_4px_10px_rgba(34,211,238,0.3)]"
                            : "bg-purple-500 text-white hover:bg-purple-600"
                        }`}
                      >
                        {item.actionRequired.label}
                      </button>
                    )}
                  </div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
