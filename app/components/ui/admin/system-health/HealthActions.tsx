'use client';
import { useRef, useState } from 'react';
import { CheckCheck, Download } from 'lucide-react';
import type { HealthIncident, SystemHealthReport, SystemHealthRepository } from '@/app/lib/types/admin/system-health';
import { notifyOperation } from '../../OperationNotification';
import { ActionButton } from '../../dashboard/ActionButton';
import { auditBadge, auditDate, auditFieldClass, auditTextareaClass } from '../audit/presentation';
import HealthDialog from './HealthDialog';

export default function HealthActions({report, incident, repository, blocked, onClose, onSaved}: {report: SystemHealthReport; incident?: HealthIncident; repository: SystemHealthRepository; blocked: boolean; onClose: () => void; onSaved: () => Promise<void>}) {
  const [note, setNote] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), retry = useRef<{fingerprint: string; id: string} | null>(null);
  const service = report.services.find(s => s.id === incident?.service_id);
  async function submit() {
    if (lock.current || blocked) return;
    if (note.trim().length < 10 || note.trim().length > 500) {setError('Enter a note of 10–500 characters.'); return;}
    lock.current = true; setBusy(true); setError('');
    const fingerprint = `${report.snapshot_id}:${incident?.id ?? 'export'}:${note.trim()}`;
    if (retry.current?.fingerprint !== fingerprint) retry.current = {fingerprint, id: crypto.randomUUID()};
    try {
      if (incident) {
        await repository.acknowledge({request_id: retry.current.id, snapshot_id: report.snapshot_id, incident_id: incident.id, expected_revision: incident.revision, note: note.trim()});
        notifyOperation('Incident acknowledged', report.mode === 'demo' ? 'Review saved in the shared browser audit journal. The incident remains open.' : 'Review recorded by the monitoring service. The incident remains open.', false, 'System Health');
        await onSaved();
      } else {
        const content = JSON.stringify({schema_version: 3, scope: 'GLOBAL', reason: note.trim(), report}, null, 2);
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
        const checksum = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
        const receipt = await repository.recordExport({request_id: retry.current.id, snapshot_id: report.snapshot_id, reason: note.trim(), content_sha256: checksum});
        const download = (text: string, name: string) => {const url = URL.createObjectURL(new Blob([text], {type: 'application/json'})); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);};
        // Keep the hashed payload exact; audit evidence is returned separately by the API.
        download(content, `mbank-${report.snapshot_id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        notifyOperation('Diagnostics exported', `All domains and 24-hour telemetry included. Audit reference: ${receipt.audit_event_id}.`, false, 'System Health');
      }
      onClose();
    } catch (cause) {setError(cause instanceof Error ? cause.message : 'Operation could not be completed.');}
    finally {lock.current = false; setBusy(false);}
  }
  return <HealthDialog title={incident ? 'Incident review' : 'Export diagnostics'} busy={busy} onClose={onClose}>
    <form className="space-y-5" onSubmit={e => {e.preventDefault(); void submit();}}>
      {incident ? <>
        <div className="flex flex-wrap items-center gap-2"><span className={auditBadge(incident.severity)}>{incident.severity}</span><span className="text-xs text-slate-200">{incident.id} · {incident.state.toLowerCase()}</span></div>
        <h3 className="text-base font-semibold">{incident.title}</h3>
        <dl className="grid gap-4 text-xs sm:grid-cols-2"><div><dt className="text-slate-400">Accountable team</dt><dd className="mt-1 text-cyan-200">{service?.owner ?? 'Unassigned'}</dd></div><div><dt className="text-slate-400">Affected service</dt><dd className="mt-1">{service?.name ?? incident.service_id}</dd></div><div><dt className="text-slate-400">Started · UTC</dt><dd className="mt-1">{auditDate(incident.started_at, 'UTC')}</dd></div><div><dt className="text-slate-400">Last update · UTC</dt><dd className="mt-1">{auditDate(incident.updated_at, 'UTC')}</dd></div></dl>
        {[['Customer impact', incident.impact], ['Latest update', incident.update], ['Next action', incident.next_step]].map(([label, text]) => <div key={label}><p className="mb-1 text-xs font-semibold text-white">{label}</p><p className="text-xs leading-relaxed text-slate-300">{text}</p></div>)}
        {incident.acknowledgement && <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 p-4 text-xs leading-relaxed text-teal-200"><p>Reviewed by {incident.acknowledgement.actor} · {auditDate(incident.acknowledgement.acknowledged_at, 'UTC')} UTC</p><p className="mt-2">{incident.acknowledgement.note}</p><p className="mt-2 break-all text-slate-300">Audit: {incident.acknowledgement.audit_event_id}</p></div>}
      </> : <div className="space-y-3 text-xs leading-relaxed text-slate-300"><p>Global snapshot captured {auditDate(report.as_of, 'UTC')} UTC.</p><p>{report.services.length} services · {report.controls.length} controls · {report.incidents.length} incidents · {report.resources.length} infrastructure resources.</p><p>Includes all domains and the full 24-hour window, regardless of visible filters. This dialog keeps the captured snapshot fixed while you review it.</p></div>}
      {!incident?.acknowledgement && <label className={auditFieldClass}>{incident ? 'Review note / ticket reference' : 'Export purpose / reference'}<textarea autoFocus className={auditTextareaClass} required rows={3} minLength={10} maxLength={500} value={note} onChange={e => setNote(e.target.value)} disabled={busy} placeholder={incident ? 'Review findings and escalation reference…' : 'Operational review or incident reference…'}/></label>}
      <p className="rounded-xl border border-white/10 p-3 text-xs leading-relaxed text-slate-300">{report.mode === 'demo' ? 'Mock telemetry. Reviews and export requests are recorded in this browser’s shared Audit Logs.' : 'Global monitoring data. Actions require server authorization and durable audit evidence.'} {incident ? 'Acknowledgement records a review; the service owns incident resolution.' : 'A SHA-256 checksum is audited before download.'}</p>
      {blocked && <p role="alert" className="text-xs text-amber-200">Monitoring is refreshing or unavailable. Actions resume after a fresh snapshot is available.</p>}{error && <p role="alert" className="rounded-xl border border-rose-400/25 p-3 text-xs text-rose-200">{error}</p>}
      <footer className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4"><ActionButton variant="blue" autoWidth disabled={busy} onClick={onClose}>{incident?.acknowledgement ? 'Close' : 'Cancel'}</ActionButton>{!incident?.acknowledgement && <ActionButton variant="cyan" autoWidth type="submit" disabled={busy || blocked} icon={incident ? <CheckCheck size={14}/> : <Download size={14}/>}>{busy ? 'Saving…' : incident ? 'Acknowledge incident' : 'Export JSON'}</ActionButton>}</footer>
    </form>
  </HealthDialog>;
}
