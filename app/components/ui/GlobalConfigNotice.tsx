'use client';
import { useEffect, useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { readConfigForExecution } from '@/app/lib/flags-config/store';
import { notifyOperation } from './OperationNotification';

/** Public runtime status only. Live clients never fetch the privileged admin snapshot. */
export default function GlobalConfigNotice({admin}: {admin: boolean}) {
  const [maintenance, setMaintenance] = useState(false), [error, setError] = useState(false);
  const revision = useRef<number | null>(null);
  useEffect(() => {
    let alive = true, generation = 0, controller: AbortController | undefined;
    async function read() {
      const current = ++generation; controller?.abort(); controller = new AbortController();
      try {
        let version: number, paused: boolean;
        const mode = process.env.NEXT_PUBLIC_FLAGS_CONFIG_MODE ?? 'demo';
        if (mode === 'demo') {const config = readConfigForExecution().environments.production; version = config.revision; paused = config.published.settings['platform.maintenance'] === true;}
        else if (mode === 'http') {
          const base = (process.env.NEXT_PUBLIC_FLAGS_CONFIG_API_URL ?? '').replace(/\/$/, '');
          const response = await fetch(`${base}/v1/config/runtime`, {credentials: 'include', cache: 'no-store', signal: controller.signal});
          if (!response.ok) throw new Error();
          const data = await response.json();
          if (data.schema_version !== 1 || data.environment !== 'production' || !Number.isSafeInteger(data.revision) || data.revision < 1 || typeof data.maintenance !== 'boolean') throw new Error();
          version = data.revision; paused = data.maintenance;
        } else throw new Error();
        if (!alive || current !== generation) return;
        if (!admin && revision.current !== null && revision.current !== version) notifyOperation('Platform configuration updated', paused ? 'New financial operations are paused for maintenance. Account information remains available.' : 'The latest published platform configuration is now available.', false, 'Platform configuration');
        revision.current = version; setMaintenance(paused); setError(false);
      } catch {if (alive && current === generation) setError(true);}
    }
    const changed = () => void read(), storage = (e: StorageEvent) => {if (e.key === 'mbank_flags_config_v1' || e.key === null) changed();};
    const timer = window.setTimeout(changed, 0); window.addEventListener('mbank:config-updated', changed); window.addEventListener('storage', storage); window.addEventListener('focus', changed);
    const interval = process.env.NEXT_PUBLIC_FLAGS_CONFIG_MODE === 'http' ? window.setInterval(changed, 60000) : undefined;
    return () => {alive = false; controller?.abort(); window.clearTimeout(timer); window.clearInterval(interval); window.removeEventListener('mbank:config-updated', changed); window.removeEventListener('storage', storage); window.removeEventListener('focus', changed);};
  }, [admin]);
  if (!error && !maintenance) return null;
  return <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 font-mono text-xs leading-relaxed text-amber-200"><ShieldAlert size={18} className="shrink-0"/><p>{error ? 'Platform configuration is currently unavailable. Operation permissions will be checked when you submit.' : `Platform maintenance is active. New financial operations are paused; account information and protective actions remain available.${admin ? ' Administrator configuration controls remain available.' : ''}`}</p></div>;
}
