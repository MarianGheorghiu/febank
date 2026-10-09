import { MOCK_SYSTEM_HEALTH } from "@/app/lib/mock/admin/system-health";
import type { SystemHealthRepository } from "@/app/lib/types/admin/system-health";
export const mockSystemHealthRepository: SystemHealthRepository = { async getSnapshot() { return structuredClone(MOCK_SYSTEM_HEALTH); } };
