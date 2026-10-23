"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Coins, Download, Landmark, ListChecks, Plus, RefreshCw, User, Wallet } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import type { CreditCommand, CreditDraft, CreditRepository, CreditScope, CreditSnapshot } from "@/app/lib/loans/contracts";
import { createCreditRepository } from "@/app/lib/loans/repository";
import { isPendingCredit, outstanding, sumMoney } from "@/app/lib/loans/engine";
import { creditReport } from "@/app/lib/loans/report";
import { WALLET_EVENT } from "@/app/lib/wallet/store";
import PageHeader from "@/app/components/ui/PageHeader";
import MetricCard from "@/app/components/ui/MetricCard";
import CardSurface from "@/app/components/ui/CardSurface";
import CardSelect from "@/app/components/ui/admin/cards/CardSelect";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import { button } from "@/app/components/ui/stocks/StockUI";
import { creditMoney } from "@/app/components/ui/loans/CreditUI";
import PersonalCredit from "@/app/components/ui/loans/PersonalCredit";
import BusinessCredit from "@/app/components/ui/loans/BusinessCredit";
import CreditCalculator from "@/app/components/ui/loans/CreditCalculator";
import CreditActionDialog from "@/app/components/ui/loans/CreditActionDialog";
import { CreditApplications, CreditHistory, CreditRepayments } from "@/app/components/ui/loans/CreditRepayments";

