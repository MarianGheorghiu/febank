import { MOCK_SUBSCRIPTIONS } from '../mock/admin/subscriptions';
import type { PlanId, SubscriptionState } from '../types/admin/subscriptions';
import { validSubscriptionState } from './engine';
import { subscriptionCustomers } from './customers';

export const SUBSCRIPTIONS_STORAGE_KEY = 'mbank_subscriptions_v1';
export const SUBSCRIPTIONS_EVENT = 'mbank:subscriptions-updated';

/** Authoritative demo read: corruption must never silently grant a pricing tier. */
export function readSubscriptions(): SubscriptionState {
  if ((process.env.NEXT_PUBLIC_SUBSCRIPTIONS_MODE ?? 'demo') !== 'demo') throw new Error('Live subscription benefits must be resolved by the backend.');
  const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
  if (!raw) return MOCK_SUBSCRIPTIONS;
  const state: unknown = JSON.parse(raw);
  if (!validSubscriptionState(state)) throw new Error('Invalid subscription storage. Preserve stored data for recovery.');
  return state;
}

export function customerMembership(email: string, state = readSubscriptions()) {
  const customer = subscriptionCustomers().find(c => c.email.trim().toLowerCase() === email.trim().toLowerCase());
  const subscription = state.subscriptions.find(s => s.customer_id === customer?.id && s.status !== 'CANCELED') ?? null;
  const tier: PlanId = customer?.eligible && subscription?.status === 'ACTIVE' ? subscription.plan_id : 'STANDARD';
  return { customer, subscription, tier };
}
