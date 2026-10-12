"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCheck, ChevronRight, Download, Flag, History, Layers3, RotateCcw, Search, Settings2, ShieldCheck, SlidersHorizontal, RefreshCw } from "lucide-react";
import PageHeader from "@/app/components/ui/PageHeader";
import MetricCard from "@/app/components/ui/MetricCard";
import { AuditPanel, auditDate } from "../audit/presentation";
import ConfigCoverage from "./ConfigCoverage";
import { useUser } from "@/app/context/UserContext";
import { CONFIG_FLAGS, CONFIG_SETTINGS } from "@/app/lib/mock/admin/flags-config";
import { configChanges, evaluateFlag, validatePayload } from "@/app/lib/flags-config/engine";
import { configStorageWarning, mockConfigRepository, useFlagsConfig } from "@/app/lib/flags-config/repository";
import { CONFIG_ENVIRONMENTS, type ConfigEnvironment, type ConfigModule, type ConfigPayload, type ConfigRelease, type ConfigValue, type FlagRule } from "@/app/lib/types/admin/flags-config";
import type { AuditActor } from "@/app/lib/types/admin/audit";
import { actionClass, Badge, ConfigDialog, ConfigSelect, displayValue, FlagEditor, inputClass, modules, panelClass, primaryClass, SettingEditor } from "./presentation";

