export type TransferType = "fiat" | "crypto" | "stock";

export type TransferStatus = "accepted" | "pending" | "denied";

export type RoutingMethod = "iban" | "phone" | "wallet" | "custody";

export interface Transfer {
  id: string;
  type: TransferType;
  asset: string; // EUR, RON, BTC, ETH, AAPL, NVDA
  amount: number;
  valueUsd: number;
  direction: "incoming" | "outgoing";
  counterparty: string;
  destination: string; // IBAN, Wallet Address, Cont Custodie
  status: TransferStatus;
  date: string;
  timestamp: string;
}
