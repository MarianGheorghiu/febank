export type Transfer = {
  id: string;
  recipient: string;
  amount: number;
  asset: string;
  type: "fiat" | "crypto" | "stock";
  status: "accepted" | "pending" | "denied";
  date: string;
};
