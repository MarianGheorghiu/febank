import { initialUsers } from "./users";
import type { ReferralRecord, ReferralReport, ReferralReferrer } from "@/app/lib/types/admin/referrals";
export const REFERRALS_AS_OF = "2026-10-09T12:00:00.000Z";
const additionalNames = ["Ana Ionescu", "Vlad Petrescu", "Elena Marin", "Diana Tudor", "Alex Matei", "Sofia Barbu"];
const referrers: ReferralReferrer[] = [
  ...initialUsers.filter(u => u.role === "CLIENT").map((u, i) => ({ id: `RFR-${i + 1}`, user_id: u.id, name: u.name, email: u.email, referral_code: `MB-${u.id.slice(4)}-INVITE` })),
  ...additionalNames.map((name, i) => ({ id: `RFR-${i + 5}`, user_id: `DEMO-RFR-USER-${i + 1}`, name, email: `referrer${i + 1}@example.test`, referral_code: `MB-DEMO-${i + 1}` })),
];
const counts = [31, 24, 17, 13, 11, 9, 7, 5, 3, 0];
const firstNames = ["Andreea", "Matei", "Bianca", "David", "Teodora", "Gabriel", "Mara", "Ionut", "Nadia", "Luca"];
const lastNames = ["Popescu", "Dumitrescu", "Marin", "Stan", "Dobre", "Pavel", "Nistor", "Radu", "Tudor", "Barbu"];
const day = 86400000;
const referrals: ReferralRecord[] = referrers.flatMap((referrer, index) => Array.from({ length: counts[index] }, (_, n) => {
  const unique = index * 100 + n + 1;
  const invited = Date.parse(REFERRALS_AS_OF) - (3 + (n * 7 + index * 11) % 115) * day;
  const registered = n % 8 !== 0;
  const status = !registered ? "INVITED" : n % 11 === 4 ? "REJECTED" : n % 6 === 2 ? "KYC_PENDING" : n % 5 === 1 ? "SIGNED_UP" : "QUALIFIED";
  const qualified = status === "QUALIFIED";
  return { id: `REF-${String(unique).padStart(4, "0")}`, referrer_id: referrer.id,
    invitee_id: registered ? `DEMO-REFERRED-${unique}` : null,
    invitee_name: `${firstNames[unique % firstNames.length]} ${lastNames[(n + index * 3) % lastNames.length]}`,
    invitee_email: `invitee${unique}@example.test`, status,
    invited_at: new Date(invited).toISOString(), registered_at: registered ? new Date(invited + day).toISOString() : null,
    qualified_at: qualified ? new Date(invited + 2 * day).toISOString() : null,
    reward_minor: qualified ? 2500 : 0, reward_currency: "EUR",
    reward_status: qualified ? n % 7 === 0 ? "HELD" : invited + 14 * day > Date.parse(REFERRALS_AS_OF) ? "PENDING" : "PAID" : "NONE",
    rejection_reason: status === "REJECTED" ? n % 2 ? "Duplicate referral attribution" : "Qualifying activity requirement not met" : null,
  };
}));
export const MOCK_REFERRAL_REPORT: ReferralReport = { schema_version: 1, as_of: REFERRALS_AS_OF, referrers, referrals };
