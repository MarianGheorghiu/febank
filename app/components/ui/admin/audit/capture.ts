"use client";
import { appendAuditEvent } from "@/app/lib/audit/store";
import type { AuditActor, AuditDraft } from "@/app/lib/types/admin/audit";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
export function captureAdminAudit(draft: AuditDraft, actor: AuditActor | null) {
  try { if (!actor) throw new Error("Administrator session required."); appendAuditEvent(draft,actor); return true; }
  catch (cause) { notifyOperation("Audit recording failed",cause instanceof Error?cause.message:"The operation could not be recorded.",true,"Audit Logs"); return false; }
}
