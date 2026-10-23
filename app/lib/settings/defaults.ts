import type { CommunicationPreferences, CustomerPreferences } from "./contracts";
export const SETTINGS_EVENT = "mbank:settings-updated";
export const DEFAULT_PREFERENCES: CustomerPreferences = { timezone: "Europe/Bucharest", date_locale: "en-GB", motion: "system", settlement_currency: "USD", analytics_period: "30D", asset_period: "1M", target_allocation: { fiat: 35, crypto: 40, stock: 25 } };
export const DEFAULT_COMMUNICATIONS: CommunicationPreferences = { offers_email: false, portfolio_email: false, social_email: false, product_email: false };
export const REQUEST_LABELS = { change_password: "Password change", setup_mfa: "Authenticator setup", manage_mfa: "Authenticator management", manage_passkeys: "Passkey management", contact_change: "Personal details update", data_export: "Personal data export", closure_review: "Account closure review" } as const;
