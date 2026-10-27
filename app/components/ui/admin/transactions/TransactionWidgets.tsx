"use client";
import { Activity, Clock3, ShieldAlert, Wallet } from "lucide-react";
import MetricCard from "../../MetricCard";
import type { TransactionSummary } from "@/app/lib/transactions/contracts";
import { money } from "./presentation";
export default function TransactionWidgets({ summary, customers }: { summary: TransactionSummary; customers: number }) {
  return <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <MetricCard title="Global transactions" value={summary.total_count.toLocaleString()} icon={Activity} tone="cyan" subtext={`${customers} observed customers · ${summary.completed_count} completed`} />
    <MetricCard title="Settlement queue" value={summary.pending_count + summary.processing_count + summary.held_count} icon={Clock3} tone="blue" subtext={`${summary.pending_count} pending · ${summary.processing_count} processing · ${money(summary.queued_usd)}`} />
    <MetricCard title="Review & exceptions" value={summary.held_count} icon={ShieldAlert} tone="amber" subtext={`${summary.rejected_count} rejected · ${summary.cancelled_count} cancelled · hold retains funds`} />
    <MetricCard title="Completed value · 24h" value={money(summary.completed_24h_usd)} icon={Wallet} tone="purple" subtext={`${money(summary.fees_24h_usd)} settled fees · USD equivalent`} />
  </div>;
}
