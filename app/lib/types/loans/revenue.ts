export interface StreamConfig {
  id: string;
  platform: string;
  mrr: number;
  status: "CONNECTED" | "SYNCING" | "OFFLINE";
  verifiedLimit: number;
}
