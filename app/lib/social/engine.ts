import { decimal, units } from "../transfers/engine";
import type { SocialCommand, SocialSnapshot } from "./contracts";

export function splitShares(amount: string, count: number): string[] {
  const total = units(amount, 2);
  if (total <= BigInt(0) || total > BigInt("99999999999")) throw new Error("Enter an amount between 0.01 and 999,999,999.99 USD.");
  if (!Number.isInteger(count) || count < 2 || count > 51 || total < BigInt(count)) throw new Error("Each participant must have at least 0.01 USD to pay (maximum 50 friends).");
  const base = total / BigInt(count), remainder = total % BigInt(count);
  return Array.from({ length: count }, (_, i) => decimal(base + (BigInt(i) < remainder ? BigInt(1) : BigInt(0)), 2));
}
export function socialTotals(snapshot: SocialSnapshot, friendId?: string) {
  const requests = snapshot.money_requests.filter(r => r.status === "pending" && (!friendId || r.friend_id === friendId));
  return { receivable: decimal(requests.filter(r => r.direction === "outgoing").reduce((s, r) => s + units(r.amount, 2), BigInt(0)), 2), payable: decimal(requests.filter(r => r.direction === "incoming").reduce((s, r) => s + units(r.amount, 2), BigInt(0)), 2) };
}
export function applySocialCommand(snapshot: SocialSnapshot, command: SocialCommand, id: string, at: string): SocialSnapshot {
  const next = structuredClone(snapshot);
  const friend = "friend_id" in command ? next.friends.find(f => f.id === command.friend_id) : undefined;
  if ("friend_id" in command && !friend) throw new Error("This friend is no longer available. Refresh your contacts.");
  switch (command.type) {
    case "invite": {
      const username = command.username.trim().toLowerCase().replace(/^@?/, "@");
      if (!/^@[a-z0-9_]{3,32}$/.test(username)) throw new Error("Use a username with 3–32 letters, digits or underscores.");
      if (next.friends.some(f => f.username.toLowerCase() === username) || next.connections.some(r => r.username.toLowerCase() === username && r.status === "pending")) throw new Error("This contact is already a friend or has a pending invitation.");
      next.connections.unshift({ id, name: username, username, direction: "outgoing", status: "pending", created_at: at });
      break;
    }
    case "connection": {
      const request = next.connections.find(r => r.id === command.request_id && r.status === "pending");
      if (!request || (request.direction === "outgoing" ? command.action !== "cancel" : command.action === "cancel")) throw new Error("This invitation can no longer be updated.");
      request.status = command.action === "accept" ? "accepted" : command.action === "decline" ? "declined" : "cancelled";
      if (command.action === "accept") {
        if (next.friends.some(f => f.username.toLowerCase() === request.username.toLowerCase())) throw new Error("This contact is already a friend.");
        next.friends.unshift({ id: `friend-${id}`, name: request.name, username: request.username, phone: "", presence: "offline", muted: false, created_at: at });
      }
      break;
    }
    case "mute": friend!.muted = command.muted; break;
    case "remove":
      if (next.money_requests.some(r => r.friend_id === command.friend_id && r.status === "pending")) throw new Error("Resolve pending money requests before removing this friend.");
      next.friends = next.friends.filter(f => f.id !== command.friend_id); break;
    case "request":
    case "split": {
      if (command.note.trim().length > 140) throw new Error("The note must be at most 140 characters.");
      const ids = command.type === "request" ? [command.friend_id] : command.friend_ids;
      if (!ids.length || new Set(ids).size !== ids.length || ids.some(fid => !next.friends.some(f => f.id === fid))) throw new Error("Choose at least one available friend without duplicates.");
      const shares = command.type === "split" ? splitShares(command.amount, ids.length + 1).slice(1) : [decimal(units(command.amount, 2), 2)];
      if (units(command.amount, 2) <= BigInt(0) || units(command.amount, 2) > BigInt("99999999999")) throw new Error("Enter an amount between 0.01 and 999,999,999.99 USD.");
      ids.forEach((fid, i) => next.money_requests.unshift({ id: `${id}-${i}`, friend_id: fid, direction: "outgoing", amount: shares[i], currency: "USD", note: command.note.trim(), ...(command.type === "split" ? { group_id: id } : {}), status: "pending", created_at: at }));
      break;
    }
    case "cancel_request":
    case "decline_request": {
      const request = next.money_requests.find(r => r.id === command.request_id && r.direction === (command.type === "cancel_request" ? "outgoing" : "incoming") && r.status === "pending");
      if (!request) throw new Error("This money request can no longer be cancelled.");
      request.status = command.type === "cancel_request" ? "cancelled" : "declined"; break;
    }
    default: throw new Error("Unsupported social command.");
  }
  next.as_of = at;
  return next;
}
