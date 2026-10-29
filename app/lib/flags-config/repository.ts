import { CONFIG_ENVIRONMENTS } from "../types/admin/flags-config";
import type { AuditActor } from '../types/admin/audit';
import type { ConfigAdminRepository, ConfigExportCommand, ConfigPublishCommand, ConfigSnapshot } from '../types/admin/flags-config';
import { validatePayload } from './engine';
import { parseConfigExportReceipt, parseConfigSnapshot, parsePublication } from './response';
export { mockConfigRepository, CONFIG_STORAGE_KEY, configStorageWarning, useFlagsConfig } from './store';

export function createConfigRepository(actor: AuditActor): ConfigAdminRepository {
  if (actor.role !== 'admin' || !actor.email.trim()) throw new Error('Administrator access required.');
  const mode = process.env.NEXT_PUBLIC_FLAGS_CONFIG_MODE ?? 'demo';
  function validate(command: ConfigPublishCommand) {
    if (!CONFIG_ENVIRONMENTS.includes(command.environment) || (command.restored_from !== null && typeof command.restored_from !== 'string') || !command.request_id.trim() || command.catalog_version !== 1 || !Number.isSafeInteger(command.expected_revision) || command.expected_revision < 1 || command.reason.trim().length < 10 || command.reason.trim().length > 500 || validatePayload(command.payload).length) throw new Error('Invalid configuration release. Review all values and the change reason.');
  }
  if (mode === 'demo') {
    const snapshots = new Map<string, ConfigSnapshot>();
    async function capture(): Promise<ConfigSnapshot> {
      const {mockConfigRepository} = await import('./store');
      const state = await mockConfigRepository.getSnapshot(); delete state.receipts;
      const snapshot = parseConfigSnapshot({schema_version: 2, catalog_version: 1, scope: 'GLOBAL', mode: 'demo', snapshot_id: `config-${crypto.randomUUID()}`, as_of: new Date().toISOString(), state, permissions: {publish: true, export: true}});
      snapshots.set(snapshot.snapshot_id, structuredClone(snapshot));
      while (snapshots.size > 20) snapshots.delete(snapshots.keys().next().value!);
      return snapshot;
    }
    return {
      getSnapshot: capture,
      async publish(command) {validate(command); const {mockConfigRepository} = await import('./store'); await mockConfigRepository.publish({...command, restored_from: command.restored_from ?? undefined, actor}); return parsePublication(await capture(), command);},
      async recordExport(command) {
        const snapshot = snapshots.get(command.snapshot_id);
        if (!snapshot || snapshot.state.environments[command.environment]?.revision !== command.revision || !command.request_id.trim() || command.reason.trim().length < 10 || command.reason.trim().length > 500 || !/^[a-f0-9]{64}$/.test(command.content_sha256)) throw new Error('Invalid or expired export snapshot. Refresh and open export again.');
        const {appendAuditEvent} = await import('../audit/store');
        const event = appendAuditEvent({source: 'SYSTEM', category: 'DATA_ACCESS', action: 'CONFIG_EXPORTED', target: `flags-config:${command.environment}`, reason: command.reason.trim(), before: null, after: command}, actor, command.request_id);
        return parseConfigExportReceipt({...command, audit_event_id: event.id, recorded_at: event.timestamp}, command);
      },
    };
  }
  if (mode !== 'http') throw new Error('Unknown Flags & Config service mode.');
  const base = (process.env.NEXT_PUBLIC_FLAGS_CONFIG_API_URL ?? '').replace(/\/$/, '');
  async function request(path: string, body?: ConfigPublishCommand | ConfigExportCommand, signal?: AbortSignal) {
    const response = await fetch(`${base}/v1/admin/config${path}`, {method: body ? 'POST' : 'GET', signal, credentials: 'include', cache: 'no-store', headers: {Accept: 'application/json', ...(body ? {'Content-Type': 'application/json', 'Idempotency-Key': body.request_id} : {})}, ...(body ? {body: JSON.stringify({schema_version: 2, ...body})} : {})});
    if (!response.ok) throw new Error(response.status === 409 ? 'A newer revision exists or the reviewed snapshot expired. Refresh and review again.' : `Configuration service unavailable (${response.status}).`);
    return response.json();
  }
  function live(snapshot: ConfigSnapshot) {if (snapshot.mode !== 'live') throw new Error('Expected live global configuration.'); return snapshot;}
  return {
    async getSnapshot(signal) {return live(parseConfigSnapshot(await request('/snapshot', undefined, signal)));},
    async publish(command) {validate(command); return live(parsePublication(await request(`/${command.environment}/releases`, command), command));},
    async recordExport(command) {if (!command.request_id.trim() || command.reason.trim().length < 10 || command.reason.trim().length > 500 || !/^[a-f0-9]{64}$/.test(command.content_sha256)) throw new Error('Invalid export request.'); return parseConfigExportReceipt(await request('/exports', command), command);},
  };
}
