import AssetPanel from "./AssetPanel";
import type { TransferAccount } from "@/app/lib/transfers/contracts";
export default function CryptoManagement({ accounts }: { accounts: TransferAccount[] }) {
  return <AssetPanel kind="crypto" className="min-h-[400px]" accounts={accounts.filter(account => account.kind === "crypto" && (Number(account.available) > 0 || Number(account.reserved) > 0))} />;
}
