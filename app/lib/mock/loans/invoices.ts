import type { InvoiceB2B } from "@/app/lib/types/loans/invoices";

export const MOCK_E_FAKTURA: InvoiceB2B[] = [
  {
    id: "inv-01",
    invoiceIndex: "RO-2026-991",
    debtor: "DANTE INTERNATIONAL SA",
    amount: 45000,
    advanceAllowed: 40500,
    dueDate: "2026-07-15",
    status: "SYNCED",
  },
  {
    id: "inv-02",
    invoiceIndex: "RO-2026-992",
    debtor: "ENDAVA ROMANIA SRL",
    amount: 120000,
    advanceAllowed: 108000,
    dueDate: "2026-08-01",
    status: "SYNCED",
  },
  {
    id: "inv-03",
    invoiceIndex: "RO-2026-840",
    debtor: "ORANGE ROMANIA SA",
    amount: 32000,
    advanceAllowed: 28800,
    dueDate: "2026-06-25",
    status: "FUNDED",
  },
];
