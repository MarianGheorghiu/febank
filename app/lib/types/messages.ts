export type MessageType = "bank" | "friend";
export type MessageFolder = "inbox" | "deleted" | "replied";

export interface Message {
  id: string;
  type: MessageType;
  folder: MessageFolder;
  senderName: string;
  title: string;
  previewText: string;
  timestamp: string;
  isUnread: boolean;
  meta?: {
    amount?: string;
  };
  replyPayload?: {
    body: string;
    timestamp: string;
  };
}
