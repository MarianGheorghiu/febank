"use client";

import { useState, useEffect } from "react";
import { Plus, CreditCard } from "lucide-react";
import PageHeader from "@/app/components/ui/PageHeader";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";

import {
  MOCK_CARDS,
  MOCK_CARD_TRANSACTIONS,
  BankCardData,
  CardAllowedChannels,
  CardTransaction,
} from "@/app/lib/mockCardData";
import BankCard from "@/app/components/ui/cards/BankCard";
import SpendingControls from "@/app/components/ui/cards/SpendingControls";
import TransactionHistory from "@/app/components/ui/cards/TransactionHistory";
import OrderCardModal from "@/app/components/ui/cards/OrderCardModal";
import CardSelector from "@/app/components/ui/cards/CardSelector";
import SpendingAnalyticsMatrix from "@/app/components/ui/cards/SpendingAnalyticsMatrix";

export default function CardsPage() {
  const [cards, setCards] = useState<BankCardData[]>(MOCK_CARDS);
  const [selectedCardId, setSelectedCardId] = useState<string>(
    MOCK_CARDS[0].id,
  );
  const [transactions, setTransactions] = useState<CardTransaction[]>(
    MOCK_CARD_TRANSACTIONS,
  );
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isTxLoading, setIsTxLoading] = useState(false);

  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  useEffect(() => {
    setIsTxLoading(true);
    const timer = setTimeout(() => setIsTxLoading(false), 150);
    return () => clearTimeout(timer);
  }, [selectedCardId]);

  const currentCardTransactions = transactions.filter(
    (tx) => tx.cardId === activeCard.id,
  );

  const handleToggleFreeze = (id: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "frozen" ? "active" : "frozen" }
          : c,
      ),
    );
  };

  const handleUpdateLimit = (id: string, newLimit: number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, monthlyLimit: newLimit } : c)),
    );
  };

  const handleToggleChannel = (
    id: string,
    channel: keyof CardAllowedChannels,
  ) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              allowedChannels: {
                ...c.allowedChannels,
                [channel]: !c.allowedChannels[channel],
              },
            }
          : c,
      ),
    );
  };

  const handleDeleteTransactions = (idsToDelete: string[]) => {
    setTransactions((prev) =>
      prev.filter((tx) => !idsToDelete.includes(tx.id)),
    );
  };

  const handleDeleteAllTransactions = () => {
    setTransactions((prev) => prev.filter((tx) => tx.cardId !== activeCard.id));
  };

  const handleConfirmOrder = (newCardPayload: Partial<BankCardData>) => {
    const generatedCard: BankCardData = {
      id: `card-${Date.now()}`,
      type: newCardPayload.type || "virtual",
      status: "active",
      holderName: "NETRUNNER #0412",
      pan: `4242 1337 9999 ${Math.floor(1000 + Math.random() * 8999)}`,
      cvv: String(Math.floor(100 + Math.random() * 899)),
      expiry: "12/30",
      colorTheme: newCardPayload.colorTheme || "cyan",
      monthlyLimit: 5000,
      spentThisMonth: 0,
      allowedChannels: {
        atm: true,
        online: true,
        contactless: true,
        international: true,
      },
    };
    setCards((prev) => [...prev, generatedCard]);
    setSelectedCardId(generatedCard.id);
  };

  return (
    <div className="w-full min-h-screen bg-[#010307] text-white antialiased p-3 sm:p-4 flex flex-col gap-3.5 overflow-x-hidden">
      {/* HEADER ZONE - FULLY RESPONSIVE */}
      <div className="w-full shrink-0">
        <PageHeader systemDate="08 Jun 2026" statusText="Cards System Active">
          <div className="grid grid-cols-1 sm:flex sm:flex-row sm:items-center sm:justify-between gap-2.5 mt-3 w-full">
            {/* Left elements aligned layout */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0a1024] rounded-lg text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/10 whitespace-nowrap">
                <CreditCard size={12} />
                <span>CARDS CORE MATRIX v1.2</span>
              </div>

              <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0a1024] rounded-lg text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/10 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  ONLINE UNITS:{" "}
                  <span className="text-white font-black">{cards.length}</span>
                </span>
              </div>
            </div>

            {/* CTA action wrapper safe wrapping */}
            <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
              <ActionButton
                variant="cyan"
                icon={<Plus size={14} />}
                onClick={() => setIsOrderModalOpen(true)}
              >
                CREATE NEW CARD
              </ActionButton>
            </div>
          </div>
        </PageHeader>
      </div>

      {/* CORE CONTROL BAR */}
      <div className="relative z-30 bg-[#0a1024] border border-cyan-500/20 sm:backdrop-blur-xl rounded-xl p-4 transition-all duration-300 group hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)] w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="w-full md:w-auto">
          <CardSelector
            cards={cards}
            selectedCardId={selectedCardId}
            onSelect={setSelectedCardId}
          />
        </div>

        <div className="flex gap-5 font-mono text-xs items-center bg-black/30 px-4 py-2 rounded-lg border border-white/[0.01] self-stretch md:self-auto justify-around md:justify-start">
          <div>
            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">
              Hardware Type
            </span>
            <span className="font-bold text-white uppercase">
              {activeCard.type}
            </span>
          </div>
          <div className="w-[1px] h-6 bg-zinc-800" />
          <div>
            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">
              Allocated Limit
            </span>
            <span className="font-bold text-cyan-400">
              ${activeCard.monthlyLimit.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>

      {/* RESPONSIVE GRID */}
      <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-5 flex flex-col gap-4 w-full">
          <BankCard card={activeCard} onToggleFreeze={handleToggleFreeze} />
          <SpendingControls
            card={activeCard}
            onUpdateLimit={handleUpdateLimit}
            onToggleChannel={handleToggleChannel}
          />
        </div>

        <div className="lg:col-span-7 w-full">
          <TransactionHistory
            transactions={currentCardTransactions}
            isLoading={isTxLoading}
            onDeleteSelected={handleDeleteTransactions}
            onDeleteAll={handleDeleteAllTransactions}
          />
        </div>
      </div>
      {/* INTEGRAT CORECT SUB ISTORIC, PRELUÂND PARAMETRII DIN CARDUL SELECTIONAT */}
      <SpendingAnalyticsMatrix
        spentThisMonth={activeCard.spentThisMonth}
        monthlyLimit={activeCard.monthlyLimit}
      />

      <OrderCardModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onConfirmOrder={handleConfirmOrder}
      />
    </div>
  );
}
