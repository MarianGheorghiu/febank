import type { CurrencyRepository, CurrencySnapshot } from "../currencies/contracts";
export interface CryptoInstrument {
  symbol: string; name: string; price_usd: string;
  change_1h: string | null; change_24h: string | null; change_7d: string | null;
  volume_24h: string; market_cap: string; sparkline: string[];
  can_buy: boolean; can_sell: boolean; buy_restriction: string | null; sell_restriction: string | null;
}
export interface CryptoOrder {
  id: string; created_at: string; symbol: string; side: "BUY" | "SELL";
  status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED";
  quantity: string; price_usd: string; fee_usd: string; total_usd: string; settlement_currency: string;
}
export interface CryptoSnapshot { schema_version: 1; as_of: string; wallet: CurrencySnapshot; market: CryptoInstrument[]; orders: CryptoOrder[] }
export interface CryptoRepository { getSnapshot(signal?: AbortSignal): Promise<CryptoSnapshot>; exchange: CurrencyRepository }
