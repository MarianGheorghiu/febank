import { MOCK_SYSTEM_HEALTH } from '@/app/lib/mock/admin/system-health';
import type { AuditActor } from '../types/admin/audit';
import type { HealthExportRequest, HealthReviewRequest, SystemHealthRepository } from '../types/admin/system-health';
import { parseAcknowledgement, parseExportReceipt, parseHealthSnapshot } from './response';

function validReason(reason: string) { if (reason.trim().length < 10 || reason.trim().length > 500) throw new Error('Enter a note of 10–500 characters.'); }
function validRequest(request: {request_id: string; snapshot_id: string}) { if (!request.request_id.trim() || !request.snapshot_id.trim()) throw new Error('Invalid health request.'); }
export function createHealthRepository(actor: AuditActor): SystemHealthRepository {
  if (actor.role !== 'admin' || !actor.email.trim()) throw new Error('Administrator access required.');
  const mode = process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE ?? 'demo';
  if (mode === 'demo') return {
    async getSnapshot() {
      const {readAuditJournal} = await import('../audit/store');
      const journal = readAuditJournal();
      const snapshot = structuredClone(MOCK_SYSTEM_HEALTH);
      for (const incident of snapshot.incidents) {
        const event = journal.events.find(e => e.source === 'SYSTEM' && e.action === 'HEALTH_INCIDENT_ACKNOWLEDGED' && e.target === incident.id && e.outcome === 'SUCCESS');
        if (event) incident.acknowledgement = {actor: event.actor, acknowledged_at: event.timestamp, note: event.reason, audit_event_id: event.id};
      }
      return parseHealthSnapshot(snapshot);
    },
    async acknowledge(request: HealthReviewRequest) {
      validRequest(request); validReason(request.note);
      const incident = MOCK_SYSTEM_HEALTH.incidents.find(i => i.id === request.incident_id);
      if (request.snapshot_id !== MOCK_SYSTEM_HEALTH.snapshot_id || !incident || incident.revision !== request.expected_revision) throw new Error('Incident changed. Refresh and review it again.');
      const {appendAuditEvent} = await import('../audit/store');
      const event = appendAuditEvent({source: 'SYSTEM', category: 'SYSTEM', action: 'HEALTH_INCIDENT_ACKNOWLEDGED', target: incident.id, reason: request.note.trim(), domain: MOCK_SYSTEM_HEALTH.services.find(s => s.id === incident.service_id)!.domain, before: {revision: incident.revision}, after: {incident_state: incident.state, snapshot_id: request.snapshot_id}}, actor, request.request_id);
      return parseAcknowledgement({actor: event.actor, acknowledged_at: event.timestamp, note: event.reason, audit_event_id: event.id});
    },
    async recordExport(request: HealthExportRequest) {
      validRequest(request); validReason(request.reason);
      if (request.snapshot_id !== MOCK_SYSTEM_HEALTH.snapshot_id || !/^[a-f0-9]{64}$/.test(request.content_sha256)) throw new Error('Invalid diagnostic export.');
      const {appendAuditEvent} = await import('../audit/store');
      const event = appendAuditEvent({source: 'SYSTEM', category: 'DATA_ACCESS', action: 'HEALTH_SNAPSHOT_EXPORT_REQUESTED', target: request.snapshot_id, reason: request.reason.trim(), before: null, after: request}, actor, request.request_id);
      return parseExportReceipt({...request, audit_event_id: event.id, recorded_at: event.timestamp}, request);
    },
  };
  if (mode !== 'http') throw new Error('Unknown System Health service mode.');
  const base = (process.env.NEXT_PUBLIC_SYSTEM_HEALTH_API_URL ?? '').replace(/\/$/, '');
  async function request(path: string, body?: HealthReviewRequest | HealthExportRequest, signal?: AbortSignal) {
    const response = await fetch(`${base}/v1/admin/system-health${path}`, {method: body ? 'POST' : 'GET', credentials: 'include', cache: 'no-store', signal, headers: {Accept: 'application/json', ...(body ? {'Content-Type': 'application/json', 'Idempotency-Key': body.request_id} : {})}, ...(body ? {body: JSON.stringify({schema_version: 3, ...body})} : {})});
    if (!response.ok) throw new Error(response.status === 409 ? 'Incident or snapshot changed. Refresh and review it again.' : `Monitoring service unavailable (${response.status}).`);
    return response.json();
  }
  return {
    async getSnapshot(signal) {const snapshot = parseHealthSnapshot(await request('', undefined, signal)); if (snapshot.mode !== 'live') throw new Error('Expected live monitoring telemetry.'); return snapshot;},
    async acknowledge(body) {validRequest(body); validReason(body.note); return parseAcknowledgement(await request(`/incidents/${encodeURIComponent(body.incident_id)}/acknowledgements`, body));},
    async recordExport(body) {validRequest(body); validReason(body.reason); if (!/^[a-f0-9]{64}$/.test(body.content_sha256)) throw new Error('Invalid diagnostic checksum.'); return parseExportReceipt(await request('/exports', body), body);},
  };
}
/** Isolated deterministic fixture for domain tests, independent from browser persistence. */
export const mockSystemHealthRepository = {async getSnapshot() {return parseHealthSnapshot(structuredClone(MOCK_SYSTEM_HEALTH));}};
