'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { ActionButton } from '../../dashboard/ActionButton';
import { AuditSelect, auditFieldClass, auditInputClass } from '../audit/presentation';
import { validatePayload, productionIssues } from '@/app/lib/flags-config/engine';
import type { ConfigEnvironment, ConfigPayload, ConfigValue, FlagRule } from '@/app/lib/types/admin/flags-config';
import { Badge, ConfigDialog, displayValue, modules, SettingInput } from './presentation';
import type { ConfigEditorTarget } from './ConfigCatalog';
export default function ConfigEditor({target, payload, environment, blocked, onSave, onClose}: {target: ConfigEditorTarget; payload: ConfigPayload; environment: ConfigEnvironment; blocked: boolean; onSave: (payload: ConfigPayload) => void; onClose: () => void}) {
  const [value, setValue] = useState<ConfigValue | FlagRule>(() => structuredClone(target.kind === 'setting' ? payload.settings[target.definition.key] : payload.flags[target.definition.key]));
  const next: ConfigPayload = target.kind === 'setting' ? {...payload, settings: {...payload.settings, [target.definition.key]: value as ConfigValue}} : {...payload, flags: {...payload.flags, [target.definition.key]: value as FlagRule}};
  const issues = [...validatePayload(next), ...productionIssues(next, environment)];
  const rule = target.kind === 'flag' ? value as FlagRule : null, d = target.definition;
  return <ConfigDialog title={`Configure ${d.name}`} subtitle={`${modules[d.module].name} · ${environment} · draft only`} onClose={onClose} footer={<><ActionButton variant="blue" autoWidth onClick={onClose}>Cancel</ActionButton><ActionButton variant="cyan" autoWidth disabled={blocked || !!issues.length} icon={<Check size={14}/>} onClick={() => {onSave(next); onClose();}}>Save to draft</ActionButton></>}>
    <div className="space-y-5"><div className="flex flex-wrap gap-2">{d.critical && <Badge tone="amber">Critical control</Badge>}<Badge>{environment}</Badge></div><p className="text-xs leading-relaxed text-slate-300">{d.description}</p><code className="block break-all text-[11px] text-slate-400">{d.key}</code>
      {target.kind === 'setting' ? <SettingInput definition={target.definition} value={value as ConfigValue} onChange={setValue} disabled={blocked}/> : rule && <>
        <SettingInput definition={{...d, type: 'boolean', default_value: false}} value={rule.enabled} onChange={enabled => setValue({...rule, enabled: enabled === true})} disabled={blocked}/>
        <label className={auditFieldClass}>Rollout percentage<input type="number" min={0} max={100} step={1} disabled={blocked} className={auditInputClass} value={Number.isFinite(rule.rollout_pct) ? rule.rollout_pct : ''} onChange={e => setValue({...rule, rollout_pct: e.target.value === '' ? NaN : Number(e.target.value)})}/><input aria-label="Rollout percentage slider" type="range" min={0} max={100} step={1} disabled={blocked} className="h-6 w-full cursor-pointer accent-cyan-300" value={Number.isFinite(rule.rollout_pct) ? rule.rollout_pct : 0} onChange={e => setValue({...rule, rollout_pct: Number(e.target.value)})}/></label>
        <label className={auditFieldClass}>Eligible audience<AuditSelect aria-label="Eligible audience" value={rule.audience} disabled={blocked} onChange={e => setValue({...rule, audience: e.target.value as FlagRule['audience']})}>{['all', 'premium', 'business', 'internal'].map(a => <option key={a} value={a}>{a}</option>)}</AuditSelect></label>
        {target.definition.depends_on && <p className="text-xs text-amber-200">Requires {target.definition.depends_on}. The parent audience and rollout must also allow access.</p>}
      </>}
      <div className="rounded-xl border border-white/10 p-4 text-xs leading-relaxed text-slate-300"><p>Current draft value: <span className="text-white">{displayValue(target.kind === 'setting' ? payload.settings[d.key] : payload.flags[d.key], target.kind === 'setting' ? target.definition.unit : undefined)}</span></p><p className="mt-2">Applies to eligible customers across {environment}. Saving here updates your draft; a reviewed release is required to change active configuration.</p>{d.key === 'platform.maintenance' && <p className="mt-2 text-amber-200">Maintenance pauses new customer writes globally. Read access, protective actions and admin recovery remain available.</p>}</div>
      {!!issues.length && <div role="alert" className="space-y-2 rounded-xl border border-amber-400/25 p-4 text-xs leading-relaxed text-amber-200">{issues.map(issue => <p key={issue}>{issue}</p>)}</div>}
      {blocked && <p role="alert" className="text-xs text-amber-200">Refresh the configuration before editing this draft.</p>}
    </div>
  </ConfigDialog>;
}
