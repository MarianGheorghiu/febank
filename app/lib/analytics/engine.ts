import { demoPortfolioHistory, demoPriceHistory } from "./demo-history";
import { applyWalletEvent, initialWallet, type WalletEvent, type WalletState } from "../wallet/engine";
import { decimal, units, usdValue } from "../transfers/engine";
import { outstanding, loanSchedule } from "../loans/engine";
import { availablePoints } from "../offers/engine";
import type { CustomerCardsSnapshot } from "../cards/contracts";
import type { AnalyticsMovement, AnalyticsPeriod, AnalyticsPosition, AnalyticsSnapshot } from "./contracts";
const zero = BigInt(0);
export const signedMoney = (value: bigint) => `${value < zero ? "-" : ""}${decimal(value < zero ? -value : value, 2)}`;
export const signedUnits = (value: string) => value.startsWith("-") ? -units(value.slice(1), 2) : units(value, 2);
export const analyticsMoney = (value: string) => { const negative = value.startsWith("-"); const [whole, fraction = "00"] = (negative ? value.slice(1) : value).split("."); return `${negative ? "−" : ""}$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")}`; };
const sum = (values: string[]) => values.reduce((total, value) => total + units(value, 2), zero);
export function periodStart(period: AnalyticsPeriod, now: string): string | null {
  if (!["30D", "90D", "1Y", "ALL"].includes(period) || !Number.isFinite(Date.parse(now))) throw new Error("Invalid analytics period.");
  if (period === "ALL") return null;
  const date = new Date(now); date.setUTCHours(0, 0, 0, 0); date.setUTCDate(date.getUTCDate() - ({ "30D": 29, "90D": 89, "1Y": 364 }[period])); return date.toISOString();
}
function totals(state: WalletState) {
  const assets = state.transfers.accounts.reduce((total, a) => total + usdValue(units(a.available, a.decimals) + units(a.reserved, a.decimals), a.decimals, a.usd_price, "nearest"), zero);
  const debt = units(outstanding(state.credit, "personal"), 2);
  return { assets_usd: decimal(assets, 2), debt_usd: decimal(debt, 2), net_worth_usd: signedMoney(assets - debt) };
}
/** Read-only projection: reservations remain owned, credit limits and rewards points are not assets. */
export function projectAnalytics(state: WalletState, events: WalletEvent[], cards: CustomerCardsSnapshot, period: AnalyticsPeriod, now: string): AnalyticsSnapshot {
  const from = periodStart(period, now), inRange = (at: string) => Date.parse(at) <= Date.parse(now) && (!from || Date.parse(at) >= Date.parse(from));
  const total = totals(state), assetTotal = units(total.assets_usd, 2);
  const positions: AnalyticsPosition[] = state.transfers.accounts.flatMap(a => {
    const available = units(a.available, a.decimals), reserved = units(a.reserved, a.decimals), owned = available + reserved;
    if (!owned) return [];
    const value = usdValue(owned, a.decimals, a.usd_price, "nearest"), availableValue = usdValue(available, a.decimals, a.usd_price, "nearest");
    const average = state.trading.cost_basis[a.asset];
    const cost = a.kind !== "fiat" && typeof average === "number" && Number.isFinite(average) && average >= 0 ? usdValue(owned, a.decimals, average.toFixed(8), "nearest") : null;
    return [{ id: a.id, symbol: a.asset, name: a.name, kind: a.kind, decimals: a.decimals, available: a.available, reserved: a.reserved, quantity: decimal(owned, a.decimals), price_usd: a.usd_price, value_usd: decimal(value, 2), available_usd: decimal(availableValue, 2), reserved_usd: decimal(value - availableValue, 2), cost_usd: cost === null ? null : decimal(cost, 2), unrealized_usd: cost === null ? null : signedMoney(value - cost), allocation_bps: assetTotal ? Number(value * BigInt(10000) / assetTotal) : 0, price_history: demoPriceHistory({ symbol: a.asset, kind: a.kind, price_usd: a.usd_price }, now) }];
  }).sort((a, b) => Number(b.value_usd) - Number(a.value_usd));
  const allocation = (["fiat", "crypto", "stock"] as const).map(kind => { const value = sum(positions.filter(p => p.kind === kind).map(p => p.value_usd)); return { kind, value_usd: decimal(value, 2), weight_bps: assetTotal ? Number(value * BigInt(10000) / assetTotal) : 0 }; });
  const investments = positions.filter(p => p.kind !== "fiat"), covered = investments.filter(p => p.cost_usd !== null), investment = sum(investments.map(p => p.value_usd)), knownValue = sum(covered.map(p => p.value_usd)), cost = sum(covered.map(p => p.cost_usd!));
  const movements: AnalyticsMovement[] = [];
  for (const t of state.transfers.transfers) {
    const a = state.transfers.accounts.find(a => a.id === t.account_id), feeAccount = state.transfers.accounts.find(a => a.id === t.fee_account_id) ?? a;
    if (!a || !feeAccount) throw new Error("A transfer valuation account is missing.");
    // value_usd is the booked amount including fee, captured at the transfer quote.
    const recorded = events.find(event => event.kind === "submit" && `trf-${event.key}` === t.id);
    const fee = usdValue(units(t.fee, feeAccount.decimals), feeAccount.decimals, recorded?.prices?.[feeAccount.asset] ?? feeAccount.usd_price, "nearest");
    movements.push({ id: `transfer:${t.id}`, at: t.status === "completed" ? t.updated_at : t.created_at, description: t.reference ? `${t.recipient_name} · ${t.reference}` : t.recipient_name, category: t.kind === "fiat" ? "Cash movement" : "Asset transfer", direction: t.direction, amount: t.amount, currency: t.asset, value_usd: t.value_usd, fee_usd: decimal(fee, 2), status: t.status === "processing" ? "pending" : t.status });
  }
  for (const { operation: op, at } of state.cash_operations) movements.push({ id: `cash:${op.id}`, at, description: op.type === "deposit" ? "Wallet deposit" : "Wallet withdrawal", category: "Cash movement", direction: op.type === "deposit" ? "incoming" : "outgoing", amount: op.amount, currency: "USD", value_usd: op.amount, fee_usd: "0.00", status: "completed" });
  for (const entry of state.rewards.entries.filter(e => e.cash !== null && (e.kind === "cashback" || e.kind === "spent"))) movements.push({ id: `reward:${entry.id}`, at: entry.at, description: entry.description, category: "Rewards", direction: "incoming", amount: entry.cash!, currency: "USD", value_usd: entry.cash!, fee_usd: "0.00", status: "completed" });
  for (const entry of state.credit.activity.filter(e => e.scope === "personal" && e.amount !== null && ["draw", "repay_facility", "repay_loan"].includes(e.action))) movements.push({ id: `credit:${entry.id}`, at: entry.at, description: entry.description, category: "Financing", direction: entry.action === "draw" ? "incoming" : "outgoing", amount: entry.amount!, currency: "USD", value_usd: entry.amount!, fee_usd: "0.00", status: "completed" });
  for (const order of state.trading.orders) movements.push({ id: `order:${order.id}`, at: order.status === "FILLED" ? order.updatedAt : order.createdAt, description: `${order.side === "BUY" ? "Buy" : "Sell"} ${order.quantity} ${order.symbol}`, category: "Investment", direction: order.side === "BUY" ? "outgoing" : "incoming", amount: String(order.quantity), currency: order.symbol, value_usd: order.totalUsd.toFixed(2), fee_usd: order.status === "FILLED" ? order.feeUsd.toFixed(2) : "0.00", status: ({ FILLED: "completed", PENDING: "pending", CANCELLED: "cancelled", REJECTED: "rejected" } as const)[order.status] });
  for (const event of events) {
    if (event.kind !== "trading" || event.command.type !== "exchange") continue;
    const command = event.command, source = state.transfers.accounts.find(a => a.asset === command.source), target = state.transfers.accounts.find(a => a.asset === command.target);
    // Asset exchanges already have investment order legs. Fiat-to-fiat has no order record.
    if (source?.kind !== "fiat" || target?.kind !== "fiat") continue;
    const amount = command.amount.toFixed(source.decimals);
    movements.push({ id: `exchange:${event.key}`, at: event.at, description: `${command.source} → ${command.target} exchange`, category: "Exchange", direction: "outgoing", amount, currency: source.asset, value_usd: decimal(usdValue(units(amount, source.decimals), source.decimals, event.prices?.[source.asset] ?? source.usd_price, "nearest"), 2), fee_usd: "0.00", status: "completed" });
  }
  const selected = movements.filter(m => inRange(m.at)).sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
  const cash = selected.filter(m => m.status === "completed" && m.category === "Cash movement"), incoming = sum(cash.filter(m => m.direction === "incoming").map(m => m.value_usd)), outgoing = sum(cash.filter(m => m.direction === "outgoing").map(m => m.value_usd));
  const flowMap = new Map<string, { incoming: bigint; outgoing: bigint }>();
  for (const m of cash) { const key = `${m.at.slice(0, 7)}-01T00:00:00.000Z`, flow = flowMap.get(key) ?? { incoming: zero, outgoing: zero }; flow[m.direction] += units(m.value_usd, 2); flowMap.set(key, flow); }
  const historyMap = new Map<string, AnalyticsSnapshot["history"][number]>();
  // Replay only saved observations, in journal order. Do not synthesize a market price series.
  let historical = initialWallet();
  for (const event of events) { historical = applyWalletEvent(historical, event); if (inRange(event.at)) historyMap.set(event.at.slice(0, 10), { at: event.at, ...totals(historical) }); }
  historyMap.set(now.slice(0, 10), { at: now, ...total });
  const history = [...historyMap.values()].sort((a, b) => a.at.localeCompare(b.at));
  // At most 400 observations, preserving the opening and current observation.
  const boundedHistory = history.filter((_, i) => i === 0 || i === history.length - 1 || i % Math.ceil(history.length / 398) === 0);
  const cardSpending = new Map<string, { completed: bigint; pending: bigint; transactions: number; categories: Map<string, bigint> }>();
  for (const t of cards.activity.filter(t => inRange(t.occurred_at) && t.status !== "REVERSED")) {
    const row = cardSpending.get(t.currency) ?? { completed: zero, pending: zero, transactions: 0, categories: new Map<string, bigint>() }, amount = units(t.amount, 2);
    if (t.status === "COMPLETED") { row.completed += amount; row.transactions++; row.categories.set(t.category, (row.categories.get(t.category) ?? zero) + amount); } else row.pending += amount;
    cardSpending.set(t.currency, row);
  }
  const categoryTotal = (category: AnalyticsMovement["category"], direction: AnalyticsMovement["direction"]) => decimal(sum(selected.filter(m => m.category === category && m.status === "completed" && m.direction === direction).map(m => m.value_usd)), 2);
  return {
    schema_version: 1, mode: "demo", as_of: now, currency: "USD", period, from,
    summary: { ...total, available_cash_usd: decimal(sum(positions.filter(p => p.kind === "fiat").map(p => p.available_usd)), 2), reserved_usd: decimal(sum(positions.map(p => p.reserved_usd)), 2), investment_usd: decimal(investment, 2), known_cost_usd: decimal(cost, 2), known_value_usd: decimal(knownValue, 2), unrealized_usd: covered.length ? signedMoney(knownValue - cost) : null, basis_coverage_bps: investment ? Number(knownValue * BigInt(10000) / investment) : 0 },
    positions, allocation, history: boundedHistory, demo_history: demoPortfolioHistory(positions, total.debt_usd, now).filter(point => inRange(point.at)), flows: [...flowMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([at, value]) => ({ at, incoming_usd: decimal(value.incoming, 2), outgoing_usd: decimal(value.outgoing, 2) })),
    cashflow: { incoming_usd: decimal(incoming, 2), outgoing_usd: decimal(outgoing, 2), net_usd: signedMoney(incoming - outgoing), fees_usd: decimal(sum(selected.filter(m => m.status === "completed").map(m => m.fee_usd)), 2), financing_in_usd: categoryTotal("Financing", "incoming"), financing_out_usd: categoryTotal("Financing", "outgoing"), rewards_usd: categoryTotal("Rewards", "incoming") }, movements: selected,
    debts: [...state.credit.loans.filter(l => l.scope === "personal" && units(l.principal, 2) > zero).map(l => ({ id: l.id, name: l.name, type: "Loan" as const, principal_usd: l.principal, limit_usd: null, next_due: l.next_due, payment_usd: loanSchedule(l)[0]?.payment ?? null })), ...state.credit.facilities.filter(f => f.scope === "personal").map(f => ({ id: f.id, name: f.name, type: "Credit line" as const, principal_usd: f.drawn, limit_usd: f.limit, next_due: null, payment_usd: null }))],
    businesses: state.credit.businesses.filter(b => b.verified).map(b => ({ id: b.id, name: b.name, cash_usd: b.cash, debt_usd: outstanding(state.credit, `business:${b.id}`) })),
    rewards: { available_points: availablePoints(state.rewards, now), expiring_points: state.rewards.lots.filter(l => l.expires_at && Date.parse(l.expires_at) > Date.parse(now) && Date.parse(l.expires_at) <= Date.parse(now) + 30 * 86400000).reduce((total, l) => total + l.remaining, 0), redeemed_usd: decimal(sum(selected.filter(m => m.id.startsWith("reward:") && state.rewards.entries.some(e => `reward:${e.id}` === m.id && e.kind === "spent")).map(m => m.value_usd)), 2), cashback_usd: decimal(sum(selected.filter(m => m.id.startsWith("reward:") && state.rewards.entries.some(e => `reward:${e.id}` === m.id && e.kind === "cashback")).map(m => m.value_usd)), 2), pending_requests: state.rewards.requests.filter(r => ["submitted", "in_progress"].includes(r.status)).length + state.rewards.bookings.filter(b => b.status === "pending").length + state.rewards.transfers.filter(t => ["pending", "processing"].includes(t.status)).length },
    cards: { count: cards.cards.filter(c => c.status !== "TERMINATED").length, active: cards.cards.filter(c => c.status === "ACTIVE").length, as_of: cards.as_of, spending: [...cardSpending.entries()].map(([currency, row]) => ({ currency, completed: decimal(row.completed, 2), pending: decimal(row.pending, 2), transactions: row.transactions, categories: [...row.categories.entries()].map(([name, amount]) => ({ name, amount: decimal(amount, 2) })).sort((a, b) => Number(b.amount) - Number(a.amount)) })) },
  };
}
