import type { MarketDomain, MarketsState } from '../types/admin/markets';
import { tradingRestriction } from './engine';
export function marketInsights(state: MarketsState, domain: MarketDomain) {
  const instruments = state.instruments.filter(item => item.domain === domain);
  return instruments.map(item => {
    const baseValue = item.reserveUnits * item.priceUsd;
    const buy = tradingRestriction(state, item, 'BUY');
    const sell = tradingRestriction(state, item, 'SELL');
    const holders = Object.entries(state.wallets).filter(([, wallet]) => (wallet.units[item.symbol] ?? 0) > 0);
    return { symbol: item.symbol, baseValue, usdReserve: item.reserveUsd,
      coverage: item.lowLiquidityUsd > 0 ? Math.min(baseValue, item.reserveUsd) / item.lowLiquidityUsd : null,
      holders: holders.length, customerUnits: holders.reduce((sum, [, wallet]) => sum + wallet.units[item.symbol], 0),
      pending: state.orders.filter(order => order.symbol === item.symbol && order.status === 'PENDING').length,
      buy: buy ?? (item.reserveUnits <= 0 ? 'Base inventory is empty.' : null),
      sell: sell ?? (item.reserveUsd <= 0 ? 'USD inventory is empty.' : null),
    };
  });
}
