import { initialWallet, applyWalletEvent, type WalletEvent } from "../wallet/engine";
import { buildQuote } from "../transfers/engine";
import { initializeTransactionDemoWallet, transactionDemoWalletExists } from "../wallet/store";
const actor = { email: "demo.ops@admin.com", role: "admin" as const };
/** Valid, replayable sample journals, persisted once under dedicated demo customers. */
export function seedTransactionDemo(now: string) {
  let changed = false;
  for (const [domain, asset, route, destination] of [
    ["payments", "USD", "route-USD", "DE89370400440532013000"],
    ["custody", "BTC", "route-BTC", "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"],
    ["broker", "AAPL", "route-AAPL", "DTC-9902"],
  ]) {
    const customer = `transactions-demo-${domain}@example.test`;
    if (transactionDemoWalletExists(customer)) continue;
    let state = initialWallet(); const events: WalletEvent[] = [];
    const record = (event: WalletEvent) => { events.push(event); state = applyWalletEvent(state, event); };
    for (let index = 0; index < 12; index++) {
      const at = new Date(Date.parse(now) - (index < 6 ? (6 - index) * 86400000 : (12 - index) * 2 * 3600000)).toISOString();
      const key = `demo-${domain}-${index}`;
      const amount = asset === "USD" ? String(850 + index * 135) : asset === "BTC" ? (0.004 + index * 0.0001).toFixed(8) : "1.00000000";
      const quote = buildQuote(state.transfers, { source_account_id: `account-${asset}`, route_id: route, amount, recipient_name: domain === "payments" ? "Northstar Services" : domain === "custody" ? "External custody wallet" : "Broker custody account", destination, reference: `Demo ${domain} settlement ${index + 1}` }, `quote-${key}`, at);
      record({ kind: "submit", key, at, quote, prices: Object.fromEntries(state.transfers.accounts.map(item => [item.asset, item.usd_price])) });
      const decisionAt = new Date(Date.parse(at) + 60000).toISOString();
      const decide = (action: "HOLD" | "PROCESS" | "SETTLE" | "REJECT", version: number, time = decisionAt) => record({ kind: "transfer_admin", key: `${key}-${action}`, at: time, customer, actor, command: { transfer_id: `trf-${key}`, expected_version: version, action, reason: `Demonstration ${action.toLowerCase()} decision for settlement batch DEMO-${index + 1}.` } });
      if (index % 6 === 0 || index % 6 === 1) { decide("PROCESS", 0); decide("SETTLE", 1, new Date(Date.parse(at) + 120000).toISOString()); }
      if (index % 6 === 2) decide("HOLD", 0);
      if (index % 6 === 3) decide("PROCESS", 0);
      if (index % 6 === 4) decide("REJECT", 0);
      // index % 6 === 5 stays pending and is available for operator testing.
    }
    changed = initializeTransactionDemoWallet(customer, events) || changed;
  }
  return changed;
}
