'use client';
import { useRef, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { canonicalConfig, configChanges, productionIssues, validatePayload } from '@/app/lib/flags-config/engine';
import type { ConfigDraft } from '@/app/lib/flags-config/draft';
import type { ConfigPublishCommand } from '@/app/lib/types/admin/flags-config';
import { notifyOperation } from '../../OperationNotification';
import { ActionButton } from '../../dashboard/ActionButton';
import { auditFieldClass, auditTextareaClass } from '../audit/presentation';
import { Badge, ConfigDialog } from './presentation';
import ConfigChanges from './ConfigChanges';
export default function ConfigReleaseReview({draft, blocked, stale, mode, onClose, onPublish}: {draft: ConfigDraft; blocked: boolean; stale: boolean; mode: 'demo' | 'live'; onClose: () => void; onPublish: (command: ConfigPublishCommand) => Promise<void>}) {
  const [reason, setReason] = useState(''), [confirmed, setConfirmed] = useState(false), [typed, setTyped] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), retry = useRef<{fingerprint: string; id: string} | null>(null);
  const changes = configChanges(draft.base, draft.payload), critical = changes.filter(c => c.critical).length;
  const issues = [...validatePayload(draft.payload), ...productionIssues(draft.payload, draft.environment)];
  const ready = confirmed && (draft.environment !== 'production' || typed === 'production') && reason.trim().length >= 10 && reason.trim().length <= 500 && !blocked && !stale && !issues.length && !!changes.length;
  async function publish() {
    if (lock.current || !ready) return;
    lock.current = true; setBusy(true); setError('');
    const body = {environment: draft.environment, expected_revision: draft.revision, payload: draft.payload, reason: reason.trim(), catalog_version: 1 as const, restored_from: draft.restored_from};
    const fingerprint = canonicalConfig(body); if (retry.current?.fingerprint !== fingerprint) retry.current = {fingerprint, id: crypto.randomUUID()};
    try {await onPublish({...body, request_id: retry.current.id}); onClose();}
    catch (cause) {const message = cause instanceof Error ? cause.message : 'Release could not be published.'; setError(message); notifyOperation('Configuration publication failed', message, true, 'Flags & Config');}
    finally {lock.current = false; setBusy(false);}
  }
  return <ConfigDialog title={draft.restored_from ? 'Review restoration release' : 'Review global release'} subtitle={`${draft.environment.toUpperCase()} · revision ${draft.revision} → ${draft.revision + 1}`} busy={busy} onClose={onClose} footer={<><ActionButton variant="blue" autoWidth disabled={busy} onClick={onClose}>Back to draft</ActionButton><ActionButton variant="cyan" autoWidth disabled={!ready || busy} icon={<CheckCheck size={14}/>} onClick={() => void publish()}>{busy ? 'Publishing…' : `Publish to ${draft.environment}`}</ActionButton></>}>
    <div className="space-y-5"><div className="flex flex-wrap gap-2"><Badge>{changes.length} key changes</Badge><Badge tone={critical ? 'amber' : 'green'}>{critical} critical changes</Badge><Badge>{mode === 'demo' ? 'Shared browser demo' : 'Global live configuration'}</Badge></div>
      <p className="text-xs leading-relaxed text-slate-300">This release affects eligible customers in {draft.environment}. {draft.environment === 'production' ? 'Production changes are consumed by customer operations; they do not apply to staging or sandbox.' : 'Production configuration is unchanged.'} The server must confirm publication before this draft is cleared.</p>
      <ConfigChanges before={draft.base} after={draft.payload}/>
      <label className={auditFieldClass}>Change reason / ticket reference<textarea className={auditTextareaClass} required minLength={10} maxLength={500} rows={3} disabled={busy} value={reason} onChange={e => {setReason(e.target.value); setConfirmed(false);}} placeholder="Explain the operational need, impact and review reference…"/></label>
      {draft.environment === 'production' && <label className={auditFieldClass}>Type production to confirm the environment<input className="min-h-11 rounded-xl border border-amber-400/25 bg-[#060d1d] px-3 text-xs text-white outline-none focus:border-cyan-300" autoComplete="off" spellCheck={false} disabled={busy} value={typed} onChange={e => setTyped(e.target.value)}/></label>}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4 text-xs leading-relaxed text-slate-200"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-cyan-300" disabled={busy} checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/><span>I reviewed the values, affected environment and {critical ? 'critical controls' : 'operational impact'}.</span></label>
      {(blocked || stale) && <p role="alert" className="text-xs text-amber-200">{stale ? 'A newer revision exists. Close this review and compare or discard your draft.' : 'Configuration is refreshing or unavailable. Publication is blocked.'}</p>}
      {!!issues.length && <div role="alert" className="text-xs text-amber-200">{issues.join(' ')}</div>}{error && <p role="alert" className="text-xs text-rose-200">{error}</p>}
    </div>
  </ConfigDialog>;
}
