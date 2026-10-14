export type MessageType = "bank" | "friend";
export type MessageStorageFolder = "inbox" | "archived" | "deleted";
export type MessageFolder = MessageStorageFolder | "replied";
export type MessageCategory = "all" | MessageType;
export interface MessageReply { id: string; body: string; created_at: string }
export interface Message {
  id: string;
  type: MessageType;
  folder: MessageStorageFolder;
  previous_folder: Exclude<MessageStorageFolder, "deleted"> | null;
  sender: { id: string; name: string };
  subject: string;
  body: string;
  created_at: string;
  read_at: string | null;
  can_reply: boolean;
  replies: MessageReply[];
  amount: { value: string; currency: string; direction: "incoming" | "outgoing"; label: string } | null;
  action: { target: "settings" | "transfers" | "friends" | "cards" | "loans" | "offers"; label: string } | null;
}
export interface MessagesSnapshot { schema_version: 1; revision: number; as_of: string; messages: Message[]; drafts: Record<string, string> }
export interface MessageFilters { folder: MessageFolder; category: MessageCategory; query: string; unread_only: boolean }
export type MessageCommand =
  | { kind: "mark_read" | "mark_unread" | "archive" | "unarchive" | "trash" | "restore" | "purge"; ids: string[] }
  | { kind: "reply"; id: string; reply_id: string; body: string }
  | { kind: "save_draft"; id: string; body: string };
