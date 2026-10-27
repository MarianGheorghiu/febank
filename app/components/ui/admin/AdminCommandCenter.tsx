"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw, ShieldAlert, Users, Wallet, Activity } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { useSessionMetadata } from "@/app/lib/session/use-session-metadata";
import { createControlRepository } from "@/app/lib/admin-control/repository";
import { DOMAINS, type ControlSnapshot, type ControlPolicy, type Domain } from "@/app/lib/admin-control/contracts";
import { RISK_EVENT } from "@/app/lib/risk/store";
import { USERS_EVENT } from "@/app/lib/user-management/store";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import { decimal, units } from "@/app/lib/transfers/engine";
import CardSurface from "../CardSurface";
import MetricCard from "../MetricCard";
import PageHeader from "../PageHeader";
import { ActionButton } from "../dashboard/ActionButton";
import ControlMonitoring from "./ControlMonitoring";
import ControlPolicyDialog from "./ControlPolicyDialog";
import { ControlDomainCard, ControlQueues } from "./ControlPanels";
import { controlMoney } from "@/app/lib/admin-control/presentation";

export default function AdminCommandCenter() {
  const { user } = useUser();
  const email = user?.email ?? ""; const role = user?.role ?? "client";
  const session = useSessionMetadata(email);
  const repository = useMemo(() => createControlRepository({ email, role }), [email, role]);
  const [snapshot, setSnapshot] = useState<ControlSnapshot | null>(null);
  const [busy, setBusy] = useState(true); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [domain, setDomain] = useState<Domain | "ALL">("ALL"); const [policy, setPolicy] = useState<{ value: ControlPolicy; revision: number } | null>(null);
  const request = useRef(0);
  const load = useCallback(async () => {
    const revision = ++request.current; setBusy(true);
    try { const value = await repository.getSnapshot(); if (revision === request.current) { setSnapshot(value); setError(""); } }
    catch (cause) { if (revision === request.current) setError(cause instanceof Error ? cause.message : "Unable to load Admin Control."); }
    finally { if (revision === request.current) setBusy(false); }
  }, [repository]);
  useEffect(() => {
    const refresh = () => { void load(); };
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("focus", refresh); window.addEventListener("storage", refresh); window.addEventListener(WALLET_EVENT, refresh); window.addEventListener(RISK_EVENT, refresh); window.addEventListener(USERS_EVENT, refresh);
    // The ref tracks request generations, not a DOM node.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { window.clearTimeout(timer); request.current++; window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); window.removeEventListener(WALLET_EVENT, refresh); window.removeEventListener(RISK_EVENT, refresh); window.removeEventListener(USERS_EVENT, refresh); };
  }, [load]);
  if (!user || user.role !== "admin") return <p role="alert">Administrator access required.</p>;
  const totals = (key: "available_usd" | "reserved_usd" | "volume_24h_usd") => decimal((snapshot?.domains ?? []).reduce((sum, item) => sum + units(item[key], 2), BigInt(0)), 2);
  return <div className="min-w-0 space-y-4">
    <PageHeader actionsPosition="right" sessionId={session.id} lastLogin={session.lastLogin}>
      <ActionButton variant="cyan" icon={<RefreshCw size={15}/>} disabled={busy} onClick={() => { setNotice(""); void load(); }}>{busy ? "Refreshing…" : "Refresh"}</ActionButton>
      <ActionButton variant="purple" icon={<Download size={15}/>} disabled={!snapshot || busy || !!error} onClick={() => {
        if (!snapshot) return;
        const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
        const anchor = document.createElement("a"); anchor.href = url; anchor.download = `admin-control-${snapshot.as_of.slice(0, 10)}.json`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice("Global snapshot exported, including all domains and operational audit entries.");
      }}>Export snapshot</ActionButton>
    </PageHeader>
    {error && <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-400/5 p-4 text-sm text-rose-200">{error} {snapshot && "Previously loaded data is shown; controls are disabled until refresh succeeds."}</div>}
    {notice && <p role="status" className="rounded-xl border border-cyan-400/20 p-3 text-sm text-cyan-200">{notice}</p>}
    {!snapshot ? <CardSurface className="p-6"><p role="status" className="text-sm text-slate-400">{busy ? "Loading global operations…" : "Snapshot unavailable. Use Refresh to retry."}</p></CardSurface> : <>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Available holdings" value={controlMoney(totals("available_usd"))} icon={Wallet} tone="cyan" subtext={`${controlMoney(totals("reserved_usd"))} reserved · indicative USD valuation`} />
        <MetricCard title="Completed volume · 24h" value={controlMoney(totals("volume_24h_usd"))} icon={Activity} tone="blue" subtext="Transfers and filled orders · excludes opening transfer history" />
        <MetricCard title="Open risk cases" value={snapshot.cases.length} icon={ShieldAlert} tone="amber" subtext={`${snapshot.cases.filter(item => item.severity === "CRITICAL").length} critical · ${snapshot.restricted_customers} restricted customers`} href="/dashboard/admin/fraud-control" />
        <MetricCard title="Observed customers" value={snapshot.customer_count} icon={Users} tone="purple" subtext={`${snapshot.mode === "demo" ? "Demo · " : ""}${snapshot.domains.reduce((sum, item) => sum + item.pending_count, 0)} pending transfers & orders · all domains`} />
      </div>
      <ControlMonitoring snapshot={snapshot}/>
      <div className="grid min-w-0 gap-3 xl:grid-cols-3">{snapshot.domains.map(item => <ControlDomainCard key={item.domain} item={item} disabled={busy || !!error} onManage={() => setPolicy({ value: item.policy, revision: snapshot.risk_revision })}/>)}</div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div role="group" aria-label="Filter operational details by domain" className="flex flex-wrap gap-2">{(["ALL", ...DOMAINS] as const).map(value => <ActionButton key={value} autoWidth size="medium" variant={domain === value ? "cyan" : "blue"} aria-pressed={domain === value} onClick={() => setDomain(value)}>{value === "ALL" ? "All domains" : value}</ActionButton>)}</div><p className="text-xs text-slate-500">Global metrics remain unfiltered</p></div>
      <ControlQueues key={domain} snapshot={snapshot} domain={domain}/>
      <div className="flex flex-wrap gap-4 text-xs text-cyan-300"><Link href="/dashboard/admin/transactions" className="underline underline-offset-4">Transactions</Link><Link href="/dashboard/admin/system-health" className="underline underline-offset-4">System health</Link><Link href="/dashboard/admin/audit-logs" className="underline underline-offset-4">Full audit logs</Link></div>
      {policy && <ControlPolicyDialog policy={policy.value} revision={policy.revision} onClose={() => setPolicy(null)} onSave={async (body, key) => { if (error) throw new Error("Refresh global data before changing controls."); await repository.updatePolicy(body, key); setNotice(`${body.policy.domain} policy saved. New operations use the updated controls.`); await load(); }}/ >}
    </>}
  </div>;
}
