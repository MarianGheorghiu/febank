"use client";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "../../context/UserContext";
import { createTransferRepository, TRANSFER_EVENT } from "../transfers/repository";
import type { TransferSnapshot } from "../transfers/contracts";
import { WALLET_EVENT } from "./store";

/** Transport-backed account projection for customer views outside the trading desk. */
export function useWalletAccounts() {
  const { user } = useUser();
  const repository = useMemo(() => createTransferRepository(user?.email ?? "demo"), [user?.email]);
  const [result, setResult] = useState<{ customer: string; snapshot: TransferSnapshot | null; error: string }>({ customer: "", snapshot: null, error: "" });
  useEffect(() => {
    if (!user) return;
    let active = true;
    let generation = 0;
    const load = async () => {
      const current = ++generation;
      try { const snapshot = await repository.getSnapshot(); if (active && current === generation) setResult({ customer: user.email, snapshot, error: "" }); }
      catch (cause) { if (active && current === generation) setResult({ customer: user.email, snapshot: null, error: cause instanceof Error ? cause.message : "Unable to load wallet." }); }
    };
    void load();
    window.addEventListener(WALLET_EVENT, load);
    window.addEventListener(TRANSFER_EVENT, load);
    window.addEventListener("focus", load);
    return () => { active = false; window.removeEventListener(WALLET_EVENT, load); window.removeEventListener(TRANSFER_EVENT, load); window.removeEventListener("focus", load); };
  }, [repository, user]);
  return result.customer === user?.email ? result : { snapshot: null, error: "" };
}
