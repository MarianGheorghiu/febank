"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Gift, RefreshCw, Search, ShieldAlert, Trophy, UserPlus, Users, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import MetricCard from "@/app/components/ui/MetricCard";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import { MOCK_REFERRAL_REPORT } from "@/app/lib/mock/admin/referrals";
import { REFERRAL_STATUSES, type ReferralFilters } from "@/app/lib/types/admin/referrals";
import { filterReferrals, referralLeaderboard, referralMoney } from "@/app/lib/referrals/engine";
import { mockReferralsRepository } from "@/app/lib/referrals/repository";
import { AuditPanel, AuditSelect, EmptyAudit, auditBadge, auditDate, auditFieldClass, auditInputClass } from "../audit/presentation";
import { buttonClass } from "../cards/presentation";
import ReferralCharts from "./ReferralCharts";

const button = `${buttonClass} min-h-9 leading-none [&>svg]:shrink-0`;
const statusLabels = { INVITED: "Invited", SIGNED_UP: "Signed up", KYC_PENDING: "KYC pending", QUALIFIED: "Qualified", REJECTED: "Rejected" };
const statusBadge = (status: string) => auditBadge(status === "QUALIFIED" || status === "PAID" ? "SUCCESS" : status === "REJECTED" || status === "HELD" ? "FAILED" : status === "KYC_PENDING" || status === "PENDING" ? "WARNING" : status);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/Bucharest" }).format(new Date(value)) : "—";
const defaultFilters: ReferralFilters = { query: "", status: "ALL", range: "90D" };

