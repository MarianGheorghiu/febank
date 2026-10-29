import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { businessChange, businessMoney, businessNumber } from '@/app/lib/business-analytics/engine';

export function Change({current, previous, money = false, snapshot = false, lowerIsBetter = false}: {current: number; previous: number; money?: boolean; snapshot?: boolean; lowerIsBetter?: boolean}) {
  const delta = businessChange(current, previous), better = lowerIsBetter ? delta.absolute < 0 : delta.absolute > 0;
  const Icon = delta.absolute > 0 ? ArrowUpRight : delta.absolute < 0 ? ArrowDownRight : Minus;
  return <div className="space-y-1 text-[11px]"><span className={`inline-flex flex-wrap items-center gap-1 ${delta.absolute === 0 ? 'text-slate-300' : better ? 'text-teal-200' : 'text-amber-200'}`}><Icon size={12} className="shrink-0"/>{delta.percent === null ? 'No comparable baseline' : `${delta.percent > 0 ? '+' : ''}${delta.percent.toFixed(1)}%`}<span className="text-slate-300">{snapshot ? 'vs prior close' : 'vs prior period'}</span></span><p className="text-slate-300">Δ {delta.absolute > 0 ? '+' : ''}{money ? businessMoney(delta.absolute, true) : businessNumber(delta.absolute)}</p></div>;
}
export function NumberGrid({values}: {values: [string, string, string?][]}) {
  return <dl className="grid grid-cols-2 gap-4 p-4 sm:p-5 lg:grid-cols-4">{values.map(([label, value, note]) => <div key={label} className="min-w-0"><dt className="text-[10px] text-slate-300">{label}</dt><dd className="mt-2 break-words text-base font-semibold text-slate-100">{value}</dd>{note && <p className="mt-2 text-[10px] leading-relaxed text-slate-300">{note}</p>}</div>)}</dl>;
}
