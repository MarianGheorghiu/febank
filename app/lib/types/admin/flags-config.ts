export const CONFIG_ENVIRONMENTS = ["production", "staging", "sandbox"] as const;
export type ConfigEnvironment = typeof CONFIG_ENVIRONMENTS[number];
export type ConfigValue = string | number | boolean;
export type ConfigModule = "platform" | "identity" | "accounts" | "transfers" | "cards" | "crypto" | "stocks" | "loans" | "subscriptions" | "growth" | "communications" | "operations";
export interface SettingDefinition {
  key: string; module: ConfigModule; name: string; description: string;
  type: "boolean" | "number" | "select"; default_value: ConfigValue;
  advanced?: boolean; critical?: boolean; unit?: string; min?: number; max?: number; options?: string[];
}
export interface FlagDefinition {
  key: string; module: ConfigModule; name: string; description: string;
  default_enabled: boolean; advanced?: boolean; critical?: boolean; depends_on?: string;
}
export interface FlagRule { enabled: boolean; rollout_pct: number; audience: "all" | "premium" | "business" | "internal" }
export interface ConfigPayload { settings: Record<string, ConfigValue>; flags: Record<string, FlagRule> }
export interface ConfigRelease {
  id: string; request_id?: string; revision: number; timestamp: string; actor: string; reason: string;
  restored_from: string | null; before: ConfigPayload; after: ConfigPayload;
}
export interface EnvironmentConfig { revision: number; published: ConfigPayload; releases: ConfigRelease[] }
export interface ConfigState { receipts?: {request_id: string; fingerprint: string; release_id: string}[]; schema_version: 1; environments: Record<ConfigEnvironment, EnvironmentConfig> }
export interface ConfigChange { key: string; name: string; before: ConfigValue | FlagRule; after: ConfigValue | FlagRule; critical: boolean }
export interface PublishConfigRequest {
  environment: ConfigEnvironment; expected_revision: number; payload: ConfigPayload;
  reason: string; actor: { email: string; role: "admin" | "client" }; restored_from?: string; request_id?: string;
}
export interface ConfigRepository {
  getSnapshot(): Promise<ConfigState>;
  publish(request: PublishConfigRequest): Promise<ConfigState>;
}

export interface ConfigPublishCommand {
  request_id: string; environment: ConfigEnvironment; catalog_version: 1;
  expected_revision: number; payload: ConfigPayload; reason: string; restored_from: string | null;
}
export interface ConfigExportCommand { request_id: string; snapshot_id: string; environment: ConfigEnvironment; revision: number; reason: string; content_sha256: string }
export interface ConfigExportReceipt { request_id: string; snapshot_id: string; environment: ConfigEnvironment; revision: number; content_sha256: string; audit_event_id: string; recorded_at: string }
export interface ConfigSnapshot {
  schema_version: 2; catalog_version: 1; scope: 'GLOBAL'; mode: 'demo' | 'live'; snapshot_id: string; as_of: string;
  state: ConfigState; permissions: {publish: boolean; export: boolean};
}
export interface ConfigAdminRepository {
  getSnapshot(signal?: AbortSignal): Promise<ConfigSnapshot>;
  publish(command: ConfigPublishCommand): Promise<ConfigSnapshot>;
  recordExport(command: ConfigExportCommand): Promise<ConfigExportReceipt>;
}
