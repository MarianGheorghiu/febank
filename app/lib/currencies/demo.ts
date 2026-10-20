import { openingCurrencyHistory } from "./history";
import { readMarketCatalog, executeCustomerCommand } from "../markets/store";
import { exchangeAssets, previewExchange, walletFor } from "../markets/engine";
import { readWallet } from "../wallet/store";
import { applyWalletEvent, initialWallet } from "../wallet/engine";
import { projectTrading } from "../wallet/trading";
import { decimal, units, usdValue } from "../transfers/engine";
import { MOCK_TRADING_FX } from "../markets/seed";
import type { CurrencyPoint, CurrencyRepository, CurrencySnapshot, ExchangeDraft } from "./contracts";
import type { TransferAccount } from "../transfers/contracts";

export function createDemoCurrencyRepository(customer: string): CurrencyRepository {
  customer = customer.trim().toLowerCase();
  const actor = { email: customer, role: "client" as const };
  const quotes = new Map<string, { draft: ExchangeDraft; revision: number; fingerprint: string; expires: number }>();
  function view() { return projectTrading(readWallet(customer).state, readMarketCatalog(), customer); }
  function fingerprint(state: ReturnType<typeof view>) { return JSON.stringify([state.revision, state.accountBalances]); }
  function snapshot(): CurrencySnapshot {
    const catalog = readMarketCatalog();
    const { state, events } = readWallet(customer);
    const prices = new Map(catalog.instruments.map(i => [i.symbol, i.priceUsd.toFixed(8)]));
    const point = (accounts: TransferAccount[], id: string, at: string | null): CurrencyPoint => {
      const total = (kind: TransferAccount["kind"]) => decimal(accounts.filter(a => a.kind === kind).reduce((sum, a) => sum + usdValue(units(a.available, a.decimals), a.decimals, prices.get(a.asset) ?? a.usd_price, "nearest"), BigInt(0)), 2);
      return { id, at, fiat: total("fiat"), crypto: total("crypto"), stock: total("stock") };
    };
    let historical = initialWallet();
    const history = openingCurrencyHistory(point(historical.transfers.accounts, "opening", null), events[0]?.at ?? new Date().toISOString());
    for (const event of events) { historical = applyWalletEvent(historical, event); history.push(point(historical.transfers.accounts, event.key, event.at)); }
    // Presentation history leads into canonical journal events and current balances.
    return { schema_version: 1, mode: "demo", as_of: new Date().toISOString(), accounts: state.transfers.accounts,
      assets: [...Object.keys(MOCK_TRADING_FX).map(symbol => ({ symbol, name: state.transfers.accounts.find(a => a.asset === symbol)?.name ?? symbol, kind: "fiat" as const, status: "ACTIVE" as const, decimals: 2 })), ...catalog.instruments.map(i => ({ symbol: i.symbol, name: i.name, kind: i.domain === "STOCK" ? "stock" as const : "crypto" as const, status: i.status, decimals: i.fractional ? 8 : 0 }))], history: history.slice(-200) };
  }
  return {
    async getSnapshot() { return snapshot(); },
    async quote(draft) {
      const state = view();
      const source = state.accountBalances?.find(a => a.asset === draft.source);
      const precision = state.instruments.find(i => i.symbol === draft.source)?.fractional === false ? 0 : source?.kind === "fiat" ? 2 : 8;
      if (!source || units(draft.amount, precision) <= BigInt(0)) throw new Error("Enter a positive amount within the asset’s supported precision.");
      const amount = Number(draft.amount);
      const id = crypto.randomUUID();
      const after = exchangeAssets(state, draft.source, draft.target, amount, state.revision, actor, new Date().toISOString(), id, 2);
      const beforeWallet = walletFor(state, customer), afterWallet = walletFor(after, customer);
      const balance = (wallet: typeof beforeWallet, asset: string) => wallet.cash[asset] ?? wallet.units[asset] ?? 0;
      const format = (value: number, asset: string) => value.toFixed(MOCK_TRADING_FX[asset] ? 2 : 8);
      const expires = Date.now() + 5 * 60_000;
      quotes.set(id, { draft, revision: state.revision, fingerprint: fingerprint(state), expires });
      return { id, source: draft.source, target: draft.target, requested: draft.amount, debited: format(balance(beforeWallet, draft.source) - balance(afterWallet, draft.source), draft.source), received: format(balance(afterWallet, draft.target) - balance(beforeWallet, draft.target), draft.target), fee_usd: previewExchange(state, draft.source, draft.target, amount, 2).feeUsd.toFixed(2), remainder_usd: draft.source !== "USD" && draft.target !== "USD" ? Math.max(0, (afterWallet.cash.USD ?? 0) - (beforeWallet.cash.USD ?? 0)).toFixed(2) : "0.00", expires_at: new Date(expires).toISOString() };
    },
    async submit(id, key) {
      if (!/^[A-Za-z0-9-]{8,100}$/.test(key)) throw new Error("Invalid idempotency key.");
      const saved = quotes.get(id);
      if (!saved) throw new Error("Quote unavailable. Review a new quote.");
      const command = { type: "exchange" as const, ...saved.draft, amount: Number(saved.draft.amount), revision: saved.revision, pricing_version: 2 as const };
      const previous = readWallet(customer).events.find(e => e.key === key);
      if (!previous && (Date.now() >= saved.expires || fingerprint(view()) !== saved.fingerprint)) throw new Error("Quote expired or your wallet changed. Review a new quote.");
      executeCustomerCommand(command, actor, key);
      return snapshot();
    },
  };
}
