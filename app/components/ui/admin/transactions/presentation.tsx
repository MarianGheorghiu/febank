import type { TransactionStatus } from "@/app/lib/transactions/contracts";
export const txInput = "w-full min-w-0 min-h-11 rounded-xl border border-white/10 bg-[#080f20] px-3 text-xs text-slate-200 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30";
export const money = (value: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value));
export const txDate = (value: string) => new Date(value).toLocaleString("en-GB", { timeZone: "Europe/Bucharest", dateStyle: "medium", timeStyle: "short" });
const statuses: Record<TransactionStatus, string> = { PENDING: "border-amber-400/20 bg-amber-400/5 text-amber-200", HELD: "border-rose-400/25 bg-rose-400/10 text-rose-200", PROCESSING: "border-blue-400/20 bg-blue-400/5 text-blue-200", COMPLETED: "border-emerald-400/20 bg-emerald-400/5 text-emerald-200", REJECTED: "border-rose-400/20 bg-rose-400/5 text-rose-200", CANCELLED: "border-slate-400/20 bg-slate-400/5 text-slate-400" };
export function StatusBadge({ status }: { status: TransactionStatus }) { return <span className={`inline-flex shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold ${statuses[status]}`}>{status === "HELD" ? "UNDER REVIEW" : status}</span>; }
export const actionLabels = { HOLD: "Hold for review", RELEASE: "Release review hold", PROCESS: "Start processing", SETTLE: "Confirm settlement", REJECT: "Reject & refund" };
export const actionDescriptions = {
  HOLD: "Retain the reserved amount and fee, and prevent processing or customer cancellation while this transfer is investigated.",
  RELEASE: "Remove the review hold and return this transfer to the pending queue. This does not settle or release reserved funds.",
  PROCESS: "Move this request into processing. Funds remain reserved and customer cancellation is disabled. Current account and risk controls are checked again.",
  SETTLE: "Record a confirmed external settlement and consume this transfer’s reserved amount and fee. The available balance will not be debited a second time. In demo mode, this simulates provider confirmation.",
  REJECT: "Reject this unsettled request and return its reserved amount and fee to the same customer accounts. Other transfers and reservations remain unchanged.",
};
