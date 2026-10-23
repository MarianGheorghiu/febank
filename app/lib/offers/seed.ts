import type { RewardsState } from "./contracts";
/** Historical demo rewards are already reflected in opening cash. Do not deposit them again. */
export function rewardsSeed(): RewardsState {
  const earned = [40000, 48000, 42000, 55000, 60000, 100200];
  const cash = ["42.50", "58.00", "76.25", "95.00", "110.75", "129.50"];
  return {
    version: 0,
    lots: earned.map((points, index) => ({ id: `points-2026-${index + 5}`, remaining: points, expires_at: `2027-${String(index + 5).padStart(2, "0")}-28T23:59:59Z` })),
    entries: earned.flatMap((points, index) => [
      { id: `earned-${index}`, kind: "earned" as const, points, cash: null, description: "Eligible card spending · demo", at: `2026-${String(index + 5).padStart(2, "0")}-15T10:00:00Z` },
      { id: `cashback-${index}`, kind: "cashback" as const, points: 0, cash: cash[index], description: "Merchant cashback · demo settlement", at: `2026-${String(index + 5).padStart(2, "0")}-18T10:00:00Z` },
    ]).sort((a,b) => b.at.localeCompare(a.at)),
    saved_offer_ids: [], activations: [], bookings: [], transfers: [], passes: [
      { id: "visit-june", lounge_id: "otp", reference: "DEMO-VISIT-01", year: 2026, status: "used", created_at: "2026-06-12T10:00:00Z", expires_at: "2026-06-12T11:00:00Z" },
      { id: "visit-august", lounge_id: "hnd", reference: "DEMO-VISIT-02", year: 2026, status: "used", created_at: "2026-08-18T10:00:00Z", expires_at: "2026-08-18T11:00:00Z" },
    ], requests: [],
  };
}
