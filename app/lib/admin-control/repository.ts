import { readRiskForExecution, executeRiskCommand } from "../risk/store";
import { readMarketCatalog, projectAllCustomers } from "../markets/store";
import { readWallet, walletCustomers } from "../wallet/store";
import type { RiskActor } from "../types/admin/risk";
import type { ControlRepository } from "./contracts";
import { buildControlSnapshot } from "./engine";
import { parseControlSnapshot } from "./response";
import { withDemoMonitoring } from "./demo";
import { readManagedUsers } from "../user-management/store";
import { determineRole } from "../mock/auth";

export function createControlRepository(actor: RiskActor): ControlRepository {
  const mode = process.env.NEXT_PUBLIC_ADMIN_CONTROL_MODE ?? "demo";
  const checkActor = () => { if (actor.role !== "admin") throw new Error("Administrator access required."); };
  if (mode === "http") {
    const base = (process.env.NEXT_PUBLIC_ADMIN_CONTROL_API_URL ?? "").replace(/\/$/, "");
    const request: typeof fetch = async (url, init) => {
      checkActor();
      const response = await fetch(url, { ...init, credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(`Admin Control request failed (${response.status}). Refresh and review current data before retrying.`);
      return response;
    };
    return {
      async getSnapshot(signal) {
        const response = await request(`${base}/v1/admin/control`, { signal, headers: { Accept: "application/json" } });
        const snapshot = parseControlSnapshot(await response.json());
        if (snapshot.mode !== "live") throw new Error("The Admin Control API must return live data.");
        return snapshot;
      },
      async updatePolicy(body, key) {
        await request(`${base}/v1/admin/control/policies/${body.policy.domain.toLowerCase()}`, { method: "PUT", headers: { Accept: "application/json", "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(body) });
      },
    };
  }
  if (mode !== "demo") throw new Error("Unknown Admin Control mode.");
  return {
    async getSnapshot() {
      checkActor();
      const risk = readRiskForExecution();
      const markets = projectAllCustomers(readMarketCatalog());
      const wallets = walletCustomers().filter(customer => determineRole(customer) === "client").map(customer => readWallet(customer).state);
      const snapshot = withDemoMonitoring(buildControlSnapshot(risk, markets, wallets, new Date().toISOString()));
      snapshot.restricted_customers = new Set([...risk.restrictions.map(r => r.email), ...readManagedUsers().users.filter(u => u.role === "CLIENT" && u.status === "BLOCKED").map(u => u.login_email)]).size;
      return parseControlSnapshot(snapshot);
    },
    async updatePolicy(request) {
      checkActor();
      const policy = request.policy;
      executeRiskCommand({ action: "POLICY", expectedRevision: request.expected_revision, reason: request.reason, policy: { domain: policy.domain, paused: policy.paused, maxTransactionUsd: Number(policy.max_transaction_usd), exposureLimitUsd: Number(policy.exposure_limit_usd), reviewScore: policy.review_score, blockScore: policy.block_score } }, actor);
    },
  };
}
