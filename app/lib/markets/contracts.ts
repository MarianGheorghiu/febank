import type { MarketAdminCommand, MarketsState } from '../types/admin/markets';
/** Decimal values travel as strings; the Go service must use fixed-point arithmetic. */
export type MarketWireValue = string | number | boolean | null | MarketWireValue[] | { [key: string]: MarketWireValue };
export interface MarketOperationsSnapshot {
  schema_version: 1;
  mode: 'demo' | 'http';
  as_of: string;
  state: MarketsState;
}
export interface MarketOperationsRepository {
  getSnapshot(signal?: AbortSignal): Promise<MarketOperationsSnapshot>;
  execute(command: MarketAdminCommand, idempotencyKey: string): Promise<MarketOperationsSnapshot>;
}
