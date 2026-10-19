"use client";
import { useEffect, useState } from "react";
import { getDemoAdminTransfers, TRANSFER_EVENT } from "@/app/lib/transfers/repository";
import TransferTable from "./TransferTable";

/** Customer requests share IDs/status with the user workspace; administrative edits remain server-owned. */
export default function AdminTransferMonitor() {
  const [groups, setGroups] = useState<Awaited<ReturnType<typeof getDemoAdminTransfers>>>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if ((process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo") !== "demo") return;
    let active = true;
    const load = () => { getDemoAdminTransfers().then(value => { if (active) { setGroups(value); setError(""); } }).catch(() => { if (active) setError("Customer transfer history could not be loaded."); }); };
    load(); window.addEventListener(TRANSFER_EVENT, load); window.addEventListener("focus", load);
    return () => { active = false; window.removeEventListener(TRANSFER_EVENT, load); window.removeEventListener("focus", load); };
  }, []);
  if ((process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? "demo") !== "demo") return null;
  return <section className="my-5 min-w-0 space-y-4" aria-label="Customer transfer requests">
    <div><h2 className="text-lg font-semibold">Customer transfer requests</h2><p className="mt-1 text-xs text-slate-400">Read-only demo monitor · requests submitted in this browser session. Customer IDs and statuses match the user workspace. Administrative decisions require the Go transfer workflow.</p></div>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {!error && !groups.some(g => g.snapshot.transfers.length) && <p className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">No customer transfer requests have been submitted in this browser session.</p>}
    {groups.filter(g => g.snapshot.transfers.length).map(group => <div key={group.customer} className="min-w-0 space-y-2"><h3 className="break-all text-xs text-cyan-200">{group.customer}</h3><TransferTable transfers={group.snapshot.transfers} /></div>)}
  </section>;
}
