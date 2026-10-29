import type { ConfigEnvironment, ConfigPayload } from '../types/admin/flags-config';
import { CONFIG_ENVIRONMENTS } from '../types/admin/flags-config';
import { validatePayload } from './engine';
export interface ConfigDraft { environment: ConfigEnvironment; revision: number; base: ConfigPayload; payload: ConfigPayload; restored_from: string | null }
const key = (actor: string) => `mbank_config_draft_v1:${encodeURIComponent(actor.toLowerCase())}`;
export function readConfigDraft(actor: string): {draft: ConfigDraft | null; warning: string | null} {
  if (typeof sessionStorage === 'undefined') return {draft: null, warning: null};
  try {const raw = sessionStorage.getItem(key(actor)); if (!raw) return {draft: null, warning: null}; const r = JSON.parse(raw); if (!r || !CONFIG_ENVIRONMENTS.includes(r.environment) || !Number.isSafeInteger(r.revision) || r.revision < 1 || validatePayload(r.base).length || validatePayload(r.payload).length || (r.restored_from !== null && typeof r.restored_from !== 'string')) throw new Error(); return {draft: r, warning: null};}
  catch {return {draft: null, warning: 'Saved draft is unavailable or invalid. It was preserved; clear the saved draft before editing.'};}
}
export function saveConfigDraft(actor: string, draft: ConfigDraft | null) {
  if (draft) sessionStorage.setItem(key(actor), JSON.stringify(draft)); else sessionStorage.removeItem(key(actor));
}
