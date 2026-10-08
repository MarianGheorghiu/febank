import type { FacilityType, FacilityConfig } from "@/app/lib/types/loans/facilities";

export const FACILITIES_DATA: Record<FacilityType, FacilityConfig> = {
  REVOLVING: {
    allocatedLimit: 500000,
    drawnAmount: 140000,
    baseAPR: 6.45,
    dscrRequirement: "> 1.25x",
    burnRateThreshold: "N/A",
  },
  VENTURE_DEBT: {
    allocatedLimit: 1500000,
    drawnAmount: 0,
    baseAPR: 8.95,
    dscrRequirement: "VC Backed",
    burnRateThreshold: "< $80k/mo",
  },
  EQUIPMENT: {
    allocatedLimit: 300000,
    drawnAmount: 85000,
    baseAPR: 5.2,
    dscrRequirement: "> 1.10x",
    burnRateThreshold: "N/A",
  },
};
