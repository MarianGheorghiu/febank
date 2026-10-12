"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CONFIG_FLAGS } from "@/app/lib/mock/admin/flags-config";
import type { ConfigModule, ConfigPayload } from "@/app/lib/types/admin/flags-config";
import { AuditPanel } from "../audit/presentation";
import { modules } from "./presentation";

export default function ConfigCoverage({payload,module}:{payload:ConfigPayload;module:ConfigModule|"all"}) {
  const flags=CONFIG_FLAGS.filter(flag=>module==="all"||flag.module===module);
  const enabled=flags.filter(flag=>payload.flags[flag.key].enabled);
  const partial=enabled.filter(flag=>payload.flags[flag.key].rollout_pct<100);
  const series=[
    {name:"Full rollout",value:enabled.length-partial.length,color:"#22d3ee"},
    {name:"Partial rollout",value:partial.length,color:"#a5b4fc"},
    {name:"Disabled",value:flags.length-enabled.length,color:"#fbbf24"},
  ];
  return <AuditPanel title="Feature rollout distribution" subtitle={`${module==="all"?"All platform domains":modules[module].name} · configured availability, before audience evaluation.`}>
    <div className="grid min-h-40 grid-cols-2 items-center gap-2 p-3">
      <div className="relative h-40 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:180,height:160}}><PieChart accessibilityLayer><Pie data={flags.length?series:[{name:"No flags",value:1,color:"#334155"}]} nameKey="name" dataKey="value" innerRadius={44} outerRadius={61} paddingAngle={3} stroke="transparent" isAnimationActive={false}>{(flags.length?series:[{name:"No flags",value:1,color:"#334155"}]).map(item=><Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip contentStyle={{backgroundColor:"#03091e",border:"1px solid #155e75",borderRadius:8,fontSize:10}} itemStyle={{color:"#f1f5f9"}}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-black text-white">{flags.length}</span><span className="text-[9px] uppercase text-slate-200">Flags</span></div></div>
      <div className="space-y-3 text-[10px]">{series.map(item=><div key={item.name} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-slate-100"><span className="size-1.5 shrink-0 rounded-full" style={{backgroundColor:item.color}}/>{item.name}</span><strong className="text-white">{item.value}</strong></div>)}<p className="border-t border-cyan-500/15 pt-3 text-[9px] leading-relaxed text-slate-200">{enabled.filter(flag=>payload.flags[flag.key].audience!=="all").length} enabled flags have a restricted audience.</p></div>
    </div>
  </AuditPanel>;
}
