"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowDownUp, Download, FileSearch, Link2, Pause, Play, RefreshCw, Search, ShieldAlert, Users, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import MetricCard from "@/app/components/ui/MetricCard";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import { AUDIT_DEMO_NOW } from "@/app/lib/mock/admin/audit";
import { AUDIT_OUTCOMES, AUDIT_SEVERITIES, AUDIT_SOURCES, type AuditActor, type AuditEvent, type AuditFilters } from "@/app/lib/types/admin/audit";
import { auditCsv, emptyFilters, filterAudit, redact } from "@/app/lib/audit/engine";
import { useAuditEvents } from "@/app/lib/audit/use-audit-events";
import { appendAuditEvent, auditJournalWarning, refreshAuditJournal } from "@/app/lib/audit/store";
import { buttonClass, primaryButtonClass } from "../cards/presentation";

import { AuditPanel, AuditSelect, auditInputClass as inputClass, auditFieldClass, auditBadge, auditDate, EmptyAudit } from "./presentation";
import AuditCharts from "./AuditCharts";
import AuditEventDialog from "./AuditEventDialog";
import AuditExportDialog from "./AuditExportDialog";
const categories=["ACCESS","SECURITY","FINANCIAL","CONFIGURATION","COMPLIANCE","SYSTEM","DATA_ACCESS"];
const dateInput=(iso:string)=>iso.slice(0,16);
export default function AuditLogsWorkspace() {
  const {user,loading}=useUser();
  if(loading || !user)return null;
  if(user.role!=="admin")return <div className="rounded-xl border border-rose-500/30 p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-rose-400"/><h1 className="font-bold">Administrator access required</h1><p className="my-3 text-xs text-slate-400">Audit evidence is restricted to bank administrators.</p><Link href="/dashboard" className={buttonClass}>Return to dashboard</Link></div>;
  return <Workspace actor={user}/>;
}
function Workspace({actor}: {actor:AuditActor}) {
  const {events,journal,health,warnings}=useAuditEvents();
  const [now,setNow]=useState(Date.parse(AUDIT_DEMO_NOW));
  const accessRecorded=useRef(false);
  useEffect(()=>{
    if(accessRecorded.current)return;
    accessRecorded.current=true;
    try{appendAuditEvent({source:"AUDIT",category:"DATA_ACCESS",action:"AUDIT_CONSOLE_OPENED",target:"audit-registry",reason:"Administrator opened the local demo audit console.",before:null,after:null},actor);}
    catch(cause){notifyOperation("Audit access recording failed",cause instanceof Error?cause.message:"The access event could not be saved.",true,"Audit Logs");}
  },[actor]);
  const [paused,setPaused]=useState<{events:AuditEvent[];time:number}|null>(null);
  const [filters,setFilters]=useState<AuditFilters>(emptyFilters);
  const [range,setRange]=useState("7D");const [timeZone,setTimeZone]=useState("Europe/Bucharest");const [sort,setSort]=useState("NEWEST");
  const toolbarRef=useRef<HTMLDivElement>(null);
  const previousTab=useRef("explorer");
  const [tab,setTab]=useState("explorer");const [page,setPage]=useState(0);const [pageSize,setPageSize]=useState(15);const [showCharts,setShowCharts]=useState(true);
  useEffect(()=>{
    if(previousTab.current!==tab){toolbarRef.current?.scrollIntoView({block:"start"});previousTab.current=tab;}
  },[tab]);
  const [selectedId,setSelectedId]=useState<string|null>(null);const [exporting,setExporting]=useState(false);const [exportReceipt,setExportReceipt]=useState<{name:string;count:number;digest:string}|null>(null);
  useEffect(()=>{const tick=()=>setNow(Date.now());tick();const interval=window.setInterval(tick,30000);return()=>window.clearInterval(interval);},[]);
  const registry=paused?.events??events;
  const latestLocalTime=events.reduce((latest,event)=>event.origin==="LOCAL"?Math.max(latest,Date.parse(event.timestamp)):latest,now);
  const referenceTime=paused?.time??latestLocalTime;
  const effectiveFilters=useMemo(()=>{
    if(range==="CUSTOM")return filters;
    const days=range==="24H"?1:range==="7D"?7:30;
    return {...filters,from:range==="ALL"?"":new Date(referenceTime-days*86400000).toISOString(),to:range==="ALL"?"":new Date(referenceTime).toISOString()};
  },[filters,range,referenceTime]);
  const matching=useMemo(()=>filterAudit(registry,effectiveFilters),[registry,effectiveFilters]);
  const sorted=useMemo(()=>[...matching].sort((a,b)=>sort==="OLDEST"?a.timestamp.localeCompare(b.timestamp)||a.id.localeCompare(b.id):sort==="SEVERITY"?AUDIT_SEVERITIES.indexOf(b.severity)-AUDIT_SEVERITIES.indexOf(a.severity)||b.timestamp.localeCompare(a.timestamp):b.timestamp.localeCompare(a.timestamp)||a.id.localeCompare(b.id)),[matching,sort]);
  const pages=Math.max(1,Math.ceil(sorted.length/pageSize));const currentPage=Math.min(page,pages-1);const visible=sorted.slice(currentPage*pageSize,currentPage*pageSize+pageSize);
  const selected=registry.find(e=>e.id===selectedId);
  const actors=[...new Set(registry.map(e=>e.actor))].sort();
  const rangeInvalid=!!(filters.from && filters.to && Date.parse(filters.from)>Date.parse(filters.to) && range==="CUSTOM");
  const chartFrom=effectiveFilters.from?Date.parse(effectiveFilters.from):matching.length?Math.min(...matching.map(e=>Date.parse(e.timestamp))):referenceTime-86400000;
  const chartTo=effectiveFilters.to?Date.parse(effectiveFilters.to):matching.length?Math.max(referenceTime,...matching.map(e=>Date.parse(e.timestamp))):referenceTime;
  const update=(key:keyof AuditFilters,value:string)=>{setFilters(prev=>({...prev,[key]:value}));setPage(0);};
  const clear=()=>{setFilters(emptyFilters());setRange("7D");setPage(0);};
  const correlate=(id:string)=>{setSelectedId(null);setFilters({...emptyFilters(),correlationId:id});setRange("ALL");setPage(0);setTab("explorer");};
  const refresh=()=>{refreshAuditJournal();window.dispatchEvent(new StorageEvent("storage",{key:null}));setNow(Date.now());setPaused(null);notifyOperation("Local sources refreshed","The registry has reloaded browser-persisted source data.",false,"Audit Logs");};
  const localCount=matching.filter(e=>e.origin==="LOCAL").length;const failed=matching.filter(e=>e.outcome==="FAILED").length;const denied=matching.filter(e=>e.outcome==="DENIED").length;
  const controlEvents=matching.filter(e=>e.actorRole==="ADMIN" && ["SECURITY","CONFIGURATION","COMPLIANCE","DATA_ACCESS"].includes(e.category)).length;
  const blocked=!!auditJournalWarning();
  const exportReport=async(format:"CSV"|"JSON",reason:string)=>{
    if(blocked || !sorted.length || rangeInvalid)throw new Error("No exportable records or audit storage is unavailable.");
    const generatedAt=new Date().toISOString();const ids=new Set(sorted.map(e=>e.id));const notes=journal.notes.filter(n=>ids.has(n.eventId));
    const manifest={schemaVersion:1,generatedAt,generatedBy:actor.email,reason,records:sorted.length,localRecords:localCount,demoRecords:sorted.length-localCount,filters:effectiveFilters,sort,displayTimeZone:timeZone,payloadRedaction:"Sensitive keys masked; do not place secrets in free text.",sourceWarnings:warnings,scope:"Local demo audit evidence; not an immutable server archive. Market order rows represent latest snapshots."};
    const content=format==="CSV"?auditCsv(sorted,notes,manifest):JSON.stringify({manifest,events:sorted.map(e=>redact(e)),notes},null,2);
    const bytes=new TextEncoder().encode(content);const hash=await crypto.subtle.digest("SHA-256",bytes);const digest=Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
    const name=`mbank-audit-${generatedAt.replace(/[:.]/g,"-")}.${format.toLowerCase()}`;
    const url=URL.createObjectURL(new Blob([content],{type:format==="CSV"?"text/csv;charset=utf-8":"application/json;charset=utf-8"}));
    try{
      appendAuditEvent({source:"AUDIT",category:"DATA_ACCESS",action:"EXPORT_REQUESTED",severity:"WARNING",target:name,reason,before:null,after:{format,records:sorted.length,sha256:digest,filters:effectiveFilters,sourceWarnings:warnings}},actor);
      const anchor=document.createElement("a");anchor.href=url;anchor.download=name;anchor.click();
      setExportReceipt({name,count:sorted.length,digest});notifyOperation("Evidence report prepared",`${sorted.length} matching events. Export request recorded; file checksum is available below.`,false,"Audit Logs");
    }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  };
  const select=(label:string,key:keyof AuditFilters,options:readonly string[])=><label className={auditFieldClass}><span className="block">{label}</span><AuditSelect value={filters[key]} onChange={e=>update(key,e.target.value)}><option value="ALL">All {label.toLowerCase()}</option>{options.map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</AuditSelect></label>;
  return <div className="w-full min-w-0 space-y-4 font-mono text-white">
    <div className="space-y-2">
      <PageHeader compact sessionId={actor.email} systemDate={new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeZone}).format(referenceTime)} statusText="ADMINISTRATOR · AUDIT & EVIDENCE"><button className={buttonClass} onClick={refresh}><RefreshCw size={13}/> Refresh sources</button><button disabled={!sorted.length || blocked || rangeInvalid} className={primaryButtonClass} onClick={()=>setExporting(true)}><Download size={13}/> Export evidence</button></PageHeader>
      <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0 flex-1 basis-96"><h1 className="text-2xl font-black uppercase tracking-widest">Audit Logs</h1><p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">Follow decisions, investigate access and reconstruct changes across users, payments, markets and risk controls.</p></div><span className="rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-300">DEMO · {registry.filter(e=>e.origin==="LOCAL").length} local / {registry.filter(e=>e.origin==="DEMO").length} fixture records</span></div>
    </div>
    {warnings.map((warning,index)=><p key={index} role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-300">{warning}</p>)}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard compact title="Matching events" value={matching.length} icon={FileSearch} subtext={`${localCount} local · ${matching.length-localCount} demo fixtures`}/><MetricCard compact title="Critical events" value={matching.filter(e=>e.severity==="CRITICAL").length} icon={ShieldAlert} iconColor="text-rose-400" subtext="Event severity; not an incident count"/><MetricCard compact title="Denied / failed" value={`${denied} / ${failed}`} icon={AlertTriangle} iconColor="text-amber-300" subtext={`${matching.length?((denied+failed)/matching.length*100).toFixed(1):"0"}% of matching events`}/><MetricCard compact title="Privileged control events" value={controlEvents} icon={Users} subtext="Admin security, policy, compliance & exports"/></div>
    <AuditPanel title="Investigation scope" subtitle="Every metric, chart and export uses these filters. Search IDs, actor, target, reason, IP, request or session. Date boundaries are inclusive UTC." action={<button className={buttonClass} onClick={clear}><X size={12}/> Reset filters</button>}>
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={`${auditFieldClass} sm:col-span-2`}><span className="block">Search audit events</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" size={13}/><input className={`${inputClass} pl-9`} value={filters.query} onChange={e=>update("query",e.target.value)} placeholder="Actor, action, target, IP or trace…"/></span></label>
        <label className={auditFieldClass}><span className="block">Time range</span><AuditSelect value={range} onChange={e=>{setRange(e.target.value);setPage(0);}}>{[["24H","Last 24 hours"],["7D","Last 7 days"],["30D","Last 30 days"],["ALL","All recorded history"],["CUSTOM","Custom UTC interval"]].map(([key,label])=><option key={key} value={key}>{label}</option>)}</AuditSelect></label>
        <label className={auditFieldClass}><span className="block">Display timezone</span><AuditSelect value={timeZone} onChange={e=>setTimeZone(e.target.value)}><option value="Europe/Bucharest">Europe/Bucharest</option><option value="UTC">UTC</option></AuditSelect></label>
        {select("Sources","source",AUDIT_SOURCES)}{select("Severities","severity",AUDIT_SEVERITIES)}{select("Outcomes","outcome",AUDIT_OUTCOMES)}{select("Domains","domain",["PLATFORM","FIAT","CRYPTO","STOCK"])}
        {select("Actors","actor",actors)}{select("Categories","category",categories)}{select("Provenance","origin",["LOCAL","DEMO"])}
        <label className={auditFieldClass}><span className="block">Exact correlation ID</span><input className={inputClass} value={filters.correlationId} onChange={e=>update("correlationId",e.target.value)} placeholder="Trace identifier…"/></label>
        {range==="CUSTOM" && <><label className={auditFieldClass}><span className="block">From (UTC, inclusive)</span><input type="datetime-local" className={`${inputClass} [color-scheme:dark]`} value={dateInput(filters.from)} onChange={e=>update("from",e.target.value?`${e.target.value}:00Z`:"")}/></label><label className={auditFieldClass}><span className="block">To (UTC, inclusive)</span><input type="datetime-local" className={`${inputClass} [color-scheme:dark]`} value={dateInput(filters.to)} onChange={e=>update("to",e.target.value?`${e.target.value}:00Z`:"")}/></label></>}
      </div>
      {rangeInvalid && <p role="alert" className="px-4 pb-4 text-xs text-rose-300">The start must be earlier than or equal to the end.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-500/15 px-4 py-3 text-[10px] text-slate-500"><span>{effectiveFilters.from?auditDate(effectiveFilters.from,"UTC"):"Beginning of available history"} → {effectiveFilters.to?auditDate(effectiveFilters.to,"UTC"):"Latest available event"} · UTC</span><button className={buttonClass} aria-pressed={!!paused} onClick={()=>setPaused(paused?null:{events:[...events],time:referenceTime})}>{paused?<Play size={12}/>:<Pause size={12}/>} {paused?"Resume local updates":"Pause local updates"}</button></div>
    </AuditPanel>
    {paused && <p role="status" className="rounded-lg border border-amber-500/30 p-3 text-[11px] text-amber-300">Event results and time range are frozen at {auditDate(paused.time,timeZone)}. New source events will appear after resuming.</p>}
    <div ref={toolbarRef} className="flex scroll-mt-4 flex-wrap items-center justify-between gap-2">
      <nav aria-label="Audit workspace views" className="scrollbar-thin flex min-w-0 gap-2 overflow-x-auto">{[["explorer","Event explorer"],["analytics","Activity analytics"],["coverage","Sources & evidence coverage"]].map(([key,label])=><button key={key} className={`${buttonClass} h-8 shrink-0 py-0! ${tab===key?"border-cyan-300 bg-cyan-500/20":""}`} aria-pressed={tab===key} aria-controls={`audit-${key}-panel`} onClick={()=>setTab(key)}>{label}</button>)}</nav>
      {tab==="explorer" && <button className={`${buttonClass} h-8 shrink-0 py-0!`} aria-expanded={showCharts} onClick={()=>setShowCharts(!showCharts)}><Activity size={12}/>{showCharts?"Hide summary charts":"Show summary charts"}</button>}
    </div>
    {tab==="explorer" && <div id="audit-explorer-panel" className="space-y-4">
      {showCharts && <AuditCharts compact events={matching} from={chartFrom} to={chartTo} timeZone={timeZone} filters={filters} actors={actors} onFilter={update}/>}
      <AuditPanel title="Event registry" subtitle={`${sorted.length} matches · Showing ${sorted.length?currentPage*pageSize+1:0}–${Math.min((currentPage+1)*pageSize,sorted.length)}. Open an event to inspect evidence, changes and notes.`} action={<div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 text-[10px] text-slate-400"><ArrowDownUp size={12}/><span className="sr-only">Sort audit events</span><AuditSelect value={sort} onChange={e=>{setSort(e.target.value);setPage(0);}}><option value="NEWEST">Newest first</option><option value="OLDEST">Oldest first</option><option value="SEVERITY">Highest severity</option></AuditSelect></label><label className="text-[10px] text-slate-400"><span className="sr-only">Events per page</span><AuditSelect value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(0);}}>{[15,30,60].map(n=><option key={n} value={n}>{n} per page</option>)}</AuditSelect></label></div>}>
        <div tabIndex={0} role="region" aria-label="Scrollable audit event registry" className="hidden max-h-[360px] overflow-auto scrollbar-thin md:block"><table className="w-full min-w-[920px] text-left text-[11px]"><caption className="sr-only">Audit events matching the current investigation scope. Times in {timeZone}.</caption><thead className="sticky top-0 z-10 bg-[#061528] text-[9px] uppercase text-cyan-300"><tr>{["Timestamp / origin","Event / source","Actor / role","Target / trace","Severity / outcome","Inspect"].map(label=><th key={label} scope="col" className="px-3 py-2">{label}</th>)}</tr></thead><tbody className="divide-y divide-cyan-500/10">{visible.map(e=><tr key={e.id} className="hover:bg-cyan-500/5"><td className="whitespace-nowrap px-3 py-2"><p className="text-[10px] text-slate-300">{auditDate(e.timestamp,timeZone)}</p><span className={`mt-2 ${auditBadge(e.origin)}`}>{e.origin}</span></td><td className="max-w-56 px-3 py-2"><p className="break-words font-bold text-white">{e.action.replaceAll("_"," ")}</p><p className="mt-1 text-[9px] text-cyan-300">{e.source} · {e.domain}</p><p className="mt-1 truncate text-[9px] text-slate-500" title={e.id}>{e.id}</p></td><td className="max-w-48 px-3 py-2"><p className="break-all text-slate-300">{e.actor}</p><p className="mt-2 text-[9px] text-slate-500">{e.actorRole}</p></td><td className="max-w-44 px-3 py-2"><p className="break-all text-slate-300">{e.target}</p>{e.correlationId?<button className="mt-2 flex items-center gap-1 break-all text-left text-[9px] text-cyan-400 hover:text-white" onClick={()=>correlate(e.correlationId!)}><Link2 size={10} className="shrink-0"/>{e.correlationId}</button>:<p className="mt-2 text-[9px] text-slate-600">No trace captured</p>}</td><td className="px-3 py-2"><div className="flex flex-col items-start gap-2"><span className={auditBadge(e.severity)}>{e.severity}</span><span className={auditBadge(e.outcome)}>{e.outcome}</span></div></td><td className="px-3 py-2"><button className={buttonClass} aria-label={`Inspect event ${e.id}`} onClick={()=>setSelectedId(e.id)}><FileSearch size={13}/> Inspect</button></td></tr>)}</tbody></table></div>
        <div tabIndex={0} role="region" aria-label="Scrollable audit event cards" className="max-h-[360px] overflow-y-auto overscroll-contain scrollbar-thin divide-y divide-cyan-500/15 md:hidden">{visible.map(e=><button key={e.id} className="block w-full space-y-2 p-3 text-left hover:bg-cyan-500/5" onClick={()=>setSelectedId(e.id)}><span className="flex flex-wrap items-start justify-between gap-2"><span className="text-xs font-bold">{e.action.replaceAll("_"," ")}</span><span className={auditBadge(e.outcome)}>{e.outcome}</span></span><span className="block break-all text-[10px] text-slate-400">{e.actor} → {e.target}</span><span className="block text-[9px] text-slate-500">{auditDate(e.timestamp,timeZone)} · {e.source} · {e.origin}</span><span className={auditBadge(e.severity)}>{e.severity}</span></button>)}</div>
        {!visible.length && <EmptyAudit text="No events match this scope. Adjust the time range, search or filters."/>}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-500/20 p-3 text-[10px] text-slate-400"><span>Page {currentPage+1} / {pages} · {sorted.length} records</span><div className="flex gap-2"><button disabled={currentPage===0} className={buttonClass} onClick={()=>setPage(0)}>First</button><button disabled={currentPage===0} className={buttonClass} onClick={()=>setPage(currentPage-1)}>Previous</button><button disabled={currentPage+1>=pages} className={buttonClass} onClick={()=>setPage(currentPage+1)}>Next</button></div></footer>
      </AuditPanel>
    </div>}
    {tab==="analytics" && <div id="audit-analytics-panel"><AuditCharts events={matching} from={chartFrom} to={chartTo} timeZone={timeZone} filters={filters} actors={actors} onFilter={update}/></div>}
    {tab==="coverage" && <div id="audit-coverage-panel" className="space-y-4">
      <AuditPanel title="Source availability" subtitle="Coverage describes the entire loaded registry, independent of investigation filters. Connected means browser-local data, not a production collector."><div className="overflow-x-auto scrollbar-thin"><table className="w-full min-w-[650px] text-left text-[11px]"><thead className="bg-cyan-950/25 text-[9px] uppercase text-cyan-300"><tr><th className="p-3">Source</th><th className="p-3">Collection</th><th className="p-3">Local records</th><th className="p-3">Coverage / limitations</th></tr></thead><tbody className="divide-y divide-cyan-500/10">{health.map(h=><tr key={h.source}><th scope="row" className="p-3 text-cyan-300">{h.source}</th><td className="p-3"><span className={auditBadge(h.status)}>{h.status.replaceAll("_"," ")}</span></td><td className="p-3">{h.localCount}</td><td className="max-w-md p-3 text-[10px] leading-relaxed text-slate-400">{h.message}</td></tr>)}</tbody></table></div></AuditPanel>
      <div className="grid gap-4 lg:grid-cols-2"><AuditPanel title="Evidence handling"><ul className="list-disc space-y-3 p-5 pl-8 text-[11px] leading-relaxed text-slate-400"><li>Source events are read-only. Notes are stored separately and audited.</li><li>Exports capture all matching pages, filters and available annotations. The export request is retained with its SHA-256 checksum.</li><li>Secret-bearing keys are masked in payloads, differences and exports. Free-text fields are not a secure place for credentials.</li><li>Missing IP, session, request and timing metadata is shown as not captured.</li></ul></AuditPanel><AuditPanel title="Production integration requirements"><ul className="list-disc space-y-3 p-5 pl-8 text-[11px] leading-relaxed text-slate-400"><li>Browser storage is editable and can be removed. There is no immutable archive or verified retention period.</li><li>Use server-side identity, authorization, append-only durable storage and atomic ledger/audit transactions.</li><li>Connect authentication, failed command attempts, provider telemetry and every order transition. Those feeds are not complete here.</li><li>Establish jurisdiction-specific retention, legal holds and tamper verification in the backend. No policy compliance is asserted by this demo.</li></ul></AuditPanel></div>
    </div>}
    {exportReceipt && <AuditPanel title="Latest prepared evidence report" subtitle="Checksum covers the exact downloaded bytes; it is not a signature or source-integrity certification."><div className="space-y-2 p-4 text-[10px] text-slate-400"><p className="break-all text-cyan-300">{exportReceipt.name} · {exportReceipt.count} records</p><p className="break-all">SHA-256: <span className="select-all text-slate-200">{exportReceipt.digest}</span></p></div></AuditPanel>}
    <footer className="flex flex-wrap justify-between gap-2 border-t border-cyan-500/15 pt-3 text-[9px] leading-relaxed text-slate-500"><span>Read-only source records · append-only local annotations · redacted exports</span><span>Display: {timeZone} · Fixtures dated 03–09 Oct 2026 · No external archive</span></footer>
    {selected && <AuditEventDialog key={selected.id} event={selected} events={registry} notes={journal.notes} actor={actor} timeZone={timeZone} blocked={blocked} onClose={()=>setSelectedId(null)} onSelect={setSelectedId} onCorrelate={correlate}/>}
    {exporting && <AuditExportDialog count={sorted.length} onClose={()=>setExporting(false)} onExport={exportReport}/>}
  </div>;
}
