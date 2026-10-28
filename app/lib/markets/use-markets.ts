"use client";
import { priceMarkets } from "../rates/execution";
import { useMemo, useSyncExternalStore } from "react";
import { useUser } from "../../context/UserContext";
import { useGlobalMarketsState, projectAllCustomers, projectOtherCustomers } from "./store";
import { readWallet, WALLET_EVENT } from "../wallet/store";
import { projectTrading } from "../wallet/trading";
let revision = 0;
function subscribe(listener: () => void) {
  const changed = () => { revision++; listener(); };
  const storage = (e: StorageEvent) => { if (e.key?.startsWith("mbank_wallet") || e.key === "mbank_rates_v1" || e.key === "mbank_subscriptions_v1" || e.key === null) changed(); };
  window.addEventListener("storage", storage);
  window.addEventListener(WALLET_EVENT, changed);
  return () => { window.removeEventListener(WALLET_EVENT, changed); window.removeEventListener("storage", storage); };
}
export function useMarketsState() {
  const catalog = useGlobalMarketsState();
  const current = useSyncExternalStore(subscribe, () => revision, () => 0);
  const { user } = useUser();
  return useMemo(() => {
    if (!user || typeof window === "undefined" || (process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo") !== "demo") return catalog;
    if (user.role === "admin") return projectAllCustomers(catalog);
    if ((process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo") !== "demo") throw new Error("Customer trading requires the shared wallet service adapter in HTTP mode.");
    void current; // Wallet notifications invalidate this memo independently of catalog changes.
    return projectTrading(readWallet(user.email).state, priceMarkets(projectOtherCustomers(catalog, user.email), user.email), user.email);
  }, [catalog, current, user]);
}
