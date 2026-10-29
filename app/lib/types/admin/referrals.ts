// Reporting DTOs shared by the operational referral registry and the Go boundary.
export const REFERRAL_STATUSES = ["INVITED", "SIGNED_UP", "KYC_PENDING", "QUALIFIED", "REJECTED"] as const;
export type ReferralStatus = typeof REFERRAL_STATUSES[number];
export interface ReferralReferrer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  referral_code: string;
}
export interface ReferralRecord {
  id: string;
  referrer_id: string;
  invitee_id: string | null;
  invitee_name: string;
  invitee_email: string;
  status: ReferralStatus;
  invited_at: string;
  registered_at: string | null;
  qualified_at: string | null;
  reward_minor: number;
  reward_currency: "EUR";
  reward_status: "NONE" | "PENDING" | "PAID" | "HELD" | "QUEUED";
  rejection_reason: string | null;
}
export interface ReferralReport {
  schema_version: 1;
  as_of: string;
  referrers: ReferralReferrer[];
  referrals: ReferralRecord[];
}
export interface ReferralFilters { query: string; status: string; range: "30D" | "90D" | "ALL" }
export interface ReferralLeaderboardRow {
  referrer: ReferralReferrer;
  invited: number;
  registered: number;
  qualified: number;
  rejected: number;
  conversion: number;
  paid_minor: number;
  pending_minor: number;
  held_minor: number;
  queued_minor: number;
  latest_invited_at: string | null;
}
export interface ReferralsRepository { getReport(): Promise<ReferralReport> }
