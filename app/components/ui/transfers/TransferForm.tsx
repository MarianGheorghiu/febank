// app/components/ui/transfers/TransferForm.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Wallet,
  Landmark,
  Phone,
  Search,
  ChevronDown,
  Check,
  Zap,
  ShieldCheck,
  ArrowLeftRight,
  Loader2,
  FileText,
} from "lucide-react";

// Adăugăm importul din librăria centralizată de mock-uri
import {
  ASSETS_DB,
  type TransferType as TransferCategory,
  type RoutingMethod,
} from "@/app/lib/mockTransfers";

export default function TransferForm() {
  const [category, setCategory] = useState<TransferCategory>("fiat");
  const [method, setMethod] = useState<RoutingMethod>("iban");
  const [selectedAsset, setSelectedAsset] = useState(ASSETS_DB.fiat[0]);

  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientData, setRecipientData] = useState("");
  const [transferDetails, setTransferDetails] = useState("");
  const [transferSpeed, setTransferSpeed] = useState<"instant" | "secured">(
    "instant",
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Resetează starea corect la schimbarea categoriei fără să strice UI-ul
  useEffect(() => {
    if (category === "fiat") {
      setSelectedAsset(ASSETS_DB.fiat[0]);
      setMethod("iban");
    } else if (category === "crypto") {
      setSelectedAsset(ASSETS_DB.crypto[0]);
      setMethod("wallet");
    } else if (category === "stock") {
      setSelectedAsset(ASSETS_DB.stock[0]);
      setMethod("custody");
    }
    setRecipientData("");
    setSearchQuery("");
    setIsDropdownOpen(false); // Închidem dropdown-ul preventiv
  }, [category]);

  const filteredAssets = ASSETS_DB[category].filter(
    (a) =>
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !recipientName || !recipientData) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setAmount("");
      setRecipientName("");
      setRecipientData("");
      setTransferDetails("");
    }, 1500);
  };

  // Clasa de baza pentru inputuri (adaugat cursor-text pentru coerenta)
  const inputClass =
    "w-full h-[42px] bg-[#030718] border border-blue-500/30 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder-blue-300/40 focus:outline-none focus:border-blue-400 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all";
  const labelClass =
    "block text-[11px] font-bold font-mono text-blue-300/80 uppercase tracking-widest mb-1.5";

  return (
    <div className="w-full relative">
      {/* Background Glow - corectat exclusiv pe nuante de albastru */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-2xl blur-xl opacity-40 pointer-events-none" />

      {/* Container Principal */}
      <div className="relative bg-[#0a1024] border border-blue-500/20 sm:backdrop-blur-xl rounded-xl p-4 sm:p-6 shadow-2xl">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-blue-500/10">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Transfer
            </h2>
            <p className="text-[10px] text-blue-400/70 font-mono mt-0.5 uppercase tracking-widest">
              Routing Gateway
            </p>
          </div>

          <div className="flex bg-[#02040f] p-1 border border-blue-500/20 rounded-lg w-full sm:w-auto">
            {[
              { id: "fiat", label: "FIAT", icon: Landmark },
              { id: "crypto", label: "CRYPTO", icon: Wallet },
              { id: "stock", label: "STOCKS", icon: ArrowLeftRight },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id as TransferCategory)}
                className={`flex-1 sm:flex-none py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  category === c.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-blue-400/60 hover:text-blue-200 hover:bg-white/5"
                }`}
              >
                <c.icon size={14} />
                <span className="text-[10px] font-bold font-mono tracking-wider">
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. RECIPIENT NAME */}
          <div>
            <label className={labelClass}>Recipient Name / Entity</label>
            <input
              type="text"
              required
              disabled={isProcessing}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. John Doe"
              className={inputClass}
            />
          </div>

          {/* 2. ASSET & AMOUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative" ref={dropdownRef}>
              <label className={labelClass}>Transfer Asset</label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`${inputClass} flex items-center justify-between cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedAsset.icon}</span>
                  <span className="font-bold text-sm">
                    {selectedAsset.symbol}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className="text-blue-400/70 transition-transform"
                  style={{
                    transform: isDropdownOpen ? "rotate(180deg)" : "none",
                  }}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-[60] top-full mt-2 left-0 w-full bg-[#0a1024] border border-blue-500/40 rounded-lg shadow-2xl overflow-hidden">
                  <div className="p-2 border-b border-blue-500/20">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50"
                      />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search asset..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#030718] text-white text-xs font-mono py-2 pl-9 pr-2 rounded-md outline-none border border-transparent focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-1">
                    {filteredAssets.map((a) => (
                      <button
                        key={a.symbol}
                        type="button"
                        onClick={() => {
                          setSelectedAsset(a);
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-blue-600/20 rounded-md transition-colors cursor-pointer"
                      >
                        <span className="text-sm font-bold text-white font-mono flex items-center gap-2">
                          <span className="text-base">{a.icon}</span> {a.symbol}
                        </span>
                        {selectedAsset.symbol === a.symbol && (
                          <Check size={14} className="text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Amount</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  disabled={isProcessing}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.00001"
                  step="any"
                  className={`${inputClass} pr-14`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-blue-400/70">
                  {selectedAsset.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* 3. ROUTING METHOD & DESTINATION */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-4">
            <div>
              <label className={labelClass}>Method</label>
              <div className="flex bg-[#030718] p-1 border border-blue-500/30 rounded-lg h-[42px]">
                {category === "fiat" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMethod("iban");
                        setRecipientData("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${method === "iban" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:text-blue-200"}`}
                    >
                      <Landmark size={14} /> IBAN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMethod("phone");
                        setRecipientData("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${method === "phone" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:text-blue-200"}`}
                    >
                      <Phone size={14} /> PHONE
                    </button>
                  </>
                )}
                {category === "crypto" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMethod("wallet");
                        setRecipientData("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${method === "wallet" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:text-blue-200"}`}
                    >
                      <Wallet size={14} /> WALLET
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMethod("phone");
                        setRecipientData("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${method === "phone" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:text-blue-200"}`}
                    >
                      <Phone size={14} /> ALIAS
                    </button>
                  </>
                )}
                {category === "stock" && (
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold rounded-md bg-blue-600 text-white cursor-default"
                  >
                    CUSTODY
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {method === "iban"
                  ? "IBAN Account"
                  : method === "wallet"
                    ? "Wallet Address"
                    : method === "phone"
                      ? "Phone Number"
                      : "Vault ID"}
              </label>
              <input
                type={method === "phone" ? "tel" : "text"}
                required
                disabled={isProcessing}
                value={recipientData}
                onChange={(e) => setRecipientData(e.target.value)}
                placeholder={
                  method === "iban"
                    ? "RO00 XXXX ..."
                    : method === "wallet"
                      ? "0x..."
                      : method === "phone"
                        ? "+40 7..."
                        : "DTC-9902"
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* 4. DETAILS & SPEED */}
          <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-4">
            <div>
              <label className={labelClass}>Reference / Details</label>
              <div className="relative">
                <FileText
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50"
                />
                <input
                  type="text"
                  disabled={isProcessing}
                  value={transferDetails}
                  onChange={(e) => setTransferDetails(e.target.value)}
                  placeholder="e.g. Invoice #123"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Transfer Speed</label>
              <div className="flex bg-[#030718] p-1 border border-blue-500/30 rounded-lg h-[42px]">
                <button
                  type="button"
                  onClick={() => setTransferSpeed("instant")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${transferSpeed === "instant" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:text-blue-200"}`}
                >
                  <Zap size={14} />
                  <span className="text-[10px] font-mono font-bold">
                    INSTANT
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransferSpeed("secured")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${transferSpeed === "secured" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:text-blue-200"}`}
                >
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-mono font-bold">
                    SECURE
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. SUBMIT */}
          <button
            type="submit"
            disabled={
              isProcessing || !amount || !recipientName || !recipientData
            }
            className="w-full mt-4 h-[48px] rounded-lg font-mono font-black text-[12px] tracking-widest uppercase text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> AUTHORIZING...
              </>
            ) : (
              "CONFIRM TRANSFER"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
