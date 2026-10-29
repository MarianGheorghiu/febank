import { Minus, Plus } from 'lucide-react';
import { businessMoney, earningsBridge, type BusinessAnalysis } from '@/app/lib/business-analytics/engine';
import { AuditPanel } from '../audit/presentation';
import { costLabels } from './presentation';

export default function EarningsBridge({analysis}: {analysis: BusinessAnalysis}) {
  const rows = earningsBridge(analysis), c = analysis.current;
  const minimum = Math.min(0, ...rows.map(r => r.after_minor)), maximum = Math.max(0, ...rows.map(r => r.after_minor)), extent = Math.max(1, maximum - minimum);
  const zero = (0 - minimum) / extent * 100;
  return <AuditPanel title="From income to operating result" subtitle="Each bar shows the balance remaining after one deduction. Gross income minus refunds and all costs equals the final result before tax.">
    <div className="grid grid-cols-1 gap-3 border-b border-white/10 p-4 sm:grid-cols-3 sm:p-5">{[['Gross recognized income', c.grossRevenue], ['Refunds + all costs', c.refunds + c.totalCosts], ['Operating result · before tax', c.operatingResult]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-slate-200">{label}</p><p className={`mt-2 text-xl font-semibold ${Number(value) < 0 ? 'text-rose-200' : 'text-white'}`}>{businessMoney(Number(value), true)}</p></div>)}</div>
    <div className="space-y-4 p-4 sm:p-5">{rows.map(row => {
      const balance = row.after_minor, left = (Math.min(0, balance) - minimum) / extent * 100, width = Math.abs(balance) / extent * 100;
      const final = row.key === 'result', label = costLabels[row.key] ?? row.label;
      return <div key={row.key} className={`grid gap-x-5 gap-y-2 ${final ? 'border-t border-white/15 pt-4' : ''} lg:grid-cols-[180px_140px_minmax(0,1fr)_160px]`}>
        <div className="flex items-center justify-between gap-3 lg:contents"><h3 className={`text-xs font-semibold ${final ? 'text-cyan-100' : 'text-slate-100'}`}>{label}</h3><p className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${final ? balance < 0 ? 'text-rose-200' : 'text-cyan-100' : row.delta < 0 ? 'text-amber-200' : 'text-slate-100'}`}>{!final && (row.delta < 0 ? <Minus size={12}/> : <Plus size={12}/>)}{businessMoney(final ? row.delta : Math.abs(row.delta))}</p></div>
        <div role="img" aria-label={`${label}: ${businessMoney(row.delta)}; balance remaining ${businessMoney(balance)}`} className="relative my-1 h-3 rounded-full border border-white/5 bg-white/[0.035]"><span className="absolute inset-y-[-3px] w-px bg-white/40" style={{left: `${zero}%`}}/><span className={`absolute inset-y-0 rounded-full ${balance < 0 ? 'bg-gradient-to-r from-rose-500 to-rose-200' : final ? 'bg-gradient-to-r from-cyan-500 to-cyan-200' : row.total ? 'bg-gradient-to-r from-sky-500 to-sky-200' : 'bg-gradient-to-r from-violet-500 to-violet-200'}`} style={{left: `${left}%`, width: `${width}%`}}/></div>
        <p className="text-right text-xs text-slate-200"><span className="mr-2 text-[11px] lg:hidden">Balance:</span><strong className={balance < 0 ? 'text-rose-200' : 'text-white'}>{businessMoney(balance)}</strong></p>
      </div>;
    })}</div>
    <p className="border-t border-white/10 px-5 py-4 text-xs leading-relaxed text-slate-200">Amounts on the left show the income or deduction at each step. Amounts on the right show the resulting balance. Bars share one scale; negative balances extend left of zero. Direct lending costs include funding interest.</p>
  </AuditPanel>;
}
