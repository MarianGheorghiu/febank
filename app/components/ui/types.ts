export interface Message {
  id: string;
  type: "bank" | "friend";
  senderName: string;
  avatarUrl?: string;
  title: string;
  previewText: string;
  timestamp: string;
  isUnread: boolean;
  meta?: {
    amount?: string; // Specific pentru tranzacții bancare sau cereri de bani P2P
    cryptoTag?: string;
  };
}
