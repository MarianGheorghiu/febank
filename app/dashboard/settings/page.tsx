"use client";
import { useRef, useState } from "react";
import { BadgeCheck, Download, FileClock, Monitor, RefreshCw, UserRound } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { usePreferences } from "@/app/context/PreferencesContext";
import type { SecurityFlow, SettingsCommand } from "@/app/lib/settings/contracts";
import { settingsReport } from "@/app/lib/settings/report";
import PageHeader from "@/app/components/ui/PageHeader";
import CardSurface from "@/app/components/ui/CardSurface";
import MetricCard from "@/app/components/ui/MetricCard";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import { button } from "@/app/components/ui/stocks/StockUI";
import AccountSettings from "@/app/components/ui/security/AccountSettings";
import PreferenceSettings from "@/app/components/ui/security/PreferenceSettings";
import CommunicationSettings from "@/app/components/ui/security/CommunicationSettings";
import AuthenticationSettings from "@/app/components/ui/security/AuthenticationSettings";
import SettingsActivity from "@/app/components/ui/security/SettingsActivity";
import SettingsDialog, { type SettingsAction } from "@/app/components/ui/security/SettingsDialog";
const tabs = ["Account", "Portfolio & display", "Communications", "Security & devices", "Activity & privacy"] as const;
export default function SettingsPage() {
  const { user, loading, logout } = useUser(), { snapshot: s, repository, loaded, refreshing, error, refresh, accept } = usePreferences();
  const [tab, setTab] = useState<typeof tabs[number]>("Account"), [busy, setBusy] = useState(false), [dialog, setDialog] = useState<SettingsAction | null>(null);
  const lock = useRef(false), retry = useRef<{ fingerprint: string; key: string } | null>(null);
  function keyFor(value: unknown) { const fingerprint = JSON.stringify(value); if (retry.current?.fingerprint !== fingerprint) retry.current = { fingerprint, key: crypto.randomUUID() }; return retry.current.key; }
  async function save(command: SettingsCommand) {
    if (!repository || lock.current) return false;
    lock.current = true; setBusy(true);
    try { const next = await repository.execute(command, keyFor(command)); accept(next); retry.current = null;
      const requested = command.action === "request", title = requested ? "Request saved" : command.action === "cancel_request" ? "Request cancelled" : command.action.startsWith("revoke") ? next.mode === "demo" ? "Demo sessions updated" : "Sessions signed out" : "Settings saved";
      notifyOperation(title, requested ? "You can track your request in Activity & privacy." : command.action === "profile" ? "Your display name has been updated across the app." : command.action === "preferences" ? "Your display and portfolio defaults have been updated." : command.action === "communications" ? "Your optional email preferences have been saved." : "Your account settings have been updated.", false, "Settings & Security", command.action === "cancel_request" ? "rose" : "cyan"); return true;
    } catch (cause) { notifyOperation("Action not completed", cause instanceof Error ? cause.message : "Your settings could not be saved.", true, "Settings & Security"); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  async function startFlow(action: SecurityFlow, expectedVersion: number) {
    if (!repository || lock.current) return false; lock.current = true; setBusy(true);
    try { const result = await repository.startSecurityFlow(action, expectedVersion, keyFor({ action, expectedVersion })); retry.current = null;
      if (result.kind === "demo_request") { accept(result.snapshot); notifyOperation("Demo security request saved", "Track it in Activity & privacy. No authentication credentials or protection status were changed.", false, "Settings & Security"); }
      else window.location.assign(result.redirect_url);
      return true;
    } catch (cause) { notifyOperation("Security action not started", cause instanceof Error ? cause.message : "Unable to start verification.", true, "Settings & Security"); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  async function refreshSettings() {
    if (!repository || lock.current) { if (!repository) refresh(); return; }
    lock.current = true; setBusy(true);
    try { accept(await repository.getSnapshot()); notifyOperation("Settings refreshed", "Your latest account settings have been loaded.", false, "Settings & Security"); }
    catch (cause) { notifyOperation("Refresh failed", cause instanceof Error ? cause.message : "Unable to load account settings.", true, "Settings & Security"); }
    finally { lock.current = false; setBusy(false); }
  }
  function download() {
    if (!s || error) return;
    try { const url = URL.createObjectURL(new Blob([settingsReport(s)], { type: "application/json;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = `account-settings-${s.as_of.slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); notifyOperation("Settings exported", "Your current profile, preferences and settings activity have been downloaded.", false, "Settings & Security"); } catch { notifyOperation("Export failed", "The settings report could not be downloaded. Try again.", true, "Settings & Security"); }
  }
  if (loading || !user) return <p role="status" className="p-6 text-sm text-slate-300">Loading your customer session…</p>;
  if (user.role !== "client") return <p className="p-6 text-sm text-slate-300">Switch to a customer account to manage personal settings.</p>;
  return <div className="w-full min-w-0 space-y-4"><h1 className="sr-only">Settings & Security</h1><PageHeader inlineActions statusText="Settings & Security"><div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2"><ActionButton autoWidth variant="cyan" aria-label="Export account settings" title="Export account settings" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" icon={<Download size={15} />} disabled={!s || !!error || busy} onClick={download}>Export</ActionButton><ActionButton autoWidth variant="blue" aria-label="Refresh account settings" title="Refresh account settings" labelClassName="hidden xl:inline" className="h-11 min-w-11 max-w-11 xl:min-w-32 xl:max-w-32" disabled={refreshing || busy} icon={<RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />} onClick={() => void refreshSettings()}>Refresh</ActionButton></div></PageHeader>
    {error ? <CardSurface className="p-5"><p role="alert" className="text-sm text-rose-200">{error}</p><button className={`${button} mt-3`} onClick={() => void refreshSettings()}>Retry loading settings</button></CardSurface> : !loaded || !s ? <p role="status" className="p-6 text-sm text-cyan-200">Loading your account settings…</p> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Account" value={s.identity.account_status === "ACTIVE" ? "Active" : s.identity.account_status === "BLOCKED" ? "Restricted" : "Unavailable"} icon={UserRound} tone="cyan" subtext={s.identity.client_code} /><MetricCard title="Identity verification" value={s.identity.verification === "VERIFIED" ? "Verified" : s.identity.verification === "IN_REVIEW" ? "Under review" : "Unavailable"} icon={BadgeCheck} tone="blue" subtext="Account identity record" /><MetricCard title="Active sessions" value={s.sessions.filter(session => !session.revoked_at).length} icon={Monitor} tone="purple" subtext={s.mode === "demo" ? "This browser + illustrative demo devices" : "Authenticated devices including this browser"} /><MetricCard title="Open requests" value={s.requests.filter(r => ["pending","processing"].includes(r.status)).length} icon={FileClock} tone="blue" subtext="Track requests in Activity & privacy" /></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div role="tablist" aria-label="Settings workspace" className="flex max-w-full flex-wrap gap-1 rounded-xl border border-white/10 bg-[#030918]/60 p-1">{tabs.map((item,index) => <button key={item} id={`settings-tab-${index}`} type="button" role="tab" tabIndex={tab === item ? 0 : -1} aria-selected={tab === item} aria-controls={`settings-panel-${index}`} disabled={busy} onClick={() => setTab(item)} onKeyDown={e => { let next = index; if (e.key === "ArrowRight") next = (index+1)%tabs.length; else if (e.key === "ArrowLeft") next = (index+tabs.length-1)%tabs.length; else if (e.key === "Home") next = 0; else if (e.key === "End") next = tabs.length-1; else return; e.preventDefault(); setTab(tabs[next]); document.getElementById(`settings-tab-${next}`)?.focus(); }} className={`min-h-11 cursor-pointer rounded-lg px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed ${tab === item ? "bg-cyan-300/15 text-cyan-100" : "text-slate-300 hover:bg-cyan-300/10 hover:text-cyan-100"}`}>{item}</button>)}</div><p className="text-[11px] text-slate-400">{s.mode === "demo" ? "Demo settings · saved in this browser" : "Connected account preferences"}</p></div>
      <div id="settings-content">{[
        <AccountSettings key="account" snapshot={s} busy={busy} onSave={save} onRequest={() => setDialog({ kind: "request", requestKind: "contact_change" })} />,
        <PreferenceSettings key="preferences" snapshot={s} busy={busy} onSave={save} />,
        <CommunicationSettings key="communications" snapshot={s} busy={busy} onSave={save} />,
        <AuthenticationSettings key="authentication" snapshot={s} busy={busy} onFlow={action => setDialog({ kind: "flow", action })} onRevoke={id => setDialog({ kind: "revoke", id })} onRevokeOthers={() => setDialog({ kind: "revoke_others" })} onLogout={logout} />,
        <SettingsActivity key="activity" snapshot={s} busy={busy} onRequest={requestKind => setDialog({ kind: "request", requestKind })} onCancel={id => setDialog({ kind: "cancel_request", id })} />
      ].map((content, index) => <div key={tabs[index]} id={`settings-panel-${index}`} role="tabpanel" aria-labelledby={`settings-tab-${index}`} hidden={tab !== tabs[index]}>{content}</div>)}</div>
      {dialog && <SettingsDialog key={JSON.stringify(dialog)} action={dialog} snapshot={s} busy={busy} onClose={() => setDialog(null)} onSave={save} onFlow={startFlow} />}
    </>}
  </div>;
}
