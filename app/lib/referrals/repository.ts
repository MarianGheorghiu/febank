import { MOCK_REFERRAL_REPORT } from "@/app/lib/mock/admin/referrals";
import type { ReferralsRepository } from "@/app/lib/types/admin/referrals";
// Replace this repository with authenticated Go reporting calls; no UI changes needed.
export const mockReferralsRepository: ReferralsRepository = {
  async getReport() { return structuredClone(MOCK_REFERRAL_REPORT); },
};
