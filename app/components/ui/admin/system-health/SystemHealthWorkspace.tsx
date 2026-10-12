"use client";
import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownRight, ArrowUpRight, BellRing, CalendarClock, CheckCheck, Clock, Download, RefreshCw, Server, ShieldAlert } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import MetricCard from "@/app/components/ui/MetricCard";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import { appendAuditEvent, auditJournalWarning, useAuditJournal } from "@/app/lib/audit/store";
import { MOCK_SYSTEM_HEALTH } from "@/app/lib/mock/admin/system-health";
import { controlStatus, effectiveStatus, healthSummary } from "@/app/lib/system-health/engine";
import { mockSystemHealthRepository } from "@/app/lib/system-health/repository";
import type { AuditActor } from "@/app/lib/types/admin/audit";
import type { HealthDomain, HealthIncident } from "@/app/lib/types/admin/system-health";
import { AuditPanel, AuditSelect, auditBadge, auditDate, auditFieldClass, auditTextareaClass } from "../audit/presentation";
import { analyticsButton as button } from "../business-analytics/presentation";
import LatencyChart from "./LatencyChart";
import ServiceRegistry, { domainLabels } from "./ServiceRegistry";
import { percent, Status, statusTone } from "./presentation";

export default function SystemHealthWorkspace() {
  const { user, loading } = useUser();
  if (loading || !user) return null;
  if (user.role !== "admin") return <div className="rounded-xl border border-rose-500/30 p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-rose-400"/><h1>Administrator access required</h1><Link className={`${button} mt-4`} href="/dashboard">Return to dashboard</Link></div>;
  return <Workspace actor={user}/>;
}
function Workspace({ actor }: { actor: AuditActor }) {
  const [report, setReport] = useState(MOCK_SYSTEM_HEALTH);
  const [domain, setDomain] = useState<HealthDomain | "ALL">("ALL");
  const [busy, setBusy] = useState(false);
  const journal = useAuditJournal();
  const journalError = auditJournalWarning();
  const summary = healthSummary(report);
  const controls = report.controls.filter(c => domain === "ALL" || c.domain === domain).sort((a,b) => Number(controlStatus(b, report.as_of) !== "OPERATIONAL") - Number(controlStatus(a, report.as_of) !== "OPERATIONAL"));
  const breaches = report.controls.filter(c => controlStatus(c, report.as_of) === "DEGRADED").length;
  const incidents = [...report.incidents].sort((a, b) => Number(b.severity === "CRITICAL") - Number(a.severity === "CRITICAL") || Date.parse(a.started_at) - Date.parse(b.started_at));
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
  return <div className="@container w-full min-w-0 font-mono text-white [overflow-wrap:anywhere] [&_button]:cursor-pointer [&_button]:disabled:cursor-not-allowed [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-4 [&_button]:focus-visible:outline-cyan-300 [&_summary]:focus-visible:outline-2 [&_summary]:focus-visible:outline-cyan-300">
    <div className="space-y-5 @min-[800px]:space-y-6">
      <div className="min-w-0 [&>div]:flex-wrap">
        <PageHeader compact sessionId={actor.email} systemDate={auditDate(report.as_of, "UTC")} statusText="ADMINISTRATOR · SYSTEM HEALTH">
          <button className={button} disabled={busy} onClick={refresh}><RefreshCw size={13} className={busy ? "animate-spin" : ""}/>{busy ? "Reloading…" : "Refresh snapshot"}</button>
          <button className={button} disabled={busy || !!journalError} onClick={exportSnapshot}><Download size={13}/>Export diagnostics</button>
        </PageHeader>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h1 className="text-2xl font-black uppercase tracking-widest">System Health</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">Service reliability, financial operations and incident response.</p></div>
        <span className={auditBadge("DEMO")}>DEMO SNAPSHOT</span>
      </div>
      <section aria-label="Overall system status" className={`rounded-xl border p-4 @min-[700px]:p-5 ${statusTone[summary.status]}`}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><ShieldAlert size={20} className="mt-0.5 shrink-0"/><div><h2 className="text-sm font-bold">{summary.status === "DEGRADED" ? "Partial service degradation" : summary.status === "OPERATIONAL" ? "All services operational" : summary.status === "OUTAGE" ? "Service interruption detected" : "Telemetry coverage incomplete"}</h2><p className="mt-1 text-xs leading-relaxed text-slate-300">{summary.healthy}/{summary.total} services operational · {report.incidents.length} active incidents · {breaches} control breaches</p></div></div><a href="#health-incidents" className={`${button} shrink-0`}><BellRing size={14}/>Review incidents</a></div>
        <div className="mt-4 flex flex-col gap-2 border-t border-current/10 pt-3 text-[10px] leading-relaxed text-slate-400 @min-[700px]:flex-row @min-[700px]:justify-between"><p>{report.region} · Snapshot {auditDate(report.as_of, "UTC")} UTC</p><p>Fixed demo data · Live monitoring disconnected</p></div>
      </section>
      {journalError && <p role="alert" className="rounded-lg border border-rose-500/30 p-3 text-xs text-rose-300">{journalError}</p>}
      <div className="grid gap-3 @min-[300px]:grid-cols-2 @min-[900px]:grid-cols-4">
        <MetricCard compact title="Synthetic availability · 24h" value={percent(summary.availability)} icon={Server} subtext={<span>Target {report.availability_target_pct}% · {summary.budgetRemainingPct === null ? "N/A" : `${summary.budgetRemainingPct.toFixed(1)}%`} probe budget left</span>}/>
        <MetricCard compact title="API response · p95" value={`${report.api_p95_ms} ms`} icon={Clock} subtext="Platform request histogram · last hour"/>
        <MetricCard compact title="Server error rate · 24h" value={percent(summary.errorRate)} icon={Activity} subtext={`${summary.errors.toLocaleString("en-GB")} HTTP 5xx / ${summary.requests.toLocaleString("en-GB")} requests`}/>
        <MetricCard compact title="Processing backlog" value={summary.queued} icon={ShieldAlert} iconColor={summary.breachedQueues ? "text-amber-300" : "text-cyan-300"} subtext={`${summary.breachedQueues} queue above age target · all domains`}/>
      </div>
      <div className="grid items-start gap-5 @min-[1100px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section id="health-incidents" className="min-w-0 scroll-mt-20 @min-[1100px]:col-start-2 @min-[1100px]:row-start-1"><AuditPanel title="Incident desk" subtitle="Customer impact, accountable owner and next action." action={<span className={auditBadge(report.incidents.length ? "WARNING" : "SUCCESS")}>{report.incidents.length} OPEN</span>}>
          {incidents.length ? incidents.map(incident => {
            const acknowledged = journalError ? undefined : journal.events.find(e => e.source === "SYSTEM" && e.action === "HEALTH_INCIDENT_ACKNOWLEDGED" && e.target === incident.id && e.outcome === "SUCCESS");
            const service = report.services.find(s => s.id === incident.service_id);
            return <Incident key={incident.id} incident={incident} actor={actor} owner={service?.owner ?? "Unassigned"} domain={service?.domain ?? "PLATFORM"} acknowledgement={acknowledged ? `${acknowledged.actor} · ${auditDate(acknowledged.timestamp, "UTC")} UTC` : undefined} blocked={!!journalError}/>;
          }) : <p role="status" className="p-6 text-xs text-emerald-300">No active incidents in this snapshot.</p>}
        </AuditPanel></section>
        <div className="min-w-0 @min-[1100px]:col-start-1 @min-[1100px]:row-start-1"><LatencyChart data={report.samples}/><div className="mt-3 rounded-lg border border-cyan-500/10 bg-cyan-950/10 p-3 text-[10px] leading-relaxed text-slate-500">Availability uses synthetic probe counts. Error rate uses request counts. Domain p95 values come from separate histograms and are never averaged into platform p95.</div></div>
      </div>
      <AuditPanel title="Financial & platform controls" subtitle={`${domain === "ALL" ? "All domains" : domainLabels[domain]} · Observed values against explicit operational targets. Evaluated at snapshot time.`} action={<div className="flex flex-wrap items-end gap-3"><span className="pb-2 text-[10px] text-slate-400">{controls.filter(c => controlStatus(c, report.as_of) === "DEGRADED").length} breaches in view</span><label className={`${auditFieldClass} w-full @min-[400px]:w-44`}>Operational domain<AuditSelect value={domain} onChange={e => setDomain(e.target.value as HealthDomain | "ALL")}><option value="ALL">All domains</option>{Object.entries(domainLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</AuditSelect></label></div>}>
        <div className="grid gap-3 p-4 @min-[600px]:grid-cols-2 @min-[1100px]:grid-cols-3">{controls.map(control => {
          const status = controlStatus(control, report.as_of), Direction = control.direction === "MAX" ? ArrowDownRight : ArrowUpRight;
          return <details key={control.id} className={`min-w-0 rounded-lg border p-3 ${statusTone[status]}`}><summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] uppercase tracking-wider text-slate-500">{domainLabels[control.domain]}</span><span className="text-[10px]">{status === "OPERATIONAL" ? "Within target" : status === "UNKNOWN" ? "No fresh signal" : "Target breached"}</span></div><h3 className="mt-2 text-[11px] font-medium leading-relaxed text-slate-200">{control.name}</h3><div className="mt-3 flex flex-wrap items-baseline justify-between gap-2"><p className="text-lg font-bold">{control.value ?? "N/A"} <span className="text-[10px] font-normal text-slate-400">{control.unit}</span></p><span className="flex items-center gap-1 text-[10px] text-slate-400"><Direction size={12}/>Target {control.direction === "MAX" ? "≤" : "≥"} {control.threshold} {control.unit}</span></div><span className="mt-3 block text-[9px] text-slate-500">Inspect check +</span></summary><p className="mt-3 border-t border-current/10 pt-3 text-[11px] leading-relaxed text-slate-400">{control.detail}</p></details>;
        })}</div>
      </AuditPanel>
      <ServiceRegistry report={report} domain={domain} setDomain={setDomain}/>
      <div className="grid items-start gap-5 @min-[1000px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <AuditPanel title="Infrastructure & resilience" subtitle="Capacity, replication, recovery evidence and secure delivery."><div className="grid gap-3 p-4 @min-[650px]:grid-cols-2">{report.resources.map(r => <details key={r.id} className="min-w-0 rounded-lg border border-cyan-500/15 bg-[#03091e]/50 p-4 text-[11px]"><summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-slate-300">{r.name}</h3><Status value={effectiveStatus(r.status, r.checked_at, report.as_of)}/></div><p className="mt-3 font-bold text-cyan-300">{r.value}</p><span className="mt-3 block text-[9px] text-slate-500">Inspect recovery evidence +</span></summary><p className="mt-3 leading-relaxed text-slate-400">{r.detail}</p></details>)}</div></AuditPanel>
        <AuditPanel title="Maintenance & handover"><div className="space-y-4 p-4 text-[11px]"><div className="flex items-start gap-3"><CalendarClock size={18} className="shrink-0 text-cyan-400"/><div><p className="text-[9px] uppercase tracking-wider text-slate-500">Scheduled after snapshot</p><h3 className="mt-1 font-bold text-slate-200">{report.maintenance.title}</h3></div></div><dl className="space-y-2 text-slate-400"><div><dt className="text-[9px] uppercase text-slate-500">Window · UTC</dt><dd className="mt-1 leading-relaxed">{auditDate(report.maintenance.starts_at, "UTC")}<br/>to {auditDate(report.maintenance.ends_at, "UTC")}</dd></div></dl><p className="leading-relaxed text-slate-400">{report.maintenance.impact}</p><Link className={`${button} w-full`} href="/dashboard/admin/audit-logs">Open Audit Logs</Link><p className="border-t border-cyan-500/15 pt-3 text-[10px] leading-relaxed text-slate-500">Incident reviews are saved locally and do not resolve incidents or page an on-call team. Refresh reloads the same demo snapshot.</p></div></AuditPanel>
      </div>
      <footer className="flex flex-col gap-2 border-t border-cyan-500/15 pt-4 text-[9px] leading-relaxed text-slate-500 @min-[700px]:flex-row @min-[700px]:justify-between"><p>Synthetic monitoring · {report.snapshot_id} · Schema v{report.schema_version}</p><p className="break-all">Operator: {actor.email} · All times UTC</p></footer>
    </div>
  </div>;
}
function Incident({ incident: i, actor, owner, domain, acknowledgement, blocked }: { incident: HealthIncident; actor: AuditActor; owner: string; domain: HealthDomain; acknowledgement?: string; blocked: boolean }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const acknowledge = () => {
    setError("");
    try {
      if (note.trim().length < 10 || note.trim().length > 500) throw new Error("Add a review note of 10–500 characters.");
      appendAuditEvent({ source: "SYSTEM", category: "SYSTEM", action: "HEALTH_INCIDENT_ACKNOWLEDGED", target: i.id, reason: note.trim(), domain, before: { acknowledged: false }, after: { acknowledged: true, incident_state: i.state } }, actor);
      notifyOperation("Incident review recorded", `${i.id} acknowledgement saved locally in Audit Logs. Incident remains ${i.state.toLowerCase()}.`, false, "System Health");
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Review could not be saved."; setError(message); notifyOperation("Acknowledgement blocked", message, true, "System Health"); }
  };
  return <article className="space-y-3 border-b border-cyan-500/15 p-4 last:border-b-0"><div className="flex flex-wrap items-center gap-2"><span className={auditBadge(i.severity)}>{i.severity}</span><span className="text-[9px] text-slate-400">{i.id} · {i.state}</span></div><h3 className="text-sm font-bold leading-relaxed">{i.title}</h3><p className="text-[10px] text-cyan-300">{owner} · {domainLabels[domain]}</p><p className="text-[11px] leading-relaxed text-slate-400">{i.impact}</p><p className="text-[11px] leading-relaxed text-slate-300"><span className="text-slate-500">Next action: </span>{i.next_step}</p><details className="text-[11px] leading-relaxed text-slate-400"><summary className="cursor-pointer text-cyan-300">Updates & review</summary><div className="mt-3 space-y-3"><p>Started {auditDate(i.started_at, "UTC")} UTC<br/>Updated {auditDate(i.updated_at, "UTC")} UTC</p><p>{i.update}</p>{!acknowledgement && <form className="space-y-3" onSubmit={e => { e.preventDefault(); acknowledge(); }}><label className={auditFieldClass}>Review note / ticket reference<textarea className={auditTextareaClass} required minLength={10} maxLength={500} rows={2} value={note} onChange={e => setNote(e.target.value)} disabled={blocked} placeholder="Review findings and escalation reference…"/></label><button className={button} disabled={blocked} type="submit"><CheckCheck size={13}/>Acknowledge locally</button>{error && <p role="alert" className="text-rose-300">{error}</p>}</form>}</div></details>{acknowledgement && <p className="flex items-start gap-2 break-words text-[10px] leading-relaxed text-teal-300"><CheckCheck size={13} className="mt-0.5 shrink-0"/><span>Reviewed locally by {acknowledgement}</span></p>}</article>;
}
