"use client";
import { useRef, useState } from "react";
import { CalendarClock, Plus, Pause, Play, Pencil } from "lucide-react";
import CardSurface from "../CardSurface";
import SocialDialog, { socialField, socialLabel } from "../friends/SocialDialog";
import AssetSelect from "../currencies/AssetSelect";
import { ActionButton } from "../dashboard/ActionButton";
import { notifyOperation } from "../OperationNotification";
import { StockTitle, StockSearch, Pager, Empty, Segments, match, money, dateLabel, smallButton } from "./StockUI";
import type { PlanFrequency, StockPlan, StockPlanCommand, StockPlanDraft, StocksRepository, StocksSnapshot } from "@/app/lib/stocks/contracts";
export default function RecurringBuys({ snapshot, repository, onComplete }: { snapshot: StocksSnapshot; repository: StocksRepository; onComplete: (value: StocksSnapshot) => void }) {
  const [search, setSearch] = useState(""), [page, setPage] = useState(0), [edit, setEdit] = useState<StockPlan | "new" | null>(null), [busy, setBusy] = useState<string | null>(null);
  const keys = useRef(new Map<string, string>());
  const plans = snapshot.plans.filter(p => match(search, p.symbol, p.name, p.frequency, p.status));
  const current = Math.min(page, Math.max(0, Math.ceil(plans.length / 4) - 1));
  async function toggle(plan: StockPlan) {
    if (busy) return; setBusy(plan.id);
    const command: StockPlanCommand = { type: "set_plan_status", id: plan.id, expected_version: plan.version, status: plan.status === "ACTIVE" ? "PAUSED" : "ACTIVE" };
    const operation = JSON.stringify(command), key = keys.current.get(operation) ?? crypto.randomUUID(); keys.current.set(operation, key);
    try { onComplete(await repository.execute(command, key)); notifyOperation(command.status === "ACTIVE" ? "Plan resumed" : "Plan paused", `${plan.symbol} · ${money(plan.amount_usd)} ${plan.frequency.toLowerCase()}`, false, "Stocks & Trading"); }
    catch (cause) { notifyOperation("Plan update failed", cause instanceof Error ? cause.message : "Unable to update the plan.", true, "Stocks & Trading"); } finally { setBusy(null); }
  }
  return <CardSurface tone="purple" className="@container flex h-full min-h-[500px] flex-col p-4 sm:p-5"><StockTitle icon={CalendarClock} aside={<ActionButton autoWidth variant="purple" aria-label="New investment plan" title="New investment plan" labelClassName="hidden @min-[380px]:inline" icon={<Plus size={14} />} onClick={() => setEdit("new")}>New plan</ActionButton>}>Recurring investments</StockTitle>
    <StockSearch label="Search investment plans" value={search} onChange={value => { setSearch(value); setPage(0); }} />
    <div className="mt-3 divide-y divide-white/10">{plans.slice(current * 4, current * 4 + 4).map(plan => <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-white">{plan.symbol}</span><span className={`rounded-full border border-white/10 px-2 py-1 text-[9px] font-semibold ${plan.status === "ACTIVE" ? "text-emerald-200" : "text-amber-200"}`}>{plan.status}</span></div><p className="mt-1 text-xs text-slate-100">{money(plan.amount_usd)} · {plan.frequency} · {plan.day}</p><p className="mt-1 text-[11px] text-slate-200">{plan.status === "ACTIVE" ? "Next" : "Scheduled"}: {dateLabel(plan.next_run)}</p></div><div className="flex gap-1.5"><button className={smallButton} aria-label={`Edit ${plan.symbol} plan`} title="Edit plan" disabled={!!busy} onClick={() => setEdit(plan)}><Pencil size={14} /></button><button className={smallButton} aria-label={`${plan.status === "ACTIVE" ? "Pause" : "Resume"} ${plan.symbol} plan`} title={plan.status === "ACTIVE" ? "Pause plan" : "Resume plan"} disabled={!!busy} onClick={() => void toggle(plan)}>{plan.status === "ACTIVE" ? <Pause size={14} /> : <Play size={14} />}</button></div></div>)}</div>
    {!plans.length && <Empty>No matching investment plans.</Empty>}<div className="mt-auto"><Pager count={plans.length} page={current} onChange={setPage} /></div>
    {edit && <PlanDialog key={edit === "new" ? "new" : `${edit.id}-${edit.version}`} plan={edit === "new" ? null : edit} snapshot={snapshot} repository={repository} onComplete={onComplete} onClose={() => setEdit(null)} />}
  </CardSurface>;
}
function PlanDialog({ plan, snapshot, repository, onComplete, onClose }: { plan: StockPlan | null; snapshot: StocksSnapshot; repository: StocksRepository; onComplete: (value: StocksSnapshot) => void; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10), assets = snapshot.wallet.assets.filter(a => a.kind !== "fiat");
  const [draft, setDraft] = useState<StockPlanDraft>({ symbol: plan?.symbol ?? assets.find(a => a.symbol === "VOO")?.symbol ?? assets[0]?.symbol ?? "", amount_usd: plan?.amount_usd ?? "", frequency: plan?.frequency ?? "Monthly", starts_on: plan ? plan.next_run < today ? today : plan.next_run : today });
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const key = useRef("");
  function update(patch: Partial<StockPlanDraft>) { key.current = ""; setDraft(current => ({ ...current, ...patch })); setError(""); }
  async function submit() {
    if (busy) return; setBusy(true); setError(""); key.current ||= crypto.randomUUID();
    try { const command: StockPlanCommand = plan ? { type: "update_plan", id: plan.id, expected_version: plan.version, draft } : { type: "create_plan", draft }; onComplete(await repository.execute(command, key.current)); notifyOperation(plan ? "Investment plan updated" : "Investment plan created", `${draft.symbol} · ${money(draft.amount_usd)} ${draft.frequency.toLowerCase()}`, false, "Stocks & Trading"); onClose(); }
    catch (cause) { const message = cause instanceof Error ? cause.message : "Unable to save your plan."; setError(message); notifyOperation("Plan not saved", message, true, "Stocks & Trading"); } finally { setBusy(false); }
  }
  return <SocialDialog title={plan ? "Edit investment plan" : "New investment plan"} subtitle="Invest a set amount on your schedule" busy={busy} icon={CalendarClock} onClose={onClose}><form onSubmit={e => { e.preventDefault(); void submit(); }} className="space-y-5 text-white"><AssetSelect label="Investment asset" value={draft.symbol} assets={assets} disabled={busy} onChange={symbol => update({ symbol })} /><div className="grid gap-4 sm:grid-cols-2"><label className={socialLabel}>Amount (USD)<input className={socialField} inputMode="decimal" required disabled={busy} value={draft.amount_usd} onChange={e => update({ amount_usd: e.target.value })} placeholder="0.00" /></label><label className={socialLabel}>Start date<input type="date" className={`${socialField} [color-scheme:dark]`} min={today} required disabled={busy} value={draft.starts_on} onChange={e => update({ starts_on: e.target.value })} /></label></div><div className="space-y-2"><p className="text-xs text-slate-200">Frequency</p><fieldset disabled={busy}><Segments label="Investment frequency" value={draft.frequency} values={["Daily", "Weekly", "Bi-Weekly", "Monthly"] as PlanFrequency[]} onChange={frequency => update({ frequency })} /></fieldset></div>{error && <p role="alert" className="text-sm text-rose-200">{error}</p>}<ActionButton type="submit" variant="purple" fullWidth disabled={busy || !draft.symbol || Number(draft.amount_usd) <= 0}>{busy ? "Saving…" : plan ? "Save changes" : "Create plan"}</ActionButton></form></SocialDialog>;
}
