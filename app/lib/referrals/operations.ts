import { MOCK_REFERRAL_REPORT } from '../mock/admin/referrals';
import { validJournal } from '../audit/engine';
import { REFERRAL_STATUSES, type ReferralRecord } from '../types/admin/referrals';
import { referralDemoEvidence } from './demo';
import type { ReferralActor, ReferralCommand, ReferralContext, ReferralState } from './contracts';

export function seedReferrals(): ReferralState {
  const report = structuredClone(MOCK_REFERRAL_REPORT);
  return {schema_version: 1, revision: 0, report, terms: Object.fromEntries(report.referrals.map(r => [r.id, {reward_minor: 2500, qualification_days: 30, config_revision: 0}])), payout_requests: [], audit: referralDemoEvidence(report), receipts: []};
}
const date = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d\d-\d\dT.*Z$/.test(s) && Number.isFinite(Date.parse(s));
const text = (s: unknown): s is string => typeof s === 'string' && !!s.trim();
const minor = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
export function validReferralState(input: unknown): input is ReferralState {
  const s = input as ReferralState | null;
  if (!s || s.schema_version !== 1 || !minor(s.revision) || !s.report || s.report.schema_version !== 1 || !date(s.report.as_of) || !Array.isArray(s.report.referrers) || !Array.isArray(s.report.referrals) || !s.terms || !Array.isArray(s.payout_requests) || !Array.isArray(s.receipts) || !validJournal({revision: s.revision, events: s.audit, notes: []})) return false;
  const {referrers, referrals} = s.report;
  if (!referrers.every(r => r && [r.id, r.user_id, r.name, r.email, r.referral_code].every(text)) || new Set(referrers.map(r => r.id)).size !== referrers.length || new Set(referrers.map(r => r.user_id)).size !== referrers.length || new Set(referrers.map(r => r.referral_code.toLowerCase())).size !== referrers.length || new Set(referrals.map(r => r?.id)).size !== referrals.length) return false;
  if (!referrals.every(r => {
    if (!r || !text(r.id) || !referrers.some(f => f.id === r.referrer_id) || ![r.invitee_name, r.invitee_email].every(text) || !REFERRAL_STATUSES.includes(r.status) || !date(r.invited_at) || Date.parse(r.invited_at) > Date.parse(s.report.as_of) || r.reward_currency !== 'EUR' || !minor(r.reward_minor) || !['NONE', 'PENDING', 'PAID', 'HELD', 'QUEUED'].includes(r.reward_status) || !(r.rejection_reason === null || text(r.rejection_reason))) return false;
    const registered = r.registered_at !== null;
    if (registered ? !date(r.registered_at) || !text(r.invitee_id) || Date.parse(r.registered_at) < Date.parse(r.invited_at) || Date.parse(r.registered_at) > Date.parse(s.report.as_of) : r.invitee_id !== null || r.status !== 'INVITED') return false;
    if (r.status === 'INVITED' && registered) return false;
    if (r.status === 'QUALIFIED' ? !registered || !date(r.qualified_at) || Date.parse(r.qualified_at) < Date.parse(r.registered_at!) || Date.parse(r.qualified_at) > Date.parse(s.report.as_of) || r.reward_status === 'NONE' : r.qualified_at !== null || r.reward_minor !== 0 || r.reward_status !== 'NONE') return false;
    const terms = s.terms[r.id];
    return !!terms && minor(terms.reward_minor) && Number.isSafeInteger(terms.qualification_days) && terms.qualification_days >= 1 && terms.qualification_days <= 180 && minor(terms.config_revision);
  })) return false;
  if (!s.payout_requests.every(r => r && text(r.request_id) && date(r.requested_at) && referrals.some(f => f.id === r.referral_id && ['QUEUED', 'PAID'].includes(f.reward_status))) || new Set(s.payout_requests.map(r => r.referral_id)).size !== s.payout_requests.length || !referrals.filter(r => r.reward_status === 'QUEUED').every(r => s.payout_requests.some(p => p.referral_id === r.id))) return false;
  return s.receipts.every(r => r && text(r.request_id) && text(r.payload)) && new Set(s.receipts.map(r => r.request_id)).size === s.receipts.length;
}

