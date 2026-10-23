import type { CreditScope, CreditSnapshot } from "./contracts";
import { loanSchedule, outstanding } from "./engine";
/** Quote every cell and neutralize spreadsheet formula prefixes in free text. */
function cell(value: unknown) {
  const text = String(value ?? "");
  return `"${(/^[\s]*[=+@-]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
}
export function creditReport(snapshot: CreditSnapshot, scope: CreditScope) {
  const rows: unknown[][] = [["Loans & Capital report", scope, snapshot.as_of, snapshot.mode], ["USD outstanding principal", outstanding(snapshot, scope)], [], ["Agreements", "Name", "Currency", "Principal", "Annual rate bps", "Remaining months", "Next due"]];
  for (const loan of snapshot.loans.filter(item => item.scope === scope)) rows.push([loan.id, loan.name, "USD", loan.principal, loan.annual_rate_bps, loan.remaining_months, loan.next_due]);
  rows.push([], ["Facilities", "Name", "Currency", "Limit", "Drawn", "Enabled"]);
  for (const facility of snapshot.facilities.filter(item => item.scope === scope)) rows.push([facility.id, facility.name, "USD", facility.limit, facility.drawn, facility.enabled]);
  rows.push([], ["Applications", "Kind", "Status", "Currency", "Amount", "Cost", "Created"]);
  for (const application of snapshot.applications.filter(item => item.scope === scope)) rows.push([application.id, application.draft.kind, application.status, application.estimate.currency, application.estimate.amount, application.estimate.cost, application.created_at]);
  rows.push([], ["Activity", "Action", "Description", "Currency", "Amount", "At"]);
  for (const activity of snapshot.activity.filter(item => item.scope === scope)) rows.push([activity.id, activity.action, activity.description, activity.amount ? "USD" : "", activity.amount, activity.at]);
  rows.push([], ["Illustrative schedule", "Due", "Principal", "Interest", "Payment", "Balance", "Currency"]);
  for (const loan of snapshot.loans.filter(item => item.scope === scope)) for (const row of loanSchedule(loan)) rows.push([loan.id, row.due, row.principal, row.interest, row.payment, row.balance, "USD"]);
  rows.push([], ["Illustrations exclude accrued interest, fees and insurance. Applications do not constitute approved credit offers."]);
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n");
}
