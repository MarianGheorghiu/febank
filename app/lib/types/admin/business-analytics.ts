// Go reporting DTOs: EUR minor units, UTC calendar dates, snake_case JSON.
export const BUSINESS_SEGMENTS = ["RETAIL", "BUSINESS"] as const;
export type BusinessSegment = typeof BUSINESS_SEGMENTS[number];
export const BUSINESS_PRODUCTS = ["PAYMENTS", "CARDS", "FX", "INVESTMENTS", "LENDING", "SUBSCRIPTIONS"] as const;
export type BusinessProduct = typeof BUSINESS_PRODUCTS[number];
export const ACQUISITION_CHANNELS = ["ORGANIC", "REFERRAL", "PAID", "PARTNER"] as const;
export type AcquisitionChannel = typeof ACQUISITION_CHANNELS[number];
export interface BusinessProductDay {
  date: string; segment: BusinessSegment; product: BusinessProduct;
  gross_revenue_minor: number; refunds_minor: number; direct_cost_minor: number;
  settled_volume_minor: number; completed_operations: number; failed_operations: number; pending_operations: number;
}
export interface BusinessDay {
  date: string; segment: BusinessSegment;
  payroll_minor: number; infrastructure_minor: number; compliance_minor: number; acquisition_minor: number; credit_provision_minor: number;
  external_inflow_minor: number; external_outflow_minor: number;
  registered_customers: number; verified_customers: number; funded_customers: number; active_customers_30d: number; paying_subscriptions: number;
  client_deposits_minor: number; liquid_assets_minor: number; loan_book_minor: number; nonperforming_loans_minor: number; other_assets_minor: number; other_liabilities_minor: number; equity_minor: number;
}
export interface BusinessAcquisitionCohort {
  date: string; segment: BusinessSegment; channel: AcquisitionChannel;
  registered: number; verified: number; funded: number; active: number; acquisition_spend_minor: number;
}
export interface BusinessAnalyticsReport {
  schema_version: 1; report_id: string; as_of: string; complete_through: string;
  reporting_currency: "EUR"; days: BusinessDay[]; products: BusinessProductDay[]; cohorts: BusinessAcquisitionCohort[];
}
export interface BusinessAnalyticsFilters { from: string; to: string; segment: "ALL" | BusinessSegment }
export interface BusinessAnalyticsRepository { getReport(): Promise<BusinessAnalyticsReport> }
