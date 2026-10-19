/** JSON transport DTOs shared by the demo adapter and the Go HTTP API. */
export type TransferKind = "fiat" | "crypto" | "stock";
export type TransferState = "pending" | "processing" | "completed" | "rejected" | "cancelled";
export interface TransferAccount {
  id: string;
  kind: TransferKind;
  asset: string;
  name: string;
  decimals: number;
  available: string;
  reserved: string;
  usd_price: string;
}
export interface TransferFeePolicy {
  fixed: string;
  rate_bps: number;
  minimum: string;
  maximum?: string;
  debit_account_id: string;
}
export interface TransferRoute {
  id: string;
  asset: string;
  name: string;
  destination_kind: "iban" | "phone" | "wallet" | "custody";
  network?: string;
  fee: string;
  fee_policy?: TransferFeePolicy;
  eta: string;
  enabled: boolean;
}
export interface TransferDraft {
  source_account_id: string;
  route_id: string;
  amount: string;
  recipient_name: string;
  destination: string;
  reference: string;
}
export interface TransferQuote {
  id: string;
  draft: TransferDraft;
  asset: string;
  fee: string;
  fee_asset?: string;
  fee_account_id?: string;
  total: string;
  value_usd: string;
  expires_at: string;
  eta: string;
}
export interface CustomerTransfer {
  id: string;
  account_id: string;
  kind: TransferKind;
  asset: string;
  amount: string;
  fee: string;
  fee_asset?: string;
  fee_account_id?: string;
  value_usd: string;
  direction: "incoming" | "outgoing";
  recipient_name: string;
  destination: string;
  route_id: string;
  reference: string;
  status: TransferState;
  created_at: string;
  updated_at: string;
  can_cancel: boolean;
}
export interface TransferSnapshot {
  schema_version: 1;
  mode: "demo" | "live";
  as_of: string;
  accounts: TransferAccount[];
  routes: TransferRoute[];
  transfers: CustomerTransfer[];
  limits: { currency: "USD"; daily_limit: string; used: string; resets_at: string; verification_label: string };
}
export interface TransferRepository {
  getSnapshot(signal?: AbortSignal): Promise<TransferSnapshot>;
  quote(draft: TransferDraft): Promise<TransferQuote>;
  submit(quoteId: string, idempotencyKey: string): Promise<TransferSnapshot>;
  cancel(transferId: string, idempotencyKey: string): Promise<TransferSnapshot>;
}
