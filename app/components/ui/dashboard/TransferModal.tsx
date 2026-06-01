// app/components/ui/TransferModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Loader2,
  Landmark,
  Phone,
} from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw" | "transfer" | null;
}

export default function TransferModal({
  isOpen,
  onClose,
  type,
}: TransferModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Stări specifice pentru modulul de TRANSFER
  const [transferType, setTransferType] = useState<"iban" | "phone">("iban");
  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientData, setRecipientData] = useState<string>(""); // Va ține fie IBAN-ul, fie Nr de Telefon

  const mockBalance = 48250.75;
  const quickAmounts = [50, 100, 500, 1000];

  // Resetăm toate stările la închidere/deschidere
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setRecipientName("");
      setRecipientData("");
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Blocăm scroll-ul pe fundal
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !type) return null;

  // Helpers pentru a identifica modul curent
  const isDeposit = type === "deposit";
  const isWithdraw = type === "withdraw";
  const isTransfer = type === "transfer";

  // Configurație dinamică de stil în funcție de tipul modalului
  const config = {
    deposit: {
      title: "Deposit Core",
      subtitle: "GATEWAY V2.4 // INSTANT",
      icon: <ArrowUpRight size={18} />,
      iconClass: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
      focusClass:
        "border-blue-500/20 focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
      btnClass:
        "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_4px_20px_rgba(6,182,212,0.25)]",
      label: "CONFIRM DEPOSIT",
    },
    withdraw: {
      title: "Withdraw Secure",
      subtitle: "GATEWAY V2.4 // INSTANT",
      icon: <ArrowDownLeft size={18} />,
      iconClass: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      focusClass:
        "border-blue-500/20 focus:border-rose-500/50 focus:shadow-[0_0_20px_rgba(244,63,94,0.15)]",
      btnClass:
        "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-[0_4px_20px_rgba(244,63,94,0.25)]",
      label: "CONFIRM WITHDRAWAL",
    },
    transfer: {
      title: "Fast Transfer",
      subtitle: "LEDGER P2P // SECURE",
      icon: <ArrowLeftRight size={18} />,
      // Fundal subtil dar text intens aprins
      iconClass: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      // Glow violet puternic la focus pe input
      focusClass:
        "border-purple-500/20 focus:border-purple-400/50 focus:shadow-[0_0_25px_rgba(168,85,247,0.2)]",
      // Gradient premium de la Purple la Indigo cu umbră intensă
      btnClass:
        "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-[0_4px_25px_rgba(168,85,247,0.3)]",
      label: "INITIATE TRANSFER",
    },
  }[type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300">
      {/* BACKDROP CLOUD GLASS */}
      <div
        className="absolute inset-0 bg-[#020617]/70 backdrop-blur-xl transition-all duration-300 cursor-pointer"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* LIQUID GLASS MODAL BOX */}
      <div
        className={`
        relative w-full sm:max-w-md 
        bg-gradient-to-b from-[#0b1536]/80 to-[#040819]/95 
        border-t sm:border border-blue-500/20 sm:border-white/10
        rounded-t-[24px] sm:rounded-2xl 
        p-6 sm:p-8
        shadow-[0_0_50px_rgba(30,58,138,0.25)] 
        backdrop-blur-2xl
        transition-all transform duration-300 ease-out
        z-10 max-h-[92vh] overflow-y-auto
        animate-in slide-in-from-bottom sm:zoom-in-95
      `}
      >
        {/* Mobile Handle */}
        <div className="w-12 h-1 bg-blue-500/20 rounded-full mx-auto mb-6 sm:hidden" />

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${config.iconClass}`}>
              {config.icon}
            </div>
            <div>
              <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase">
                {config.title}
              </h3>
              <p className="text-[10px] text-blue-400/60 font-mono tracking-wide">
                {config.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BALANCE BOX */}
        <div className="mb-6 bg-[#070d24]/60 border border-blue-500/10 rounded-xl p-4 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <Wallet size={16} className="text-blue-400" />
            <span className="text-[11px] font-bold font-mono text-slate-400 tracking-wider">
              AVAILABLE BALANCE
            </span>
          </div>
          <span className="text-sm font-black font-mono text-blue-400 tracking-wide">
            ${mockBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* DYNAMIC FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* CÂMPURI SUPLIMENTARE PENTRU TRANSFER */}
          {isTransfer && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Recipient Name */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-2">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  disabled={isProcessing}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="JOHN DOE"
                  className={`w-full bg-[#030712]/80 border rounded-xl px-4 py-3 text-xs font-mono font-bold text-white placeholder-slate-700 focus:outline-none transition-all duration-300 ${config.focusClass}`}
                />
              </div>

              {/* Tab Switcher pentru metodă transfer */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-2">
                  Transfer Method
                </label>

                {/* Containerul principal - acum are clasa "isolate" ca fundalul să nu acopere textul */}
                <div className="relative grid grid-cols-2 p-1 bg-[#030712]/60 border border-blue-500/10 rounded-xl isolate">
                  {/* PASTILA MAGNETICĂ (EFECTUL DE GLIDE) */}
                  <div
                    className={`
        absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] 
        bg-purple-500/20 border border-purple-500/30 rounded-lg 
        transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) -z-10
        ${transferType === "iban" ? "translate-x-0" : "translate-x-full"}
      `}
                  />

                  {/* BUTON 1: BANK IBAN */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setTransferType("iban");
                      setRecipientData("");
                    }}
                    className={`
        flex items-center justify-center gap-2 py-2.5 text-[10px] font-mono font-bold 
        transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed
        ${transferType === "iban" ? "text-white" : "text-slate-400 hover:text-slate-200"}
      `}
                  >
                    <Landmark size={12} /> BANK IBAN
                  </button>

                  {/* BUTON 2: PHONE NUMBER */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setTransferType("phone");
                      setRecipientData("");
                    }}
                    className={`
        flex items-center justify-center gap-2 py-2.5 text-[10px] font-mono font-bold 
        transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed
        ${transferType === "phone" ? "text-white" : "text-slate-400 hover:text-slate-200"}
      `}
                  >
                    <Phone size={12} /> PHONE NUMBER
                  </button>
                </div>
              </div>

              {/* Recipient Account Data (IBAN / Phone) */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-2">
                  {transferType === "iban"
                    ? "Recipient IBAN Account"
                    : "Recipient Phone Number"}
                </label>
                <input
                  type={transferType === "iban" ? "text" : "tel"}
                  required
                  disabled={isProcessing}
                  value={recipientData}
                  onChange={(e) => setRecipientData(e.target.value)}
                  placeholder={
                    transferType === "iban"
                      ? "RO00XAAA0000000000000000"
                      : "+40 7xx xxx xxx"
                  }
                  className={`w-full bg-[#030712]/80 border rounded-xl px-4 py-3 text-xs font-mono font-bold text-white placeholder-slate-700 focus:outline-none transition-all duration-300 ${config.focusClass}`}
                />
              </div>
            </div>
          )}

          {/* INPUT SUMĂ (Universal) */}
          <div className="relative group">
            <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-2">
              Specify Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-mono font-black text-slate-500 group-focus-within:text-blue-400 transition-colors">
                $
              </span>
              <input
                type="number"
                required
                disabled={isProcessing}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="any"
                className={`w-full bg-[#030712]/80 border rounded-xl pl-9 pr-4 py-3.5 text-xl font-mono font-bold text-white placeholder-slate-700 focus:outline-none transition-all duration-300 ${config.focusClass}`}
              />
            </div>
          </div>

          {/* CHIPS DE SELECTIE RAPIDĂ (Afișate corect cu + sau - în funcție de sensul banilor, ascunse la Transfer pentru spațiu mobil) */}
          {!isTransfer && (
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((qAmount) => (
                <button
                  key={qAmount}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setAmount(qAmount.toString())}
                  className="py-2 px-1 text-center bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/10 hover:border-blue-400/30 text-[11px] font-mono font-bold text-slate-300 rounded-lg transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isDeposit ? "+" : "-"}
                  {qAmount}
                </button>
              ))}
            </div>
          )}

          <div className="h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent my-1" />

          {/* BUTTON PRINCIPAL */}
          <button
            type="submit"
            disabled={
              isProcessing ||
              !amount ||
              parseFloat(amount) <= 0 ||
              (isTransfer && (!recipientName || !recipientData))
            }
            className={`
              relative w-full py-4 rounded-xl 
              font-mono font-black text-xs tracking-widest uppercase text-white
              transition-all duration-300 active:scale-[0.99]
              disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer
              ${config.btnClass}
            `}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                PROCESSING SECURITY LEDGER...
              </span>
            ) : (
              <span>{config.label}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
