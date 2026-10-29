'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuditActor } from '../types/admin/audit';
import type { SystemHealthReport } from '../types/admin/system-health';
import { healthSnapshotStale } from './engine';
import { createHealthRepository } from './repository';

export function useHealthSource(actor: AuditActor) {
  const {email, role} = actor;
  const repository = useMemo(() => createHealthRepository({email, role}), [email, role]);
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [error, setError] = useState<string | null>(null), [loading, setLoading] = useState(true), [now, setNow] = useState(() => Date.now());
  const generation = useRef(0), controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const current = ++generation.current; setLoading(true);
    try {const next = await repository.getSnapshot(abort.signal); if (current === generation.current) {setReport(next); setNow(Date.now()); setError(null);}}
    catch (cause) {if (current === generation.current && !abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'Health telemetry unavailable.');}
    finally {if (current === generation.current) setLoading(false);}
  }, [repository]);
  useEffect(() => {
    const sequence = generation, activeController = controller;
    const timer = window.setTimeout(() => void refresh(), 0);
    const focus = () => void refresh();
    window.addEventListener('focus', focus);
    let pending: number | undefined;
    const changed = () => {if (process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE !== 'http') {window.clearTimeout(pending); pending = window.setTimeout(focus, 150);}};
    const storage = (event: StorageEvent) => {if (event.key === 'mbank_audit_journal_v1' || event.key === null) changed();};
    window.addEventListener('storage', storage); window.addEventListener('mbank:audit-updated', changed);
    const interval = process.env.NEXT_PUBLIC_SYSTEM_HEALTH_MODE === 'http' ? window.setInterval(focus, 30000) : undefined;
    return () => {sequence.current++; activeController.current?.abort(); window.clearTimeout(pending); window.removeEventListener('storage', storage); window.removeEventListener('mbank:audit-updated', changed); window.clearTimeout(timer); window.clearInterval(interval); window.removeEventListener('focus', focus);};
  }, [refresh]);
  useEffect(() => {const interval = window.setInterval(() => setNow(Date.now()), 10000); return () => window.clearInterval(interval);}, []);
  const stale = report ? healthSnapshotStale(report, now) : false;
  return {report, error, loading, stale, refresh, repository};
}
