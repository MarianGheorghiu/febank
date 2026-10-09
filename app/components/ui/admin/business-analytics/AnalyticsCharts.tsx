"use client";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { businessMoney, type BusinessAnalysis } from "@/app/lib/business-analytics/engine";
import { AuditPanel } from "../audit/presentation";
import { channelLabels, costLabels, reportDate } from "./presentation";
const tooltip = { contentStyle: { backgroundColor: "#03091e", border: "1px solid #155e75", borderRadius: 8, fontSize: 11 }, itemStyle: { color: "#e2e8f0" }, labelStyle: { color: "#67e8f9" } };
const tick = { fill: "#94a3b8", fontSize: 9 };
const colors = ["#22d3ee", "#818cf8", "#38bdf8", "#2dd4bf", "#fbbf24", "#fb7185"];
type ChartKind = "FINANCIAL" | "CUSTOMERS" | "COSTS" | "CHANNELS";
const chartTitles: Record<ChartKind, [string, string]> = {
  FINANCIAL: ["Revenue & operating performance", "Net recognized revenue, all operating costs and result before tax. EUR; deposits and transaction notional are excluded."],
  CUSTOMERS: ["Customer acquisition quality", "Registration-date cohorts and how many are now funded, as of the report snapshot. These series overlap; they are not daily funding events."],
  COSTS: ["Where the money goes", "Direct product costs, shared operating expenses and credit provisions. Funding interest is included in direct lending costs."],
  CHANNELS: ["Acquisition by channel", "Registered and funded users in the selected registration cohort. Each customer has one acquisition channel."],
};
export default function AnalyticsCharts({ kind, analysis }: { kind: ChartKind; analysis: BusinessAnalysis }) {
  const financial = kind === "FINANCIAL";
  const moneyChart = financial || kind === "COSTS";
  const trend = analysis.trend.map(row => ({ ...row, label: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${row.from}T00:00:00Z`)) }));
  const costs = Object.entries(analysis.current.costs).map(([key, value]) => ({ name: costLabels[key], amount: value / 100 }));
  const channels = analysis.current.channels.map(row => ({ ...row, name: channelLabels[row.channel] }));
  const horizontal: { name: string; amount?: number; registered?: number; funded?: number }[] = kind === "COSTS" ? costs : channels;
  const dataRows = kind === "COSTS" ? costs.map(c => [c.name, businessMoney(Math.round(c.amount * 100))]) : kind === "CHANNELS" ? channels.map(c => [c.name, `${c.registered} registered / ${c.funded} funded`]) : trend.map(t => [`${t.from} → ${t.to}`, financial ? `${businessMoney(Math.round(t.revenue * 100))} revenue / ${businessMoney(Math.round(t.costs * 100))} costs / ${businessMoney(Math.round(t.result * 100))} result` : `${t.registered} registered / ${t.funded} funded`]);
  return <AuditPanel className="flex h-full flex-col [&>header]:lg:min-h-24" title={chartTitles[kind][0]} subtitle={chartTitles[kind][1]}>
    <div className="h-60 min-w-0 p-3 sm:h-64"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 232 }}>
      {kind === "FINANCIAL" || kind === "CUSTOMERS" ? <ComposedChart data={trend} margin={{ top: 12, right: 8, left: financial ? 0 : -18, bottom: 0 }} accessibilityLayer>
        <defs><linearGradient id={`ba-${kind.toLowerCase()}-gradient`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.28}/><stop offset="100%" stopColor="#22d3ee" stopOpacity={0.01}/></linearGradient></defs>
        <CartesianGrid stroke="#164e63" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tick={tick} tickLine={false} minTickGap={28}/><YAxis tick={tick} width={financial ? 55 : 35} allowDecimals={financial} tickFormatter={financial ? value => businessMoney(Number(value) * 100, true) : undefined} tickLine={false}/>
        <Tooltip {...tooltip} formatter={value => moneyChart ? businessMoney(Number(value) * 100) : Number(value).toLocaleString("en-GB")} labelFormatter={(_, payload) => { const from = payload[0]?.payload?.from; const to = payload[0]?.payload?.to; return from && to ? `${reportDate(from)}${to !== from ? ` → ${reportDate(to)}` : ""} · UTC` : "Period"; }}/>
        <Area type="monotone" dataKey={financial ? "revenue" : "registered"} name={financial ? "Net revenue" : "Registered"} stroke="#22d3ee" fill={`url(#ba-${kind.toLowerCase()}-gradient)`} strokeWidth={2} isAnimationActive={false}/>
        {financial ? <><Line type="monotone" dataKey="costs" name="Costs incl. provisions" stroke="#fb7185" dot={false} strokeWidth={2} isAnimationActive={false}/><Line type="monotone" dataKey="result" name="Operating result" stroke="#818cf8" dot={false} strokeWidth={2} isAnimationActive={false}/></> : <Line type="monotone" dataKey="funded" name="Funded cohort" stroke="#2dd4bf" dot={false} strokeWidth={2} isAnimationActive={false}/>}
      </ComposedChart> : <BarChart data={horizontal} layout="vertical" margin={{ top: 6, right: 12, left: 0, bottom: 0 }} accessibilityLayer><CartesianGrid stroke="#164e63" strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tick={tick} allowDecimals={kind === "COSTS"} tickFormatter={kind === "COSTS" ? value => businessMoney(Number(value) * 100, true) : undefined}/><YAxis type="category" dataKey="name" width={112} tick={tick} tickLine={false}/><Tooltip {...tooltip} cursor={{ fill: "#22d3ee08" }} formatter={value => moneyChart ? businessMoney(Number(value) * 100) : Number(value).toLocaleString("en-GB")}/>{kind === "COSTS" ? <Bar dataKey="amount" name="Cost" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>{costs.map((c, i) => <Cell key={c.name} fill={colors[i]}/>)}</Bar> : <><Bar dataKey="registered" name="Registered" fill="#818cf8" radius={[0, 3, 3, 0]} maxBarSize={14} isAnimationActive={false}/><Bar dataKey="funded" name="Funded" fill="#2dd4bf" radius={[0, 3, 3, 0]} maxBarSize={14} isAnimationActive={false}/></>}</BarChart>}
    </ResponsiveContainer></div>
    <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 pb-3 text-[10px]">{(financial ? [["Net revenue", "#22d3ee"], ["Costs", "#fb7185"], ["Operating result", "#818cf8"]] : kind === "CUSTOMERS" ? [["Registered", "#22d3ee"], ["Funded cohort", "#2dd4bf"]] : kind === "CHANNELS" ? [["Registered", "#818cf8"], ["Funded", "#2dd4bf"]] : [["EUR · selected period", "#94a3b8"]]).map(([label, color]) => <span key={label} style={{ color }}>● {label}</span>)}</div>
    <details className="mt-auto border-t border-cyan-500/15 px-4 py-3 text-[10px] text-slate-400"><summary className="cursor-pointer text-cyan-300">View underlying data</summary><div className="scrollbar-thin mt-3 max-h-52 overflow-auto"><table className="w-full text-left"><thead><tr><th scope="col" className="py-2">{kind === "COSTS" || kind === "CHANNELS" ? "Category" : "UTC interval"}</th><th scope="col">Values</th></tr></thead><tbody>{dataRows.map(([label, value]) => <tr key={label} className="border-t border-cyan-500/10"><td className="py-2 pr-3 align-top">{label}</td><td className="py-2 leading-relaxed">{value}</td></tr>)}</tbody></table></div></details>
  </AuditPanel>;
}
