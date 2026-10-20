import EvolutionChart from "../currencies/EvolutionChart";
import type { CurrencySnapshot } from "@/app/lib/currencies/contracts";
export default function CryptoPLAnalysis({ wallet }: { wallet: CurrencySnapshot }) {
  return <EvolutionChart snapshot={wallet} assetClass="crypto" title="Crypto portfolio" />;
}
