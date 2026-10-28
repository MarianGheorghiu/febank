import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputClass } from './presentation';
export default function MarketSelect({className='',children,...props}:SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className="relative block min-w-0"><select {...props} className={`${inputClass} min-h-11 cursor-pointer appearance-none pr-9 ${className}`}>{children}</select><ChevronDown aria-hidden size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/></span>;
}
