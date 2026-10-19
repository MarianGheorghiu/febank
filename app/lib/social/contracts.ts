/** JSON DTOs for the future Go service. Money is a decimal string, dates are RFC3339. */
export interface SocialFriend {
  id: string;
  name: string;
  username: string;
  phone: string;
  presence: "online" | "offline";
  muted: boolean;
  created_at: string;
}
export interface ConnectionRequest {
  id: string;
  name: string;
  username: string;
  direction: "incoming" | "outgoing";
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
}
export interface MoneyRequest {
  id: string;
  friend_id: string;
  direction: "incoming" | "outgoing";
  amount: string;
  currency: "USD";
  note: string;
  group_id?: string;
  status: "pending" | "cancelled" | "declined" | "paid";
  created_at: string;
}
export interface SocialSnapshot {
  schema_version: 1;
  mode: "demo" | "live";
  as_of: string;
  friends: SocialFriend[];
  connections: ConnectionRequest[];
  money_requests: MoneyRequest[];
}
export type SocialCommand =
  | { type: "invite"; username: string }
  | { type: "connection"; request_id: string; action: "accept" | "decline" | "cancel" }
  | { type: "mute"; friend_id: string; muted: boolean }
  | { type: "remove"; friend_id: string }
  | { type: "request"; friend_id: string; amount: string; note: string }
  | { type: "split"; friend_ids: string[]; amount: string; note: string }
  | { type: "cancel_request" | "decline_request"; request_id: string };
export interface SocialRepository {
  getSnapshot(signal?: AbortSignal): Promise<SocialSnapshot>;
  execute(command: SocialCommand, idempotencyKey: string): Promise<SocialSnapshot>;
}
