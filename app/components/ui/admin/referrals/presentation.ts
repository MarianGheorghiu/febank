import { auditBadge } from '../audit/presentation';
import type { ReferralAction } from '@/app/lib/referrals/contracts';
export const referralStatusLabels = {INVITED: 'Invited', SIGNED_UP: 'Signed up', KYC_PENDING: 'KYC pending', QUALIFIED: 'Qualified', REJECTED: 'Rejected'};
export const referralActionLabels: Record<ReferralAction, string> = {INVITE: 'Record invitation', HOLD_REWARD: 'Hold reward', RELEASE_REWARD: 'Release hold', REQUEST_PAYOUT: 'Request payout', EXPORT: 'Export report'};
export const referralBadge = (status: string) => auditBadge(['QUALIFIED', 'PAID'].includes(status) ? 'SUCCESS' : status === 'REJECTED' ? 'FAILED' : ['HELD', 'KYC_PENDING', 'PENDING'].includes(status) ? 'WARNING' : status);
export const referralDate = (value: string | null) => value ? new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium', timeZone: 'Europe/Bucharest'}).format(new Date(value)) : '—';
