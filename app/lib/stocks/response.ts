import { parseCurrencySnapshot } from "../currencies/response";
import { STOCK_PERIODS, type StocksSnapshot, type StockQuote } from "./contracts";
import { validDay, validatePlanDraft } from "./plans";
const fail = () => { throw new Error("Invalid stocks service response."); };
function obj(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) return fail(); return value as Record<string, unknown>; }
function text(value: unknown): asserts value is string { if (typeof value !== "string" || !value.trim()) fail(); }
function amount(value: unknown, signed = false) { text(value); if (!(signed ? /^-?\d+(\.\d{1,18})?$/ : /^\d+(\.\d{1,18})?$/).test(value) || !Number.isFinite(Number(value))) fail(); }
function date(value: unknown) { text(value); if (!value.endsWith("Z") || !Number.isFinite(Date.parse(value))) fail(); }
function day(value: unknown) { text(value); if (!validDay(value)) fail(); }
function list(value: unknown): Record<string, unknown>[] { if (!Array.isArray(value) || value.length > 20000) return fail(); return value.map(obj); }
function unique(rows: Record<string, unknown>[], key: string) { const ids = new Set(); for (const row of rows) { text(row[key]); if (ids.has(row[key])) fail(); ids.add(row[key]); } }
function one(value: unknown, values: string[]) { if (!values.includes(String(value))) fail(); }
export function parseStocksSnapshot(value: unknown): StocksSnapshot {
  const data = obj(value); if (data.schema_version !== 1) fail(); date(data.as_of);
  const wallet = parseCurrencySnapshot(data.wallet);
  const market = list(data.market); unique(market, "symbol");
  for (const row of market) {
    if (!wallet.assets.some(a => a.symbol === row.symbol && a.kind === "stock")) fail();
    for (const field of ["name", "exchange", "volume", "market_cap", "category", "sector", "region"]) text(row[field]);
    for (const field of ["price_usd", "min_order_usd", "max_order_usd"]) amount(row[field]);
    if (Number(row.price_usd) <= 0 || Number(row.min_order_usd) <= 0 || Number(row.max_order_usd) < Number(row.min_order_usd)) fail();
    for (const field of ["fee_bps", "spread_bps"]) if (!Number.isInteger(row[field]) || Number(row[field]) < 0 || Number(row[field]) > 500) fail();
    for (const field of ["change_24h", "change_7d"]) if (row[field] !== null) amount(row[field], true);
    for (const field of ["fractional", "can_buy", "can_sell"]) if (typeof row[field] !== "boolean") fail();
    for (const side of ["buy", "sell"]) { if (row[`${side}_restriction`] !== null) text(row[`${side}_restriction`]); if (!row[`can_${side}`] && row[`${side}_restriction`] === null) fail(); }
    for (const stat of list(row.stats)) { for (const field of ["label", "value", "icon"]) text(stat[field]); if (typeof stat.unit !== "string") fail(); one(stat.icon, ["Globe", "Activity", "DollarSign", "PieChart", "Flame", "ShieldCheck"]); }
    for (const news of list(row.news)) { if (!Number.isInteger(news.id)) fail(); for (const field of ["source", "time", "title", "sentiment"]) text(news[field]); }
    const charts = obj(row.charts);
    for (const period of STOCK_PERIODS) { const points = list(charts[period]); if (points.length < 2) fail(); for (const p of points) { text(p.label); for (const field of ["open", "high", "low", "close"]) amount(p[field]); if (Number(p.low) > Math.min(Number(p.open), Number(p.close)) || Number(p.high) < Math.max(Number(p.open), Number(p.close))) fail(); } }
  }
  const history = obj(data.portfolio_history); for (const period of STOCK_PERIODS) { const rows = list(history[period]); if (rows.length < 2) fail(); rows.forEach(p => { text(p.label); amount(p.value_usd); }); }
  const holdings = list(data.holdings); unique(holdings, "symbol"); for (const row of holdings) { text(row.name); text(row.sector); for (const field of ["quantity", "reserved", "average_cost_usd", "price_usd", "value_usd", "cost_usd"]) amount(row[field]); amount(row.unrealized_usd, true); amount(row.unrealized_percent, true); if (Number(row.reserved) > Number(row.quantity)) fail(); }
  const orders = list(data.orders); unique(orders, "id"); for (const row of orders) {
    text(row.symbol); text(row.currency); if (typeof row.note !== "string") fail(); date(row.created_at); one(row.side, ["BUY", "SELL"]); one(row.type, ["MARKET", "LIMIT", "STOP"]); one(row.status, ["PENDING", "FILLED", "CANCELLED", "REJECTED"]);
    for (const field of ["quantity", "price_usd", "fee_usd", "total_usd", "reserved_cash"]) amount(row[field]); if (row.target_price_usd !== null) amount(row.target_price_usd);
  }
  const plans = list(data.plans); unique(plans, "id"); for (const row of plans) { validatePlanDraft(row as unknown as StocksSnapshot["plans"][number]); text(row.name); text(row.day); day(row.next_run); one(row.status, ["ACTIVE", "PAUSED"]); if (!Number.isInteger(row.version) || Number(row.version) < 1) fail(); }
  const dividends = list(data.dividends); unique(dividends, "id"); for (const row of dividends) { text(row.symbol); text(row.company); day(row.ex_date); day(row.pay_date); if (String(row.pay_date) < String(row.ex_date)) fail(); for (const field of ["amount_per_share_usd", "eligible_quantity", "estimated_payout_usd", "paid_amount_usd"]) amount(row[field]); one(row.status, ["PENDING", "UPCOMING", "PAID"]); }
  return value as StocksSnapshot;
}
export function parseStockQuote(value: unknown): StockQuote {
  const quote = obj(value), draft = obj(quote.draft); text(quote.id); date(quote.expires_at);
  text(draft.symbol); text(draft.currency); one(draft.side, ["BUY", "SELL"]); one(draft.type, ["MARKET", "LIMIT", "STOP"]); amount(draft.quantity); if (draft.target_price_usd !== null) amount(draft.target_price_usd);
  for (const field of ["execution_price_usd", "fee_usd", "total_usd", "settlement_amount"]) amount(quote[field]); one(quote.status, ["PENDING", "FILLED"]); return value as StockQuote;
}
