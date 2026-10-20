import AssetPanel from "./AssetPanel";
import type { TransferAccount } from "@/app/lib/transfers/contracts";
export default function AccountManagement({ accounts }: { accounts: TransferAccount[] }) { return <AssetPanel kind="fiat" accounts={accounts} />; }
