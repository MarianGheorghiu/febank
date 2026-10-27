import type { AuditActor, AuditEvent } from "../types/admin/audit";
export const USER_ROLES = ["CLIENT", "OPERATOR", "COMPLIANCE", "ADMIN"] as const;
export const USER_STATUSES = ["ACTIVE", "BLOCKED"] as const;
export const KYC_STATUSES = ["VERIFIED", "IN_REVIEW", "REJECTED"] as const;
export interface ManagedUser {
  id: string; version: number; login_email: string; contact_email: string;
  legal_name: string; username: string; phone: string; country: string; address: string;
  date_of_birth: string | null; occupation: string; tax_country: string;
  role: typeof USER_ROLES[number]; status: typeof USER_STATUSES[number];
  kyc_status: typeof KYC_STATUSES[number]; risk_level: "LOW" | "MEDIUM" | "HIGH"; politically_exposed: boolean;
  mfa_status: "ENABLED" | "NOT_ENROLLED" | "UNKNOWN";
  password_reset_requested_at: string | null; mfa_reset_requested_at: string | null;
  created_at: string; updated_at: string; last_seen_at: string | null;
  notes: { id: string; text: string; actor: string; created_at: string }[];
}
export interface ManagedSession { id: string; user_id: string; device: string; ip: string | null; location: string | null; started_at: string; last_seen_at: string; revoked_at: string | null; expires_at: string; source: "DEMO" }
export interface UserRegistry { schema_version: 1; revision: number; users: ManagedUser[]; sessions: ManagedSession[]; audit: AuditEvent[]; receipts: { key: string; fingerprint: string; actor: string }[] }
export type UserProfile = Pick<ManagedUser, "legal_name" | "username" | "contact_email" | "phone" | "country" | "address" | "date_of_birth" | "occupation" | "tax_country">;
export type UserCommand = { expected_revision: number; reason: string } & (
  | { action: "CREATE"; login_email: string; profile: UserProfile }
  | { action: "PROFILE"; user_id: string; profile: UserProfile }
  | { action: "ACCESS"; user_id: string; role: ManagedUser["role"]; status: ManagedUser["status"] }
  | { action: "VERIFICATION"; user_id: string; kyc_status: ManagedUser["kyc_status"]; risk_level: ManagedUser["risk_level"]; politically_exposed: boolean }
  | { action: "REVOKE_SESSION"; user_id: string; session_id: string }
  | { action: "REVOKE_ALL" | "REQUEST_PASSWORD_RESET" | "REQUEST_MFA_RESET" | "NOTE"; user_id: string }
  | { action: "EXPORT"; user_ids: string[]; format: "CSV" | "JSON" }
);
export interface UserRegistrySnapshot extends UserRegistry { mode: "demo" | "http"; as_of: string }
export interface UserFinancials {
  observed: boolean; available_usd: string; reserved_usd: string;
  accounts: { asset: string; kind: string; available: string; reserved: string; usd_value: string }[];
  transfers: { id: string; asset: string; amount: string; status: string; direction: string; at: string }[];
  pending_orders: number; personal_credit_usd: string;
}
export interface UserDetail {
  user_id: string; as_of: string; financials: UserFinancials;
  cards: { id: string; last4: string; type: string; status: string; currency: string }[];
  subscriptions: { id: string; plan: string; status: string }[];
  risk_cases: { id: string; domain: string; status: string; severity: string }[];
  risk_restriction: boolean;
}
export interface UsersRepository {
  getSnapshot(signal?: AbortSignal): Promise<UserRegistrySnapshot>;
  getDetail(id: string, signal?: AbortSignal): Promise<UserDetail>;
  execute(command: UserCommand, key: string): Promise<UserRegistrySnapshot>;
}
export type UserOperator = AuditActor;
