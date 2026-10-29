import type { AuditEvent } from '../types/admin/audit';
import type { ReferralReport } from '../types/admin/referrals';

/** Explicit sample evidence of imported outcomes; never fabricated local operations. */
export function referralDemoEvidence(report: ReferralReport): AuditEvent[] {
  const examples = [
    ...report.referrals.filter(r => r.reward_status === 'HELD').slice(0, 4).map(r => ({r, action: 'REWARD_HOLD_SNAPSHOT', category: 'COMPLIANCE' as const, reason: 'Illustrative imported reward on hold. Review is required before this unpaid reward can enter payment processing.'})),
    ...report.referrals.filter(r => r.reward_status === 'PENDING').slice(0, 4).map(r => ({r, action: 'PENDING_REWARD_SNAPSHOT', category: 'FINANCIAL' as const, reason: 'Illustrative earned reward awaiting review. No payout request or wallet credit is implied by this snapshot.'})),
    ...report.referrals.filter(r => r.reward_status === 'PAID').slice(0, 4).map(r => ({r, action: 'PAID_REWARD_SNAPSHOT', category: 'FINANCIAL' as const, reason: 'Illustrative historical reward marked paid in the imported campaign report. No local wallet settlement was executed.'})),
    ...report.referrals.filter(r => r.status === 'REJECTED').slice(0, 4).map(r => ({r, action: 'REJECTED_ATTRIBUTION_SNAPSHOT', category: 'COMPLIANCE' as const, reason: `Illustrative imported rejected referral: ${r.rejection_reason}. No reward was earned.`})),
    ...report.referrals.filter(r => r.status === 'KYC_PENDING').slice(0, 3).map(r => ({r, action: 'KYC_PENDING_SNAPSHOT', category: 'COMPLIANCE' as const, reason: 'Illustrative registered customer awaiting verification. Referral qualification has not been confirmed.'})),
  ];
  return examples.map(({r, action, category, reason}, i) => ({id: `referrals:demo-import:${i}:${r.id}`, timestamp: report.as_of, source: 'REFERRALS', domain: 'PLATFORM', category, action, severity: r.reward_status === 'HELD' || r.status === 'REJECTED' ? 'WARNING' : 'INFO', outcome: 'SUCCESS', actor: 'campaign-import@example.test', actorRole: 'SYSTEM', target: r.id, reason, correlationId: `referral-import:${r.referrer_id}`, requestId: null, sessionId: null, ip: null, durationMs: null, before: null, after: {...r}, origin: 'DEMO', evidenceKind: 'SNAPSHOT'}));
}
