const entries = new Map<string, { id: string; started_at: string }>();
export function getDemoSession(email: string) {
  const subject = email.trim().toLowerCase(), existing = entries.get(subject);
  if (existing) return existing;
  let id: string;
  try { const key = `mbank_overview_session:${email}`; id = sessionStorage.getItem(key) ?? `MB-${crypto.randomUUID().replaceAll("-", "").slice(0,12).toUpperCase()}`; sessionStorage.setItem(key, id); }
  catch { id = `MB-${crypto.randomUUID().replaceAll("-", "").slice(0,12).toUpperCase()}`; }
  const entry = { id, started_at: new Date().toISOString() }; entries.set(subject, entry); return entry;
}
export function clearDemoSession(email: string) { entries.delete(email.trim().toLowerCase()); try { sessionStorage.removeItem(`mbank_overview_session:${email}`); } catch { /* Storage may be disabled. */ } }
