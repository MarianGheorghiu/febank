import type { ReactNode } from 'react';
export { IssuingPager as MarketPager, issuingInput as marketInput } from '../cards/IssuingUI';
export { issuingPage as marketPage } from '@/app/lib/card-issuing/engine';
export const marketRow = 'transition-[box-shadow] duration-200 hover:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.5)] focus-within:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.5)]';
export function MarketBadge({children}:{children:ReactNode}) {
  const value=String(children);
  const tone=['ACTIVE','HEALTHY','FILLED'].includes(value)?'border-cyan-400/20 bg-cyan-400/5 text-cyan-200':['HALTED','STALE','REJECTED'].includes(value)?'border-rose-400/20 bg-rose-400/5 text-rose-200':value==='CANCELLED'?'border-slate-400/20 text-slate-300':'border-amber-400/20 bg-amber-400/5 text-amber-200';
  return <span className={`inline-flex rounded-lg border px-2 py-1 text-[10px] ${tone}`}>{children}</span>;
}
export const marketMoney=(value:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:value<1?6:2}).format(value);