function LoansWorkspace({ customer }: { customer: string }) {
  const configuration = useMemo<{ repository?: CreditRepository; error?: string }>(() => {
    try { return { repository: createCreditRepository(customer) }; } catch (cause) { return { error: cause instanceof Error ? cause.message : "Credit service configuration is unavailable." }; }
  }, [customer]);
  const repository = configuration.repository;
  const [snapshot, setSnapshot] = useState<CreditSnapshot | null>(null), [error, setError] = useState(""), [reload, setReload] = useState(0), [status, setStatus] = useState("");
  const [scope, setScope] = useState<CreditScope>("personal"), [command, setCommand] = useState<CreditCommand | null>(null);
  const initialAction = useRef(false);
  useEffect(() => {
    if (!repository) return;
    let cancelled = false, revision = 0;
    const controller = new AbortController();
    const load = () => {
      const request = ++revision;
      repository.getSnapshot(controller.signal).then(value => { if (!cancelled && revision === request) { setSnapshot(value); setError("");
        if (!initialAction.current) {
          initialAction.current = true;
          if (new URLSearchParams(window.location.search).get("action") === "apply") {
            window.requestAnimationFrame(() => {
              const calculator = document.querySelector<HTMLElement>("[data-credit-calculator]");
              calculator?.scrollIntoView({ block: "start" });
              calculator?.querySelector<HTMLInputElement>("input[data-loan-amount]")?.focus({ preventScroll: true });
            });
          }
        } } }).catch(cause => { if (!cancelled && revision === request) setError(cause instanceof Error ? cause.message : "Unable to load your credit workspace."); });
    };
    load();
    window.addEventListener(WALLET_EVENT, load); window.addEventListener("focus", load); window.addEventListener("storage", load);
    return () => { cancelled = true; controller.abort(); window.removeEventListener(WALLET_EVENT, load); window.removeEventListener("focus", load); window.removeEventListener("storage", load); };
  }, [repository, reload]);
  const failure = configuration.error ?? error;
  if (failure) return <CardSurface className="p-6"><p role="alert" className="text-sm text-rose-200">{failure}</p><button className={`${button} mt-4`} onClick={() => setReload(value => value + 1)}>Retry loading credit data</button></CardSurface>;
  if (!snapshot || !repository) return <p role="status" className="p-6 text-sm text-cyan-200">Loading your loans & capital workspace…</p>;
  const businesses = snapshot.businesses.filter(business => business.verified);
  const business = businesses.find(item => scope === `business:${item.id}`);
  const activeScope: CreditScope = scope === "personal" || business ? scope : "personal";
  const cash = activeScope === "personal" ? snapshot.personal_cash : business!.cash;
  const facilities = snapshot.facilities.filter(facility => facility.scope === activeScope);
  const available = sumMoney(facilities.filter(item => item.enabled).map(facility => (Number(facility.limit) - Number(facility.drawn)).toFixed(2)));
  const requests = snapshot.applications.filter(application => application.scope === activeScope && isPendingCredit(application.status)).length;
  const apply = (draft: CreditDraft) => setCommand({ action: "apply", scope: activeScope, expected_version: snapshot.version, draft });
  const newApplication = () => {
    const calculator = document.querySelector<HTMLElement>("[data-credit-calculator]");
    calculator?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    calculator?.querySelector<HTMLInputElement>("input[data-loan-amount]")?.focus({ preventScroll: true });
  };
  const exportReport = () => {
    try {
      const url = URL.createObjectURL(new Blob([creditReport(snapshot, activeScope)], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `credit-${activeScope.replace(":", "-")}-${snapshot.as_of.slice(0, 10)}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setStatus("Credit report downloaded.");
    } catch { setStatus("The report could not be downloaded. Please try again."); }
  };
  return <div className="w-full min-w-0 space-y-4 animate-fade-in"><h1 className="sr-only">Loans & Capital</h1>
    <PageHeader inlineActions statusText="Loans & Capital"><div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
      <ActionButton autoWidth variant="cyan" aria-label="Apply for a loan" title="Apply for a loan" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" icon={<Plus size={15} />} disabled={!snapshot.products.some(item => item.segment === (activeScope === "personal" ? "personal" : "business"))} onClick={newApplication}>New loan</ActionButton>
      <ActionButton autoWidth variant="blue" aria-label="Export credit report" title="Export credit report" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" icon={<Download size={15} />} onClick={exportReport}>Export</ActionButton>
      <ActionButton autoWidth variant="blue" aria-label="Refresh credit workspace" title="Refresh" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" icon={<RefreshCw size={15} />} onClick={() => setReload(value => value + 1)}>Refresh</ActionButton>
    </div></PageHeader>
    <CardSurface className="flex flex-wrap items-center justify-between gap-4 p-4"><div className="flex min-w-0 flex-wrap items-center gap-3"><div role="group" aria-label="Borrower type" className="flex flex-wrap gap-2"><button className={`${button} ${activeScope === "personal" ? "border-purple-300/30 bg-purple-300/10 text-purple-100" : ""}`} aria-pressed={activeScope === "personal"} onClick={() => { setScope("personal"); setCommand(null); }}><User size={15} />Retail & Wealth</button><button className={`${button} ${activeScope !== "personal" ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : ""}`} aria-pressed={activeScope !== "personal"} disabled={!businesses.length} title={businesses.length ? "Business credit" : "No verified business linked to your account"} onClick={() => { setScope(`business:${businesses[0].id}`); setCommand(null); }}><Building2 size={15} />Business & SMEs</button></div>{activeScope !== "personal" && <label className="min-w-0 text-xs text-slate-400"><span className="sr-only">Business borrower</span><CardSelect aria-label="Select business" value={activeScope} onChange={event => { setScope(event.target.value as CreditScope); setCommand(null); }}>{businesses.map(item => <option key={item.id} value={`business:${item.id}`}>{item.name}</option>)}</CardSelect></label>}</div><p className="text-xs text-slate-400">{snapshot.mode === "demo" ? "Demo data · browser session" : "Connected credit service"} · as of {snapshot.as_of.slice(0, 10)}</p>{!businesses.length && <p className="w-full text-xs text-slate-400">Business credit becomes available when a verified company is linked to your account.</p>}</CardSurface>
    <div role="status" aria-live="polite" className={status ? "text-xs text-cyan-200" : "sr-only"}>{status}</div>
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Outstanding principal" value={creditMoney(outstanding(snapshot, activeScope))} icon={Coins} tone="cyan" subtext="USD · loans + drawn facilities" /><MetricCard title="Available facility credit" value={creditMoney(available)} icon={Landmark} tone="cyan" subtext="Approved USD limits · excludes applications" /><MetricCard title={activeScope === "personal" ? "Personal USD cash" : "Business USD cash"} value={creditMoney(cash)} icon={Wallet} tone="blue" subtext={activeScope === "personal" ? "Shared with Overview & Wallet" : "Separate from your personal wallet"} /><MetricCard title="Pending requests" value={requests} icon={ListChecks} tone="purple" subtext="Awaiting lender review · no funds released" /></div>
    {activeScope === "personal" ? <PersonalCredit snapshot={snapshot} onApply={apply} onCommand={setCommand} /> : <BusinessCredit key={activeScope} snapshot={snapshot} scope={activeScope} onApply={apply} onCommand={setCommand} />}
    <CreditCalculator key={`calculator-${activeScope}`} snapshot={snapshot} scope={activeScope} onApply={apply} />
    <CreditRepayments key={`repayments-${activeScope}`} snapshot={snapshot} scope={activeScope} onCommand={setCommand} />
    <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2"><CreditApplications key={`applications-${activeScope}`} snapshot={snapshot} scope={activeScope} onCommand={setCommand} /><CreditHistory key={`history-${activeScope}`} snapshot={snapshot} scope={activeScope} /></div>
    {command && <CreditActionDialog key={JSON.stringify(command)} initialCommand={command} snapshot={snapshot} repository={repository} onClose={() => setCommand(null)} onComplete={next => { setSnapshot(next); setStatus(command.action === "apply" ? "Your request was submitted for lender review." : "Credit workspace updated successfully."); }} />}
  </div>;
}
export default function LoansCapitalPage() {
  const { user, loading } = useUser();
  if (loading || !user) return <p role="status" className="p-6 text-sm text-slate-300">Loading your customer session…</p>;
  if (user.role !== "client") return <p className="p-6 text-sm text-slate-300">Switch to a customer account to access Loans & Capital.</p>;
  return <LoansWorkspace key={user.email} customer={user.email} />;
}
