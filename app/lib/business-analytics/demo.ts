import { decimal, units } from '../transfers/engine';
import type { BusinessSnapshot, OperationalData, OperationalSourceKey, OperationalSources, SourceReading } from './contracts';
import { validOperationalData } from './response';

const ensureDemo = (mode: string | undefined, name: string) => {if ((mode ?? 'demo') !== 'demo') throw new Error(`${name} requires the server analytics aggregator in HTTP mode.`);};
/** Read-only projections: never provision customers, seed wallets, or commit financial operations. */
export async function collectBusinessOperations(asOf: string): Promise<BusinessSnapshot['operations']> {
  const from = new Date(Date.parse(asOf) - 30 * 86400000).toISOString();
  const readers: {[K in OperationalSourceKey]: {scope: string; read: () => Promise<{revision: string; data: OperationalData[K]}>}} = {
    users: {scope: 'Current managed CLIENT identities; recent activity means recorded sign-in, not qualifying banking activity.', async read() {
      ensureDemo(process.env.NEXT_PUBLIC_USER_MANAGEMENT_MODE, 'User Management');
      const {readManagedUsers} = await import('../user-management/store'), state = readManagedUsers(), rows = state.users.filter(u => u.role === 'CLIENT');
      return {revision: String(state.revision), data: {clients: rows.length, active: rows.filter(u => u.status === 'ACTIVE').length, blocked: rows.filter(u => u.status === 'BLOCKED').length, verified: rows.filter(u => u.kyc_status === 'VERIFIED').length, seen_30d: rows.filter(u => !!u.last_seen_at && Date.parse(u.last_seen_at) >= Date.parse(from) && Date.parse(u.last_seen_at) <= Date.parse(asOf)).length}};
    }},
    subscriptions: {scope: 'Current shared EUR contracts and unpaid invoices; MRR is an annual-normalized estimate, not recognized income or collection.', async read() {
      const {readSubscriptions} = await import('../subscriptions/registry'), state = readSubscriptions();
      const rows = state.subscriptions.filter(s => s.status !== 'CANCELED'), recurring = rows.filter(s => ['ACTIVE', 'PAST_DUE'].includes(s.status));
      const overdue = state.invoices.filter(i => i.status !== 'PAID' && Date.parse(i.due_at) < Date.parse(asOf));
      const annual = recurring.reduce((sum, s) => sum + BigInt(s.price_minor) * BigInt(s.cycle === 'ANNUAL' ? 1 : 12), BigInt(0));
      return {revision: String(state.revision), data: {open: rows.length, active: rows.filter(s => s.status === 'ACTIVE').length, past_due: rows.filter(s => s.status === 'PAST_DUE').length, suspended: rows.filter(s => s.status === 'SUSPENDED').length, canceling: rows.filter(s => s.cancel_at_period_end).length, contracted_mrr_minor: Number((annual + BigInt(6)) / BigInt(12)), overdue_minor: overdue.reduce((sum, i) => sum + i.amount_minor, 0), overdue_invoices: overdue.length, renewals_7d: rows.filter(s => Date.parse(s.period_end) >= Date.parse(asOf) && Date.parse(s.period_end) <= Date.parse(asOf) + 7 * 86400000).length, plans: (['STANDARD', 'PREMIUM', 'METAL'] as const).map(plan => ({plan, count: rows.filter(s => s.plan_id === plan).length}))}};
    }},
    referrals: {scope: 'Current shared referral attribution and earned EUR obligations. Paid fixture history does not imply wallet credit.', async read() {
      const {readReferrals} = await import('../referrals/store'), state = readReferrals(), rows = state.report.referrals;
      const total = (status: string) => rows.filter(r => r.reward_status === status).reduce((sum, r) => sum + r.reward_minor, 0);
      return {revision: String(state.revision), data: {invited: rows.length, registered: rows.filter(r => !!r.registered_at).length, qualified: rows.filter(r => r.status === 'QUALIFIED').length, pending_minor: total('PENDING'), held_minor: total('HELD'), queued_minor: total('QUEUED'), paid_history_minor: total('PAID')}};
    }},
    wallets: {scope: 'Only saved wallet journals visible in this browser session. Balances include demo opening funds; transfer outcomes use the trailing 30 days. Assets are never converted or added across currencies.', async read() {
      ensureDemo(process.env.NEXT_PUBLIC_TRANSFERS_MODE, 'Wallets');
      const {walletCustomers, readWalletForAudit} = await import('../wallet/store');
      const customers = [...new Map(walletCustomers().map(c => [c.trim().toLowerCase(), c.trim()])).values()];
      const positions = new Map<string, {asset: string; kind: 'fiat' | 'crypto' | 'stock'; decimals: number; available: bigint; reserved: bigint}>();
      const settlements = new Map<string, {asset: string; decimals: number; incoming: bigint; outgoing: bigint; completed: number}>();
      const data = {observed_wallets: customers.length, transfers: 0, completed: 0, pending: 0, processing: 0, rejected: 0, cancelled: 0, positions: [] as OperationalData['wallets']['positions'], settlements: [] as OperationalData['wallets']['settlements'], pending_orders: 0, credit_applications: 0};
      let events = 0;
      for (const email of customers) {
        const wallet = readWalletForAudit(email); events += wallet.events.length;
        const {state} = wallet;
        for (const account of state.transfers.accounts) {
          const item = positions.get(account.asset) ?? {asset: account.asset, kind: account.kind, decimals: account.decimals, available: BigInt(0), reserved: BigInt(0)};
          if (item.decimals !== account.decimals || item.kind !== account.kind) throw new Error('Inconsistent asset precision across observed wallets.');
          item.available += units(account.available, item.decimals); item.reserved += units(account.reserved, item.decimals); positions.set(item.asset, item);
        }
        for (const transfer of state.transfers.transfers.filter(t => Date.parse(t.created_at) >= Date.parse(from) && Date.parse(t.created_at) <= Date.parse(asOf))) {
          data.transfers++; data[transfer.status]++;
          if (transfer.status !== 'completed') continue;
          const account = state.transfers.accounts.find(a => a.asset === transfer.asset);
          if (!account) throw new Error('Transfer asset precision is unavailable.');
          const item = settlements.get(transfer.asset) ?? {asset: transfer.asset, decimals: account.decimals, incoming: BigInt(0), outgoing: BigInt(0), completed: 0};
          item[transfer.direction] += units(transfer.amount, item.decimals); item.completed++; settlements.set(item.asset, item);
        }
        data.pending_orders += state.trading.orders.filter(o => o.status === 'PENDING').length;
        data.credit_applications += state.credit.applications.filter(a => ['submitted', 'under_review'].includes(a.status)).length;
      }
      data.positions = [...positions.values()].sort((a, b) => a.asset.localeCompare(b.asset)).map(p => ({...p, available: decimal(p.available, p.decimals), reserved: decimal(p.reserved, p.decimals)}));
      data.settlements = [...settlements.values()].sort((a, b) => a.asset.localeCompare(b.asset)).map(p => ({...p, incoming: decimal(p.incoming, p.decimals), outgoing: decimal(p.outgoing, p.decimals)}));
      return {revision: `${customers.length} wallets / ${events} events`, data};
    }},
    cards: {scope: 'Shared issuing registry, excluding customer-deleted cards; issuance status is not payment volume.', async read() {
      ensureDemo(process.env.NEXT_PUBLIC_CARDS_MODE ?? process.env.NEXT_PUBLIC_TRANSFERS_MODE, 'Cards');
      const {readCardIssuingState} = await import('../admin/mock-card-issuing-store'), state = readCardIssuingState(), rows = state.cards.filter(c => !c.customerDeletedAt);
      return {revision: String(state.revision), data: {total: rows.length, active: rows.filter(c => c.status === 'ACTIVE').length, pending: rows.filter(c => c.status === 'PENDING').length, frozen: rows.filter(c => c.status === 'FROZEN').length, blocked: rows.filter(c => c.status === 'BLOCKED').length, terminated: rows.filter(c => c.status === 'TERMINATED').length}};
    }},
    risk: {scope: 'Current unresolved investigations and restrictions; case counts do not estimate financial losses.', async read() {
      const {readRiskForExecution} = await import('../risk/store'), state = readRiskForExecution(), rows = state.cases.filter(c => c.status !== 'RESOLVED');
      return {revision: String(state.revision), data: {open_cases: rows.length, critical_cases: rows.filter(c => c.severity === 'CRITICAL').length, overdue_cases: rows.filter(c => Date.parse(c.dueAt) < Date.parse(asOf)).length, restricted_accounts: state.restrictions.length}};
    }},
    rates: {scope: 'Published pricing controls only. Proposals and fee configuration are not booked revenue.', async read() {
      ensureDemo(process.env.NEXT_PUBLIC_RATES_MODE, 'Rates');
      const {readRates} = await import('../rates/repository'), state = readRates();
      return {revision: String(state.revision), data: {version: state.active.version, enabled_products: state.active.policies.filter(p => p.enabled).length, paused_products: state.active.policies.filter(p => !p.enabled).length, pending_releases: state.releases.filter(r => r.status === 'PENDING').length}};
    }},
  };
  const keys = Object.keys(readers) as OperationalSourceKey[];
  const results = await Promise.allSettled(keys.map(async key => {const result = await readers[key].read(); if (!validOperationalData(key, result.data)) throw new Error('Source aggregates are invalid or exceed reporting precision.'); return result;}));
  const sources = Object.fromEntries(keys.map((key, index) => {
    const result = results[index];
    const entry: SourceReading<OperationalData[OperationalSourceKey]> = result.status === 'fulfilled' ? {status: 'READY', as_of: asOf, revision: result.value.revision, scope: readers[key].scope, error: null, data: result.value.data} : {status: 'ERROR', as_of: null, revision: null, scope: readers[key].scope, error: 'This source could not be read or validated. Saved data was preserved; its aggregates are unavailable.', data: null};
    return [key, entry];
  })) as OperationalSources;
  return {as_of: asOf, window_from: from, window_to: asOf, sources};
}
