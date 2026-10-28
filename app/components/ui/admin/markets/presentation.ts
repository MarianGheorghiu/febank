export { formatCardDate } from '../cards/presentation';
export const panelClass = 'relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-blue-500/10 to-[#080f20] shadow-lg';
export const inputClass = 'w-full min-w-0 rounded-xl border border-white/10 bg-[#080f20] px-3 py-3 text-xs text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 disabled:opacity-40';
export const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-b from-blue-500/10 to-[#080f20] px-3 py-2 text-[11px] font-semibold text-blue-200 transition hover:border-blue-400/50 hover:shadow-[0_8px_24px_rgba(59,130,246,0.12)] focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer';
export const primaryButtonClass = buttonClass.replaceAll('blue', 'cyan');
export const dangerButtonClass = buttonClass.replaceAll('blue', 'rose');
