import type { TransferAccount } from "../transfers/contracts";
export interface CurrencyAsset { symbol: string; name: string; kind: "fiat" | "crypto" | "stock"; status: "ACTIVE" | "SELL_ONLY" | "HALTED"; decimals: number }
export interface CurrencyPoint { id: string; at: string | null; fiat: string; crypto: string; stock: string }
export interface CurrencySnapshot { schema_version: 1; mode: "demo" | "live"; as_of: string; accounts: TransferAccount[]; assets: CurrencyAsset[]; history: CurrencyPoint[] }
export interface ExchangeDraft { source: string; target: string; amount: string }
export interface CurrencyQuote { id: string; source: string; target: string; requested: string; debited: string; received: string; fee_usd: string; remainder_usd: string; expires_at: string }
export interface CurrencyRepository { getSnapshot(signal?: AbortSignal): Promise<CurrencySnapshot>; quote(draft: ExchangeDraft): Promise<CurrencyQuote>; submit(quote_id: string, key: string): Promise<CurrencySnapshot> }
