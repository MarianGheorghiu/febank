import type { StreamConfig } from "@/app/lib/types/loans/revenue";

export const MOCK_REVENUE_STREAMS: StreamConfig[] = [
  {
    id: "str-1",
    platform: "STRIPE CORE API",
    mrr: 84000,
    status: "CONNECTED",
    verifiedLimit: 250000,
  },
  {
    id: "str-2",
    platform: "SHOPIFY GATEWAY",
    mrr: 42000,
    status: "CONNECTED",
    verifiedLimit: 120000,
  },
  {
    id: "str-3",
    platform: "APP STORE CONNECT",
    mrr: 19000,
    status: "SYNCING",
    verifiedLimit: 50000,
  },
];
