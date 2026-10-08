export type FacilityType = "REVOLVING" | "VENTURE_DEBT" | "EQUIPMENT";

export interface FacilityConfig {
  allocatedLimit: number;
  drawnAmount: number;
  baseAPR: number;
  dscrRequirement: string; // Metrică financiară corporate corporativă (Debt Service Coverage Ratio)
  burnRateThreshold: string;
}
