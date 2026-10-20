import { createDemoCurrencyRepository } from "../currencies/demo";
import { readMarketCatalog } from "../markets/store";
import { tradingRestriction } from "../markets/engine";
import { projectTrading } from "../wallet/trading";
import { readWallet } from "../wallet/store";
import { MOCK_MARKET } from "../mock/crypto";
import type { CryptoSnapshot } from "./contracts";
export function createLocalCryptoReader(customer: string) {
  customer = customer.trim().toLowerCase();
  const currencies = createDemoCurrencyRepository(customer);
  return async (): Promise<CryptoSnapshot> => {
    const wallet = await currencies.getSnapshot();
    const state = projectTrading(readWallet(customer).state, readMarketCatalog(), customer);
    return { schema_version: 1, as_of: wallet.as_of, wallet,
      market: state.instruments.filter(item => item.domain === "CRYPTO").map(item => {
        const metadata = MOCK_MARKET.find(asset => asset.symbol === item.symbol);
        const buy = tradingRestriction(state, item, "BUY"), sell = tradingRestriction(state, item, "SELL");
        const history = metadata?.sparkline ?? [item.priceUsd, item.priceUsd];
        const last = history.at(-1) || item.priceUsd;
        return { symbol: item.symbol, name: item.name, price_usd: item.priceUsd.toFixed(8),
          change_1h: metadata?.change1h.toFixed(2) ?? null, change_24h: metadata?.change24h.toFixed(2) ?? null, change_7d: metadata?.change7d.toFixed(2) ?? null,
          volume_24h: metadata?.volume ?? "—", market_cap: metadata?.cap ?? "—", sparkline: history.map(price => (price / last * item.priceUsd).toFixed(8)),
          can_buy: !buy, can_sell: !sell, buy_restriction: buy, sell_restriction: sell };
      }),
      orders: state.orders.filter(order => order.domain === "CRYPTO" && order.userEmail.toLowerCase() === customer.trim().toLowerCase()).map(order => ({ id: order.id, created_at: order.createdAt, symbol: order.symbol, side: order.side, status: order.status, quantity: order.quantity.toFixed(8), price_usd: order.price.toFixed(8), fee_usd: order.feeUsd.toFixed(2), total_usd: order.totalUsd.toFixed(2), settlement_currency: order.currency })),
    };
  };
}
