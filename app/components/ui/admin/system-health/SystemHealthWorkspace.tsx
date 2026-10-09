"use client";
import { useState } from "react";
import Link from "next/link";
import { Activity, CheckCheck, Clock, Download, RefreshCw, Server, ShieldAlert } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import MetricCard from "@/app/components/ui/MetricCard";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import { appendAuditEvent, auditJournalWarning, useAuditJournal } from "@/app/lib/audit/store";
import { MOCK_SYSTEM_HEALTH } from "@/app/lib/mock/admin/system-health";
import { effectiveStatus, healthServices, healthSummary } from "@/app/lib/system-health/engine";
import { mockSystemHealthRepository } from "@/app/lib/system-health/repository";
import type { AuditActor } from "@/app/lib/types/admin/audit";
import type { HealthDomain, HealthIncident, HealthService, ServiceStatus } from "@/app/lib/types/admin/system-health";
import { AuditPanel, AuditSelect, auditBadge, auditDate, auditFieldClass, auditTextareaClass } from "../audit/presentation";
import { analyticsButton as button } from "../business-analytics/presentation";

const labels: Record<HealthDomain, string> = { PLATFORM: "Platform", FIAT: "Fiat banking", CRYPTO: "Crypto", STOCK: "Stocks" };
const percent = (n: number | null) => n === null ? "N/A" : `${n.toFixed(2)}%`;
const time = (s: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(s));
function Status({ value }: { value: ServiceStatus }) {
  return <span className={auditBadge(value === "OPERATIONAL" ? "SUCCESS" : value === "DEGRADED" ? "WARNING" : value === "OUTAGE" ? "CRITICAL" : "ERROR")}>{value === "UNKNOWN" ? "NO FRESH SIGNAL" : value.replaceAll("_", " ")}</span>;
}
export default function SystemHealthWorkspace() {
  const { user, loading } = useUser();
  if (loading || !user) return null;
  if (user.role !== "admin") return <div className="rounded-xl border border-rose-500/30 p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-rose-400"/><h1>Administrator access required</h1><Link className={`${button} mt-4`} href="/dashboard">Return to dashboard</Link></div>;
  return <Workspace actor={user}/>;
}
function Workspace({ actor }: { actor: AuditActor }) {
  const [report, setReport] = useState(MOCK_SYSTEM_HEALTH);
  const [domain, setDomain] = useState<HealthDomain | "ALL">("ALL");
  const [hours, setHours] = useState("24");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const journal = useAuditJournal();
  const journalError = auditJournalWarning();
  const summary = healthSummary(report), services = healthServices(report, domain);
  const samples = report.samples.slice(-Number(hours)).map(s => ({ ...s, label: time(s.timestamp) }));
  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    try { setReport(await mockSystemHealthRepository.getSnapshot()); notifyOperation("Health snapshot reloaded", "The fixed demo snapshot has been reloaded. Snapshot time remains unchanged.", false, "System Health"); }
    catch (cause) { notifyOperation("Health snapshot unavailable", cause instanceof Error ? cause.message : "Could not reload telemetry.", true, "System Health"); }
    finally { setBusy(false); }
  };
  const exportSnapshot = () => {
    let url: string | undefined;
    try {
      const content = { generated_at: new Date().toISOString(), generated_by: actor.email, scope: "All services and 24-hour telemetry; independent synthetic snapshot", report, acknowledgements: journal.events.filter(e => e.source === "SYSTEM" && e.action === "HEALTH_INCIDENT_ACKNOWLEDGED" && report.incidents.some(i => i.id === e.target)) };
      url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }));
      appendAuditEvent({ source: "SYSTEM", category: "DATA_ACCESS", action: "HEALTH_SNAPSHOT_EXPORT_REQUESTED", target: report.snapshot_id, reason: "Administrator requested the full operational diagnostic snapshot.", before: null, after: { snapshot_id: report.snapshot_id, as_of: report.as_of, format: "JSON" } }, actor);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `mbank-${report.snapshot_id}.json`; anchor.click();
      notifyOperation("Diagnostic snapshot prepared", "All services, incidents and 24-hour samples are included. Export request recorded in Audit Logs.", false, "System Health");
    } catch (cause) { notifyOperation("Diagnostic export blocked", cause instanceof Error ? cause.message : "Could not record the export request.", true, "System Health"); }
    finally { if (url) { const objectUrl = url; window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000); } }
  };
  return <div className="w-full min-w-0 space-y-4 font-mono text-white">
    <PageHeader compact sessionId={actor.email} systemDate={auditDate(report.as_of, "UTC")} statusText="ADMINISTRATOR · SYSTEM HEALTH"><button className={button} disabled={busy} onClick={refresh}><RefreshCw size={13} className={busy ? "animate-spin" : ""}/>{busy ? "Reloading…" : "Refresh snapshot"}</button><button className={button} disabled={busy || !!journalError} onClick={exportSnapshot}><Download size={13}/>Export diagnostics</button></PageHeader>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-black uppercase tracking-widest">System Health</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">Operational visibility across banking, crypto and stock services. Identify impact, inspect dependencies and follow active incidents.</p></div><span className={auditBadge("DEMO")}>DEMO SNAPSHOT</span></div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4"><div className="flex min-w-0 items-start gap-3"><Activity size={18} className="mt-0.5 shrink-0 text-amber-300"/><div><p className="text-xs font-bold text-slate-200">{summary.status === "DEGRADED" ? "Partial service degradation" : summary.status === "OPERATIONAL" ? "All services operational" : summary.status === "OUTAGE" ? "Service interruption detected" : "Telemetry coverage incomplete"}</p><p className="mt-1 text-[10px] leading-relaxed text-slate-400">{summary.healthy}/{summary.total} services operational · {report.region}<br/>Fixed illustrative data as of {auditDate(report.as_of, "UTC")} UTC. This console is not connected to live monitoring.</p></div></div><Status value={summary.status}/></div>
    {journalError && <p role="alert" className="rounded-lg border border-rose-500/30 p-3 text-xs text-rose-300">{journalError}</p>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 [&_h3]:min-h-7">
      <MetricCard compact title="Availability · 24 hours" value={percent(summary.availability)} icon={Server} subtext={<div className="min-h-8">Successful synthetic probes / all probes</div>}/>
      <MetricCard compact title="API latency · p95" value={`${report.api_p95_ms} ms`} icon={Clock} subtext={<div className="min-h-8">Platform request histogram · last hour</div>}/>
      <MetricCard compact title="API server errors · 24h" value={percent(summary.errorRate)} icon={Activity} subtext={<div className="min-h-8">{summary.errors.toLocaleString("en-GB")} HTTP 5xx / {summary.requests.toLocaleString("en-GB")} requests</div>}/>
      <MetricCard compact title="Open incidents" value={report.incidents.length} icon={ShieldAlert} iconColor="text-amber-300" subtext={<div className="min-h-8">Acknowledgement does not resolve an incident</div>}/>
    </div>
    <AuditPanel title="API response time" subtitle="Hourly p95 from separate domain request histograms, in milliseconds. A percentile is not an average; platform p95 is computed separately." action={<label className={`${auditFieldClass} min-w-36`}>Chart window<AuditSelect value={hours} onChange={e => setHours(e.target.value)}><option value="24">Last 24 hours</option><option value="6">Last 6 hours</option></AuditSelect></label>}>
      <div className="h-64 min-w-0 p-3 sm:h-72"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 232 }}><LineChart data={samples} accessibilityLayer margin={{ top: 15, right: 10, left: -10, bottom: 0 }}><CartesianGrid stroke="#164e63" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" minTickGap={35} tick={{ fill: "#94a3b8", fontSize: 9 }}/><YAxis unit=" ms" width={60} tick={{ fill: "#94a3b8", fontSize: 9 }}/><Tooltip contentStyle={{ background: "#03091e", border: "1px solid #155e75", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#67e8f9" }} labelFormatter={(_, p) => p[0]?.payload?.timestamp ? `${auditDate(p[0].payload.timestamp, "UTC")} UTC` : "UTC"} formatter={v => `${v} ms`}/><ReferenceLine y={500} stroke="#fbbf24" strokeDasharray="5 5"/>{[["fiat_p95_ms", "Fiat", "#22d3ee"], ["crypto_p95_ms", "Crypto", "#818cf8"], ["stock_p95_ms", "Stocks", "#2dd4bf"]].map(([key, name, color]) => <Line key={key} type="linear" dataKey={key} name={name} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false}/>)}</LineChart></ResponsiveContainer></div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 pb-4 text-[10px]"><span className="text-cyan-300">● Fiat</span><span className="text-indigo-300">● Crypto</span><span className="text-teal-300">● Stocks</span><span className="text-amber-300">┄ 500 ms investigation threshold</span><span className="text-slate-500">UTC · window affects this chart only</span></div>
      <details className="border-t border-cyan-500/15 p-4 text-[10px] text-slate-400"><summary className="cursor-pointer text-cyan-300">View response-time samples</summary><div className="scrollbar-thin mt-3 max-h-52 overflow-auto"><table className="w-full min-w-[380px] text-left"><thead className="sticky top-0 bg-[#061528]"><tr>{["UTC", "Fiat p95", "Crypto p95", "Stocks p95"].map(s => <th key={s} scope="col" className="p-2">{s}</th>)}</tr></thead><tbody>{samples.map(s => <tr key={s.timestamp} className="border-t border-cyan-500/10"><th scope="row" className="p-2 font-normal">{s.timestamp.slice(5,16).replace("T"," ")}</th><td className="p-2">{s.fiat_p95_ms} ms</td><td className="p-2">{s.crypto_p95_ms} ms</td><td className="p-2">{s.stock_p95_ms} ms</td></tr>)}</tbody></table></div></details>
    </AuditPanel>
    <AuditPanel title="Service registry" subtitle="Latest probes at the snapshot time. Domain filters apply only to this registry; platform metrics and incidents retain full coverage." action={<label className={`${auditFieldClass} min-w-40`}>Service domain<AuditSelect value={domain} onChange={e => { setDomain(e.target.value as HealthDomain | "ALL"); setExpanded(null); }}><option value="ALL">All services</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</AuditSelect></label>}>
      <div className="scrollbar-thin hidden max-h-[360px] overflow-auto md:block"><table className="w-full min-w-[760px] text-left text-[11px]"><thead className="sticky top-0 z-10 bg-[#061528] text-[9px] uppercase text-cyan-300"><tr>{["Service / domain", "Status", "24h uptime", "p95", "Queued / oldest", "Inspect"].map(s => <th key={s} scope="col" className="px-4 py-3">{s}</th>)}</tr></thead><tbody>{services.map(s => <ServiceRows key={s.id} service={s} asOf={report.as_of} expanded={expanded === s.id} toggle={() => setExpanded(expanded === s.id ? null : s.id)}/>)}</tbody></table></div>
      <div className="scrollbar-thin max-h-[360px] overflow-y-auto divide-y divide-cyan-500/15 md:hidden">{services.map(s => <details key={s.id} className="p-4 text-[11px]"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">{s.name}</span><Status value={effectiveStatus(s.status, s.checked_at, report.as_of)}/></div><p className="mt-2 text-slate-400">{labels[s.domain]} · {percent(s.availability_24h_pct)} uptime · {s.latency_p95_ms ?? "N/A"} ms p95</p><p className="mt-2 text-cyan-300">View service details</p></summary><ServiceDetails service={s}/></details>)}</div>
    </AuditPanel>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(300px,2fr)]">
      <AuditPanel title="Active incidents" subtitle="Current impact and operator updates. Local acknowledgements track review only; incident state is controlled by the monitoring source.">{report.incidents.map(incident => {
        const acknowledged = journalError ? undefined : journal.events.find(e => e.source === "SYSTEM" && e.action === "HEALTH_INCIDENT_ACKNOWLEDGED" && e.target === incident.id && e.outcome === "SUCCESS");
        return <Incident key={incident.id} incident={incident} actor={actor} acknowledgement={acknowledged ? `${acknowledged.actor} · ${auditDate(acknowledged.timestamp, "UTC")} UTC` : undefined} blocked={!!journalError}/>;
      })}</AuditPanel>
      <div className="space-y-4"><AuditPanel title="Infrastructure & recovery" subtitle="Expand a check for thresholds, recovery evidence and telemetry scope."><div className="divide-y divide-cyan-500/15">{report.resources.map(r => <details key={r.id} className="p-4 text-[11px]"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-slate-300">{r.name}</span><Status value={r.status}/></div><p className="mt-2 font-bold text-cyan-300">{r.value}</p></summary><p className="mt-3 leading-relaxed text-slate-400">{r.detail}</p></details>)}</div></AuditPanel>
      <AuditPanel title="Planned maintenance"><div className="space-y-3 p-4 text-[11px]"><p className="font-bold text-slate-200">{report.maintenance.title}</p><p className="leading-relaxed text-cyan-300">{auditDate(report.maintenance.starts_at, "UTC")} → {time(report.maintenance.ends_at)} UTC</p><p className="leading-relaxed text-slate-400">{report.maintenance.impact}</p><Link className={`${button} w-full`} href="/dashboard/admin/audit-logs">Open Audit Logs</Link></div></AuditPanel></div>
    </div>
    <footer className="border-t border-cyan-500/15 pt-3 text-[9px] leading-relaxed text-slate-500">Synthetic monitoring · {report.snapshot_id} · Refresh reloads the fixed snapshot. Acknowledgements persist in this browser’s audit journal. Operational controls belong to the future authenticated backend.</footer>
  </div>;
}
function ServiceDetails({ service: s }: { service: HealthService }) {
  return <div className="mt-3 space-y-2 text-[10px] leading-relaxed text-slate-400"><p>{s.detail}</p><p>Owner: <span className="text-slate-200">{s.owner}</span></p><p>{s.queue_depth} queued · oldest {s.oldest_job_seconds} s · checked {time(s.checked_at)} UTC</p></div>;
}
function ServiceRows({ service: s, asOf, expanded, toggle }: { service: HealthService; asOf: string; expanded: boolean; toggle: () => void }) {
  return <><tr className="border-t border-cyan-500/10"><th scope="row" className="px-4 py-3 font-normal"><p className="text-slate-200">{s.name}</p><p className="mt-1 text-[9px] text-slate-500">{labels[s.domain]}</p></th><td className="px-4 py-3"><Status value={effectiveStatus(s.status, s.checked_at, asOf)}/></td><td className="px-4 py-3">{percent(s.availability_24h_pct)}</td><td className="px-4 py-3">{s.latency_p95_ms === null ? "N/A" : `${s.latency_p95_ms} ms`}</td><td className="px-4 py-3">{s.queue_depth} / {s.oldest_job_seconds} s</td><td className="px-4 py-3"><button className={button} aria-label={`${expanded ? "Close" : "Inspect"} ${s.name}`} aria-expanded={expanded} aria-controls={`health-service-${s.id}`} onClick={toggle}>{expanded ? "Close" : "Inspect"}</button></td></tr>{expanded && <tr id={`health-service-${s.id}`} className="bg-cyan-950/10"><td colSpan={6} className="px-4 pb-4"><ServiceDetails service={s}/></td></tr>}</>;
}
function Incident({ incident: i, actor, acknowledgement, blocked }: { incident: HealthIncident; actor: AuditActor; acknowledgement?: string; blocked: boolean }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const acknowledge = () => {
    setError("");
    try {
      if (note.trim().length < 10 || note.trim().length > 500) throw new Error("Add a review note of 10–500 characters.");
      appendAuditEvent({ source: "SYSTEM", category: "SYSTEM", action: "HEALTH_INCIDENT_ACKNOWLEDGED", target: i.id, reason: note.trim(), domain: i.service_id === "chain" ? "CRYPTO" : "STOCK", before: { acknowledged: false }, after: { acknowledged: true, incident_state: i.state } }, actor);
      notifyOperation("Incident review recorded", `${i.id} acknowledgement saved locally in Audit Logs. Incident remains ${i.state.toLowerCase()}.`, false, "System Health");
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Review could not be saved."; setError(message); notifyOperation("Acknowledgement blocked", message, true, "System Health"); }
  };
  return <article className="space-y-3 border-b border-cyan-500/15 p-4 last:border-b-0"><div className="flex flex-wrap items-center gap-2"><span className={auditBadge(i.severity)}>{i.severity}</span><span className="text-[9px] text-slate-400">{i.id} · {i.state}</span></div><h3 className="text-xs font-bold">{i.title}</h3><p className="text-[11px] leading-relaxed text-slate-400">{i.impact}</p><details className="text-[10px] leading-relaxed text-slate-400"><summary className="cursor-pointer text-cyan-300">Updates & review</summary><div className="mt-3 space-y-3"><p>Started {auditDate(i.started_at, "UTC")} UTC<br/>Updated {auditDate(i.updated_at, "UTC")} UTC</p><p>{i.update}</p><p><span className="text-slate-200">Next step: </span>{i.next_step}</p>{!acknowledgement && <form className="space-y-3" onSubmit={e => { e.preventDefault(); acknowledge(); }}><label className={auditFieldClass}>Review note / ticket reference<textarea className={auditTextareaClass} required minLength={10} maxLength={500} rows={2} value={note} onChange={e => setNote(e.target.value)} disabled={blocked} placeholder="Review findings and escalation reference…"/></label><button className={button} disabled={blocked} type="submit"><CheckCheck size={13}/>Acknowledge locally</button>{error && <p role="alert" className="text-rose-300">{error}</p>}</form>}</div></details>{acknowledgement && <p className="flex items-start gap-2 break-words text-[10px] leading-relaxed text-teal-300"><CheckCheck size={13} className="mt-0.5 shrink-0"/><span>Reviewed locally by {acknowledgement}</span></p>}</article>;
}
