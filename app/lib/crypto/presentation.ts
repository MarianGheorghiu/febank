import type { CurrencyAsset, CurrencySnapshot } from "../currencies/contracts";
export type CryptoAction = "BUY" | "SELL" | "SWAP";
const FIAT: CurrencyAsset["kind"][] = ["fiat"];
const CRYPTO: CurrencyAsset["kind"][] = ["crypto"];
export function cryptoTradeConfig(action: CryptoAction, wallet: CurrencySnapshot, symbol?: string) {
  const coin = symbol ?? wallet.assets.find(asset => asset.kind === "crypto" && asset.symbol === "BTC")?.symbol ?? wallet.assets.find(asset => asset.kind === "crypto")?.symbol ?? "";
  const fiat = wallet.assets.find(asset => asset.kind === "fiat" && asset.symbol === "USD")?.symbol ?? wallet.assets.find(asset => asset.kind === "fiat")?.symbol ?? "";
  const target = wallet.assets.find(asset => asset.kind === "crypto" && asset.symbol !== coin && asset.status === "ACTIVE")?.symbol ?? "";
  return { initialSource: action === "BUY" ? fiat : coin, initialTarget: action === "BUY" ? coin : action === "SELL" ? fiat : target, sourceKinds: action === "BUY" ? FIAT : CRYPTO, targetKinds: action === "SELL" ? FIAT : CRYPTO };
}
