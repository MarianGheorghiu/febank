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
  id: string; revision: number; timestamp: string; actor: string; reason: string;
  restored_from: string | null; before: ConfigPayload; after: ConfigPayload;
}
export interface EnvironmentConfig { revision: number; published: ConfigPayload; releases: ConfigRelease[] }
export interface ConfigState { schema_version: 1; environments: Record<ConfigEnvironment, EnvironmentConfig> }
export interface ConfigChange { key: string; name: string; before: ConfigValue | FlagRule; after: ConfigValue | FlagRule; critical: boolean }
export interface PublishConfigRequest {
  environment: ConfigEnvironment; expected_revision: number; payload: ConfigPayload;
  reason: string; actor: { email: string; role: "admin" | "client" }; restored_from?: string;
}
export interface ConfigRepository {
  getSnapshot(): Promise<ConfigState>;
  publish(request: PublishConfigRequest): Promise<ConfigState>;
}
