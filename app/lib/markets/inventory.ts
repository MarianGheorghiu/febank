import type { MarketsState } from '../types/admin/markets';
import type { WalletTrading } from '../wallet/trading';

/** Fold customer settlement journals into the bank inventory without copying balances. */
export function projectInventory(catalog: MarketsState, journals: WalletTrading[]): MarketsState {
  return { ...catalog, revision: catalog.revision + journals.reduce((sum, journal) => sum + journal.revision, 0), instruments: catalog.instruments.map(item => {
    const changes = journals.map(journal => journal.liquidity[item.symbol]).filter(Boolean);
    return { ...item,
      reserveUnits: Math.round((item.reserveUnits + changes.reduce((sum, change) => sum + change.units, 0)) * 1e8) / 1e8 || 0,
      reserveUsd: Math.round((item.reserveUsd + changes.reduce((sum, change) => sum + change.usd, 0)) * 100) / 100 || 0,
      version: item.version + changes.reduce((sum, change) => sum + change.version, 0),
      updatedAt: journals.flatMap(journal => journal.orders.filter(order => order.symbol === item.symbol && order.status === 'FILLED').map(order => order.updatedAt)).reduce((latest, at) => at > latest ? at : latest, item.updatedAt),
    };
  }) };
}

/** Persist only the administrative delta; journal settlement must never be applied twice. */
export function unprojectInventory(base: MarketsState, projected: MarketsState, next: MarketsState): MarketsState {
  return { ...next, revision: base.revision + next.revision - projected.revision, instruments: next.instruments.map(item => {
    const previous = projected.instruments.find(asset => asset.symbol === item.symbol);
    const original = base.instruments.find(asset => asset.symbol === item.symbol);
    return previous && original ? { ...item,
      reserveUnits: original.reserveUnits + item.reserveUnits - previous.reserveUnits,
      reserveUsd: original.reserveUsd + item.reserveUsd - previous.reserveUsd,
      version: original.version + item.version - previous.version,
    } : item;
  }) };
}
