import { readConfigForExecution } from './store';
import { customerMembership } from '../subscriptions/registry';
import { findManagedUser } from '../user-management/store';
import { evaluateFlag } from './engine';
import type { ConfigModule } from '../types/admin/flags-config';
import type { WalletEvent } from '../wallet/engine';
const masters: Partial<Record<ConfigModule, string>> = {cards: 'cards.issuing_enabled', crypto: 'crypto.trading_enabled', stocks: 'stocks.trading_enabled', loans: 'loans.applications_enabled'};
/** Runs on new demo commits, never on replay, retries, refunds or cancellations. Go must enforce the same policy atomically. */
export function assertGlobalConfig(module?: ConfigModule, feature?: string, subject = 'demo-customer') {
  const {published} = readConfigForExecution().environments.production;
  if (published.settings['platform.maintenance'] === true) throw new Error('Customer operations are paused for platform maintenance. Please try again later.');
  const master = module && masters[module];
  if (master && published.settings[master] === false) throw new Error(`${module} operations are paused in global configuration.`);
  if (feature) {
    const rule = published.flags[feature], user = findManagedUser(subject);
    // Audience comes from shared identity/membership records, never a caller-supplied claim.
    const audience = rule?.audience === 'premium' && customerMembership(subject).tier !== 'STANDARD' ? 'premium' : rule?.audience === 'internal' && user?.role === 'ADMIN' ? 'internal' : 'all';
    const result = evaluateFlag(published, feature, user?.id ?? subject, audience);
    if (!result.enabled) throw new Error(`Feature unavailable: ${result.reason}.`);
  }
}
export function assertWalletConfig(event: WalletEvent, customer: string) {
  if (event.kind === 'submit' || event.kind === 'overview') assertGlobalConfig('transfers', undefined, customer);
  if (event.kind === 'trading') {
    if (event.command.type === 'cancel_order') return;
    // Read the instrument domain from the same catalog used by this execution.
    if (event.command.type === 'trade') {
      const symbol = event.command.request.symbol;
      const domain = event.catalog.instruments.find(i => i.symbol === symbol)?.domain;
      assertGlobalConfig(domain === 'CRYPTO' ? 'crypto' : 'stocks');
    } else {const assets = [event.command.source, event.command.target]; const crypto = event.catalog.instruments.some(i => i.domain === 'CRYPTO' && assets.includes(i.symbol)); assertGlobalConfig(crypto ? 'crypto' : undefined);}
  }
  if (event.kind === 'credit' && !['cancel', 'repay_loan', 'repay_facility'].includes(event.command.action)) assertGlobalConfig(event.command.action === 'apply' ? 'loans' : undefined);
  if (event.kind === 'rewards' && !event.command.action.startsWith('cancel_')) assertGlobalConfig();
}
