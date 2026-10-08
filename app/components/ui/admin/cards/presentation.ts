import type { CardAction, IssuedCardStatus } from "@/app/lib/types/admin/card-issuing";

export const cardStatusStyles: Record<IssuedCardStatus, string> = {
  ACTIVE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  PENDING: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  FROZEN: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  BLOCKED: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  TERMINATED: "border-slate-600/40 bg-slate-800/40 text-slate-400",
};
export const cardActionLabels: Record<CardAction, string> = {
  ACTIVATE: "Activate card", FREEZE: "Freeze card", UNFREEZE: "Unfreeze card",
  BLOCK: "Block permanently", TERMINATE: "Close card", REPLACE: "Replace card",
  DISPATCH: "Mark dispatched", DELIVER: "Confirm delivery", UPDATE_CONTROLS: "Edit limits & controls",
};
export const actionDescriptions: Record<CardAction, string> = {
  ACTIVATE: "Enable payments for this customer's card. Activation requires an eligible customer and, for physical cards, confirmed delivery.",
  FREEZE: "Temporarily suspend new payments. The card can be unfrozen after the investigation is resolved.",
  UNFREEZE: "Restore payment authorization under the existing limits and channel restrictions.",
  BLOCK: "Permanently block this card for suspected compromise or loss. It cannot be reactivated; issue a replacement when appropriate.",
  TERMINATE: "Permanently close this card. It cannot be reactivated. The customer account and other cards remain available; historical records are retained.",
  REPLACE: "Immediately close the original card and create a new pending card for the same customer, currency and network. Existing limits and channel restrictions are preserved. The replacement requires activation.",
  DISPATCH: "Record the carrier tracking reference for the physical card sent to the customer's verified address.",
  DELIVER: "Record confirmed delivery to the customer. This does not activate the card automatically.",
  UPDATE_CONTROLS: "Update this customer's spending limits and allowed payment channels. Limits cannot be lower than recorded spending.",
};
export const panelClass = "rounded-xl border border-cyan-500/30 bg-gradient-to-br from-[#020617] to-[#040e29] overflow-hidden";
export const inputClass = "w-full min-w-0 rounded-lg border border-cyan-500/40 bg-[#03091e] px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50";
export const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-[11px] font-bold text-cyan-300 transition hover:bg-cyan-500/20 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer";
export const primaryButtonClass = buttonClass.replace("bg-cyan-500/10", "bg-cyan-400").replace("text-cyan-300", "text-slate-950").replace("hover:bg-cyan-500/20", "hover:bg-cyan-300");
export const dangerButtonClass = buttonClass.replaceAll("cyan", "rose");
export function formatCardMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}
export function formatCardDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(new Date(value));
}
