"use client";
import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import SocialDialog from "../friends/SocialDialog";
import ExchangeForm from "../currencies/ExchangeForm";
import { cryptoTradeConfig, type CryptoAction } from "@/app/lib/crypto/presentation";
import type { CurrencyRepository, CurrencySnapshot } from "@/app/lib/currencies/contracts";
export interface CryptoTradeSelection { type: CryptoAction; symbol: string }
export default function CryptoActionModal({ selection, wallet, repository, onClose, onComplete }: { selection: CryptoTradeSelection; wallet: CurrencySnapshot; repository: CurrencyRepository; onClose: () => void; onComplete: (snapshot: CurrencySnapshot) => void }) {
  const [busy, setBusy] = useState(false);
  const config = cryptoTradeConfig(selection.type, wallet, selection.symbol);
  const action = selection.type.toLowerCase() as "buy" | "sell" | "swap";
  const name = wallet.assets.find(asset => asset.symbol === selection.symbol)?.name ?? selection.symbol;
  return <SocialDialog title={`${selection.type === "BUY" ? "Buy" : selection.type === "SELL" ? "Sell" : "Swap"} ${selection.symbol}`} subtitle={name} icon={ArrowRightLeft} busy={busy} onClose={onClose}>
    <ExchangeForm embedded snapshot={wallet} repository={repository} {...config} lockTarget={selection.type === "BUY"} lockSource={selection.type !== "BUY"} action={action} notificationScope="Crypto Terminal" onBusyChange={setBusy} onComplete={snapshot => { onComplete(snapshot); onClose(); }} />
  </SocialDialog>;
}
