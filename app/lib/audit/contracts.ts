import type { AuditActor, AuditEvent, AuditFilters, AuditNote, AuditSourceHealth } from '../types/admin/audit';
export interface AuditSnapshot {
  schema_version: 1; mode: 'demo' | 'live'; as_of: string; complete: true;
  revision: number; events: AuditEvent[]; notes: AuditNote[];
  health: AuditSourceHealth[]; warnings: string[];
}
export interface AuditNoteCommand { event_id: string; text: string; expected_revision: number }
export interface AuditExportRequest {
  format: 'CSV' | 'JSON'; reason: string; generated_at: string; name: string;
  event_ids: string[]; sha256: string; filters: AuditFilters; sort: string; display_time_zone: string;
}
export interface AuditReceipt { id: string; timestamp: string; event_ids: string[]; sha256: string }
export interface AuditRepository {
  getSnapshot(signal?: AbortSignal): Promise<AuditSnapshot>;
  recordAccess(key: string): Promise<void>;
  addNote(command: AuditNoteCommand, key: string): Promise<AuditNote>;
  recordExport(request: AuditExportRequest, key: string): Promise<AuditReceipt>;
}
export type { AuditActor };
