import AssetPanel from "./AssetPanel";
import type { TransferAccount } from "@/app/lib/transfers/contracts";
export default function StockManagement({ accounts }: { accounts: TransferAccount[] }) { return <AssetPanel kind="stock" accounts={accounts} />; }
