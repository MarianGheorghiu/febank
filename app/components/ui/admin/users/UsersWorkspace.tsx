"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, RefreshCw, Search, ShieldCheck, UserRoundCheck, Users, UserX, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { useSessionMetadata } from "@/app/lib/session/use-session-metadata";
import { createUsersRepository } from "@/app/lib/user-management/repository";
import { usersCsv } from "@/app/lib/user-management/engine";
import { USERS_EVENT } from "@/app/lib/user-management/store";
import { CARDS_EVENT } from "@/app/lib/cards/repository";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import { RISK_EVENT } from "@/app/lib/risk/store";
import type { ManagedUser, UserCommand, UserDetail, UserRegistrySnapshot } from "@/app/lib/user-management/contracts";
import CardSurface from "../../CardSurface";
import PageHeader from "../../PageHeader";
import MetricCard from "../../MetricCard";
import { ActionButton } from "../../dashboard/ActionButton";
import OptionSelect from "../../dashboard/OptionSelect";
import { notifyOperation } from "../../OperationNotification";
import UserDirectory from "./UserDirectory";
import UserOperationsPanel from "./UserOperationsPanel";
import { initialLogs } from "@/app/lib/mock/admin/users";
import { userAuditEvent } from "@/app/lib/audit/adapters";
import UserProfilePanel from "./UserProfilePanel";
import UserOperationDialog, { type UserOperation } from "./UserOperationDialog";
import { userDate, userInput } from "./presentation";
const options=(items:[string,string][])=>items.map(([value,label])=>({value,label}));
export default function UsersWorkspace(){
  const {user,loading}=useUser();
  if(loading||!user)return null;
  if(user.role!=="admin")return <p role="alert" className="p-6 text-rose-300">Administrator access required.</p>;
  return <Workspace email={user.email}/>;
}
function Workspace({email}:{email:string}){
  const session=useSessionMetadata(email), repository=useMemo(()=>createUsersRepository({email,role:"admin"}),[email]);
  const [snapshot,setSnapshot]=useState<UserRegistrySnapshot|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState("");
  const [workspaceView,setWorkspaceView]=useState("DIRECTORY");
  const [query,setQuery]=useState(""),[status,setStatus]=useState("ALL"),[role,setRole]=useState("ALL"),[verification,setVerification]=useState("ALL"),[sort,setSort]=useState("NAME"),[page,setPage]=useState(0);
  const [selected,setSelected]=useState<string|null>(null),[detail,setDetail]=useState<UserDetail|null>(null),[detailBusy,setDetailBusy]=useState(false),[detailError,setDetailError]=useState(""),[detailReload,setDetailReload]=useState(0);
  const [operation,setOperation]=useState<UserOperation|null>(null);
  const generation=useRef(0),detailRef=useRef<HTMLDivElement>(null),registryRef=useRef<HTMLDivElement>(null),intent=useRef(false);
  const load=useCallback(async()=>{const current=++generation.current;setBusy(true);try{const next=await repository.getSnapshot();if(current===generation.current){setSnapshot(next);setError("");}}catch(cause){if(current===generation.current)setError(cause instanceof Error?cause.message:"Registry unavailable.");}finally{if(current===generation.current)setBusy(false);}},[repository]);
  useEffect(()=>{const refresh=()=>{void load();};const timer=window.setTimeout(refresh,0);window.addEventListener(USERS_EVENT,refresh);window.addEventListener("storage",refresh);window.addEventListener("focus",refresh);return()=>{window.clearTimeout(timer);
    // Request generation invalidates pending reads; it is not a DOM ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    generation.current++;window.removeEventListener(USERS_EVENT,refresh);window.removeEventListener("storage",refresh);window.removeEventListener("focus",refresh);};},[load]);
  useEffect(()=>{if(!selected)return;let cancelled=false;const controller=new AbortController();const run=()=>{setDetailBusy(true);setDetail(null);setDetailError("");repository.getDetail(selected,controller.signal).then(value=>{if(!cancelled)setDetail(value);}).catch(cause=>{if(!cancelled)setDetailError(cause instanceof Error?cause.message:"Related data unavailable.");}).finally(()=>{if(!cancelled)setDetailBusy(false);});};const timer=window.setTimeout(run,0);window.addEventListener(WALLET_EVENT,run);window.addEventListener(CARDS_EVENT,run);window.addEventListener(RISK_EVENT,run);return()=>{cancelled=true;window.clearTimeout(timer);controller.abort();window.removeEventListener(WALLET_EVENT,run);window.removeEventListener(CARDS_EVENT,run);window.removeEventListener(RISK_EVENT,run);};},[repository,selected,detailReload,snapshot?.revision]);
  useEffect(()=>{if(selected&&intent.current){detailRef.current?.scrollIntoView({block:"start"});detailRef.current?.focus({preventScroll:true});intent.current=false;}},[selected]);
  const users=useMemo(()=>snapshot?.users??[],[snapshot]);
  const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return users.filter(u=>(!q||[u.id,u.login_email,u.contact_email,u.legal_name,u.username,u.phone].some(v=>v.toLowerCase().includes(q)))&&(status==="ALL"||u.status===status)&&(role==="ALL"||role==="STAFF"&&u.role!=="CLIENT"||u.role===role)&&(verification==="ALL"||u.kyc_status===verification)).sort((a,b)=>sort==="RECENT"?b.updated_at.localeCompare(a.updated_at)||a.id.localeCompare(b.id):sort==="RISK"?({HIGH:0,MEDIUM:1,LOW:2}[a.risk_level]-{HIGH:0,MEDIUM:1,LOW:2}[b.risk_level])||a.legal_name.localeCompare(b.legal_name):a.legal_name.localeCompare(b.legal_name));},[users,query,status,role,verification,sort]);
  const activeUser=users.find(u=>u.id===selected),pageSize=8,currentPage=Math.min(page,Math.max(0,Math.ceil(filtered.length/pageSize)-1)),rows=filtered.slice(currentPage*pageSize,(currentPage+1)*pageSize);
  const disabled=busy||!!error;
  const userAudit=useMemo(()=>[...(snapshot?.audit??[]),...(snapshot?.mode==="demo"?initialLogs.map(log=>userAuditEvent(log)):[])].sort((a,b)=>b.timestamp.localeCompare(a.timestamp)),[snapshot]);
  const open=(u:ManagedUser)=>{intent.current=true;if(selected===u.id){detailRef.current?.scrollIntoView({block:"start"});detailRef.current?.focus({preventScroll:true});intent.current=false;}else setSelected(u.id);};
  const execute=async(command:UserCommand,key:string)=>{
    if(disabled)throw new Error("Refresh the registry before changing users.");
    const exportUsers=command.action==="EXPORT"?users.filter(u=>command.user_ids.includes(u.id)):[];
    try{
      const next=await repository.execute(command,key);setSnapshot(next);setDetailReload(v=>v+1);
      if(command.action==="EXPORT"){
        const ids=new Set(command.user_ids), content=command.format==="CSV"?usersCsv(exportUsers):JSON.stringify({schema_version:1,generated_at:new Date().toISOString(),generated_by:email,scope:{user_ids:command.user_ids,records:exportUsers.length},reason:command.reason,users:exportUsers,sessions:next.sessions.filter(s=>ids.has(s.user_id)),audit:next.audit.filter(a=>ids.has(a.target)||(a.action==="USER_EXPORT"&&a.correlationId===key))},null,2);
        const url=URL.createObjectURL(new Blob([content],{type:command.format==="CSV"?"text/csv;charset=utf-8":"application/json"}));const anchor=document.createElement("a");anchor.href=url;anchor.download=`mbank-users-${new Date().toISOString().slice(0,10)}.${command.format.toLowerCase()}`;anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
      if(command.action==="CREATE"){const created=next.users.find(u=>u.login_email===command.login_email.toLowerCase());if(created){intent.current=true;setSelected(created.id);}}
      notifyOperation(command.action==="EXPORT"?"User export prepared":"User record updated",command.action.startsWith("REQUEST_")?"Recovery request recorded. Authentication credentials were not changed.":"The shared registry and its audit history were saved together.",false,"User Management");
    }catch(cause){notifyOperation("User operation failed",cause instanceof Error?cause.message:"No changes were saved.",true,"User Management");throw cause;}
  };
  const reset=()=>{setQuery("");setStatus("ALL");setRole("ALL");setVerification("ALL");setSort("NAME");setPage(0);};
  return <div className="w-full min-w-0 space-y-4 text-white">
    <PageHeader statusText="User Management" sessionId={session.id} lastLogin={session.lastLogin}><ActionButton autoWidth variant="blue" disabled={busy} onClick={()=>void load()} icon={<RefreshCw size={13} className={busy?"animate-spin":""}/>}>Refresh</ActionButton><ActionButton autoWidth variant="purple" disabled={disabled||!filtered.length} onClick={()=>setOperation({mode:"EXPORT",user:null,user_ids:filtered.map(u=>u.id)})} icon={<Download size={13}/>}>Export {filtered.length?`(${filtered.length})`:"users"}</ActionButton><ActionButton autoWidth variant="cyan" disabled={disabled} onClick={()=>setOperation({mode:"CREATE",user:null})} icon={<Plus size={14}/>}>Create customer</ActionButton></PageHeader>

    {error&&<div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/5 p-4 text-xs leading-relaxed text-rose-200">{error} {snapshot&&"Previously loaded records remain visible. Changes and exports are disabled."}</div>}
    {!snapshot?<CardSurface className="p-8"><p role="status" className="text-center text-xs text-slate-300">{busy?"Loading shared user registry…":"Registry unavailable. Use Refresh to retry."}</p></CardSurface>:<>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard compact title="Registered identities" value={users.length} icon={Users} tone="blue" subtext={<span className="text-slate-300">Customers and staff in the shared registry</span>}/><MetricCard compact title="Active customers" value={users.filter(u=>u.role==="CLIENT"&&u.status==="ACTIVE").length} icon={UserRoundCheck} tone="cyan" subtext={<span className="text-slate-300">Account access enabled · KYC tracked separately</span>}/><MetricCard compact title="Verification review" value={users.filter(u=>u.role==="CLIENT"&&u.kyc_status!=="VERIFIED").length} icon={ShieldCheck} tone="amber" subtext={<span className="text-slate-300">Customer profiles requiring verification attention</span>}/><MetricCard compact title="Blocked identities" value={users.filter(u=>u.status==="BLOCKED").length} icon={UserX} tone="purple" subtext={<span className="text-slate-300">Sign-in and new customer operations blocked</span>}/></div>
      <nav aria-label="User administration areas" className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">{[["DIRECTORY","Users & profiles"],["VERIFICATION","Verification reviews"],["SECURITY","Access & security"],["AUDIT","History & reports"]].map(([value,label])=><ActionButton key={value} autoWidth variant={workspaceView===value?"cyan":"blue"} aria-pressed={workspaceView===value} onClick={()=>{setWorkspaceView(value);setSelected(null);}}>{label}</ActionButton>)}</nav>
      {workspaceView!=="DIRECTORY"&&<UserOperationsPanel view={workspaceView} snapshot={snapshot} audit={userAudit} disabled={disabled} onOpen={open} onAction={setOperation} onExport={()=>setOperation({mode:"EXPORT",user:null,user_ids:users.map(u=>u.id)})}/>}
      {workspaceView==="DIRECTORY"&&<div ref={registryRef} tabIndex={-1} className="scroll-mt-20 sm:scroll-mt-4"><CardSurface as="section" tone="blue" className="p-4 sm:p-5"><header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-100">User directory</h2><p className="mt-1 text-[11px] text-slate-400">{filtered.length} matching identities · metrics above cover the full registry</p></div><ActionButton autoWidth size="medium" variant="blue" onClick={reset}>Reset filters</ActionButton></header>
        <div className="mt-4 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(200px,2fr)_repeat(4,minmax(130px,1fr))]"><label className="relative block sm:col-span-2 xl:col-span-1"><span className="sr-only">Search users</span><Search aria-hidden size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className={`${userInput} pl-9 pr-9 text-xs`} type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder="Search name, email, ID or phone…"/>{query&&<button type="button" aria-label="Clear user search" className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-white" onClick={()=>{setQuery("");setPage(0);}}><X size={13}/></button>}</label>
        <OptionSelect label="Filter users by status" value={status} options={options([["ALL","All statuses"],["ACTIVE","Active"],["BLOCKED","Blocked"]])} onChange={v=>{setStatus(v);setPage(0);}}/>
        <OptionSelect label="Filter users by role" value={role} options={options([["ALL","All roles"],["CLIENT","Customers"],["STAFF","All staff"],["ADMIN","Administrators"]])} onChange={v=>{setRole(v);setPage(0);}}/>
        <OptionSelect label="Filter users by verification" value={verification} options={options([["ALL","All verification"],["VERIFIED","Verified"],["IN_REVIEW","In review"],["REJECTED","Rejected"]])} onChange={v=>{setVerification(v);setPage(0);}}/>
        <OptionSelect label="Sort user directory" value={sort} options={options([["NAME","Name A–Z"],["RECENT","Recently updated"],["RISK","Highest risk first"]])} onChange={v=>{setSort(v);setPage(0);}}/></div>
        <UserDirectory rows={rows} selected={selected} disabled={disabled} onOpen={open} onEdit={u=>setOperation({mode:"PROFILE",user:u})} onAccess={u=>setOperation({mode:"ACCESS",user:u})}/>
        {!rows.length&&<p role="status" className="py-10 text-center text-xs text-slate-400">No users match these filters.</p>}
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"><p className="text-[10px] text-slate-400">{filtered.length?`${currentPage*pageSize+1}–${Math.min((currentPage+1)*pageSize,filtered.length)}`:"0"} of {filtered.length} · {userDate(snapshot.as_of)}</p><div className="flex gap-2"><ActionButton autoWidth size="medium" variant="blue" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</ActionButton><ActionButton autoWidth size="medium" variant="blue" disabled={(currentPage+1)*pageSize>=filtered.length} onClick={()=>setPage(currentPage+1)}>Next</ActionButton></div></footer>
      </CardSurface></div>}
      {activeUser&&<div ref={detailRef} tabIndex={-1} className="scroll-mt-20 sm:scroll-mt-4"><UserProfilePanel asOf={snapshot.as_of} key={activeUser.id} user={activeUser} sessions={snapshot.sessions.filter(s=>s.user_id===activeUser.id)} audit={userAudit.filter(a=>a.target===activeUser.id||(a.action==="USER_EXPORT"&&typeof a.after==="object"&&a.after!==null&&"user_ids" in a.after&&Array.isArray(a.after.user_ids)&&a.after.user_ids.includes(activeUser.id)))} detail={detail?.user_id===activeUser.id?detail:null} detailError={detailError} loading={detailBusy} disabled={disabled} onRetry={()=>setDetailReload(v=>v+1)} onAction={setOperation} onClose={()=>{setSelected(null);registryRef.current?.scrollIntoView({block:"start"});registryRef.current?.focus({preventScroll:true});}}/></div>}
      <p className="border-t border-white/10 pt-3 text-[10px] leading-relaxed text-slate-400">{snapshot.mode==="demo"?"Shared browser demo · profile changes and audit persist in local storage · observed wallets remain session-scoped":"Authenticated user service"} · Profile edits do not change booked balances. All displayed dates use Europe/Bucharest.</p>
      {operation&&<UserOperationDialog operation={operation} revision={snapshot.revision} onClose={()=>setOperation(null)} onExecute={execute}/>}
    </>}
  </div>;
}
