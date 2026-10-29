'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CheckCheck, Download, Flag, History, RefreshCw, RotateCcw, Settings2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useUser } from '@/app/context/UserContext';
import PageHeader from '../../PageHeader';
import MetricCard from '../../MetricCard';
import CardSurface from '../../CardSurface';
import { ActionButton } from '../../dashboard/ActionButton';
import { notifyOperation } from '../../OperationNotification';
import { AuditPanel, AuditSelect, auditDate, auditFieldClass } from '../audit/presentation';
import { CONFIG_FLAGS, CONFIG_SETTINGS } from '@/app/lib/flags-config/catalog';
import { configChanges } from '@/app/lib/flags-config/engine';
import { useConfigSource } from '@/app/lib/flags-config/use-config-source';
import { readConfigDraft, saveConfigDraft, type ConfigDraft } from '@/app/lib/flags-config/draft';
import type { AuditActor } from '@/app/lib/types/admin/audit';
import { CONFIG_ENVIRONMENTS, type ConfigEnvironment, type ConfigPayload, type ConfigPublishCommand, type ConfigRelease, type ConfigSnapshot } from '@/app/lib/types/admin/flags-config';
import { Badge, ConfigDialog } from './presentation';
import ConfigCharts from './ConfigCharts';
import ConfigCatalog, {type ConfigEditorTarget} from './ConfigCatalog';
import ConfigEditor from './ConfigEditor';
import ConfigReleaseReview from './ConfigReleaseReview';
import ConfigHistory from './ConfigHistory';
import ConfigChanges from './ConfigChanges';
import ConfigExport from './ConfigExport';
import ConfigSimulator from './ConfigSimulator';

