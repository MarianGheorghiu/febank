/** Go-facing customer settings. Identity and capabilities are service-owned. No secrets in commands. */
export type SecurityFlow = "change_password" | "setup_mfa" | "manage_mfa" | "manage_passkeys";
export type RequestKind = SecurityFlow | "contact_change" | "data_export" | "closure_review";
export interface CustomerPreferences {
  timezone: "Europe/Bucharest" | "UTC" | "Europe/London" | "America/New_York";
  date_locale: "en-GB" | "ro-RO" | "en-US";
  motion: "system" | "reduce";
  settlement_currency: "USD" | "EUR" | "RON";
  analytics_period: "30D" | "90D" | "1Y" | "ALL";
  asset_period: "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";
  target_allocation: { fiat: number; crypto: number; stock: number };
}
export interface CommunicationPreferences { offers_email: boolean; portfolio_email: boolean; social_email: boolean; product_email: boolean }
export interface SettingsSession { id: string; device: string; current: boolean; ip: string | null; location: string | null; started_at: string; last_seen_at: string; revoked_at: string | null; source: "demo" | "server" }
export interface SettingsRequest { id: string; kind: RequestKind; details: string; status: "pending" | "processing" | "completed" | "cancelled" | "declined"; created_at: string }
export interface SettingsAudit { id: string; at: string; action: string; description: string; result: "completed" | "requested"; source: "demo" | "server" }
export interface SettingsState {
  version: number; display_name: string; preferences: CustomerPreferences; communications: CommunicationPreferences;
  sessions: SettingsSession[]; requests: SettingsRequest[]; audit: SettingsAudit[];
}
export interface SettingsSnapshot extends SettingsState {
  schema_version: 1; mode: "demo" | "http"; as_of: string;
  identity: { email: string; legal_name: string; client_code: string; account_status: "ACTIVE" | "BLOCKED" | "UNKNOWN"; verification: "VERIFIED" | "IN_REVIEW" | "UNKNOWN"; address: string | null };
  security: { mfa: "enabled" | "not_enrolled" | "unknown"; passkey_count: number; password_updated_at: string | null; available_flows: SecurityFlow[] };
  account_review: { has_balances: boolean; has_personal_credit: boolean; pending_transfers: number; pending_orders: number; linked_businesses: number };
}
export type SettingsCommand = { expected_version: number } & (
  | { action: "profile"; display_name: string }
  | { action: "preferences"; preferences: CustomerPreferences }
  | { action: "communications"; communications: CommunicationPreferences }
  | { action: "revoke_session"; session_id: string }
  | { action: "revoke_others" }
  | { action: "request"; kind: RequestKind; details: string }
  | { action: "cancel_request"; request_id: string }
);
export type SecurityFlowResult = { kind: "demo_request"; snapshot: SettingsSnapshot } | { kind: "redirect"; redirect_url: string; expires_at: string };
export interface SettingsRepository {
  getSnapshot(signal?: AbortSignal): Promise<SettingsSnapshot>;
  execute(command: SettingsCommand, key: string): Promise<SettingsSnapshot>;
  startSecurityFlow(action: SecurityFlow, expectedVersion: number, key: string): Promise<SecurityFlowResult>;
}
