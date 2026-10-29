import type { SubscriptionCommand } from '../types/admin/subscriptions';
import type { SubscriptionSnapshot, SubscriptionExport } from './contracts';
import { validSubscriptionState } from './engine';

export function decodeSubscriptionSnapshot(value: unknown): SubscriptionSnapshot {
  const s = value as SubscriptionSnapshot | null;
  const minor = (n: number) => Number.isSafeInteger(n) && n >= 0;
  if (!s || s.schema_version !== 1 || !['demo', 'live'].includes(s.mode) || !/^\d{4}-\d\d-\d\dT.*Z$/.test(s.as_of) || !Number.isFinite(Date.parse(s.as_of)) || !validSubscriptionState(s.state)
    || !Array.isArray(s.customers) || !s.customers.every(c => c && typeof c.id === 'string' && !!c.id && typeof c.name === 'string' && typeof c.email === 'string' && typeof c.eligible === 'boolean')
    || new Set(s.customers.map(c => c.id)).size !== s.customers.length
    || !Array.isArray(s.plans) || s.plans.length !== 3 || new Set(s.plans.map(p => p.id)).size !== 3 || !s.plans.every(p => p && ['STANDARD', 'PREMIUM', 'METAL'].includes(p.id) && typeof p.name === 'string' && typeof p.description === 'string' && p.currency === 'EUR' && minor(p.monthly_minor) && minor(p.annual_minor) && Array.isArray(p.benefits) && p.benefits.every(b => typeof b === 'string'))
    || !s.state.subscriptions.every(sub => s.customers.some(c => c.id === sub.customer_id))) throw new Error('Invalid subscription service response.');
  return s;
}

export interface SubscriptionSourceRepository {
  getSnapshot(signal?: AbortSignal): Promise<SubscriptionSnapshot>;
  execute(command: SubscriptionCommand): Promise<SubscriptionSnapshot>;
  recordExport(request: SubscriptionExport): Promise<void>;
}

export function createSubscriptionsRepository(actor: { email: string; role: 'admin' | 'client' }): SubscriptionSourceRepository {
  if (actor.role !== 'admin') throw new Error('Administrator access required.');
  const mode = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_MODE ?? 'demo';
  if (mode === 'demo') return {
    async getSnapshot() {
      const [{ mockSubscriptionsRepository }, { subscriptionCustomers }, { SUBSCRIPTION_PLANS }] = await Promise.all([import('./store'), import('./customers'), import('../mock/admin/subscriptions')]);
      return decodeSubscriptionSnapshot({ schema_version: 1, mode: 'demo', as_of: new Date().toISOString(), state: await mockSubscriptionsRepository.list(), customers: subscriptionCustomers(), plans: SUBSCRIPTION_PLANS });
    },
    async execute(command) {
      const { mockSubscriptionsRepository } = await import('./store');
      await mockSubscriptionsRepository.execute(command, actor);
      return this.getSnapshot();
    },
    async recordExport(request) {
      const [{appendAuditEvent}, {readSubscriptions}] = await Promise.all([import('../audit/store'), import('./registry')]);
      const state = readSubscriptions();
      if (state.revision !== request.expected_revision) throw new Error('Subscriptions changed. Refresh before exporting.');
      const records = request.kind === 'invoices' ? state.invoices : state.subscriptions;
      if (!request.record_ids.every(id => records.some(r => r.id === id))) throw new Error('Export records are unavailable.');
      appendAuditEvent({source: 'SUBSCRIPTIONS', category: 'DATA_ACCESS', action: 'EXPORT_REQUESTED', target: `subscriptions-${request.kind}.csv`, reason: 'Administrator exported the filtered subscription report.', before: null, after: request}, actor);
    },
  };
  if (mode !== 'http') throw new Error('Unknown subscription service mode.');
  const base = (process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL ?? '').replace(/\/$/, '');
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${base}/v1/admin/subscriptions${path}`, { ...init, credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json', ...init.headers } });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(typeof body?.error?.message === 'string' ? body.error.message : `Subscription service unavailable (${response.status}).`);
    }
    if (response.status === 204) return null;
    const snapshot = decodeSubscriptionSnapshot(await response.json());
    if (snapshot.mode !== 'live') throw new Error('Subscription service must return live data.');
    return snapshot;
  }
  return {
    getSnapshot: async signal => { const result = await request('', { signal }); if (!result) throw new Error('Missing subscription snapshot.'); return result; },
    execute: async command => { const result = await request('/commands', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': command.request_id }, body: JSON.stringify({ schema_version: 1, command }) }); if (!result) throw new Error('Missing subscription command result.'); return result; },
    recordExport: async body => { await request('/exports', {method: 'POST', headers: {'Content-Type': 'application/json', 'Idempotency-Key': body.request_id}, body: JSON.stringify({schema_version: 1, ...body})}); },
  };
}
