'use client';
import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { ConfigAdminRepository, ConfigEnvironment, ConfigSnapshot } from '@/app/lib/types/admin/flags-config';
import { notifyOperation } from '../../OperationNotification';
import { ActionButton } from '../../dashboard/ActionButton';
import { auditDate, auditFieldClass, auditTextareaClass } from '../audit/presentation';
import { ConfigDialog } from './presentation';
export default function ConfigExport({snapshot, environment, repository, blocked, onClose}: {snapshot: ConfigSnapshot; environment: ConfigEnvironment; repository: ConfigAdminRepository; blocked: boolean; onClose: () => void}) {
  const [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), retry = useRef<{reason: string; id: string} | null>(null), current = snapshot.state.environments[environment];
  async function download() {
    if (lock.current || blocked || reason.trim().length < 10 || reason.trim().length > 500) return;
    lock.current = true; setBusy(true); setError('');
    if (retry.current?.reason !== reason.trim()) retry.current = {reason: reason.trim(), id: crypto.randomUUID()};
    try {
      const content = JSON.stringify({schema_version: 2, catalog_version: 1, scope: 'GLOBAL', mode: snapshot.mode, snapshot_id: snapshot.snapshot_id, as_of: snapshot.as_of, environment, revision: current.revision, published: current.published, reason: reason.trim()}, null, 2);
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content)), checksum = Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
      await repository.recordExport({request_id: retry.current.id, snapshot_id: snapshot.snapshot_id, environment, revision: current.revision, reason: reason.trim(), content_sha256: checksum});
      const url = URL.createObjectURL(new Blob([content], {type: 'application/json'}));
      try {const anchor = document.createElement('a'); anchor.href = url; anchor.download = `mbank-config-${environment}-r${current.revision}.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove();} finally {window.setTimeout(() => URL.revokeObjectURL(url), 1000);}
      notifyOperation('Configuration exported', `Published ${environment} revision ${current.revision} exported with an audited SHA-256 checksum.`, false, 'Flags & Config'); onClose();
    } catch (cause) {const message = cause instanceof Error ? cause.message : 'Export failed.'; setError(message); notifyOperation('Configuration export failed', message, true, 'Flags & Config');}
    finally {lock.current = false; setBusy(false);}
  }
  return <ConfigDialog title="Export published configuration" subtitle={`${environment} · revision ${current.revision} · ${auditDate(snapshot.as_of, 'UTC')} UTC`} busy={busy} onClose={onClose} footer={<><ActionButton variant="blue" autoWidth disabled={busy} onClick={onClose}>Cancel</ActionButton><ActionButton variant="cyan" autoWidth disabled={busy || blocked || reason.trim().length < 10 || reason.trim().length > 500} icon={<Download size={14}/>} onClick={() => void download()}>{busy ? 'Preparing…' : 'Export JSON'}</ActionButton></>}><div className="space-y-5"><p className="text-xs leading-relaxed text-slate-300">Includes the entire published configuration for this environment. Search filters and unpublished draft edits are excluded. This snapshot remains fixed while you review the export.</p><label className={auditFieldClass}>Export purpose / reference<textarea className={auditTextareaClass} rows={3} required minLength={10} maxLength={500} disabled={busy} value={reason} onChange={e => setReason(e.target.value)} placeholder="Configuration review, incident or release reference…"/></label><p className="rounded-xl border border-white/10 p-4 text-xs leading-relaxed text-slate-300">The export request and content checksum are recorded in global Audit Logs before download. This catalog contains configuration values; credentials and secrets belong in a secret manager.</p>{blocked && <p role="alert" className="text-xs text-amber-200">Refresh the configuration before exporting.</p>}{error && <p role="alert" className="text-xs text-rose-200">{error}</p>}</div></ConfigDialog>;
}