type Draft={payload:ConfigPayload;revision:number;restored_from?:string};
type Tab="settings"|"flags"|"history";
type Modal="settings"|"flags"|"review"|null;
const date=(value:string)=>new Date(value).toLocaleString("en-GB",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"})+" UTC";

export default function FlagsConfigWorkspace() {
  const {user,loading}=useUser();
  if (loading || !user) return null;
  if (user.role!=="admin") return <div className={`${panelClass} p-8 text-center text-white`}><ShieldCheck className="mx-auto mb-4 text-amber-200"/><h1 className="text-xl font-bold">Administrator access required</h1><Link className={`${actionClass} mt-5`} href="/dashboard">Return to dashboard</Link></div>;
  return <Workspace actor={user}/>;
}

function Workspace({actor}:{actor:AuditActor}) {
  const state=useFlagsConfig();
  const [environment,setEnvironment]=useState<ConfigEnvironment>("production");
  const [draft,setDraft]=useState<Draft|null>(null);
  const [tab,setTab]=useState<Tab>("settings");
  const [module,setModule]=useState<ConfigModule|"all">("all");
  const [query,setQuery]=useState("");
  const [advancedQuery,setAdvancedQuery]=useState("");
  const [modal,setModal]=useState<Modal>(null);
  const [reason,setReason]=useState("");
  const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);
  const current=state.environments[environment];
  const payload=draft?.payload??current.published;
  const changes=configChanges(current.published,payload);
  const dirty=changes.length>0;
  const stale=!!draft && draft.revision!==current.revision;
  const issues=validatePayload(payload);
  if (environment==="production" && (payload.settings["identity.admin_mfa"]!==true || payload.settings["accounts.kyc_required"]!==true)) issues.push("Production requires administrator MFA and verified identity checks.");
  const warning=configStorageWarning();
  const critical=changes.filter(c=>c.critical).length;
  const matches=(item:{module:ConfigModule;key:string;name:string;description:string},search=query)=>(module==="all"||item.module===module)&&`${item.key} ${item.name} ${item.description}`.toLowerCase().includes(search.trim().toLowerCase());
  const visibleSettings=CONFIG_SETTINGS.filter(s=>matches(s)&&(!s.advanced||!!query.trim()));
  const visibleFlags=CONFIG_FLAGS.filter(f=>matches(f)&&(!f.advanced||!!query.trim()));
  const edit=(update:(previous:ConfigPayload)=>ConfigPayload)=>{
    setDraft(previous=>({payload:update(previous?.payload??structuredClone(current.published)),revision:previous?.revision??current.revision}));
    setNotice(null);setError(null);
  };
  const editSetting=(key:string,value:ConfigValue)=>edit(previous=>({...previous,settings:{...previous.settings,[key]:value}}));
  const editFlag=(key:string,value:FlagRule)=>edit(previous=>({...previous,flags:{...previous.flags,[key]:value}}));
  const open=(next:Modal)=>{setAdvancedQuery("");setConfirmed(false);setModal(next);setError(null);};
  const discard=()=>{setDraft(null);setReason("");setError(null);setNotice("Draft cleared. You are viewing the latest published mock configuration.");};
  const publish=async()=>{
    if (busy) return;
    setBusy(true);setError(null);
    try {
      if (!confirmed) throw new Error("Confirm the environment and reviewed changes before publishing.");
      const next=await mockConfigRepository.publish({environment,payload,expected_revision:draft?.revision??current.revision,actor,reason,restored_from:draft?.restored_from});
      setDraft(null);setModal(null);setReason("");setNotice(`Revision ${next.environments[environment].revision} published to ${environment} in this browser. Release history and Audit Logs have been updated.`);
    } catch (cause) {setError(cause instanceof Error?cause.message:"Could not publish configuration.");}
    finally {setBusy(false);}
  };
  const restore=(release:ConfigRelease)=>{
    setDraft({payload:structuredClone(release.before),revision:current.revision,restored_from:release.id});
    setReason(`Restore configuration before revision ${release.revision}: `);setConfirmed(false);setModal("review");setError(null);
  };
  const exportPublished=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify({schema_version:1,environment,revision:current.revision,exported_at:new Date().toISOString(),scope:"browser-local mock; no secrets",payload:current.published},null,2)],{type:"application/json"}));
    const anchor=document.createElement("a");anchor.href=url;anchor.download=`mbank-config-${environment}-r${current.revision}.json`;anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice(`Published revision ${current.revision} exported. Unpublished edits are excluded.`);
  };

  return <div className="@container min-w-0 w-full space-y-4 font-mono text-white [overflow-wrap:anywhere] [&_.text-slate-400]:text-slate-200 [&_.text-gray-400\/80]:text-slate-200 [&_.text-zinc-500]:text-zinc-300 [&_button]:cursor-pointer [&_button]:disabled:cursor-not-allowed [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-4 [&_button]:focus-visible:outline-cyan-200">
    <div className="[&>div]:flex-col [&>div]:items-stretch @min-[650px]:[&>div]:items-center [&>div>div]:min-w-0 [&>div>div:first-child>div:last-child]:flex-wrap @min-[650px]:[&>div]:grid @min-[650px]:[&>div]:grid-cols-[minmax(0,1fr)_auto] @min-[650px]:[&>div>div:last-child]:grid @min-[650px]:[&>div>div:last-child]:grid-cols-2 @min-[650px]:[&>div>div:last-child]:w-auto @min-[650px]:[&>div>div:last-child]:gap-2 @min-[650px]:[&>div>div:last-child>button:last-child]:col-span-2 @min-[1000px]:[&>div>div:last-child]:flex"><PageHeader compact sessionId={actor.email} systemDate={current.releases[0]?auditDate(current.releases[0].timestamp).split(",")[0]:undefined} statusText="ADMINISTRATOR · FLAGS & CONFIG">
      <button className={actionClass} disabled={busy||dirty} onClick={async()=>{try{await mockConfigRepository.getSnapshot();setNotice("Published configuration reloaded.");}catch(cause){setError(cause instanceof Error?cause.message:"Refresh failed.");}}}><RefreshCw size={13}/>Refresh</button>
      <button className={actionClass} disabled={busy||!!warning} onClick={exportPublished}><Download size={13}/>Export config</button>
      <button className={primaryClass} disabled={!dirty||busy||stale||!!warning} onClick={()=>open("review")}><CheckCheck size={13}/>Review changes</button>
    </PageHeader></div>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-black uppercase tracking-widest">Flags & Config</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-200">Platform controls, feature availability and versioned configuration releases.</p></div><Badge tone="amber">DEMO · LOCAL CONFIG</Badge></div>
    <div className="grid grid-cols-2 gap-3 @min-[700px]:grid-cols-4">
      <MetricCard compact title="Platform domains" value={Object.keys(modules).length} icon={Layers3} subtext="Banking, security & operations"/>
      <MetricCard compact title="Configuration keys" value={CONFIG_SETTINGS.length} icon={Settings2} subtext={`${CONFIG_SETTINGS.filter(s=>s.advanced).length} advanced controls`}/>
      <MetricCard compact title="Enabled flags" value={Object.values(payload.flags).filter(f=>f.enabled).length} icon={Flag} subtext={`${CONFIG_FLAGS.length} total · audience & rollout rules`}/>
      <MetricCard compact title="Pending changes" value={changes.length} icon={History} subtext={critical?`${critical} critical controls`:"No critical changes pending"}/>
    </div>
    <div className="grid items-stretch gap-4 @min-[620px]:grid-cols-2">
      <AuditPanel title="Environment & release" subtitle="Select the configuration scope before editing." action={<Badge tone={dirty?"amber":"green"}>{dirty?"DRAFT":"PUBLISHED"}</Badge>}>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 items-end gap-3">
            <label className="flex min-w-0 flex-col gap-1.5 text-[10px] text-slate-200"><span>Environment</span><ConfigSelect aria-label="Environment" value={environment} disabled={dirty||busy} onChange={e=>{setEnvironment(e.target.value as ConfigEnvironment);setDraft(null);setError(null);setNotice(null);}}>{CONFIG_ENVIRONMENTS.map(e=><option key={e} value={e}>{e[0].toUpperCase()+e.slice(1)}</option>)}</ConfigSelect></label>
            <div className="flex min-w-0 flex-col gap-1.5 text-[10px] text-slate-200"><span>Published version</span><div className="flex h-9 min-w-0 items-center rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 text-xs leading-normal text-cyan-100">Revision {current.revision}</div></div>
          </div>
          <div className="space-y-2 border-t border-cyan-500/15 pt-3 text-[10px] leading-relaxed"><div className="flex justify-between gap-3"><span className="text-slate-200">Last publication</span><span className="text-right text-white">{current.releases[0]?date(current.releases[0].timestamp):"Initial demo baseline"}</span></div><div className="flex justify-between gap-3"><span className="text-slate-200">Release history</span><span className="text-white">{current.releases.length} recorded releases</span></div><p className={dirty?"text-amber-200":"text-slate-200"}>{dirty?"Publish or discard the draft before switching environments.":"Browser-local mock. Banking services are not connected yet."}</p></div>
        </div>
      </AuditPanel>
      <ConfigCoverage payload={payload} module="all"/>
    </div>

    {warning&&<p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-400/10 p-4 text-[11px] leading-6 text-rose-200">{warning}</p>}
    {stale&&<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-[11px] text-amber-100"><p>A newer revision was published in another tab. This draft cannot be published.</p><button className={actionClass} onClick={discard}>Discard and load latest</button></div>}
    {notice&&<p role="status" className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-[10px] leading-relaxed text-emerald-100">{notice}</p>}
    {error&&!modal&&<p role="alert" className="text-[11px] text-rose-200">{error}</p>}

    <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex max-w-full flex-wrap gap-1 rounded-xl border border-white/15 bg-white/[0.025] p-1" role="tablist" aria-label="Configuration workspace">{([{id:"settings",label:"Configuration",icon:Settings2},{id:"flags",label:"Feature flags",icon:Flag},{id:"history",label:"Release history",icon:History}] as const).map(item=><button id={`tab-${item.id}`} key={item.id} role="tab" aria-selected={tab===item.id} aria-controls={`panel-${item.id}`} className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${tab===item.id?"bg-cyan-400/15 text-cyan-100":"text-slate-200 hover:bg-white/5"}`} onClick={()=>setTab(item.id)}><item.icon size={14}/>{item.label}</button>)}</div>{tab!=="history"&&<button className={actionClass} onClick={()=>open(tab)}><SlidersHorizontal size={14}/>Advanced {tab=== "settings"?"settings":"flags"}<ChevronRight size={14}/></button>}</div>
      {tab!=="history"&&<div className="grid gap-3 @min-[650px]:grid-cols-[minmax(0,1fr)_240px]"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={16}/><input className={`${inputClass} pl-10`} aria-label="Search settings and flags" placeholder="Search by name, key or description…" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="sr-only" htmlFor="config-module">Filter by domain</label><ConfigSelect id="config-module" className={inputClass} value={module} onChange={e=>setModule(e.target.value as ConfigModule|"all")}><option value="all">All platform domains</option>{Object.entries(modules).map(([key,item])=><option key={key} value={key}>{item.name}</option>)}</ConfigSelect></div>}
    </div>

    <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab==="settings"&&<><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] leading-relaxed text-slate-300">{query.trim()?"Search includes advanced controls.":"Essential controls first. Open each domain for deeper configuration."}</p><span className="text-xs text-cyan-200">{visibleSettings.length} settings in view</span></div><div className="grid items-stretch gap-4 @min-[620px]:grid-cols-2">{Object.entries(modules).filter(([key])=>module==="all"||module===key).map(([key,item],index)=>{
        const settings=visibleSettings.filter(s=>s.module===key), advanced=CONFIG_SETTINGS.filter(s=>s.module===key&&s.advanced).length;
        if (!settings.length) return null;
        return <article key={key} className={`${panelClass} flex flex-col overflow-hidden`}><div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 p-4"><div className="flex items-start gap-3"><span className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 px-2 py-1 text-xs text-cyan-200">{String(index+1).padStart(2,"0")}</span><div><h2 className="text-xs font-bold uppercase tracking-wider text-cyan-200">{item.name}</h2><p className="mt-1 text-[10px] leading-relaxed text-slate-300">{item.description}</p></div></div></div><div className="divide-y divide-cyan-500/10 px-4">{settings.map(s=><SettingEditor key={s.key} definition={s} value={payload.settings[s.key]} onChange={v=>editSetting(s.key,v)}/>)}</div>{advanced>0&&<button className="mt-auto flex min-h-9 w-full items-center justify-between border-t border-cyan-500/15 bg-cyan-500/5 px-4 text-[10px] text-cyan-100 hover:bg-cyan-400/10" onClick={()=>{setModule(key as ConfigModule);open("settings");}}><span>{advanced} advanced settings</span><ArrowRight size={14}/></button>}</article>;
      })}{visibleSettings.length>0&&new Set(visibleSettings.map(s=>s.module)).size%2===1&&<ConfigCoverage payload={payload} module={module}/>}</div>{!visibleSettings.length&&<Empty text="No settings match this search. Try another domain or keyword."/>}</>}
      {tab==="flags"&&<div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] leading-relaxed text-slate-300">Control availability here. Use Advanced flags to set rollout percentages and audiences.</p><span className="text-xs text-cyan-200">{visibleFlags.length} flags in view</span></div><div className="grid gap-4 @min-[650px]:grid-cols-2 @min-[1250px]:grid-cols-3">{visibleFlags.map(f=><FlagEditor key={f.key} definition={f} rule={payload.flags[f.key]} onChange={value=>editFlag(f.key,value)}/>) }{visibleFlags.length%2===1&&<ConfigCoverage payload={payload} module={module}/>}</div>{!visibleFlags.length&&<Empty text="No essential flags in this view. Open Advanced flags or search the full catalog."/>}<FlagPreview payload={payload} dirty={dirty}/></div>}
      {tab==="history"&&<div className={`${panelClass} p-4 @min-[700px]:p-6`}><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xs font-bold">Release timeline</h2><p className="mt-2 text-[10px] leading-relaxed text-slate-300">Versioned changes, reasons and restoration snapshots.</p></div><Badge>{environment} · {current.releases.length} releases</Badge></div>{!current.releases.length?<Empty text="No releases yet. Publish your first reviewed change to start the timeline."/>:<div className="space-y-4">{current.releases.map(release=><details key={release.id} className="rounded-xl border border-white/15 bg-black/10 p-4"><summary className="cursor-pointer text-[11px] text-white"><span className="font-bold">Revision {release.revision}</span><span className="ml-3 text-xs text-cyan-200">{date(release.timestamp)}</span><p className="mt-2 text-[10px] leading-relaxed text-slate-200">{release.reason}</p></summary><div className="mt-4 space-y-4 border-t border-white/10 pt-4"><p className="text-xs text-slate-300">By {release.actor}{release.restored_from?" · Restoration release":""}</p><ChangeList before={release.before} after={release.after}/><button className={actionClass} disabled={dirty||busy||!!warning} onClick={()=>restore(release)}><RotateCcw size={14}/>Review restoration to revision {release.revision-1}</button></div></details>)}</div>}</div>}
    </section>

    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-[10px] leading-relaxed text-slate-300"><ShieldCheck size={18} className="mt-1 shrink-0 text-cyan-200"/><p>Local demo storage · Versioned changes appear in Audit Logs · Pricing, risk policies and market inventory remain in their dedicated modules.</p></div>
    {dirty&&<div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-200/40 bg-[#0c1b2c]/95 p-4 shadow-[0_8px_40px_#0009] backdrop-blur-xl"><div><p className="text-[11px] font-semibold text-white">{changes.length} unpublished {changes.length===1?"change":"changes"}<span className="ml-2 text-cyan-200">· {environment}</span></p><p className="mt-1 text-xs text-slate-200">{issues.length?`${issues.length} validation issues to resolve`:critical?`${critical} critical changes need careful review`:"Ready for review"}</p></div><div className="flex flex-wrap gap-2"><button className={actionClass} disabled={busy} onClick={discard}>Discard draft</button><button className={primaryClass} disabled={busy||stale||!!warning} onClick={()=>open("review")}><CheckCheck size={15}/>Review changes</button></div></div>}

    {(modal==="settings"||modal==="flags")&&<ConfigDialog title={modal==="settings"?"Advanced settings":"Advanced flags"} subtitle={`${module==="all"?"All platform domains":modules[module].name} · ${environment} · Editing draft values`} onClose={()=>setModal(null)}><div className="mb-5 grid gap-3 sm:grid-cols-2"><input aria-label="Search advanced controls" className={inputClass} placeholder="Search the full catalog…" value={advancedQuery} onChange={e=>setAdvancedQuery(e.target.value)}/><ConfigSelect aria-label="Advanced domain" className={inputClass} value={module} onChange={e=>setModule(e.target.value as ConfigModule|"all")}><option value="all">All platform domains</option>{Object.entries(modules).map(([key,item])=><option key={key} value={key}>{item.name}</option>)}</ConfigSelect></div><div className="grid items-start gap-4 sm:grid-cols-2">{modal==="settings"?CONFIG_SETTINGS.filter(s=>matches(s,advancedQuery)).map(s=><div key={s.key} className="space-y-2"><p className="text-xs text-cyan-200">{modules[s.module].name}{s.advanced?" · Advanced":" · Essential"}</p><SettingEditor definition={s} value={payload.settings[s.key]} onChange={v=>editSetting(s.key,v)}/><code className="block break-all text-[11px] text-slate-300">{s.key}</code></div>):CONFIG_FLAGS.filter(f=>matches(f,advancedQuery)).map(f=><FlagEditor key={f.key} definition={f} rule={payload.flags[f.key]} onChange={v=>editFlag(f.key,v)} expanded/>)}</div>{!(modal==="settings"?CONFIG_SETTINGS:CONFIG_FLAGS).some(s=>matches(s,advancedQuery))&&<Empty text="No controls match this search."/>}{issues.length>0&&<div className="mt-5 rounded-xl border border-amber-300/30 p-4 text-xs text-amber-100"><p className="mb-2 font-bold">Resolve before publishing</p><ul className="list-disc space-y-2 pl-4">{issues.map(issue=><li key={issue}>{issue}</li>)}</ul></div>}</ConfigDialog>}
    {modal==="review"&&<ConfigDialog title={draft?.restored_from?"Review restoration":"Review configuration release"} subtitle={`${environment.toUpperCase()} · Revision ${current.revision} → ${current.revision+1} · ${changes.length} changes`} onClose={()=>{if(!busy)setModal(null);}} footer={<><span className="text-xs text-slate-200">{critical} critical changes · Browser-local mock release</span><button className={primaryClass} disabled={busy||!!warning||stale||issues.length>0||!dirty||!confirmed||reason.trim().length<10||reason.trim().length>500} onClick={publish}>{busy?"Publishing…":`Publish to ${environment}`}</button></>}><div className="space-y-4">{issues.length>0&&<div role="alert" className="space-y-2 rounded-xl border border-amber-300/30 p-4 text-xs text-amber-100">{issues.map(issue=><p key={issue}>{issue}</p>)}<p>Return to the editors to resolve these issues.</p></div>}<ChangeList before={current.published} after={payload}/><label className="block space-y-2 text-[11px] text-white"><span>Change reason <span className="text-slate-300">· required, 10–500 characters</span></span><textarea className={`${inputClass} min-h-24`} maxLength={500} value={reason} disabled={busy} placeholder="Describe why this release is needed…" onChange={e=>setReason(e.target.value)}/></label><label className="flex items-start gap-3 rounded-xl border border-cyan-200/25 bg-cyan-400/5 p-4 text-[10px] leading-relaxed text-cyan-100"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-cyan-300" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/><span>I reviewed these changes and intend to publish them to <strong className="uppercase">{environment}</strong> in the local mock. {critical>0?"I also reviewed the critical controls listed above.":""}</span></label>{error&&<p role="alert" className="text-[11px] text-rose-200">{error}</p>}{stale&&<p role="alert" className="text-[11px] text-amber-100">A newer revision exists. Close this dialog and reload the latest configuration.</p>}</div></ConfigDialog>}
  </div>;
}
function Empty({text}:{text:string}) {return <p className="rounded-xl border border-dashed border-white/20 p-8 text-center text-[11px] leading-6 text-slate-200">{text}</p>;}
function ChangeList({before,after}:{before:ConfigPayload;after:ConfigPayload}) {
  const changes=configChanges(before,after);
  return <div className="space-y-3">{changes.length?changes.map(change=><div key={change.key} className="rounded-xl border border-white/15 bg-white/[0.025] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] font-semibold text-white">{change.name}</span>{change.critical&&<Badge tone="amber">Critical</Badge>}</div><code className="mt-2 block break-all text-[11px] text-slate-300">{change.key}</code><div className="mt-3 grid items-center gap-2 text-xs sm:grid-cols-[1fr_auto_1fr]"><span className="rounded-lg bg-white/5 p-3 text-slate-200">Before: {displayValue(change.before)}</span><ArrowRight size={14} className="hidden text-cyan-200 sm:block"/><span className="rounded-lg bg-cyan-400/10 p-3 text-cyan-100">After: {displayValue(change.after)}</span></div></div>):<Empty text="This snapshot is identical to the current published configuration."/>}</div>;
}
function FlagPreview({payload,dirty}:{payload:ConfigPayload;dirty:boolean}) {
  const [flag,setFlag]=useState(CONFIG_FLAGS[0].key), [subject,setSubject]=useState("customer-demo-001"), [audience,setAudience]=useState("all");
  const result=evaluateFlag(payload,flag,subject,audience);
  return <section className={`${panelClass} p-5`}><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-[11px] font-bold">Feature evaluation sandbox</h2><Badge>{dirty?"Draft evaluation":"Published evaluation"}</Badge></div><p className="mt-2 text-[10px] leading-relaxed text-slate-300">Preview audience, rollout, dependencies and master controls using a stable customer ID. The same ID always gets the same rollout bucket.</p><div className="mt-4 grid gap-3 @min-[800px]:grid-cols-3"><label className="space-y-2 text-xs text-slate-200"><span>Feature</span><ConfigSelect className={inputClass} value={flag} onChange={e=>setFlag(e.target.value)}>{CONFIG_FLAGS.map(f=><option key={f.key} value={f.key}>{f.name}</option>)}</ConfigSelect></label><label className="space-y-2 text-xs text-slate-200"><span>Stable customer ID</span><input maxLength={128} className={inputClass} value={subject} onChange={e=>setSubject(e.target.value)}/></label><label className="space-y-2 text-xs text-slate-200"><span>Customer audience</span><ConfigSelect className={inputClass} value={audience} onChange={e=>setAudience(e.target.value)}>{["all","premium","business","internal"].map(a=><option key={a}>{a}</option>)}</ConfigSelect></label></div><div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-4" role="status"><Badge tone={result.enabled?"green":"amber"}>{result.enabled?"Feature available":"Feature unavailable"}</Badge><span className="text-[10px] leading-relaxed text-slate-100">{result.reason}</span></div></section>;
}
