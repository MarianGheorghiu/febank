import { MOCK_FRIENDS, MOCK_RECEIVED_REQUESTS, MOCK_SENT_REQUESTS } from "../mock/friends";
import type { SocialSnapshot } from "./contracts";

export function socialSeed(): SocialSnapshot {
  const at = "2026-10-14T12:00:00.000Z";
  return {
    schema_version: 1, mode: "demo", as_of: at,
    friends: MOCK_FRIENDS.map(f => ({ id: f.id, name: f.name, username: f.username, phone: f.phone.replace(/\s/g, ""), presence: f.status, muted: f.isMuted, created_at: new Date(f.dateAdded + " 00:00:00 UTC").toISOString() })),
    connections: [...MOCK_RECEIVED_REQUESTS.map(r => ({ ...r, direction: "incoming" as const })), ...MOCK_SENT_REQUESTS.map(r => ({ ...r, direction: "outgoing" as const }))].map(r => ({ id: r.id, name: r.name, username: r.username, direction: r.direction, status: "pending", created_at: new Date(r.date + " 00:00:00 UTC").toISOString() })),
    money_requests: MOCK_FRIENDS.filter(f => f.balance > 0).map(f => ({ id: `money-${f.id}`, friend_id: f.id, direction: f.financialStatus === "you_owe" ? "incoming" : "outgoing", amount: f.balance.toFixed(2), currency: "USD", note: "Shared expenses", status: "pending", created_at: at })),
  };
}
