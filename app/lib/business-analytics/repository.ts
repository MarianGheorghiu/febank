import { MOCK_BUSINESS_ANALYTICS } from "@/app/lib/mock/admin/business-analytics";
import type { BusinessAnalyticsRepository } from "@/app/lib/types/admin/business-analytics";
import type { BusinessActor, BusinessRepository, BusinessSnapshot } from './contracts';
import { parseBusinessExportReceipt, parseBusinessSnapshot } from './response';
import { businessAnalytics } from './engine';
export const mockBusinessAnalyticsRepository: BusinessAnalyticsRepository = { async getReport() { return structuredClone(MOCK_BUSINESS_ANALYTICS); } };

export function createBusinessRepository(actor: BusinessActor): BusinessRepository {
  if (actor.role !== 'admin' || !actor.email.trim()) throw new Error('Administrator access required.');
  const mode = process.env.NEXT_PUBLIC_BUSINESS_ANALYTICS_MODE ?? 'demo';
  if (mode === 'demo') {
    const snapshots = new Map<string, BusinessSnapshot>();
    return {
      async getSnapshot() {
        const {collectBusinessOperations} = await import('./demo'), asOf = new Date().toISOString();
        const snapshot = parseBusinessSnapshot({schema_version: 1, snapshot_id: `business:${crypto.randomUUID()}`, mode: 'demo', as_of: asOf, financial_basis: 'ILLUSTRATIVE_WAREHOUSE', consistency: 'BEST_EFFORT', report: structuredClone(MOCK_BUSINESS_ANALYTICS), operations: await collectBusinessOperations(asOf)});
        snapshots.set(snapshot.snapshot_id, structuredClone(snapshot));
        while (snapshots.size > 12) snapshots.delete(snapshots.keys().next().value!);
        return snapshot;
      },
      async recordExport(request) {
        const snapshot = snapshots.get(request.snapshot_id);
        if (!snapshot || snapshot.report.report_id !== request.report_id) throw new Error('The reviewed snapshot expired. Refresh and open export again.');
        if (!request.request_id.trim() || !['CSV', 'JSON'].includes(request.format) || request.reason.trim().length < 10 || request.reason.trim().length > 500 || !/^[a-f0-9]{64}$/.test(request.content_sha256)) throw new Error('Invalid business export request.');
        businessAnalytics(snapshot.report, request.filters);
        const {appendAuditEvent} = await import('../audit/store');
        const event = appendAuditEvent({source: 'ANALYTICS', category: 'DATA_ACCESS', action: 'BUSINESS_REPORT_EXPORT_REQUESTED', target: request.report_id, reason: request.reason.trim(), before: null, after: request}, actor, request.request_id);
        return parseBusinessExportReceipt({...request, audit_event_id: event.id, requested_at: event.timestamp}, request);
      },
    };
  }
  if (mode !== 'http') throw new Error('Unknown business analytics service mode.');
  const base = (process.env.NEXT_PUBLIC_BUSINESS_ANALYTICS_API_URL ?? '').replace(/\/$/, '');
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${base}/v1/admin/business-analytics${path}`, {...init, credentials: 'include', cache: 'no-store', headers: {Accept: 'application/json', ...init.headers}});
    if (!response.ok) {const body = await response.json().catch(() => null); throw new Error(typeof body?.error?.message === 'string' ? body.error.message : `Business reporting service unavailable (${response.status}).`);}
    return response.json();
  }
  return {
    async getSnapshot(signal) {const snapshot = parseBusinessSnapshot(await request('', {signal})); if (snapshot.mode !== 'live' || snapshot.financial_basis !== 'BOOKED_WAREHOUSE') throw new Error('Expected a live booked reporting snapshot.'); return snapshot;},
    async recordExport(body) {return parseBusinessExportReceipt(await request('/exports', {method: 'POST', headers: {'Content-Type': 'application/json', 'Idempotency-Key': body.request_id}, body: JSON.stringify({schema_version: 1, ...body})}), body);},
  };
}
