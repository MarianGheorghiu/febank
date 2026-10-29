'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createBusinessRepository } from './repository';
import type { BusinessActor, BusinessSnapshot } from './contracts';

export function useBusinessSource(actor: BusinessActor) {
  const repository = useMemo(() => createBusinessRepository({email: actor.email, role: actor.role}), [actor.email, actor.role]);
  const [snapshot, setSnapshot] = useState<BusinessSnapshot | null>(null), [warning, setWarning] = useState<string | null>(null), [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current; setLoading(true);
    try {const next = await repository.getSnapshot(); if (current === generation.current) {setSnapshot(next); setWarning(null);}}
    catch (cause) {if (current === generation.current) setWarning(cause instanceof Error ? cause.message : 'Business Analytics is unavailable.');}
    finally {if (current === generation.current) setLoading(false);}
  }, [repository]);
  useEffect(() => {
    let timer: number | undefined;
    const changed = () => {window.clearTimeout(timer); timer = window.setTimeout(() => void refresh(), 150);};
    const storage = (e: StorageEvent) => {if (e.key === null || (e.key.startsWith('mbank_') && e.key !== 'mbank_audit_journal_v1' && e.key !== 'mbank_session')) changed();};
    const events = ['mbank:users-updated', 'mbank:wallet-updated', 'mbank:cards-updated', 'mbank:subscriptions-updated', 'mbank:referrals-updated', 'mbank:risk-updated', 'mbank:rates-updated', 'mbank:markets-updated', 'mbank:config-updated', 'focus'];
    changed(); events.forEach(e => window.addEventListener(e, changed)); window.addEventListener('storage', storage);
    const interval = window.setInterval(changed, 60000);
    return () => {generation.current++; window.clearTimeout(timer); window.clearInterval(interval); events.forEach(e => window.removeEventListener(e, changed)); window.removeEventListener('storage', storage);};
  }, [refresh]);
  return {snapshot, warning, loading, refresh, repository};
}
