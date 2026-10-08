"use client";
import TradeOrderDialog, { type TradeAsset } from "@/app/components/ui/markets/TradeOrderDialog";
export type TradeType = "BUY" | "SELL" | "SWAP" | null;
export default function CryptoActionModal({ isOpen, onClose, type, asset }: { isOpen: boolean; onClose: () => void; type: TradeType; asset: TradeAsset | null }) {
  return isOpen && type && asset ? <TradeOrderDialog key={`${type}-${asset.symbol}`} symbol={asset.symbol} side={type} onClose={onClose} /> : null;
}
