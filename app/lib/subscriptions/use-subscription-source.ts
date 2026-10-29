'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSubscriptionsRepository } from './repository';
import type { SubscriptionSnapshot } from './contracts';
import type { SubscriptionCommand } from '../types/admin/subscriptions';
export function useSubscriptionSource(actor: {email: string; role: 'admin' | 'client'}) {
  const repository = useMemo(() => createSubscriptionsRepository({email: actor.email, role: actor.role}), [actor.email, actor.role]);
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);
  const [warning, setWarning] = useState<string | null>(null), [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const accept = useCallback((next: SubscriptionSnapshot) => { generation.current++; setSnapshot(next); setWarning(null); setLoading(false); }, []);
  const refresh = useCallback(async () => {
    const current = ++generation.current; setLoading(true);
    try { const next = await repository.getSnapshot(); if (current === generation.current) { setSnapshot(next); setWarning(null); } }
    catch (cause) { if (current === generation.current) setWarning(cause instanceof Error ? cause.message : 'Subscriptions unavailable.'); }
    finally { if (current === generation.current) setLoading(false); }
  }, [repository]);
  useEffect(() => {
    const changed = () => void refresh();
    const storage = (e: StorageEvent) => { if (e.key === null || ['mbank_subscriptions_v1', 'mbank_user_registry_v1'].includes(e.key)) changed(); };
    const timer = window.setTimeout(changed, 0);
    window.addEventListener('storage', storage); window.addEventListener('mbank:subscriptions-updated', changed); window.addEventListener('mbank:users-updated', changed); window.addEventListener('focus', changed);
    return () => { generation.current++; window.clearTimeout(timer); window.removeEventListener('storage', storage); window.removeEventListener('mbank:subscriptions-updated', changed); window.removeEventListener('mbank:users-updated', changed); window.removeEventListener('focus', changed); };
  }, [refresh]);
  const execute = async (command: SubscriptionCommand) => { const next = await repository.execute(command); accept(next); };
  return {snapshot, warning, loading, refresh, execute, recordExport: repository.recordExport};
}
