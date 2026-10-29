'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createReferralsRepository } from './repository';
import type { ReferralActor, ReferralCommand, ReferralSnapshot } from './contracts';

export function useReferrals(actor: ReferralActor) {
  const repository = useMemo(() => createReferralsRepository({email: actor.email, role: actor.role}), [actor.email, actor.role]);
  const [snapshot, setSnapshot] = useState<ReferralSnapshot | null>(null), [warning, setWarning] = useState<string | null>(null), [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current; setLoading(true);
    try { const next = await repository.getSnapshot(); if (current === generation.current) {setSnapshot(next); setWarning(null);} }
    catch (cause) {if (current === generation.current) setWarning(cause instanceof Error ? cause.message : 'Referral registry unavailable.');}
    finally {if (current === generation.current) setLoading(false);}
  }, [repository]);
  useEffect(() => {
    const changed = () => void refresh(), storage = (e: StorageEvent) => {if (e.key === null || ['mbank_referrals_v1', 'mbank_risk_v1', 'mbank_user_registry_v1', 'mbank_flags_config_v1', 'mbank_subscriptions_v1'].includes(e.key)) changed();};
    const events = ['mbank:referrals-updated', 'mbank:risk-updated', 'mbank:users-updated', 'mbank:config-updated', 'mbank:subscriptions-updated', 'focus'];
    const timer = window.setTimeout(changed, 0); events.forEach(e => window.addEventListener(e, changed)); window.addEventListener('storage', storage);
    return () => {generation.current++; window.clearTimeout(timer); events.forEach(e => window.removeEventListener(e, changed)); window.removeEventListener('storage', storage);};
  }, [refresh]);
  const execute = async (command: ReferralCommand) => {const next = await repository.execute(command); generation.current++; setSnapshot(next); setWarning(null); setLoading(false);};
  return {snapshot, warning, loading, refresh, execute};
}
