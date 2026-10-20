import { createDemoCurrencyRepository } from "../currencies/demo";
import { readMarketCatalog, executeCustomerCommand } from "../markets/store";
import { quantityForBudget, quoteTrade, tradingRestriction } from "../markets/engine";
import { readWallet, commitWallet } from "../wallet/store";
import { applyTrading, projectTrading } from "../wallet/trading";
import { applyWalletEvent, initialWallet } from "../wallet/engine";
import { decimal, units, usdValue } from "../transfers/engine";
import { MOCK_STOCK_HOLDINGS, MOCK_STOCK_HISTORY } from "../mock/stocks";
import { MOCK_DIVIDENDS } from "../mock/dividends";
import { stockCatalog } from "./catalog";
import { seedPlans, applyPlanCommand, validatePlanDraft, type PlanEvent } from "./plans";
import type { StocksRepository, StocksSnapshot, StockOrderDraft } from "./contracts";
import type { TradeRequest } from "../types/admin/markets";
export const STOCKS_EVENT = "mbank:stocks-updated";
const signed = (value: bigint) => `${value < BigInt(0) ? "-" : ""}${decimal(value < BigInt(0) ? -value : value, 2)}`;
export function createLocalStocksRepository(customer: string): StocksRepository {
  customer = customer.trim().toLowerCase();
  const actor = { email: customer, role: "client" as const }, currencies = createDemoCurrencyRepository(customer);
  const key = `mbank_stock_plans_v1:${encodeURIComponent(customer)}`;
  const quotes = new Map<string, { request: TradeRequest; expires: number; fingerprint: string }>();
  function view() { return projectTrading(readWallet(customer).state, readMarketCatalog(), customer); }
  function fingerprint() { const { state, events } = readWallet(customer); return JSON.stringify([readMarketCatalog(), state.transfers.accounts, state.trading, events.map(event => event.key)]); }
  function journal(): PlanEvent[] {
    const raw = sessionStorage.getItem(key); if (!raw) return [];
    let data: unknown; try { data = JSON.parse(raw); } catch { throw new Error("Saved investment plans could not be read. Your data was preserved."); }
    if (!Array.isArray(data) || data.length > 20000 || new Set(data.map(item => item?.key)).size !== data.length) throw new Error("Invalid saved investment plans. Your data was preserved.");
    return data as PlanEvent[];
  }
  function plans(events = journal()) {
    const names = new Map(readMarketCatalog().instruments.map(item => [item.symbol, item.name]));
    const today = new Date().toISOString().slice(0, 10);
    return events.reduce((result, event) => applyPlanCommand(result, event, names, today), seedPlans(today));
  }
  async function snapshot(): Promise<StocksSnapshot> {
    let saved = readWallet(customer);
    if (!saved.events.some(event => event.key === "stocks-opening-basis-v1")) {
      const basis = Object.fromEntries(saved.state.transfers.accounts.filter(a => a.kind === "stock" && Number(a.available) + Number(a.reserved) > 0 && saved.state.trading.cost_basis[a.asset] === undefined).map(a => [a.asset, (MOCK_STOCK_HOLDINGS.find(item => item.symbol === a.asset)?.avgCost ?? Number(a.usd_price)).toFixed(8)]));
      if (Object.keys(basis).length) { commitWallet(customer, { kind: "cost_basis", key: "stocks-opening-basis-v1", at: new Date().toISOString(), actor, basis }); saved = readWallet(customer); }
    }
    const wallet = await currencies.getSnapshot(), state = view(), market = stockCatalog(state);
    const total = wallet.accounts.filter(a => a.kind === "stock").reduce((sum, a) => sum + usdValue(units(a.available, a.decimals) + units(a.reserved, a.decimals), a.decimals, a.usd_price, "nearest"), BigInt(0));
    const stockTotal = (accounts: typeof wallet.accounts) => accounts.filter(a => a.kind === "stock").reduce((sum, a) => sum + usdValue(units(a.available, a.decimals) + units(a.reserved, a.decimals), a.decimals, market.find(i => i.symbol === a.asset)?.price_usd ?? a.usd_price, "nearest"), BigInt(0));
    let historical = initialWallet(); const openingTotal = stockTotal(historical.transfers.accounts);
    const movements: { label: string; value_usd: string; at: string }[] = [];
    let previousTotal = openingTotal;
    for (const event of saved.events) { historical = applyWalletEvent(historical, event); const value = stockTotal(historical.transfers.accounts); if (value !== previousTotal) movements.push({ label: new Date(event.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), value_usd: decimal(value, 2), at: event.at }); previousTotal = value; }
    const portfolio_history = Object.fromEntries(Object.entries(MOCK_STOCK_HISTORY).map(([period, points]) => {
      const history: { label: string; value_usd: string }[] = [];
      points.forEach((point, index) => {
        const start = points[Math.max(0, index - 1)];
        if (index) for (let step = 1; step < 5; step++) { const progress = step / 5, value = start.valoare + (point.valoare - start.valoare) * progress + Math.sin(index * 2 + step * 1.7) * Math.abs(point.valoare - start.valoare) * .17; history.push({ label: `${start.date} · ${step}`, value_usd: (value / points[points.length - 1].valoare * Number(openingTotal) / 100).toFixed(2) }); }
        history.push({ label: point.date, value_usd: (point.valoare / points[points.length - 1].valoare * Number(openingTotal) / 100).toFixed(2) });
      });
      const days = period === "1D" ? 1 : period === "1W" ? 7 : period === "1M" ? 30 : period === "1Y" ? 365 : Infinity;
      history.push(...movements.filter(p => Date.parse(p.at) >= Date.now() - days * 86400000).map(({ label, value_usd }) => ({ label, value_usd })));
      if (history.at(-1)?.value_usd !== decimal(total, 2)) history.push({ label: "Now", value_usd: decimal(total, 2) });
      return [period, history.slice(-500)];
    })) as StocksSnapshot["portfolio_history"];
    return { schema_version: 1, as_of: wallet.as_of, wallet, market, portfolio_history,
      holdings: wallet.accounts.filter(a => a.kind === "stock" && Number(a.available) + Number(a.reserved) > 0).map(a => {
        const item = market.find(item => item.symbol === a.asset), quantity = units(a.available, a.decimals) + units(a.reserved, a.decimals);
        const price = item?.price_usd ?? a.usd_price, average = (saved.state.trading.cost_basis[a.asset] ?? Number(price)).toFixed(8);
        const value = usdValue(quantity, a.decimals, price, "nearest"), cost = usdValue(quantity, a.decimals, average, "nearest");
        return { symbol: a.asset, name: a.name, sector: item?.sector ?? "Unclassified", quantity: decimal(quantity, a.decimals), reserved: a.reserved, average_cost_usd: average, price_usd: price, value_usd: decimal(value, 2), cost_usd: decimal(cost, 2), unrealized_usd: signed(value - cost), unrealized_percent: cost ? (Number(value - cost) / Number(cost) * 100).toFixed(2) : "0.00" };
      }),
      orders: state.orders.filter(o => o.domain === "STOCK" && o.userEmail === customer).map(o => ({ id: o.id, created_at: o.createdAt, symbol: o.symbol, side: o.side, type: o.type, status: o.status, quantity: o.quantity.toFixed(8), price_usd: o.price.toFixed(8), target_price_usd: o.targetPrice?.toFixed(8) ?? null, fee_usd: o.feeUsd.toFixed(2), total_usd: o.totalUsd.toFixed(2), currency: o.currency, reserved_cash: o.reservedCash.toFixed(2), note: o.note.replace("Demo execution settled in the shared trading wallet.", "Order completed.") })),
      plans: plans(),
      dividends: MOCK_DIVIDENDS.map(d => {
        // Entitlements follow the ex-date journal; later sales never rewrite a historical entitlement.
        let atEx = initialWallet(); for (const event of saved.events) if (event.at.slice(0, 10) < d.exDate) atEx = applyWalletEvent(atEx, event);
        const account = atEx.transfers.accounts.find(a => a.asset === d.symbol);
        const quantity = account ? units(account.available, account.decimals) + units(account.reserved, account.decimals) : BigInt(0);
        const payout = usdValue(quantity, account?.decimals ?? 8, d.amountPerShare.toFixed(8), "nearest");
        return { id: String(d.id), symbol: d.symbol, company: d.company, ex_date: d.exDate, pay_date: d.payDate, amount_per_share_usd: d.amountPerShare.toFixed(8), eligible_quantity: decimal(quantity, account?.decimals ?? 8), estimated_payout_usd: decimal(payout, 2), paid_amount_usd: "0.00", status: d.status };
      }),
    };
  }
  async function consistentSnapshot(): Promise<StocksSnapshot> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const before = fingerprint(), value = await snapshot();
      if (before === fingerprint()) return value;
    }
    throw new Error("Your portfolio changed while loading. Refresh to see the latest balances.");
  }
  function validateDraft(draft: StockOrderDraft): TradeRequest {
    const state = view(), item = state.instruments.find(i => i.symbol === draft.symbol && i.domain === "STOCK");
    if (!item || !["BUY", "SELL"].includes(draft.side) || !["MARKET", "LIMIT", "STOP"].includes(draft.type)) throw new Error("Select a listed stock and valid order type.");
    if (units(draft.quantity, item.fractional ? 8 : 0) <= BigInt(0)) throw new Error("Enter a positive share quantity.");
    if (draft.type !== "MARKET" && (!draft.target_price_usd || units(draft.target_price_usd, 8) <= BigInt(0))) throw new Error("Enter a positive target price.");
    return { symbol: draft.symbol, side: draft.side, type: draft.type, quantity: Number(draft.quantity), currency: draft.currency, ...(draft.type !== "MARKET" ? { targetPrice: Number(draft.target_price_usd) } : {}), expectedVersion: item.version, expectedRoutingVersion: state.routing.STOCK.version };
  }
  return { getSnapshot: consistentSnapshot,
    async quote(draft) {
      const request = validateDraft(draft), id = crypto.randomUUID(), catalog = readMarketCatalog();
      const execution = applyTrading(readWallet(customer).state, catalog, { type: "trade", request }, actor, new Date().toISOString(), id);
      const order = execution.after.orders.find(o => o.id === id)!;
      const item = execution.before.instruments.find(i => i.symbol === draft.symbol)!;
      const amount = quoteTrade(item, draft.side, request.quantity, draft.currency, order.price);
      const expires = Date.now() + 300000; for (const [key, saved] of quotes) if (saved.expires < Date.now()) quotes.delete(key); quotes.set(id, { request, expires, fingerprint: fingerprint() });
      return { id, draft: { ...draft }, execution_price_usd: order.price.toFixed(8), fee_usd: order.feeUsd.toFixed(2), total_usd: order.totalUsd.toFixed(2), settlement_amount: amount.cashAmount.toFixed(2), status: order.status as "FILLED" | "PENDING", expires_at: new Date(expires).toISOString() };
    },
    async submit(id, requestKey) {
      const quote = quotes.get(id); if (!quote) throw new Error("Quote unavailable. Request a new quote.");
      if (!/^[A-Za-z0-9-]{8,100}$/.test(requestKey)) throw new Error("Invalid request key.");
      if (!readWallet(customer).events.some(e => e.key === requestKey) && (Date.now() >= quote.expires || quote.fingerprint !== fingerprint())) throw new Error("Your wallet or market conditions changed. Refresh the quote.");
      executeCustomerCommand({ type: "trade", request: quote.request }, actor, requestKey); return consistentSnapshot();
    },
    async cancel(order_id, requestKey) { executeCustomerCommand({ type: "cancel_order", order_id }, actor, requestKey); return consistentSnapshot(); },
    async execute(command, requestKey) {
      if (!/^[A-Za-z0-9-]{8,100}$/.test(requestKey)) throw new Error("Invalid request key.");
      const events = journal(), prior = events.find(e => e.key === requestKey);
      if (prior) { if (JSON.stringify(prior.command) !== JSON.stringify(command)) throw new Error("Request key already used."); return consistentSnapshot(); }
      const current = plans(events), state = view();
      const draft = command.type === "set_plan_status" ? current.find(p => p.id === command.id) : command.draft;
      if (command.type !== "set_plan_status" || command.status === "ACTIVE") {
        if (!draft) throw new Error("Investment plan unavailable."); validatePlanDraft(draft);
        if (command.type !== "set_plan_status" && draft.starts_on < new Date().toISOString().slice(0, 10)) throw new Error("Choose today or a future start date.");
        const item = state.instruments.find(i => i.symbol === draft.symbol); if (!item) throw new Error("Asset unavailable.");
        const restriction = tradingRestriction(state, item, "BUY"); if (restriction) throw new Error(restriction);
        quoteTrade(item, "BUY", quantityForBudget(item, Number(draft.amount_usd), "USD", true));
      }
      const event = { command, key: requestKey, at: new Date().toISOString() };
      plans([...events, event]); sessionStorage.setItem(key, JSON.stringify([...events, event]));
      window.dispatchEvent(new Event(STOCKS_EVENT)); return consistentSnapshot();
    },
  };
}
