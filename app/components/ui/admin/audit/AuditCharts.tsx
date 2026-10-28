"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AUDIT_SOURCES, type AuditFilters, type AuditEvent } from "@/app/lib/types/admin/audit";
import OutcomeBreakdown from "./OutcomeBreakdown";
import { auditTimeline, groupAudit } from "@/app/lib/audit/engine";
import { AuditPanel, AuditSelect, auditFieldClass, EmptyAudit } from "./presentation";

const colors=["#22d3ee","#818cf8","#38bdf8","#2dd4bf","#a78bfa","#60a5fa","#fbbf24","#fb7185","#94a3b8"];
const outcomeColors: Record<string,string>={SUCCESS:"#22d3ee",DENIED:"#fbbf24",FAILED:"#fb7185"};
const tooltip={contentStyle:{backgroundColor:"#03091e",border:"1px solid #155e75",borderRadius:8,fontSize:11,color:"#e2e8f0"},itemStyle:{color:"#e2e8f0"},labelStyle:{color:"#67e8f9"}};
function DataTable({rows}: {rows:{name:string;count:number}[]}) {
  return <details className="mt-auto border-t border-cyan-500/15 px-4 py-3 text-[10px] text-slate-400"><summary className="cursor-pointer text-cyan-300">View chart data</summary><div className="max-h-64 overflow-auto"><table className="mt-3 w-full text-left"><thead><tr><th className="py-2">Series</th><th className="text-right">Events</th></tr></thead><tbody>{rows.map(row=><tr key={row.name}><td className="py-1.5 break-all">{row.name}</td><td className="text-right text-white">{row.count}</td></tr>)}</tbody></table></div></details>;
}
export default function AuditCharts({events,from,to,timeZone,filters,actors:actorOptions,onFilter,compact=false}: {filters:AuditFilters;actors:string[];compact?:boolean;events:AuditEvent[];from:number;to:number;timeZone:string;onFilter:(key:"source"|"actor"|"outcome",value:string)=>void}) {
  const timeline=auditTimeline(events,from,to);
  const hourly=to-from<=86400000;
  const buckets=timeline.map(b=>({...b,label:new Intl.DateTimeFormat("en-GB",hourly?{hour:"2-digit",minute:"2-digit",timeZone}:{day:"2-digit",month:"short",timeZone}).format(b.start)}));
  const sources=groupAudit(events,"source"); const outcomes=groupAudit(events,"outcome"); const actors=groupAudit(events.filter(e=>e.actorRole==="ADMIN"),"actor").slice(0,5);
  const filterSelect=(label:string,key:"source"|"outcome"|"actor",options:readonly string[])=><label className={`${auditFieldClass} border-t border-cyan-500/15 px-4 py-3`}><span>{label}</span><AuditSelect aria-label={label} value={filters[key]} onChange={e=>onFilter(key,e.target.value)}><option value="ALL">All {key==="actor"?"actors":key==="source"?"sources":"outcomes"}</option>{options.map(value=><option key={value} value={value}>{value}</option>)}</AuditSelect></label>;
  return <div className="grid items-stretch gap-4 lg:grid-cols-2">
    <AuditPanel className="flex h-full flex-col [&>header]:lg:min-h-26" title="Event activity over time" subtitle={`Stacked outcomes · ${hourly?"hourly":"daily / multi-day"} buckets · ${timeZone}. Empty intervals are included.`}>
      {events.length?<div className="h-64 min-w-0 grow p-3"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:320,height:232}}><AreaChart data={buckets} margin={{top:12,right:8,left:-18,bottom:0}} accessibilityLayer>
        <CartesianGrid stroke="#164e63" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tick={{fill:"#94a3b8",fontSize:9}} minTickGap={24} tickLine={false}/><YAxis allowDecimals={false} tick={{fill:"#94a3b8",fontSize:9}} tickLine={false}/>
        <Tooltip {...tooltip} labelFormatter={(_,payload)=>{const start=payload[0]?.payload?.start;return typeof start==="number"?new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone}).format(start):"Interval";}}/>
        <Area isAnimationActive={false} type="monotone" dataKey="success" name="Success" stackId="events" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2}/><Area isAnimationActive={false} type="monotone" dataKey="denied" name="Denied" stackId="events" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.25}/><Area isAnimationActive={false} type="monotone" dataKey="failed" name="Failed" stackId="events" stroke="#fb7185" fill="#fb7185" fillOpacity={0.3}/>
      </AreaChart></ResponsiveContainer></div>:<EmptyAudit text="No events in the selected time range."/>}
      <div className="flex flex-wrap gap-4 px-4 pb-3 text-[10px]">{Object.entries(outcomeColors).map(([name,color])=><span key={name} style={{color}}>● {name}</span>)}</div>
      <DataTable rows={buckets.map(b=>({name:`${new Date(b.start).toISOString()} · Success ${b.success} / Denied ${b.denied} / Failed ${b.failed}`,count:b.total}))}/>
    </AuditPanel>
    {!compact && <AuditPanel className="flex h-full flex-col [&>header]:lg:min-h-26" title="Events by source" subtitle="Source distribution for the current filters. Select a source to filter; choose All sources to restore the scope.">
      {sources.length?<div className="h-64 min-w-0 grow p-3"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:320,height:232}}><BarChart data={sources} layout="vertical" margin={{top:4,right:20,left:0,bottom:0}} accessibilityLayer><CartesianGrid stroke="#164e63" strokeDasharray="3 3" horizontal={false}/><XAxis type="number" allowDecimals={false} tick={{fill:"#94a3b8",fontSize:9}}/><YAxis type="category" dataKey="name" width={92} tick={{fill:"#94a3b8",fontSize:9}} tickLine={false}/><Tooltip {...tooltip} cursor={{fill:"#22d3ee0a"}}/><Bar isAnimationActive={false} dataKey="count" name="Events" radius={[0,4,4,0]}>{sources.map((row,index)=><Cell key={row.name} fill={colors[index%colors.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>:<EmptyAudit text="No source activity matches."/>}
      {filterSelect("Filter source","source",AUDIT_SOURCES)}<DataTable rows={sources}/>
    </AuditPanel>}
    <AuditPanel className="flex h-full flex-col [&>header]:lg:min-h-26" title="Outcome distribution" subtitle="Denied operations were blocked by a policy; failed operations encountered an error. These are distinct outcomes.">
      {events.length?<OutcomeBreakdown events={events} from={from} to={to} timeZone={timeZone} selected={filters.outcome} onSelect={value=>onFilter('outcome',value)}/>:<EmptyAudit text="No outcome data matches."/>}<DataTable rows={outcomes}/>
    </AuditPanel>
    {!compact && <AuditPanel className="flex h-full flex-col [&>header]:lg:min-h-26" title="Privileged actor activity" subtitle="Top five recorded ADMIN actors by event count; activity volume does not establish suspicious behavior.">
      {actors.length?<div className="space-y-4 p-4">{actors.map((a,index)=><div key={a.name} className="block w-full rounded-lg border border-white/10 bg-[#03091e] p-3 text-left"><span className="mb-3 flex justify-between gap-3 text-[11px]"><span className="break-all text-slate-300">{a.name}</span><span className="text-cyan-300">{a.count}</span></span><span className="block h-1.5 rounded-full bg-white/5"><span className="block h-full rounded-full" style={{width:`${a.count/actors[0].count*100}%`,backgroundColor:colors[index]}}/></span></div>)}</div>:<EmptyAudit text="No administrator events match."/>}{filterSelect("Filter actor","actor",actorOptions)}<DataTable rows={actors}/>
    </AuditPanel>}
  </div>;
}
