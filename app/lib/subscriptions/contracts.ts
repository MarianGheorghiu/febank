import type { SubscriptionCustomer, SubscriptionPlan, SubscriptionState } from '../types/admin/subscriptions';

export interface SubscriptionSnapshot {
  schema_version: 1;
  mode: 'demo' | 'live';
  as_of: string;
  state: SubscriptionState;
  customers: SubscriptionCustomer[];
  plans: SubscriptionPlan[];
}

export interface SubscriptionExport {
  request_id: string;
  kind: 'subscriptions' | 'invoices';
  record_ids: string[];
  expected_revision: number;
  as_of: string;
  filters: Record<string, string>;
}