export default function ReferralsWorkspace() {
  const { user, loading } = useUser();
  if (loading || !user) return null;
  if (user.role !== "admin") return <div className="rounded-xl border border-rose-500/30 p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-rose-400"/><h1>Administrator access required</h1><Link href="/dashboard" className={`${button} mt-4`}>Return to dashboard</Link></div>;
  return <Workspace email={user.email}/>;
}
function Workspace({ email }: { email: string }) {
  const [report, setReport] = useState(MOCK_REFERRAL_REPORT);
  const [filters, setFilters] = useState<ReferralFilters>(defaultFilters);
  const [sort, setSort] = useState("REGISTERED");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const records = filterReferrals(report, filters);
  const leaderboard = referralLeaderboard(report, records);
  const ranked = [...leaderboard].sort((a, b) => sort === "QUALIFIED" ? b.qualified - a.qualified || b.registered - a.registered : sort === "CONVERSION" ? b.conversion - a.conversion || b.invited - a.invited : 0);
  const registered = records.filter(r => r.registered_at !== null).length;
  const qualified = records.filter(r => r.status === "QUALIFIED").length;
  const reward = (status: string) => records.filter(r => r.reward_status === status).reduce((sum, r) => sum + r.reward_minor, 0);
  const pages = Math.max(1, Math.ceil(ranked.length / 8));
  const currentPage = Math.min(page, pages - 1);
  const selected = leaderboard.find(row => row.referrer.id === selectedId);
  const selectedRecords = records.filter(r => r.referrer_id === selectedId).sort((a, b) => b.invited_at.localeCompare(a.invited_at));
  const detailsId = selected?.referrer.id;
  useEffect(() => { if (detailsId) detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [detailsId]);
  const update = <K extends keyof ReferralFilters>(key: K, value: ReferralFilters[K]) => { setFilters(prev => ({ ...prev, [key]: value })); setPage(0); };
  const reset = () => { setFilters(defaultFilters); setSort("REGISTERED"); setPage(0); setSelectedId(null); };
  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    try { setReport(await mockReferralsRepository.getReport()); notifyOperation("Referrals refreshed", "Demo reporting data reloaded. No rewards were issued or changed.", false, "Referrals"); }
    catch (cause) { notifyOperation("Referral report unavailable", cause instanceof Error ? cause.message : "Could not load the report.", true, "Referrals"); }
    finally { setBusy(false); }
  };
  return <div className="w-full min-w-0 space-y-4 font-mono text-white">
    <PageHeader compact sessionId={email} systemDate={date(report.as_of)} statusText="ADMINISTRATOR · REFERRALS"><button className={button} disabled={busy} onClick={refresh}><RefreshCw size={13} className={busy ? "animate-spin" : ""}/>{busy ? "Refreshing…" : "Refresh report"}</button></PageHeader>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-black uppercase tracking-widest">Referrals</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">Discover who brings new customers to the bank, follow referral quality and track campaign rewards.</p></div><span className={auditBadge("DEMO")}>DEMO · READ ONLY</span></div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard compact title="Invitations" value={records.length} icon={UserPlus} subtext={`${leaderboard.length} referrers in the selected scope`}/>
      <MetricCard compact title="Users registered" value={registered} icon={Users} subtext={`${records.length ? (registered / records.length * 100).toFixed(1) : "0.0"}% of scoped invitations`}/>
      <MetricCard compact title="Qualified referrals" value={qualified} icon={CheckCircle2} iconColor="text-teal-300" subtext={`${records.length ? (qualified / records.length * 100).toFixed(1) : "0.0"}% qualified · KYC + campaign criteria`}/>
      <MetricCard compact title="Rewards paid" value={referralMoney(reward("PAID"))} icon={Gift} subtext={`${referralMoney(reward("PENDING"))} pending · ${referralMoney(reward("HELD"))} held`}/>
    </div>
    <AuditPanel title="Referral scope" subtitle="Filters apply to every metric, chart and table. The period uses invitation date; registration and qualification reflect the report snapshot." action={<button className={button} onClick={reset}><X size={12}/>Reset filters</button>}>
      <div className="grid items-end gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={`${auditFieldClass} lg:col-span-2`}>Search referrers<span className="relative block"><Search size={13} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400"/><input className={`${auditInputClass} pl-9`} value={filters.query} onChange={e => update("query", e.target.value)} placeholder="Name, email, user ID or referral code…"/></span></label>
        <label className={auditFieldClass}>Invitation period<AuditSelect value={filters.range} onChange={e => update("range", e.target.value as ReferralFilters["range"])}><option value="30D">Last 30 days</option><option value="90D">Last 90 days</option><option value="ALL">All available history</option></AuditSelect></label>
        <label className={auditFieldClass}>Referral status<AuditSelect value={filters.status} onChange={e => update("status", e.target.value)}><option value="ALL">All statuses</option>{REFERRAL_STATUSES.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</AuditSelect></label>
      </div>
    </AuditPanel>
    <ReferralCharts report={report} records={records} leaderboard={leaderboard} range={filters.range}/>
    {leaderboard[0] && <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300"><Trophy size={18}/></span><div className="min-w-0"><p className="text-[9px] uppercase tracking-wider text-cyan-300">Most users brought to the bank</p><p className="mt-1 break-words text-sm font-bold">{leaderboard[0].referrer.name}<span className="ml-2 text-[10px] font-normal text-slate-400">{leaderboard[0].registered} registered · {leaderboard[0].qualified} qualified</span></p></div></div><button className={button} onClick={() => setSelectedId(leaderboard[0].referrer.id)}>View referrals<ArrowRight size={12}/></button></div>}
    <AuditPanel title="Referrer leaderboard" subtitle={`${ranked.length} matching referrers · Ranked by ${sort === "REGISTERED" ? "registered users" : sort === "QUALIFIED" ? "qualified referrals" : "qualification rate"}. Rewards shown are for the referrer, in EUR.`} action={<label className={`${auditFieldClass} min-w-44`}>Rank by<AuditSelect value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}><option value="REGISTERED">Users registered</option><option value="QUALIFIED">Qualified referrals</option><option value="CONVERSION">Qualification rate</option></AuditSelect></label>}>
      <div tabIndex={0} role="region" aria-label="Scrollable referrer leaderboard" className="scrollbar-thin hidden max-h-[360px] overflow-auto overscroll-contain md:block">
        <table className="w-full min-w-[900px] text-left text-[11px]"><caption className="sr-only">Referrers and attributed customer registrations for the selected invitation cohort.</caption><thead className="sticky top-0 z-10 bg-[#061528] text-[9px] uppercase text-cyan-300"><tr>{["Rank", "Referrer / code", "Invited", "Registered", "Qualified", "Qualification", "Paid / pending", "Details"].map(label => <th key={label} scope="col" className="px-3 py-2.5">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-cyan-500/10">{ranked.slice(currentPage * 8, currentPage * 8 + 8).map((row, i) => <tr key={row.referrer.id} className="hover:bg-cyan-500/5"><td className="px-3 py-2.5 align-middle"><span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold ${currentPage === 0 && i === 0 ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-cyan-500/20 text-slate-400"}`}>{currentPage * 8 + i + 1}</span></td><td className="px-3 py-2.5 align-middle"><p className="font-bold">{row.referrer.name}</p><p className="mt-1 text-[10px] text-slate-400">{row.referrer.email}</p><p className="mt-1 text-[9px] text-cyan-400">{row.referrer.referral_code}</p></td><td className="px-3 py-2.5 align-middle text-slate-400">{row.invited}</td><td className="px-3 py-2.5 align-middle font-bold text-white">{row.registered}</td><td className="px-3 py-2.5 align-middle text-teal-300">{row.qualified}</td><td className="px-3 py-2.5 align-middle"><div className="min-w-20"><p>{row.conversion.toFixed(1)}%</p><div aria-hidden="true" className="mt-2 h-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-teal-400" style={{ width: `${row.conversion}%` }}/></div></div></td><td className="whitespace-nowrap px-3 py-2.5 align-middle"><p>{referralMoney(row.paid_minor)}</p><p className="mt-1 text-[9px] text-slate-400">{referralMoney(row.pending_minor)} pending</p>{row.held_minor > 0 && <p className="mt-1 text-[9px] text-amber-300">{referralMoney(row.held_minor)} held</p>}</td><td className="px-3 py-2.5 align-middle"><button className={button} aria-label={`View referrals from ${row.referrer.name}`} onClick={() => setSelectedId(row.referrer.id)}>View<ArrowRight size={12}/></button></td></tr>)}</tbody>
        </table>
      </div>
      <div tabIndex={0} role="region" aria-label="Scrollable referrer cards" className="scrollbar-thin max-h-[360px] overflow-y-auto overscroll-contain divide-y divide-cyan-500/15 md:hidden">{ranked.slice(currentPage * 8, currentPage * 8 + 8).map((row, i) => <article key={row.referrer.id} className="space-y-3 p-4 text-xs"><div className="flex items-center gap-2"><span className="text-cyan-400">#{currentPage * 8 + i + 1}</span><h3 className="font-bold">{row.referrer.name}</h3></div><p className="break-all text-[10px] text-slate-400">{row.referrer.email} · {row.referrer.referral_code}</p><dl className="grid grid-cols-3 gap-2"><div><dt className="text-[9px] text-slate-500">Invited</dt><dd className="mt-1">{row.invited}</dd></div><div><dt className="text-[9px] text-slate-500">Registered</dt><dd className="mt-1 font-bold">{row.registered}</dd></div><div><dt className="text-[9px] text-slate-500">Qualified</dt><dd className="mt-1 text-teal-300">{row.qualified}</dd></div></dl><p className="text-[10px] text-slate-400">{referralMoney(row.paid_minor)} paid · {row.conversion.toFixed(1)}% qualified</p><button className={`${button} w-full`} onClick={() => setSelectedId(row.referrer.id)}>View referrals<ArrowRight size={12}/></button></article>)}</div>
      {!ranked.length && <EmptyAudit text="No referrals match this scope. Adjust the search, period or status."/>}
    </AuditPanel>
    <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400"><span>Page {currentPage + 1} of {pages} · 8 referrers per page</span><div className="flex gap-2"><button className={button} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><button className={button} disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
    {selected && <div ref={detailsRef} className="scroll-mt-4"><AuditPanel title={`Referrals from ${selected.referrer.name}`} subtitle={`${selected.referrer.user_id} · ${selected.referrer.referral_code} · ${selectedRecords.length} invitations under the current filters.`} action={<button className={button} onClick={() => setSelectedId(null)}><X size={12}/>Close details</button>}>
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-cyan-500/15 p-4 text-[10px] text-slate-400"><span><strong className="text-white">{selected.registered}</strong> registered users</span><span><strong className="text-teal-300">{selected.qualified}</strong> qualified</span><span>{selected.rejected} rejected</span><span>Latest invitation {date(selected.latest_invited_at)}</span></div>
      <div tabIndex={0} role="region" aria-label="Scrollable referred users" className="scrollbar-thin hidden max-h-[360px] overflow-auto overscroll-contain md:block"><table className="w-full min-w-[820px] text-left text-[11px]"><thead className="sticky top-0 z-10 bg-[#061528] text-[9px] uppercase text-cyan-300"><tr>{["Invited customer", "Invitation / registration", "Status", "Qualification / reason", "Referrer reward"].map(label => <th key={label} scope="col" className="px-3 py-2.5">{label}</th>)}</tr></thead><tbody className="divide-y divide-cyan-500/10">{selectedRecords.map(r => <tr key={r.id}><td className="px-3 py-2.5 align-middle"><p className="font-bold">{r.invitee_name}</p><p className="mt-1 text-[10px] text-slate-400">{r.invitee_email}</p><p className="mt-1 text-[9px] text-slate-500">{r.invitee_id ?? "Not registered"} · {r.id}</p></td><td className="px-3 py-2.5 align-middle"><p>{date(r.invited_at)}</p><p className="mt-1 text-[9px] text-slate-400">Joined {date(r.registered_at)}</p></td><td className="px-3 py-2.5 align-middle"><span className={statusBadge(r.status)}>{statusLabels[r.status]}</span></td><td className="max-w-52 px-3 py-2.5 align-middle text-[10px] text-slate-400">{r.rejection_reason ?? (r.qualified_at ? `Qualified ${date(r.qualified_at)}` : "Awaiting campaign requirements")}</td><td className="px-3 py-2.5 align-middle">{r.reward_status === "NONE" ? <span className="text-slate-500">Not earned</span> : <div className="flex flex-wrap items-center gap-2"><span>{referralMoney(r.reward_minor)}</span><span className={statusBadge(r.reward_status)}>{r.reward_status}</span></div>}</td></tr>)}</tbody></table></div>
      <div tabIndex={0} role="region" aria-label="Scrollable referred customer cards" className="scrollbar-thin max-h-[360px] overflow-y-auto overscroll-contain divide-y divide-cyan-500/15 md:hidden">{selectedRecords.map(r => <article key={r.id} className="space-y-2 p-4 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{r.invitee_name}</h3><span className={statusBadge(r.status)}>{statusLabels[r.status]}</span></div><p className="break-all text-[10px] text-slate-400">{r.invitee_email}</p><p className="text-[10px] text-slate-500">{r.invitee_id ?? "Not registered"} · {r.id}</p><p className="text-[10px] text-slate-400">Invited {date(r.invited_at)} · Joined {date(r.registered_at)}</p>{r.rejection_reason && <p className="text-[10px] text-rose-300">{r.rejection_reason}</p>}{r.qualified_at && <p className="text-[10px] text-teal-300">Qualified {date(r.qualified_at)}</p>}<p className="text-[10px] text-cyan-300">{r.reward_status === "NONE" ? "Reward not earned" : `${referralMoney(r.reward_minor)} · ${r.reward_status}`}</p></article>)}</div>
    </AuditPanel></div>}
    <footer className="flex flex-wrap justify-between gap-2 border-t border-cyan-500/15 pt-3 text-[9px] leading-relaxed text-slate-500"><span>Demo campaign · reward €25 per qualified referral · reporting only</span><span>Snapshot {auditDate(report.as_of)} · Europe/Bucharest</span></footer>
  </div>;
}
