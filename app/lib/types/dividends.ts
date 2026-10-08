export interface Dividend {
  id: number;
  symbol: string;
  company: string;
  exDate: string;
  payDate: string;
  amountPerShare: number;
  sharesOwned: number;
  status: "PENDING" | "UPCOMING" | "PAID";
}
