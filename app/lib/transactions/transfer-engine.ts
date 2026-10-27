import type { TransferSnapshot, CustomerTransfer, TransferAdminCommand } from "../transfers/contracts";
import { TRANSFER_ADMIN_ACTIONS } from "../transfers/contracts";
import type { RiskActor } from "../types/admin/risk";
import { decimal, units, refreshLimits } from "../transfers/engine";
export function transferActions(transfer: CustomerTransfer): TransferAdminCommand["action"][] {
  if (transfer.direction !== "outgoing" || !transfer.id.startsWith("trf-")) return [];
  if (transfer.status === "pending") return transfer.review_hold ? ["RELEASE", "REJECT"] : ["HOLD", "PROCESS", "REJECT"];
  return transfer.status === "processing" ? ["SETTLE", "REJECT"] : [];
}
/** Settlement consumes only this transfer's own reservations; rejection refunds them. */
export function applyTransferAdmin(snapshot: TransferSnapshot, command: TransferAdminCommand, actor: RiskActor, now: string, id: string): TransferSnapshot {
  if (actor.role !== "admin" || !actor.email.trim()) throw new Error("Administrator access required.");
  if (!TRANSFER_ADMIN_ACTIONS.includes(command.action) || !Number.isInteger(command.expected_version) || command.expected_version < 0) throw new Error("Invalid transfer command.");
  const reason = command.reason.trim();
  if (reason.length < 10 || reason.length > 500) throw new Error("An audit reason of 10–500 characters is required.");
  const existing = snapshot.transfers.find(item => item.id === command.transfer_id);
  if (!existing) throw new Error("Transfer unavailable.");
  if ((existing.version ?? 0) !== command.expected_version) throw new Error("Transfer changed. Refresh and review the latest version.");
  if (!transferActions(existing).includes(command.action)) throw new Error("This action is unavailable for the current transfer state.");
  if (!Number.isFinite(Date.parse(now)) || Date.parse(now) < Date.parse(existing.updated_at)) throw new Error("Invalid transfer decision timestamp.");
  const next = structuredClone(snapshot), transfer = next.transfers.find(item => item.id === existing.id)!;
  if (command.action === "SETTLE" || command.action === "REJECT") {
    const source = next.accounts.find(item => item.id === transfer.account_id);
    const feeAccount = next.accounts.find(item => item.id === (transfer.fee_account_id ?? transfer.account_id));
    if (!source || !feeAccount) throw new Error("Transfer reservation account unavailable.");
    const fee = units(transfer.fee, feeAccount.decimals);
    const total = units(transfer.amount, source.decimals) + (source.id === feeAccount.id ? fee : BigInt(0));
    source.reserved = decimal(units(source.reserved, source.decimals) - total, source.decimals);
    if (command.action === "REJECT") source.available = decimal(units(source.available, source.decimals) + total, source.decimals);
    if (source.id !== feeAccount.id) {
      feeAccount.reserved = decimal(units(feeAccount.reserved, feeAccount.decimals) - fee, feeAccount.decimals);
      if (command.action === "REJECT") feeAccount.available = decimal(units(feeAccount.available, feeAccount.decimals) + fee, feeAccount.decimals);
    }
    transfer.status = command.action === "SETTLE" ? "completed" : "rejected";
    transfer.review_hold = false;
  }
  if (command.action === "HOLD") transfer.review_hold = true;
  if (command.action === "RELEASE") transfer.review_hold = false;
  if (command.action === "PROCESS") transfer.status = "processing";
  transfer.version = (existing.version ?? 0) + 1;
  transfer.can_cancel = transfer.status === "pending" && !transfer.review_hold;
  transfer.updated_at = now;
  transfer.admin_history = [...(transfer.admin_history ?? []), { id, actor: actor.email, action: command.action, reason, occurred_at: now, before_status: existing.status, after_status: transfer.status, before_hold: existing.review_hold ?? false, after_hold: transfer.review_hold ?? false }];
  return refreshLimits(next, now);
}
