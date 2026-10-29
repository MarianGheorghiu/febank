'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuditActor } from '../types/admin/audit';
import type { ConfigSnapshot } from '../types/admin/flags-config';
import { createConfigRepository } from './repository';
export function useConfigSource(actor: AuditActor) {
  const {email, role} = actor;
  const repository = useMemo(() => createConfigRepository({email, role}), [email, role]);
  const [snapshot, setSnapshot] = useState<ConfigSnapshot | null>(null), [error, setError] = useState<string | null>(null), [loading, setLoading] = useState(true);
  const generation = useRef(0), controller = useRef<AbortController | null>(null);
  const accept = useCallback((next: ConfigSnapshot) => {generation.current++; controller.current?.abort(); setSnapshot(next); setError(null); setLoading(false);}, []);
  const refresh = useCallback(async () => {
    const current = ++generation.current; controller.current?.abort(); const abort = new AbortController(); controller.current = abort; setLoading(true);
    try {const next = await repository.getSnapshot(abort.signal); if (current === generation.current) {setSnapshot(next); setError(null);}}
    catch (cause) {if (current === generation.current && !abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'Global configuration unavailable.');}
    finally {if (current === generation.current) setLoading(false);}
  }, [repository]);
  useEffect(() => {
    const sequence = generation, active = controller;
    let pending: number | undefined;
    const schedule = () => {window.clearTimeout(pending); pending = window.setTimeout(() => void refresh(), 100);};
    const storage = (e: StorageEvent) => {if (e.key === 'mbank_flags_config_v1' || e.key === null) schedule();};
    schedule(); window.addEventListener('storage', storage); window.addEventListener('mbank:config-updated', schedule); window.addEventListener('focus', schedule);
    const interval = process.env.NEXT_PUBLIC_FLAGS_CONFIG_MODE === 'http' ? window.setInterval(schedule, 60000) : undefined;
    return () => {sequence.current++; active.current?.abort(); window.clearTimeout(pending); window.clearInterval(interval); window.removeEventListener('storage', storage); window.removeEventListener('mbank:config-updated', schedule); window.removeEventListener('focus', schedule);};
  }, [refresh]);
  return {snapshot, error, loading, refresh, accept, repository};
}
