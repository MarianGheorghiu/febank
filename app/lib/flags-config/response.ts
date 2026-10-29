import type { ConfigExportCommand, ConfigExportReceipt, ConfigPublishCommand, ConfigSnapshot } from '../types/admin/flags-config';
const timestamp = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
import { canonicalConfig, validConfigState } from './engine';
export function parseConfigSnapshot(value: unknown): ConfigSnapshot {
  const r = value as ConfigSnapshot;
  if (!r || r.schema_version !== 2 || r.catalog_version !== 1 || r.scope !== 'GLOBAL' || !['demo', 'live'].includes(r.mode) || typeof r.snapshot_id !== 'string' || !r.snapshot_id.trim() || !timestamp(r.as_of) || !r.permissions || typeof r.permissions.publish !== 'boolean' || typeof r.permissions.export !== 'boolean' || !validConfigState(r.state) || r.state.receipts !== undefined) throw new Error('Invalid global configuration response. No configuration was applied.');
  if (Object.values(r.state.environments).some(env => env.releases.some(release => Date.parse(release.timestamp) > Date.parse(r.as_of)))) throw new Error('Configuration release exceeds the snapshot cutoff.');
  return r;
}
export function parsePublication(value: unknown, command: ConfigPublishCommand): ConfigSnapshot {
  const snapshot = parseConfigSnapshot(value), environment = snapshot.state.environments[command.environment];
  const release = environment.releases.find(r => r.request_id === command.request_id);
  if (!release || release.revision !== command.expected_revision + 1 || canonicalConfig(release.after) !== canonicalConfig(command.payload) || release.reason !== command.reason.trim() || release.restored_from !== command.restored_from) throw new Error('Publication response does not match the reviewed release. Refresh before editing again.');
  return snapshot;
}
export function parseConfigExportReceipt(value: unknown, command: ConfigExportCommand): ConfigExportReceipt {
  const r = value as ConfigExportReceipt;
  if (!r || r.request_id !== command.request_id || r.snapshot_id !== command.snapshot_id || r.environment !== command.environment || r.revision !== command.revision || r.content_sha256 !== command.content_sha256 || typeof r.audit_event_id !== 'string' || !r.audit_event_id.trim() || !timestamp(r.recorded_at)) throw new Error('Invalid configuration export receipt. Download blocked.');
  return r;
}
