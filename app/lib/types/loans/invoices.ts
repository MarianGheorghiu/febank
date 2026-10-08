export interface InvoiceB2B {
  id: string;
  invoiceIndex: string;
  debtor: string;
  amount: number;
  advanceAllowed: number; // 90%
  dueDate: string;
  status: "SYNCED" | "FUNDED";
}
