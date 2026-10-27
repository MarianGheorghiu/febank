import type { ReactNode } from 'react';
export const rateInput='w-full min-h-11 rounded-xl border border-white/10 bg-[#060d1d] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50';
export const rateLabel='flex min-w-0 flex-col gap-2 text-[11px] font-medium text-slate-300';
export const rateMoney=(minor:number)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'USD'}).format(minor===0?0:minor/100);
export const ratePercent=(bps:number)=>`${(bps/100).toFixed(2)}%`;
export const rateDate=(date:string)=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bucharest'}).format(new Date(date));
export function RateBadge({children,tone='cyan'}:{children:ReactNode;tone?:'cyan'|'amber'|'rose'|'purple'}){const colors={cyan:'border-cyan-400/20 bg-cyan-400/5 text-cyan-200',amber:'border-amber-400/20 bg-amber-400/5 text-amber-200',rose:'border-rose-400/20 bg-rose-400/5 text-rose-200',purple:'border-purple-400/20 bg-purple-400/5 text-purple-200'};return <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-medium ${colors[tone]}`}>{children}</span>;}
