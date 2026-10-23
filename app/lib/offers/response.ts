import type { OffersSnapshot } from "./contracts";
/** Strict boundary for server-supplied financial values and the collections rendered by the UI. */
export function parseOffersSnapshot(input: unknown): OffersSnapshot {
  const fail = (): never => { throw new Error("Invalid offers service response."); };
  const obj = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : fail();
  const txt = (value: unknown) => typeof value === "string" && value.trim().length > 0 && value.length <= 3000 ? value : fail();
  const num = (value: unknown, min = 0, max = 1000000000) => typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max ? value : fail();
  const money = (value: unknown) => { if (!/^\d{1,12}\.\d{2}$/.test(txt(value))) fail(); };
  const date = (value: unknown) => { if (!/^\d{4}-\d\d-\d\dT/.test(txt(value)) || !Number.isFinite(Date.parse(String(value)))) fail(); };
  const bool = (value: unknown) => { if (typeof value !== "boolean") fail(); };
  const one = (value: unknown, values: unknown[]) => { if (!values.includes(value)) fail(); };
  const rows = (value: unknown) => {
    if (!Array.isArray(value) || value.length > 20000) return fail();
    const result = value.map(obj); const ids = result.map(row => txt(row.id)); if (new Set(ids).size !== ids.length) fail(); return result;
  };
  const plans = ["STANDARD", "PREMIUM", "METAL"];
  const tiers = (value: unknown) => { if (!Array.isArray(value) || !value.length || value.some(item => !plans.includes(item))) fail(); };
  const data = obj(input); one(data.schema_version, [1]); one(data.mode, ["http"]); num(data.version); date(data.as_of); num(data.available_points); num(data.expiring_points); if (data.next_expiry !== null) date(data.next_expiry); num(data.lounge_remaining); money(data.wallet_usd);
  const membership = obj(data.membership); one(membership.plan, plans); bool(membership.active); one(membership.source, ["subscription"]); if (membership.subscription_id !== null) txt(membership.subscription_id);
  const catalog = obj(data.catalog); num(catalog.version);
  const policy = obj(catalog.policy); for (const key of ["cash_points_per_dollar", "cash_min_points", "cash_step_points"]) num(policy[key], 1); num(policy.lounge_year, 2000, 2200); const allowance = obj(policy.lounge_allowance); for (const plan of plans) num(allowance[plan], 0, 10000); tiers(policy.concierge_plans);
  const cards = rows(data.cards); for (const card of cards) { txt(card.label); one(card.currency, ["USD", "EUR", "RON"]); bool(card.eligible); }
  const offers = rows(catalog.offers);
  for (const row of offers) { for (const key of ["merchant", "title", "description", "channels", "region", "terms"]) txt(row[key]); one(row.category, ["Travel", "Dining", "Shopping", "Wellness"]); num(row.rate_bps, 0, 10000); money(row.min_spend); money(row.max_cashback); date(row.starts_at); date(row.expires_at); if (String(row.starts_at) >= String(row.expires_at)) fail(); tiers(row.plans); }
  const experiences = rows(catalog.experiences);
  for (const row of experiences) { for (const key of ["title", "venue", "location", "timezone", "description"]) txt(row[key]); try { new Intl.DateTimeFormat("en", { timeZone: String(row.timezone) }); } catch { fail(); } date(row.starts_at); date(row.cancel_until); if (String(row.cancel_until) >= String(row.starts_at)) fail(); num(row.points_cost, 1); num(row.capacity); tiers(row.plans); }
  const lounges = rows(catalog.lounges); for (const row of lounges) for (const key of ["name", "airport", "location", "opening_hours", "terms"]) txt(row[key]);
  const airlines = rows(catalog.airlines); for (const row of airlines) { txt(row.name); txt(row.eta); num(row.points_per_mile, 1); num(row.minimum_points, 1); num(row.step_points, 1); num(row.member_digits, 4, 20); }
  for (const row of rows(catalog.research)) { txt(row.name); txt(row.description); money(row.minimum_capital); txt(row.risk); tiers(row.plans); }
  const lots = rows(data.lots); for (const lot of lots) { num(lot.remaining); if (lot.expires_at !== null) date(lot.expires_at); }
  for (const row of rows(data.entries)) { one(row.kind, ["earned", "spent", "refund", "expired", "cashback", "activity"]); num(row.points, -1000000000); if (row.cash !== null) money(row.cash); txt(row.description); date(row.at); }
  if (!Array.isArray(data.saved_offer_ids) || new Set(data.saved_offer_ids).size !== data.saved_offer_ids.length || data.saved_offer_ids.some(id => !offers.some(offer => offer.id === id))) fail();
  for (const row of rows(data.activations)) { if (!offers.some(offer => offer.id === row.offer_id)) fail(); txt(row.card_id); date(row.activated_at); }
  const allocations = (value: unknown) => { if (!Array.isArray(value) || value.length > 10000) fail(); for (const allocation of value as unknown[]) { const row = obj(allocation); if (!lots.some(lot => lot.id === row.lot_id)) fail(); num(row.points, 1); } };
  for (const row of rows(data.bookings)) { if (!experiences.some(experience => experience.id === row.experience_id)) fail(); one(row.status, ["pending", "confirmed", "cancelled", "used"]); num(row.points_paid, 1); allocations(row.allocations); date(row.created_at); txt(row.reference); }
  for (const row of rows(data.transfers)) { if (!airlines.some(airline => airline.id === row.partner_id)) fail(); if (!/^\d{4}$/.test(txt(row.member_last4))) fail(); num(row.points, 1); num(row.miles, 1); one(row.status, ["pending", "processing", "completed", "cancelled", "failed"]); allocations(row.allocations); date(row.created_at); }
  for (const row of rows(data.passes)) { if (!lounges.some(lounge => lounge.id === row.lounge_id)) fail(); txt(row.reference); num(row.year, 2000, 2200); one(row.status, ["reserved", "used", "cancelled"]); date(row.expires_at); date(row.created_at); }
  for (const row of rows(data.requests)) { one(row.kind, ["concierge", "research"]); txt(row.subject); txt(row.details); one(row.status, ["submitted", "in_progress", "closed", "cancelled"]); date(row.created_at); }
  const points = lots.filter(lot => lot.expires_at === null || Date.parse(String(lot.expires_at)) > Date.parse(String(data.as_of))).reduce((sum, lot) => sum + Number(lot.remaining), 0);
  if (points !== data.available_points || Number(data.expiring_points) > points) fail();
  return input as OffersSnapshot;
}
