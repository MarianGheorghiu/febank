import { units } from "../transfers/engine";
import { MOCK_DCA } from "../mock/recurring-buys";
import type { PlanFrequency, StockPlan, StockPlanCommand, StockPlanDraft } from "./contracts";
export interface PlanEvent { key: string; at: string; command: StockPlanCommand }
export function validDay(value: string) { const date = new Date(`${value}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
export function nextOccurrence(starts: string, frequency: PlanFrequency, today: string) {
  if (!validDay(starts) || !validDay(today)) throw new Error("Enter a valid schedule date.");
  const origin = new Date(`${starts}T00:00:00Z`); let next = new Date(origin);
  if (frequency === "Monthly") {
    const target = new Date(`${today}T00:00:00Z`);
    let months = Math.max(0, (target.getUTCFullYear() - origin.getUTCFullYear()) * 12 + target.getUTCMonth() - origin.getUTCMonth());
    const monthly = () => { const value = new Date(Date.UTC(origin.getUTCFullYear(), origin.getUTCMonth() + months, 1)); const lastDay = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate(); value.setUTCDate(Math.min(origin.getUTCDate(), lastDay)); return value; };
    next = monthly(); if (next.toISOString().slice(0, 10) < today) { months++; next = monthly(); }
  } else {
    const days = frequency === "Daily" ? 1 : frequency === "Weekly" ? 7 : 14;
    const elapsed = Math.max(0, Math.ceil((Date.parse(`${today}T00:00:00Z`) - origin.getTime()) / (days * 86400000)));
    next = new Date(origin.getTime() + elapsed * days * 86400000);
  }
  return next.toISOString().slice(0, 10);
}
export function validatePlanDraft(draft: StockPlanDraft) {
  if (!draft || typeof draft.symbol !== "string" || !/^[A-Z][A-Z0-9.-]{0,11}$/.test(draft.symbol) || !["Daily", "Weekly", "Bi-Weekly", "Monthly"].includes(draft.frequency) || !validDay(draft.starts_on) || units(draft.amount_usd, 2) <= BigInt(0)) throw new Error("Check the asset, amount, frequency and start date.");
}
export function seedPlans(today: string): StockPlan[] { return MOCK_DCA.map(plan => ({ id: plan.id, symbol: plan.symbol, name: plan.name, amount_usd: plan.amount.toFixed(2), frequency: plan.frequency as PlanFrequency, starts_on: plan.nextRun, next_run: nextOccurrence(plan.nextRun, plan.frequency as PlanFrequency, today), status: plan.status, version: 1, day: plan.day })); }
export function applyPlanCommand(plans: StockPlan[], event: PlanEvent, names: Map<string, string>, today: string): StockPlan[] {
  const command = event.command;
  if (!event.key || !Number.isFinite(Date.parse(event.at))) throw new Error("Invalid saved investment plan.");
  if (command.type === "create_plan") {
    validatePlanDraft(command.draft);
    return [{ ...command.draft, id: event.key, name: names.get(command.draft.symbol) ?? command.draft.symbol, status: "ACTIVE", version: 1, next_run: nextOccurrence(command.draft.starts_on, command.draft.frequency, today), day: command.draft.frequency === "Monthly" ? `Day ${Number(command.draft.starts_on.slice(-2))}` : new Date(`${command.draft.starts_on}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }) }, ...plans];
  }
  if (command.type !== "update_plan" && command.type !== "set_plan_status") throw new Error("Invalid saved investment plan command.");
  const plan = plans.find(item => item.id === command.id);
  if (!plan || plan.version !== command.expected_version) throw new Error("This investment plan changed. Refresh it before trying again.");
  if (command.type === "set_plan_status" && !["ACTIVE", "PAUSED"].includes(command.status)) throw new Error("Invalid investment plan status.");
  if (command.type === "update_plan") validatePlanDraft(command.draft);
  return plans.map(item => item.id !== plan.id ? item : command.type === "set_plan_status" ? { ...item, status: command.status, version: item.version + 1 } : { ...item, ...command.draft, name: names.get(command.draft.symbol) ?? command.draft.symbol, next_run: nextOccurrence(command.draft.starts_on, command.draft.frequency, today), day: command.draft.frequency, version: item.version + 1 });
}
