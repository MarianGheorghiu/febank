import type { ReferralFilters, ReferralLeaderboardRow, ReferralRecord, ReferralReport } from "@/app/lib/types/admin/referrals";

export function filterReferrals(report: ReferralReport, filters: ReferralFilters): ReferralRecord[] {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const tokens = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  const referrers = new Map(report.referrers.map(r => [r.id, r]));
  const end = Date.parse(report.as_of);
  const start = filters.range === "ALL" ? -Infinity : end - (filters.range === "30D" ? 30 : 90) * 86400000;
  return report.referrals.filter(r => { const referrer = referrers.get(r.referrer_id); return referrer && tokens.every(token => normalize(`${referrer.name} ${referrer.email} ${referrer.user_id} ${referrer.referral_code} ${r.id} ${r.invitee_name} ${r.invitee_email} ${r.invitee_id ?? ''}`).includes(token)) && (filters.status === "ALL" || r.status === filters.status) && Date.parse(r.invited_at) >= start && Date.parse(r.invited_at) <= end; });
}
export function referralLeaderboard(report: ReferralReport, records: ReferralRecord[]): ReferralLeaderboardRow[] {
  return report.referrers.map(referrer => {
    const rows = records.filter(r => r.referrer_id === referrer.id);
    const registered = rows.filter(r => r.registered_at !== null).length;
    const qualified = rows.filter(r => r.status === "QUALIFIED").length;
    const reward = (status: ReferralRecord["reward_status"]) => rows.filter(r => r.reward_status === status).reduce((sum, r) => sum + r.reward_minor, 0);
    return { referrer, invited: rows.length, registered, qualified, rejected: rows.filter(r => r.status === "REJECTED").length, conversion: rows.length ? qualified / rows.length * 100 : 0, paid_minor: reward("PAID"), pending_minor: reward("PENDING"), held_minor: reward("HELD"), queued_minor: reward("QUEUED"), latest_invited_at: rows.reduce<string | null>((latest, r) => !latest || r.invited_at > latest ? r.invited_at : latest, null) };
  }).filter(row => row.invited > 0).sort((a, b) => b.registered - a.registered || b.qualified - a.qualified || b.invited - a.invited || a.referrer.id.localeCompare(b.referrer.id));
}
export function referralCohorts(report: ReferralReport, records: ReferralRecord[], range: ReferralFilters["range"]) {
  const end = Date.parse(report.as_of);
  const earliest = report.referrals.reduce((min, r) => Math.min(min, Date.parse(r.invited_at)), end);
  const start = range === "ALL" ? earliest : end - (range === "30D" ? 30 : 90) * 86400000;
  const days = (end - start) / 86400000;
  const step = days <= 31 ? 86400000 : 7 * 86400000;
  const count = Math.floor((end - start) / step) + 1;
  return Array.from({ length: count }, (_, i) => {
    const from = start + i * step;
    const to = Math.min(from + step, end + 1);
    const cohort = records.filter(r => Date.parse(r.invited_at) >= from && Date.parse(r.invited_at) < to);
    return { start: new Date(from).toISOString(), end: new Date(to - 1).toISOString(), invited: cohort.length, registered: cohort.filter(r => r.registered_at !== null).length, qualified: cohort.filter(r => r.status === "QUALIFIED").length };
  });
}
export const referralMoney = (minor: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(minor / 100);

export function searchReferralRecords(records: ReferralRecord[], report: ReferralReport, query: string) {
  const names = new Map(report.referrers.map(r => [r.id, r.name]));
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  return records.filter(r => tokens.every(token => normalize(`${r.id} ${r.invitee_name} ${r.invitee_email} ${r.invitee_id ?? ''} ${names.get(r.referrer_id) ?? ''} ${r.rejection_reason ?? ''}`).includes(token))).sort((a, b) => b.invited_at.localeCompare(a.invited_at));
}
