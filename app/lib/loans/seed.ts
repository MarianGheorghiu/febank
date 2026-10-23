import { RETAIL_CONFIGS, BUSINESS_CONFIGS } from "../mock/loans/products";
import { FACILITIES_DATA } from "../mock/loans/facilities";
import { MOCK_REVENUE_STREAMS } from "../mock/loans/revenue";
import { MOCK_VC_FUNDS } from "../mock/loans/capital";
import type { CreditProduct, CreditState } from "./contracts";

export const demoFunds = MOCK_VC_FUNDS.map((fund, index) => ({ scope: "business:demo-company" as const, id: `fund-${index}`, name: fund.name, focus: fund.focus, ticket: fund.ticketRange, match_percent: fund.matchScore }));
/** Explicit demo membership. Production memberships MUST come from the authenticated service. */
export function creditSeed(): CreditState {
  const products: CreditProduct[] = [];
  for (const [segment, catalog] of [["personal", RETAIL_CONFIGS], ["business", BUSINESS_CONFIGS]] as const) {
    for (const [key, config] of Object.entries(catalog)) products.push({
      id: `${segment}-${key}`, segment, name: key.toLowerCase().replaceAll("_", " "),
      min_amount: config.minAmount.toFixed(2), max_amount: config.maxAmount.toFixed(2), step_amount: config.stepAmount.toFixed(2),
      min_months: config.minYears * 12, max_months: config.maxYears * 12, annual_rate_bps: Math.round(config.baseAPR * 100),
    });
  }
  return {
    policy: { lombard_base_rate_bps: 445, lombard_min_months: 1, lombard_max_months: 12,
      revenue_min_amount: "5000.00", revenue_min_share_bps: 200, revenue_max_share_bps: 2000,
      revenue_factor_threshold_bps: 1000, revenue_low_factor_bps: 10500, revenue_high_factor_bps: 10800 },
    version: 0, businesses: [{ id: "demo-company", name: "Acme Studio SRL · Demo", verified: true, cash: "85000.00" }], products,
    // Reconciles to Overview's opening USD 12,500 credit; historical proceeds are already in opening cash.
    loans: [{ id: "loan-personal", scope: "personal", name: "Personal loan", principal: "11250.00", annual_rate_bps: 725, remaining_months: 36, next_due: "2026-11-15", pauses_used: 0 },
      { id: "loan-equipment", scope: "business:demo-company", name: "Equipment finance", principal: "85000.00", annual_rate_bps: 520, remaining_months: 36, next_due: "2026-11-20", pauses_used: 0 }],
    facilities: [{ id: "buffer", scope: "personal", name: "Buffer shield", limit: "5000.00", drawn: "1250.00", annual_rate_bps: 899, enabled: true, requirement: "Repay outstanding funds before disabling. Interest accrues under your credit agreement." },
      ...Object.entries(FACILITIES_DATA).filter(([key]) => key !== "EQUIPMENT").map(([key, item]) => ({ id: `facility-${key}`, scope: "business:demo-company" as const, name: key.toLowerCase().replaceAll("_", " "), limit: item.allocatedLimit.toFixed(2), drawn: item.drawnAmount.toFixed(2), annual_rate_bps: Math.round(item.baseAPR * 100), enabled: true, requirement: `${item.dscrRequirement} · Burn rate ${item.burnRateThreshold}` }))],
    sources: MOCK_REVENUE_STREAMS.map(source => ({ id: source.id, scope: "business:demo-company", name: source.platform.replace(" API", ""), monthly_revenue: source.mrr.toFixed(2), verified_limit: source.verifiedLimit.toFixed(2), status: source.status.toLowerCase() as "connected" | "syncing" | "offline" })),
    // Invoices carry their actual currency; no implicit conversion to USD.
    invoices: [{ id: "inv-01", scope: "business:demo-company", reference: "RO-2026-991", debtor: "DANTE INTERNATIONAL SA", currency: "RON", amount: "45000.00", advance_bps: 9000, fee_bps: 150, due: "2026-11-25", status: "eligible" },
      { id: "inv-02", scope: "business:demo-company", reference: "RO-2026-992", debtor: "ENDAVA ROMANIA SRL", currency: "RON", amount: "120000.00", advance_bps: 9000, fee_bps: 150, due: "2026-12-01", status: "eligible" },
      { id: "inv-03", scope: "business:demo-company", reference: "RO-2026-840", debtor: "ORANGE ROMANIA SA", currency: "RON", amount: "32000.00", advance_bps: 9000, fee_bps: 150, due: "2026-10-01", status: "funded" }],
    discounts: [{ id: "salary", label: "Salary routing", description: "Set up salary deposits through your USD account. Eligibility is verified by the lender.", discount_bps: 50, achieved: false },
      { id: "turnover", label: "Monthly card volume", description: "Demo verified monthly card volume exceeds USD 5,000.", discount_bps: 25, achieved: true },
      { id: "health", label: "Financial health", description: "Demo financial health score: 815 / 850.", discount_bps: 25, achieved: true }],
    matching: [{ enabled: false, anonymous: true, scope: "business:demo-company" }], applications: [], activity: [],
  };
}
