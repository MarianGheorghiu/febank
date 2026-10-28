'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, CircleDollarSign, Coins, History, LayoutDashboard, ListOrdered, Plus, RefreshCw, ShieldAlert, SlidersHorizontal, Users } from 'lucide-react';
import { useUser } from '@/app/context/UserContext';
import { useRatesSource } from '@/app/lib/rates/use-rates';
import { useMarketOperationsSource } from '@/app/lib/markets/use-operations';
import type { MarketActor, MarketDomain, TradingInstrument } from '@/app/lib/types/admin/markets';
import PageHeader from '../../PageHeader';
import CardSurface from '../../CardSurface';
import MetricCard from '../../MetricCard';
import { ActionButton } from '../../dashboard/ActionButton';
import { notifyOperation } from '../../OperationNotification';
import MarketOperationDialog, { type MarketIntent } from './MarketOperationDialog';
import MarketInsights from './MarketInsights';
import MarketRegistry from './MarketRegistry';
import MarketOrders from './MarketOrders';
import MarketAuditTrail from './MarketAuditTrail';
import MarketDetails from './MarketDetails';
import { MarketBadge } from './MarketUI';
const tabs=[['overview','Overview',LayoutDashboard],['instruments','Pools & controls',Coins],['orders','Customer orders',ListOrdered],['audit','Operational audit',History]] as const;
export default function MarketOperationsPage({domain}:{domain:MarketDomain}) {
 const {user,loading}=useUser();
 if(loading||!user)return null;
 if(user.role!=='admin')return <CardSurface className="p-6 text-center text-sm text-rose-200"><ShieldAlert className="mx-auto mb-3"/><p>Administrator access required.</p><Link href="/dashboard" className="mt-4 inline-block text-cyan-300">Return to dashboard</Link></CardSurface>;
 return <Workspace domain={domain} actor={user}/>;
}
function Workspace({domain,actor}:{domain:MarketDomain;actor:MarketActor}) {
 const source=useMarketOperationsSource(actor),state=source.state,pricing=useRatesSource();
 const [tab,setTab]=useState('overview'),[selectedId,setSelectedId]=useState<string|null>(null),[intent,setIntent]=useState<MarketIntent|null>(null),[auditScope,setAuditScope]=useState<'ALL'|'SELECTED'>('ALL'),[auditKey,setAuditKey]=useState(0);
 const details=useRef<HTMLDivElement>(null),scrollIntent=useRef(false);
 useEffect(()=>{if(selectedId&&scrollIntent.current){details.current?.scrollIntoView({block:'start'});details.current?.focus({preventScroll:true});scrollIntent.current=false;}},[selectedId,tab]);
 const title=domain==='CRYPTO'?'Crypto Pools':'Stock & Markets',assets=state.instruments.filter(i=>i.domain===domain),orders=state.orders.filter(o=>o.domain===domain),audit=state.audit.filter(e=>e.domain===domain),selected=assets.find(i=>i.symbol===selectedId),routing=state.routing[domain],disabled=source.busy||!!source.error;
 const feePolicy=pricing.snapshot.active.policies.find(p=>p.operation===(domain==='CRYPTO'?'CRYPTO_TRADE':'STOCK_TRADE'));
 const feeSummary=pricing.warning||!feePolicy?'Pricing unavailable':`${feePolicy.brackets[0]?.rate_bps??feePolicy.rate_bps} bps${feePolicy.brackets.length?' progressive':''} · spread ${feePolicy.spread_bps} bps`;
 const low=(item:TradingInstrument)=>Math.min(item.reserveUnits*item.priceUsd,item.reserveUsd)<item.lowLiquidityUsd;
 const open=(symbol:string)=>{scrollIntent.current=true;if(selectedId===symbol&&tab==='instruments'){details.current?.scrollIntoView({block:'start'});details.current?.focus({preventScroll:true});scrollIntent.current=false;}setSelectedId(symbol);setTab('instruments');};
 const exportRows=(rows:TradingInstrument[])=>{if(disabled)return;try{const cell=(value:string|number)=>`"${String(value).replace(/^[=+\-@\t\r]/,"'$&").replaceAll('"','""')}"`;const content=[['Symbol','Name','Status','Reference USD','Quote health','Base reserve','USD reserve'],...rows.map(i=>[i.symbol,i.name,i.status,i.priceUsd,i.quoteStatus,i.reserveUnits,i.reserveUsd])].map(row=>row.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`${domain.toLowerCase()}-${domain==='CRYPTO'?'pools':'instruments'}.csv`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);notifyOperation(domain==='CRYPTO'?'Pool export prepared':'Instrument export prepared',`${rows.length} filtered records.`,false,title);}catch{notifyOperation('Export failed','The pool registry could not be exported.',true,title);}};
 return <div className="w-full min-w-0 space-y-4 text-white"><PageHeader statusText={title}><ActionButton autoWidth variant="blue" disabled={source.busy} icon={<RefreshCw size={13} className={source.busy?'animate-spin':''}/>} onClick={()=>void source.refresh()}>Refresh</ActionButton><ActionButton autoWidth variant="cyan" disabled={disabled||!source.ready} icon={<Plus size={13}/>} onClick={()=>setIntent({action:'CREATE',domain})}>Register {domain==='CRYPTO'?'pool':'instrument'}</ActionButton></PageHeader>
 {source.error&&<p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-xs leading-relaxed text-rose-200">{source.error} {source.ready&&'Previously loaded records remain visible. Changes and exports are disabled.'}</p>}
 {!source.ready?<CardSurface className="p-10 text-center text-xs text-slate-300"><p role="status">{source.busy?'Loading shared execution pools…':'Market registry unavailable. Refresh to retry.'}</p></CardSurface>:<>
 <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard compact title="Instruments" value={assets.length} icon={Coins} tone="blue" subtext={`${assets.filter(i=>i.status==='ACTIVE'&&i.quoteStatus==='HEALTHY').length} active with approved quotes`}/><MetricCard compact title="USD liquidity" value={new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(assets.reduce((sum,i)=>sum+i.reserveUsd,0))} icon={CircleDollarSign} tone="cyan" subtext="Observed customer settlements included"/><MetricCard compact title="Risk alerts" value={assets.filter(i=>low(i)||i.quoteStatus==='STALE'||i.status!=='ACTIVE').length} icon={ShieldAlert} tone="amber" subtext="Liquidity, quote or availability"/><MetricCard compact title="Pending orders" value={orders.filter(o=>o.status==='PENDING').length} icon={Users} tone="purple" subtext={`${orders.filter(o=>o.status==='FILLED').length} filled customer orders`}/></div>
 <nav aria-label="Market operations views" className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">{tabs.map(([value,label,Icon])=><ActionButton key={value} autoWidth className="shrink-0" labelClassName="whitespace-nowrap" variant={tab===value?'cyan':'blue'} aria-pressed={tab===value} icon={<Icon size={13}/>} onClick={()=>{setTab(value);if(value==='audit'){setAuditScope('ALL');setAuditKey(k=>k+1);}}}>{value==='instruments'&&domain==='STOCK'?'Instruments & controls':label}</ActionButton>)}</nav>
 {tab==='overview'&&<><MarketInsights state={state} domain={domain} onManage={open}/><CardSurface className="p-4 sm:p-5"><header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold"><Activity size={15} className="text-cyan-300"/>Customer order routing <MarketBadge>{routing.status}</MarketBadge></h2><p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-slate-400">{routing.status==='ACTIVE'?'Buy and sell routing enabled. Instrument controls still apply.':routing.status==='SELL_ONLY'?'Purchases are blocked. Eligible sell orders can execute.':'All executions suspended. Pending reservations are retained.'}{domain==='STOCK'&&' Manual session control; exchange calendars and broker feeds are not connected.'}</p></div><ActionButton autoWidth variant="cyan" disabled={disabled} icon={<SlidersHorizontal size={13}/>} onClick={()=>setIntent({action:'ROUTING',domain})}>Configure routing</ActionButton></header></CardSurface></>}
 {tab==='instruments'&&<MarketRegistry domain={domain} assets={assets} selected={selectedId} disabled={disabled} fee={feeSummary} onManage={open} onExport={exportRows}/>}
 {tab==='orders'&&<MarketOrders orders={orders} disabled={disabled} onCancel={order=>setIntent({action:'CANCEL',order})} onProcess={()=>setIntent({action:'PROCESS',domain})}/>}
 {tab==='audit'&&<MarketAuditTrail key={auditKey} entries={audit} selected={selectedId} initialScope={auditScope} domain={domain}/>}
 {selected&&tab==='instruments'&&<div ref={details} tabIndex={-1} className="scroll-mt-20 sm:scroll-mt-4"><MarketDetails item={selected} state={state} fee={feeSummary} disabled={disabled} onAction={setIntent} onClose={()=>setSelectedId(null)} onAudit={()=>{setAuditScope('SELECTED');setAuditKey(k=>k+1);setTab('audit');}}/></div>}
 <p className="border-t border-white/10 pt-3 text-[10px] leading-relaxed text-slate-400">{source.mode==='demo'?'Shared browser demo · dedicated demo customer orders use the common wallet · no exchange or custody connected':'Authenticated market operations service'} · display timezone Europe/Bucharest.</p>
 {intent&&<MarketOperationDialog key={intent.action+('instrument' in intent?intent.instrument.symbol:'order' in intent?intent.order.id:'new')} intent={intent} state={state} actor={actor} onClose={()=>setIntent(null)} onConfirm={async(command,key)=>{try{const next=await source.execute(command,key);if(command.action==='CREATE')open(command.instrument.symbol);const processed=command.action==='PROCESS'?next.orders.filter(o=>o.domain===domain&&o.status==='FILLED').length-orders.filter(o=>o.status==='FILLED').length:null;notifyOperation('Market operation applied',processed===null?'Shared trading controls updated. Operator and reason recorded in audit.':`${processed} orders filled. Review the queue for restricted orders.`,false,title);}catch(cause){notifyOperation('Operation not applied',cause instanceof Error?cause.message:'Review the operation.',true,title);throw cause;}}}/>}
 </>}
 </div>;
}
