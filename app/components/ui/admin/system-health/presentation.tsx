import type { ServiceStatus } from "@/app/lib/types/admin/system-health";
export const statusLabels: Record<ServiceStatus, string> = { OPERATIONAL: "Operational", DEGRADED: "Degraded", OUTAGE: "Outage", UNKNOWN: "No fresh signal" };
export const statusTone: Record<ServiceStatus, string> = {
  OPERATIONAL: "border-emerald-500/25 bg-emerald-500/5 text-emerald-300",
  DEGRADED: "border-amber-500/30 bg-amber-500/5 text-amber-300",
  OUTAGE: "border-rose-500/30 bg-rose-500/5 text-rose-300",
  UNKNOWN: "border-slate-500/30 bg-slate-500/5 text-slate-300",
};
export function Status({ value }: { value: ServiceStatus }) {
  return <span className={`inline-flex min-h-6 shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium ${statusTone[value]}`}><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current"/>{statusLabels[value]}</span>;
}
export const percent = (n: number | null) => n === null ? "N/A" : `${n.toFixed(2)}%`;
export const time = (s: string) => Number.isFinite(Date.parse(s)) ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(s)) : "Unavailable";
