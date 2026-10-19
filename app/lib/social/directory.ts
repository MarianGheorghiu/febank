import type { SocialSnapshot } from "./contracts";
import { decimal, units } from "../transfers/engine";

/** Build once per snapshot: O(friends + requests), rather than scanning requests per row. */
export function indexSocialDirectory(snapshot: SocialSnapshot) {
  const friends = new Map(snapshot.friends.map(friend => [friend.id, friend]));
  const balances = new Map<string, { receivable: bigint; payable: bigint; count: number }>();
  let receivable = BigInt(0), payable = BigInt(0);
  const requests = snapshot.money_requests.filter(request => request.status === "pending");
  for (const request of requests) {
    const amount = units(request.amount, 2);
    const balance = balances.get(request.friend_id) ?? { receivable: BigInt(0), payable: BigInt(0), count: 0 };
    if (request.direction === "outgoing") { balance.receivable += amount; receivable += amount; }
    else { balance.payable += amount; payable += amount; }
    balance.count++;
    balances.set(request.friend_id, balance);
  }
  return { friends, balances, requests, receivable: decimal(receivable, 2), payable: decimal(payable, 2) };
}
export function pageOf<T>(rows: readonly T[], requestedPage: number, size: number) {
  const pageSize = [5, 8, 10, 25, 50].includes(size) ? size : 10;
  const page = Math.min(Math.max(1, Math.floor(requestedPage) || 1), Math.max(1, Math.ceil(rows.length / pageSize)));
  return { page, rows: rows.slice((page - 1) * pageSize, page * pageSize) };
}
export function matchesSocialSearch(name: string, username: string, query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  return normalize(`${name} ${username}`).includes(normalize(query.trim()));
}

export type SocialDirectoryIndex = ReturnType<typeof indexSocialDirectory>;
