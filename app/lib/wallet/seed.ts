import type { TransferAccount } from "../transfers/contracts";

/** One opening balance per asset; catalog-only instruments open with zero funds. */
export const OPENING_ASSETS: [string, TransferAccount["kind"], string, number, string, string, string][] = [
  ["USD", "fiat", "US Dollar", 2, "142350.80", "1.00", "1.00"],
  ["EUR", "fiat", "Euro", 2, "24500.00", "1.08", "1.00"],
  ["RON", "fiat", "Romanian Leu", 2, "38000.00", "0.22", "5.00"],
  ["BTC", "crypto", "Bitcoin", 8, "2.40500000", "68430.25", "0.00002000"],
  ["ETH", "crypto", "Ethereum", 18, "12.400000000000000000", "3842.10", "0.000100000000000000"],
  ["SOL", "crypto", "Solana", 9, "145.800000000", "152.00", "0.000005000"],
  ["NVDA", "stock", "NVIDIA", 0, "30", "1230.00", "0"],
  ["AAPL", "stock", "Apple", 0, "25", "189.84", "0"],
  ["TSLA", "stock", "Tesla", 0, "40", "177.46", "0"],
];