export function rewardActions(record: ReferralRecord) {
  return record.status !== 'QUALIFIED' || record.reward_minor <= 0 ? [] : record.reward_status === 'PENDING' ? ['HOLD_REWARD', 'REQUEST_PAYOUT'] as const : record.reward_status === 'HELD' ? ['RELEASE_REWARD'] as const : [];
}
export function applyReferralCommand(state: ReferralState, command: ReferralCommand, actor: ReferralActor, context: ReferralContext, now: string): ReferralState {
  if (actor.role !== 'admin' || !actor.email.trim()) throw new Error('Administrator access required.');
  if (!text(command.request_id) || !date(now)) throw new Error('Invalid request metadata.');
  const payload = JSON.stringify({command, actor: actor.email});
  const receipt = state.receipts.find(r => r.request_id === command.request_id);
  if (receipt) { if (receipt.payload !== payload) throw new Error('Request ID already used for a different operation.'); return state; }
  if (command.expected_revision !== state.revision) throw new Error('Referral registry changed. Refresh and review the operation again.');
  if (typeof command.reason !== 'string' || command.reason.trim().length < 10 || command.reason.trim().length > 500) throw new Error('Provide an audit reason of 10–500 characters.');
  const next = structuredClone(state);
  let before: unknown = null, after: unknown, target: string;
  if (command.action === 'INVITE') {
    if (command.expected_config_revision !== context.policy.config_revision) throw new Error('Campaign terms changed. Close this operation, refresh and review the new terms.');
    const referrer = next.report.referrers.find(r => r.id === command.referrer_id);
    const email = command.invitee_email?.trim().toLowerCase() ?? '';
    if (!referrer || !context.eligible_referrer_ids.includes(referrer.id)) throw new Error('Choose an active, verified referrer included in the campaign rollout.');
    if (!context.policy.program_enabled) throw new Error('The referral program is paused in Flags & Config.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !command.invitee_name || command.invitee_name.trim().length < 2 || command.invitee_name.trim().length > 100) throw new Error('Enter a valid invited customer name and email.');
    if (referrer.email.toLowerCase() === email) throw new Error('Self-referrals are not allowed.');
    if (context.existing_customer_emails.includes(email)) throw new Error('Existing bank customers cannot receive a new referral attribution.');
    if (next.report.referrals.some(r => r.invitee_email.toLowerCase() === email)) throw new Error('This email already has a referral attribution.');
    target = `REF-${command.request_id}`;
    const record: ReferralRecord = {id: target, referrer_id: referrer.id, invitee_id: null, invitee_name: command.invitee_name.trim(), invitee_email: email, status: 'INVITED', invited_at: now, registered_at: null, qualified_at: null, reward_minor: 0, reward_currency: 'EUR', reward_status: 'NONE', rejection_reason: null};
    next.report.referrals.unshift(record);
    next.terms[target] = {reward_minor: context.policy.reward_minor, qualification_days: context.policy.qualification_days, config_revision: context.policy.config_revision};
    after = {record, terms: next.terms[target]};
  } else if (command.action === 'EXPORT') {
    const rows = command.kind === 'leaderboard' ? next.report.referrers : next.report.referrals;
    if (!['leaderboard', 'referrals'].includes(command.kind ?? '') || !Array.isArray(command.record_ids) || !command.record_ids.every(id => rows.some(r => r.id === id)) || new Set(command.record_ids).size !== command.record_ids.length) throw new Error('Invalid export scope.');
    target = `referrals-${command.kind}.csv`; after = {kind: command.kind, record_ids: command.record_ids, as_of: state.report.as_of};
  } else {
    const record = next.report.referrals.find(r => r.id === command.referral_id);
    if (!record || !(rewardActions(record) as readonly string[]).includes(command.action)) throw new Error('This reward operation is not allowed.');
    if (command.action === 'REQUEST_PAYOUT' && !context.eligible_referrer_ids.includes(record.referrer_id)) throw new Error('Reward payout requires an active, verified referrer in the campaign rollout.');
    before = structuredClone(record); target = record.id;
    if (command.action === 'HOLD_REWARD') record.reward_status = 'HELD';
    if (command.action === 'RELEASE_REWARD') record.reward_status = 'PENDING';
    if (command.action === 'REQUEST_PAYOUT') { record.reward_status = 'QUEUED'; next.payout_requests.push({referral_id: record.id, request_id: command.request_id, requested_at: now}); }
    after = record;
  }
  next.revision++; next.report.as_of = now;
  next.receipts.push({request_id: command.request_id, payload});
  next.audit.unshift({id: `referrals:${command.request_id}`, timestamp: now, source: 'REFERRALS', domain: 'PLATFORM', category: command.action === 'EXPORT' ? 'DATA_ACCESS' : 'CONFIGURATION', action: command.action, severity: command.action === 'EXPORT' ? 'INFO' : 'WARNING', outcome: 'SUCCESS', actor: actor.email, actorRole: 'ADMIN', target, reason: command.reason.trim(), correlationId: command.request_id, requestId: command.request_id, sessionId: null, ip: null, durationMs: null, before, after, origin: 'LOCAL'});
  return next;
}
