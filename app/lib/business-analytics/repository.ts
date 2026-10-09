import { MOCK_BUSINESS_ANALYTICS } from "@/app/lib/mock/admin/business-analytics";
import type { BusinessAnalyticsRepository } from "@/app/lib/types/admin/business-analytics";
export const mockBusinessAnalyticsRepository: BusinessAnalyticsRepository = { async getReport() { return structuredClone(MOCK_BUSINESS_ANALYTICS); } };
