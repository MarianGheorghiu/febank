import type { LedgerRow } from "@/app/lib/types/analytics-ledger";

export const LEDGER_DATA: LedgerRow[] = [
  {
    id: "btc",
    asset: "Bitcoin",
    symbol: "BTC",
    category: "crypto",
    allocation: 63.2,
    r7d: 8.42,
    r30d: 14.5,
    r1y: 112.4,
    volatility: "34.2%",
    sharpe: 2.15,
    maxDrawdown: "-18.4%",
    status: "HIGH_VOL",
  },
  {
    id: "eth",
    asset: "Ethereum",
    symbol: "ETH",
    category: "crypto",
    allocation: 12.1,
    r7d: -2.1,
    r30d: 5.85,
    r1y: 64.2,
    volatility: "41.5%",
    sharpe: 1.85,
    maxDrawdown: "-24.1%",
    status: "HIGH_VOL",
  },
  {
    id: "nvda",
    asset: "Nvidia Corp",
    symbol: "NVDA",
    category: "stock",
    allocation: 10.5,
    r7d: 4.15,
    r30d: 22.1,
    r1y: 185.3,
    volatility: "28.9%",
    sharpe: 2.45,
    maxDrawdown: "-12.5%",
    status: "OPTIMAL",
  },
  {
    id: "usd",
    asset: "US Dollar",
    symbol: "USD",
    category: "fiat",
    allocation: 17.1,
    r7d: 0.0,
    r30d: 0.0,
    r1y: 0.0,
    volatility: "0.2%",
    sharpe: 0.0,
    maxDrawdown: "0.0%",
    status: "STABLE",
  },
  {
    id: "aapl",
    asset: "Apple Inc.",
    symbol: "AAPL",
    category: "stock",
    allocation: 9.2,
    r7d: 1.05,
    r30d: -3.4,
    r1y: 24.8,
    volatility: "14.1%",
    sharpe: 1.65,
    maxDrawdown: "-8.2%",
    status: "OPTIMAL",
  },
];

export const MOCK_LEDGER_LOGS = [
  {
    "time": "[10:12:35]",
    "event": "// [MATRIX_SYNC]",
    "message": "Telemetry synchronization routine executed successfully. Structural integrity optimal."
  },
  {
    "time": "[10:05:12]",
    "event": "// [DB_WRITE]",
    "message": "BTC algorithmic history nodes verified and injected into localized system pipeline."
  },
  {
    "time": "[10:01:45]",
    "event": "// [ENGINE_MET]",
    "message": "Rebalancing scheduler detected negligible drift (-0.45% Equity allocation deviation)."
  },
  {
    "time": "[09:44:22]",
    "event": "// [RISK_EVAL]",
    "message": "Mathematical Sharpe calculation routine processed for NVDA asset node -> Alpha verified at 2.45."
  }
];
