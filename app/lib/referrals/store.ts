import { readManagedUsers } from '../user-management/store';
import { mockConfigRepository } from '../flags-config/repository';
import { evaluateFlag } from '../flags-config/engine';
import { customerMembership } from '../subscriptions/registry';
import { readRiskForExecution } from '../risk/store';
import type { ReferralActor, ReferralCommand, ReferralContext, ReferralSnapshot, ReferralState } from './contracts';
import { applyReferralCommand, seedReferrals, validReferralState } from './operations';
import { referralDemoEvidence } from './demo';

export const REFERRALS_KEY = 'mbank_referrals_v1';
export const REFERRALS_EVENT = 'mbank:referrals-updated';
export function readReferrals(): ReferralState {
  if ((process.env.NEXT_PUBLIC_REFERRALS_MODE ?? 'demo') !== 'demo') throw new Error('Use the Go referral service for live data.');
  const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(REFERRALS_KEY);
  if (!raw) return seedReferrals();
  try {
    const value: unknown = JSON.parse(raw); if (!validReferralState(value)) throw new Error();
    // Older demo journals gain labelled baseline evidence without replacing operator decisions.
    const samples = referralDemoEvidence(seedReferrals().report), ids = new Set(value.audit.map(e => e.id));
    return {...value, audit: [...value.audit, ...samples.filter(e => !ids.has(e.id))]};
  }
  catch { throw new Error('Referral storage is corrupt or unavailable. Saved data was preserved; operations are blocked.'); }
}
export async function referralContext(state: ReferralState): Promise<ReferralContext> {
  const config = (await mockConfigRepository.getSnapshot()).environments.production;
  const payload = config.published, rule = payload.flags.referral_program;
  const users = readManagedUsers().users;
  const restrictions = readRiskForExecution().restrictions;
  const eligible = state.report.referrers.filter(referrer => {
    const user = users.find(u => u.login_email === referrer.email.toLowerCase());
    if (restrictions.some(r => r.email.toLowerCase() === referrer.email.toLowerCase())) return false;
    if (user && (user.role !== 'CLIENT' || user.status !== 'ACTIVE' || user.kyc_status !== 'VERIFIED')) return false;
    const audience = rule.audience === 'premium' && customerMembership(referrer.email).tier !== 'STANDARD' ? 'premium' : 'all';
    return evaluateFlag(payload, 'referral_program', user?.id ?? referrer.user_id, audience).enabled;
  }).map(r => r.id);
  return {policy: {config_revision: config.revision, reward_minor: Number(payload.settings['growth.referral_reward_minor']), qualification_days: Number(payload.settings['growth.referral_expiry_days']), program_enabled: rule.enabled && payload.settings['platform.maintenance'] !== true}, eligible_referrer_ids: eligible, existing_customer_emails: users.map(u => u.login_email.toLowerCase())};
}
export function projectReferrals(state: ReferralState, context: ReferralContext, at: string): ReferralSnapshot {
  const users = readManagedUsers().users;
  const byEmail = new Map(users.map(u => [u.login_email, u]));
  const report = {...state.report, as_of: at, referrers: state.report.referrers.map(r => ({...r, name: byEmail.get(r.email.toLowerCase())?.legal_name ?? r.name})), referrals: state.report.referrals.map(r => ({...r, invitee_name: byEmail.get(r.invitee_email.toLowerCase())?.legal_name ?? r.invitee_name}))};
  return {schema_version: 1, mode: 'demo', as_of: at, state: {...state, report}, policy: context.policy, eligible_referrer_ids: context.eligible_referrer_ids};
}
export async function getDemoReferralSnapshot(): Promise<ReferralSnapshot> {
  const state = readReferrals(); return projectReferrals(state, await referralContext(state), new Date().toISOString());
}
export async function executeDemoReferralCommand(command: ReferralCommand, actor: ReferralActor) {
  const context = await referralContext(readReferrals());
  const state = readReferrals(), now = new Date().toISOString();
  const next = applyReferralCommand(state, command, actor, context, now);
  if (!validReferralState(next)) throw new Error('Invalid referral operation result. No changes saved.');
  if (next !== state) {
    try { localStorage.setItem(REFERRALS_KEY, JSON.stringify(next)); }
    catch { throw new Error('Referral storage is unavailable or full. No changes saved.'); }
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(REFERRALS_EVENT));
  }
  return projectReferrals(next, context, now);
}
