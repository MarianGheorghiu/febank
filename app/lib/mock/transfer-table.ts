import type { Transfer } from "@/app/lib/types/transfer-table";

export const MOCK_TRANSFERS: Transfer[] = [
  {
    id: "TRX-001",
    recipient: "John Doe",
    amount: 1500,
    asset: "EUR",
    type: "fiat",
    status: "accepted",
    date: "2026-06-01 10:30",
  },
  {
    id: "TRX-002",
    recipient: "0x7F...A2B",
    amount: 0.25,
    asset: "BTC",
    type: "crypto",
    status: "pending",
    date: "2026-06-01 14:15",
  },
  {
    id: "TRX-003",
    recipient: "Tesla Motors",
    amount: 10,
    asset: "TSLA",
    type: "stock",
    status: "accepted",
    date: "2026-05-30 09:00",
  },
  {
    id: "TRX-004",
    recipient: "Alice Smith",
    amount: 500,
    asset: "RON",
    type: "fiat",
    status: "denied",
    date: "2026-05-29 16:45",
  },
  {
    id: "TRX-005",
    recipient: "Vitalik B.",
    amount: 5.5,
    asset: "ETH",
    type: "crypto",
    status: "pending",
    date: "2026-06-02 08:20",
  },
];