type View = 'OVERVIEW' | 'SETTINGS' | 'FLAGS' | 'HISTORY' | 'SIMULATOR';
const views: [View, string][] = [['OVERVIEW', 'Overview'], ['SETTINGS', 'Configuration'], ['FLAGS', 'Feature flags'], ['HISTORY', 'Release history'], ['SIMULATOR', 'Simulator']];
export default function FlagsConfigWorkspace() {
  const {user, loading} = useUser();
  if (loading || !user) return null;
  if (user.role !== 'admin') return <div className="rounded-xl border border-rose-400/25 p-8 text-center text-white"><ShieldAlert className="mx-auto mb-3 text-rose-200"/><h1>Administrator access required</h1><Link className="mt-4 inline-block text-cyan-200" href="/dashboard">Return to dashboard</Link></div>;
  return <Workspace key={user.email} actor={user}/>;
}
function Workspace({actor}: {actor: AuditActor}) {
  const source = useConfigSource(actor), {snapshot} = source;
  const [saved] = useState(() => readConfigDraft(actor.email));
  const [draft, setDraft] = useState<ConfigDraft | null>(saved.draft), [draftWarning, setDraftWarning] = useState<string | null>(saved.warning), [recovery, setRecovery] = useState(!!saved.warning);
  const [environment, setEnvironment] = useState<ConfigEnvironment>(saved.draft?.environment ?? 'production'), [view, setView] = useState<View>('OVERVIEW');
  const [editor, setEditor] = useState<ConfigEditorTarget | null>(null), [review, setReview] = useState(false), [discard, setDiscard] = useState(false), [release, setRelease] = useState<ConfigRelease | null>(null), [exportContext, setExportContext] = useState<{snapshot: ConfigSnapshot; environment: ConfigEnvironment} | null>(null);
  const current = snapshot?.state.environments[environment], payload = draft?.payload ?? current?.published;
  const changes = draft ? configChanges(draft.base, draft.payload) : [], dirty = !!changes.length;
  const stale = !!draft && !!current && draft.revision !== current.revision;
  const blocked = source.loading || !!source.error || !snapshot, editBlocked = blocked || stale || recovery || !snapshot?.permissions.publish;
  function saveDraft(next: ConfigDraft | null) {
    try {saveConfigDraft(actor.email, next); setDraftWarning(null); setRecovery(false);}
    catch {setDraftWarning('The draft could not be saved in this tab. Keep this page open to preserve current edits.');}
    setDraft(next);
  }
  function stage(next: ConfigPayload) {
    if (!current || editBlocked) return;
    const base = draft?.base ?? structuredClone(current.published);
    saveDraft(configChanges(base, next).length ? {environment, revision: draft?.revision ?? current.revision, base, payload: next, restored_from: null} : null);
    notifyOperation('Draft updated', 'Published configuration is unchanged. Review the draft when ready to release.', false, 'Flags & Config');
  }
  function discardDraft() {
    try {saveConfigDraft(actor.email, null); setDraft(null); setDraftWarning(null); setRecovery(false); setDiscard(false); notifyOperation('Draft discarded', 'The latest published configuration is now shown.', false, 'Flags & Config');}
    catch {setDraftWarning('Saved draft could not be cleared. Check browser storage before leaving this page.'); notifyOperation('Draft could not be discarded', 'Browser storage is unavailable. Your draft was preserved.', true, 'Flags & Config');}
  }
  async function publish(command: ConfigPublishCommand) {
    if (editBlocked) throw new Error('Refresh the current configuration before publishing.');
    const next = await source.repository.publish(command); source.accept(next);
    try {saveConfigDraft(actor.email, null); setDraftWarning(null);} catch {setDraftWarning('Release was published, but the old saved draft could not be removed. It will be stale if reopened.');}
    setDraft(null);
    if (next.mode === 'live') window.dispatchEvent(new Event('mbank:config-updated'));
    notifyOperation('Global configuration published', `${command.environment} revision ${command.expected_revision + 1} confirmed. Release history and Audit Logs include this change.`, false, 'Flags & Config');
  }
  function restore(r: ConfigRelease) {
    if (!current || dirty || editBlocked) return;
    const next = {environment, revision: current.revision, base: structuredClone(current.published), payload: structuredClone(r.before), restored_from: r.id};
    saveDraft(next); setRelease(null); setReview(true);
  }
  return <div className="@container w-full min-w-0 space-y-5 font-mono text-white [overflow-wrap:anywhere] [&_header_p]:text-slate-300 [&_button]:cursor-pointer [&_button]:disabled:cursor-not-allowed [&_summary]:focus-visible:outline-2 [&_summary]:focus-visible:outline-cyan-300">
    <h1 className="sr-only">Flags & Config</h1>
    <PageHeader statusText="Flags & Config" wrapActions><ActionButton variant="blue" autoWidth disabled={source.loading} icon={<RefreshCw size={14} className={source.loading ? 'animate-spin' : ''}/>} onClick={() => void source.refresh()}>Refresh</ActionButton><ActionButton variant="cyan" autoWidth disabled={blocked || !snapshot?.permissions.export} icon={<Download size={14}/>} onClick={() => snapshot && setExportContext({snapshot: structuredClone(snapshot), environment})}>Export config</ActionButton><ActionButton variant="cyan" autoWidth disabled={!dirty || editBlocked} icon={<CheckCheck size={14}/>} onClick={() => setReview(true)}>Review draft</ActionButton></PageHeader>
    {source.error && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/5 p-4 text-xs leading-relaxed text-rose-200">{source.error} {snapshot ? 'The last successful snapshot remains visible. Editing, publication and export are blocked.' : 'No published configuration is available.'}</p>}
    {draftWarning && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 p-4 text-xs leading-relaxed text-amber-200"><p>{draftWarning}</p>{recovery && <ActionButton variant="amber" autoWidth size="small" onClick={() => setDiscard(true)}>Clear saved draft</ActionButton>}</div>}
    {!snapshot && <p role="status" className="rounded-2xl border border-white/10 p-12 text-center text-sm text-slate-300">{source.loading ? 'Loading global configuration…' : 'Refresh to retry the configuration service.'}</p>}
    {snapshot && current && payload && <>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-300"><span>Global application scope · <strong className="text-white">{snapshot.mode === 'demo' ? 'Shared browser demo' : 'Live configuration service'}</strong></span><span>Captured {auditDate(snapshot.as_of, 'UTC')} UTC</span></div>
      <CardSurface tone="blue" className="focus-within:z-40 p-4"><div className="grid items-end gap-4 @min-[600px]:grid-cols-[220px_minmax(0,1fr)]"><label className={auditFieldClass}>Configuration environment<AuditSelect searchable aria-label="Configuration environment" disabled={dirty || !!editor || review || recovery} value={environment} onChange={e => {setEnvironment(e.target.value as ConfigEnvironment); setRelease(null);}}>{CONFIG_ENVIRONMENTS.map(e => <option key={e} value={e}>{e[0].toUpperCase() + e.slice(1)}</option>)}</AuditSelect></label><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Published revision {current.revision}</p><p className="mt-2 text-xs leading-relaxed text-slate-300">{dirty ? `Draft based on revision ${draft!.revision} · publish or discard before switching environments.` : environment === 'production' ? 'Production values are consumed by customer operations. Changes require a reviewed release.' : `${environment} is isolated from production.`}</p></div><Badge tone={dirty ? 'amber' : 'green'}>{dirty ? 'Unpublished draft' : 'Published'}</Badge></div></div></CardSurface>
      {stale && <div role="alert" className="rounded-xl border border-amber-400/25 p-4 text-xs leading-relaxed text-amber-200"><p>A newer revision was published. Your draft is preserved and cannot overwrite it. Compare the current values, then discard and reapply the intended changes.</p><ActionButton variant="amber" autoWidth size="small" className="mt-3" onClick={() => setDiscard(true)}>Discard stale draft</ActionButton></div>}
      <div className="grid auto-rows-fr gap-3 @min-[400px]:grid-cols-2 @min-[1050px]:grid-cols-4"><MetricCard readable compact tone="blue" title="Configuration settings" value={CONFIG_SETTINGS.length} icon={Settings2} subtext="12 global application domains"/><MetricCard readable compact tone="cyan" title="Enabled feature flags" value={Object.values(payload.flags).filter(r => r.enabled && r.rollout_pct > 0).length} icon={Flag} subtext={`${CONFIG_FLAGS.length} total · eligibility rules still apply`}/><MetricCard readable compact tone="purple" title="Published releases" value={current.releases.length} icon={History} subtext={`${environment} · immutable revision history`}/><MetricCard readable compact tone="amber" title="Draft changes" value={changes.length} icon={ShieldCheck} subtext={`${changes.filter(c => c.critical).length} critical controls changed`}/></div>
      <nav aria-label="Configuration views" className="scrollbar-thin flex min-w-0 gap-2 overflow-x-auto pb-1">{views.map(([key, label]) => <ActionButton key={key} variant={view === key ? 'cyan' : 'blue'} autoWidth className="shrink-0" labelClassName="whitespace-nowrap" aria-pressed={view === key} aria-controls="config-view-panel" onClick={() => setView(key)}>{label}</ActionButton>)}</nav>
      <div id="config-view-panel" className="min-w-0 space-y-5">
        {view === 'OVERVIEW' && <><ConfigCharts payload={payload} current={current} asOf={snapshot.as_of}/><AuditPanel title="Global impact & enforcement" subtitle="Published configuration is distinct from confirmed service adoption."><div className="grid gap-4 p-5 text-xs leading-relaxed @min-[750px]:grid-cols-3"><div><h3 className="mb-2 font-semibold text-white">Customer write controls</h3><p className="text-slate-300">The shared demo wallet checks production maintenance, crypto / stock trading masters and new loan applications at commit time. Card issuing and virtual card access use the same published configuration.</p></div><div><h3 className="mb-2 font-semibold text-white">Audience & campaigns</h3><p className="text-slate-300">Referral eligibility and campaign terms already consume production flags and values. The simulator explains stable rollout decisions without changing customer records.</p></div><div><h3 className="mb-2 font-semibold text-white">Go service ownership</h3><p className="text-slate-300">Session security, reporting defaults, delivery, retention and other service settings are versioned targets for their owning services. This console does not claim those services have acknowledged a release.</p></div></div></AuditPanel></>}
        {(view === 'SETTINGS' || view === 'FLAGS') && <ConfigCatalog key={view === 'FLAGS' ? 'feature-rules' : 'settings'} kind={view === 'SETTINGS' ? 'settings' : 'flags'} payload={payload} published={current.published} disabled={editBlocked} onEdit={setEditor} onStage={stage}/>}
        {view === 'HISTORY' && <ConfigHistory key={environment} releases={current.releases} onOpen={r => setRelease(structuredClone(r))}/>}
        {view === 'SIMULATOR' && <ConfigSimulator published={current.published} payload={payload} dirty={dirty}/>}
      </div>
    </>}
    {dirty && <div className="sticky bottom-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-400/30 bg-[#0b172b]/95 p-4 shadow-xl backdrop-blur"><div><p className="text-xs font-semibold">{changes.length} unpublished changes · {environment}</p><p className="mt-1 text-[11px] text-slate-300">{stale ? 'Newer published revision detected.' : 'Draft saved in this tab; active values stay published.'}</p></div><div className="flex flex-wrap gap-2"><ActionButton variant="blue" autoWidth onClick={() => setDiscard(true)}>Discard draft</ActionButton><ActionButton variant="cyan" autoWidth disabled={editBlocked} icon={<CheckCheck size={14}/>} onClick={() => setReview(true)}>Review changes</ActionButton></div></div>}
    {editor && payload && <ConfigEditor target={editor} payload={payload} environment={environment} blocked={editBlocked} onClose={() => setEditor(null)} onSave={stage}/>}
    {review && draft && snapshot && <ConfigReleaseReview draft={draft} blocked={blocked || !snapshot.permissions.publish || recovery} stale={stale} mode={snapshot.mode} onClose={() => setReview(false)} onPublish={publish}/>}
    {discard && <ConfigDialog title="Discard saved draft?" subtitle="Published configuration and release history remain unchanged." onClose={() => setDiscard(false)} footer={<><ActionButton variant="blue" autoWidth onClick={() => setDiscard(false)}>Keep draft</ActionButton><ActionButton variant="rose" autoWidth onClick={discardDraft}>Discard draft</ActionButton></>}><p className="text-xs leading-relaxed text-slate-300">This removes the unpublished draft from this tab. Any intended changes will need to be entered again against the latest published revision.</p></ConfigDialog>}
    {release && current && <ConfigDialog title={`Release revision ${release.revision}`} subtitle={`${environment} · ${auditDate(release.timestamp, 'UTC')} UTC · ${release.actor}`} onClose={() => setRelease(null)} footer={<><ActionButton variant="blue" autoWidth onClick={() => setRelease(null)}>Close</ActionButton><ActionButton variant="amber" autoWidth disabled={dirty || editBlocked || !configChanges(current.published, release.before).length} icon={<RotateCcw size={14}/>} onClick={() => restore(release)}>Review restoration</ActionButton></>}><div className="space-y-5"><p className="text-xs leading-relaxed text-slate-200">{release.reason}</p><ConfigChanges before={release.before} after={release.after}/><p className="text-xs leading-relaxed text-slate-300">Restoration stages the complete configuration that existed before this release. It creates a new revision after review; later changes are included in the review diff.</p>{dirty && <p className="text-xs text-amber-200">Publish or discard the existing draft before starting a restoration.</p>}</div></ConfigDialog>}
    {exportContext && <ConfigExport snapshot={exportContext.snapshot} environment={exportContext.environment} repository={source.repository} blocked={blocked || !snapshot?.permissions.export} onClose={() => setExportContext(null)}/>}
  </div>;
}
