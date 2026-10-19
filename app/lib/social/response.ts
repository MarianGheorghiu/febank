import type { SocialSnapshot } from "./contracts";

/** Validate untrusted JSON before it can drive contacts or payment destinations. */
export function parseSocialSnapshot(value: unknown): SocialSnapshot {
  const fail = () => { throw new Error("Invalid Friends & Social response. Please refresh or contact support."); };
  const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  const text = (v: unknown, max = 160): v is string => typeof v === "string" && v.length <= max;
  const date = (v: unknown) => text(v) && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(v) && Number.isFinite(Date.parse(v));
  if (!object(value) || value.schema_version !== 1 || !["demo", "live"].includes(String(value.mode)) || !date(value.as_of)) return fail();
  for (const key of ["friends", "connections", "money_requests"]) {
    const rows = value[key];
    if (!Array.isArray(rows) || rows.length > 10000 || rows.some(r => !object(r) || !text(r.id) || !r.id || !date(r.created_at)) || new Set(rows.map(r => r.id)).size !== rows.length) return fail();
  }
  const friends = value.friends as Record<string, unknown>[];
  if (friends.some(f => !text(f.name, 120) || !f.name || !text(f.username, 33) || !/^@[a-z0-9_]{3,32}$/i.test(f.username) || !text(f.phone, 16) || (f.phone !== "" && !/^\+[1-9]\d{7,14}$/.test(f.phone)) || !["online", "offline"].includes(String(f.presence)) || typeof f.muted !== "boolean")) return fail();
  if ((value.connections as Record<string, unknown>[]).some(r => !text(r.name, 120) || !text(r.username, 33) || !/^@[a-z0-9_]{3,32}$/i.test(r.username) || !["incoming", "outgoing"].includes(String(r.direction)) || !["pending", "accepted", "declined", "cancelled"].includes(String(r.status)))) return fail();
  if ((value.money_requests as Record<string, unknown>[]).some(r => (!text(r.friend_id) || (r.status === "pending" && !friends.some(f => f.id === r.friend_id))) || !["incoming", "outgoing"].includes(String(r.direction)) || !["pending", "paid", "cancelled", "declined"].includes(String(r.status)) || !text(r.amount, 15) || !/^\d{1,9}\.\d{2}$/.test(r.amount) || Number(r.amount) <= 0 || r.currency !== "USD" || !text(r.note, 140) || (r.group_id !== undefined && !text(r.group_id)))) return fail();
  return structuredClone(value) as unknown as SocialSnapshot;
}
