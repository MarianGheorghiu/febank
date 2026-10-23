import type { OffersSnapshot } from "./contracts";
const cell = (value: unknown) => { const text = String(value ?? ""); return `"${(/^[\s]*[=+@-]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`; };
export function offersReport(snapshot: OffersSnapshot) {
  const rows: unknown[][] = [["Premium offers & rewards", snapshot.as_of, snapshot.mode], ["Membership", snapshot.membership.plan, snapshot.membership.active ? "Active" : "Paused"], ["Available points", snapshot.available_points], ["Lounge visits remaining", snapshot.lounge_remaining], [], ["Activity ID", "Type", "Description", "Points", "USD credit", "Date"]];
  for (const entry of snapshot.entries) rows.push([entry.id, entry.kind, entry.description, entry.points, entry.cash, entry.at]);
  rows.push([], ["Activated offer", "Merchant", "Card ID", "Activated"]);
  for (const activation of snapshot.activations) rows.push([activation.offer_id, snapshot.catalog.offers.find(offer => offer.id === activation.offer_id)?.merchant, activation.card_id, activation.activated_at]);
  rows.push([], ["Booking ID", "Experience", "Status", "Points paid", "Date"]);
  for (const booking of snapshot.bookings) rows.push([booking.id, snapshot.catalog.experiences.find(experience => experience.id === booking.experience_id)?.title, booking.status, booking.points_paid, booking.created_at]);
  rows.push([], ["Transfer ID", "Partner", "Member last 4", "Status", "Points", "Miles", "Date"]);
  for (const transfer of snapshot.transfers) rows.push([transfer.id, transfer.partner_id, transfer.member_last4, transfer.status, transfer.points, transfer.miles, transfer.created_at]);
  rows.push([], ["Request ID", "Type", "Subject", "Status", "Date"]);
  for (const request of snapshot.requests) rows.push([request.id, request.kind, request.subject, request.status, request.created_at]);
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n");
}
