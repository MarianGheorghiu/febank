"use client";
import TradeOrderDialog, { type TradeAsset } from "@/app/components/ui/markets/TradeOrderDialog";
export default function StockActionModal({ isOpen, onClose, type, stock }: { isOpen: boolean; onClose: () => void; type: "BUY" | "SELL" | null; stock: TradeAsset | null }) {
  return isOpen && type && stock ? <TradeOrderDialog key={`${type}-${stock.symbol}`} symbol={stock.symbol} side={type} onClose={onClose} /> : null;
}
