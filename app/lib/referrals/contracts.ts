import type { AuditActor, AuditEvent } from '../types/admin/audit';
import type { ReferralReport } from '../types/admin/referrals';

export interface ReferralPolicy {
  config_revision: number;
  reward_minor: number;
  qualification_days: number;
  program_enabled: boolean;
}
export interface ReferralState {
  schema_version: 1;
  revision: number;
  report: ReferralReport;
  terms: Record<string, { reward_minor: number; qualification_days: number; config_revision: number }>;
  payout_requests: { referral_id: string; request_id: string; requested_at: string }[];
  audit: AuditEvent[];
  receipts: { request_id: string; payload: string }[];
}
export interface ReferralSnapshot {
  schema_version: 1; mode: 'demo' | 'live'; as_of: string;
  state: ReferralState; policy: ReferralPolicy; eligible_referrer_ids: string[];
}
export type ReferralAction = 'INVITE' | 'HOLD_REWARD' | 'RELEASE_REWARD' | 'REQUEST_PAYOUT' | 'EXPORT';
export interface ReferralCommand {
  request_id: string; expected_revision: number; action: ReferralAction; reason: string;
  referral_id?: string; referrer_id?: string; invitee_name?: string; invitee_email?: string;
  expected_config_revision?: number;
  kind?: 'referrals' | 'leaderboard'; record_ids?: string[];
}
export interface ReferralRepository {
  getSnapshot(signal?: AbortSignal): Promise<ReferralSnapshot>;
  execute(command: ReferralCommand): Promise<ReferralSnapshot>;
}
export interface ReferralContext { policy: ReferralPolicy; eligible_referrer_ids: string[]; existing_customer_emails: string[] }
export type ReferralActor = AuditActor;
export interface CustomerReferralSummary {
  schema_version: 1; mode: 'demo' | 'live'; as_of: string;
  referral_code: string | null; invited: number; registered: number; qualified: number;
  paid_minor: number; pending_minor: number; held_minor: number; queued_minor: number;
  currency: 'EUR'; program_available: boolean;
}
