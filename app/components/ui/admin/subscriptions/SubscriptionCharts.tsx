"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Subscription, SubscriptionInvoice, SubscriptionPlan } from "@/app/lib/types/admin/subscriptions";
import { money } from "@/app/lib/subscriptions/engine";
import { AuditPanel } from "../audit/presentation";
import PlanDistribution from "./PlanDistribution";
const tooltip = { contentStyle: { backgroundColor: "#03091e", border: "1px solid #155e75", borderRadius: 8, fontSize: 11 }, itemStyle: { color: "#e2e8f0" }, labelStyle: { color: "#67e8f9" } };
export default function SubscriptionCharts({ subscriptions, invoices, plans }: { subscriptions: Subscription[]; invoices: SubscriptionInvoice[]; plans: SubscriptionPlan[] }) {
  const months = [...new Set(invoices.map(i => i.issued_at.slice(0, 7)))].sort();
  const series = months.map(month => ({ month, paid: invoices.filter(i => i.issued_at.startsWith(month) && i.status === "PAID").reduce((n, i) => n + i.amount_minor / 100, 0), unpaid: invoices.filter(i => i.issued_at.startsWith(month) && i.status !== "PAID").reduce((n, i) => n + i.amount_minor / 100, 0) }));
  return <div className="grid gap-4 xl:grid-cols-2"><AuditPanel title="Billing performance" subtitle="EUR by invoice issue month, under the current customer filters. Paid totals are collections against those invoices; this is not recognized revenue.">
    <div className="h-64 min-w-0 p-3"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 232 }}><BarChart data={series} accessibilityLayer><CartesianGrid stroke="#164e63" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }}/><YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={45}/><Tooltip {...tooltip}/><Bar dataKey="paid" name="Paid EUR" stackId="billing" fill="#22d3ee" isAnimationActive={false}/><Bar dataKey="unpaid" name="Unpaid EUR" stackId="billing" fill="#fb7185" isAnimationActive={false}/></BarChart></ResponsiveContainer></div>
    <details className="border-t border-cyan-500/15 p-3 text-[10px] text-slate-400"><summary className="cursor-pointer text-cyan-300">View billing data</summary><table className="mt-3 w-full text-left"><thead><tr><th>Issue month</th><th>Paid</th><th>Unpaid</th></tr></thead><tbody>{series.map(s => <tr key={s.month}><td className="py-2">{s.month}</td><td>{money(Math.round(s.paid * 100))}</td><td>{money(Math.round(s.unpaid * 100))}</td></tr>)}</tbody></table>{!series.length && <p className="py-4">No invoices in this scope.</p>}</details>
  </AuditPanel><PlanDistribution subscriptions={subscriptions} plans={plans}/></div>;
}
