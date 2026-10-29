import { ArrowRight } from 'lucide-react';
import { configChanges } from '@/app/lib/flags-config/engine';
import { CONFIG_FLAGS, CONFIG_SETTINGS } from '@/app/lib/flags-config/catalog';
import type { ConfigPayload } from '@/app/lib/types/admin/flags-config';
import { Badge, displayValue, modules } from './presentation';
export default function ConfigChanges({before, after}: {before: ConfigPayload; after: ConfigPayload}) {
  const changes = configChanges(before, after);
  return <div className="scrollbar-thin max-h-80 space-y-3 overflow-y-auto overscroll-contain pr-1" role="region" aria-label="Configuration changes" tabIndex={0}>{changes.map(c => {const definition = CONFIG_SETTINGS.find(d => d.key === c.key), domain = definition?.module ?? CONFIG_FLAGS.find(d => d.key === c.key)!.module; return <article key={c.key} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold">{c.name}</h3>{c.critical && <Badge tone="amber">Critical</Badge>}</div><p className="mt-2 break-all text-[11px] text-slate-400">{modules[domain].name} · {c.key}</p><div className="mt-3 grid items-center gap-2 text-xs sm:grid-cols-[1fr_auto_1fr]"><div className="rounded-lg bg-white/5 p-3"><p className="mb-1 text-[10px] text-slate-400">Before</p>{displayValue(c.before, definition?.unit)}</div><ArrowRight size={14} aria-hidden className="hidden text-cyan-200 sm:block"/><div className="rounded-lg bg-cyan-400/5 p-3"><p className="mb-1 text-[10px] text-cyan-200">After</p>{displayValue(c.after, definition?.unit)}</div></div></article>;})}{!changes.length && <p className="p-5 text-xs text-slate-300">No differences from the selected version.</p>}</div>;
}
