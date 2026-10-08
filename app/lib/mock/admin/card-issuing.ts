import { initialUsers } from "./users";
import type { CardCustomer, CardIssuingState, IssuedCard } from "@/app/lib/types/admin/card-issuing";

const customerProfiles: Record<string, Pick<CardCustomer, "kycStatus" | "deliveryAddress">> = {
  "USR-1204": { kycStatus: "VERIFIED", deliveryAddress: "Str. Lalelelor 12, București, 030167, România" },
  "USR-2315": { kycStatus: "VERIFIED", deliveryAddress: "Str. Memorandumului 8, Cluj-Napoca, 400114, România" },
  "USR-3426": { kycStatus: "IN_REVIEW", deliveryAddress: null },
  "USR-0883": { kycStatus: "VERIFIED", deliveryAddress: null },
};
export const MOCK_CARD_CUSTOMERS: CardCustomer[] = initialUsers.filter(user => user.role === "CLIENT").map(user => ({
  id: user.id, name: user.name, email: user.email, accountStatus: user.status,
  ...(customerProfiles[user.id] ?? { kycStatus: "IN_REVIEW", deliveryAddress: null }),
}));
export const MOCK_ISSUING_POLICY = {
  maxOpenCardsPerCustomer: 5,
  maxMonthlyLimit: 100000,
  defaultLimits: { daily: 2500, monthly: 15000, atmDaily: 500 },
  currencies: ["EUR", "USD", "RON"],
  networks: ["VISA", "MASTERCARD"],
} as const;

const seedCard = (overrides: Partial<IssuedCard> & Pick<IssuedCard, "id" | "userId" | "last4">): IssuedCard => ({
  type: "PHYSICAL", network: "VISA", currency: "EUR", expiry: "09/29", status: "ACTIVE",
  limits: { ...MOCK_ISSUING_POLICY.defaultLimits },
  channels: { online: true, atm: true, contactless: true, international: true },
  spentToday: 125, spentThisMonth: 1840,
  delivery: "DELIVERED", deliveryAddress: customerProfiles[overrides.userId]?.deliveryAddress ?? null,
  trackingReference: "MB-RO-720041", createdAt: "2026-09-01T09:00:00Z", updatedAt: "2026-10-08T07:00:00Z",
  version: 1, replacesCardId: null, replacedByCardId: null, ...overrides,
});
export const MOCK_CARD_ISSUING_STATE: CardIssuingState = {
  revision: 0,
  cards: [
    seedCard({ id: "CRD-1001", userId: "USR-1204", last4: "4821" }),
    seedCard({ id: "CRD-1002", userId: "USR-1204", last4: "9073", type: "VIRTUAL", network: "MASTERCARD", currency: "USD", delivery: "NOT_REQUIRED", deliveryAddress: null, trackingReference: null, channels: { online: true, atm: false, contactless: false, international: true }, limits: { daily: 1000, monthly: 5000, atmDaily: 0 }, spentToday: 0, spentThisMonth: 380 }),
    seedCard({ id: "CRD-1003", userId: "USR-2315", last4: "6154", status: "FROZEN", spentToday: 0, spentThisMonth: 620 }),
    seedCard({ id: "CRD-1004", userId: "USR-2315", last4: "3382", status: "PENDING", currency: "RON", delivery: "ORDERED", trackingReference: null, spentToday: 0, spentThisMonth: 0 }),
    seedCard({ id: "CRD-1005", userId: "USR-0883", last4: "1208", status: "BLOCKED", spentToday: 0, spentThisMonth: 0 }),
    seedCard({ id: "CRD-1006", userId: "USR-1204", last4: "7690", status: "TERMINATED", spentToday: 0, spentThisMonth: 0 }),
    seedCard({ id: "CRD-1007", userId: "USR-2315", last4: "2448", status: "PENDING", delivery: "DISPATCHED", trackingReference: "MB-RO-720088", spentToday: 0, spentThisMonth: 0 }),
  ],
  audit: [
    { id: "CAU-001", timestamp: "2026-10-08T07:00:00Z", actor: "operations@admin.com", action: "FREEZE", cardId: "CRD-1003", userId: "USR-2315", reason: "Customer reported an unrecognized authorization; investigation opened.", before: null, after: null },
    { id: "CAU-002", timestamp: "2026-10-07T13:30:00Z", actor: "operations@admin.com", action: "DISPATCH", cardId: "CRD-1007", userId: "USR-2315", reason: "Physical card handed over to the verified delivery partner.", before: null, after: null },
  ],
};
