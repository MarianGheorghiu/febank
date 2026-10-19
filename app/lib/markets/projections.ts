"use client";
import { useUser } from "@/app/context/UserContext";
import { MOCK_MARKET } from "@/app/lib/mock/crypto";
import { MOCK_MARKET_ASSETS, MOCK_STOCK_HOLDINGS } from "@/app/lib/mock/stocks";
import type { FiatAccount } from "../types/currencies";
import { MOCK_CRYPTO } from "@/app/lib/mock/currencies";
import { availableCash, availableUnits, walletFor } from "./engine";
import { valuation } from "../wallet/engine";
import { decimal } from "../transfers/engine";
import { useMarketsState } from "./use-markets";
import type { MarketAsset, StockHolding } from "@/app/lib/types/stocks";
export function useTradingPortfolio() {
  const state=useMarketsState();const {user}=useUser();const wallet=walletFor(state,user?.email??'');
  const cryptoMarket=state.instruments.filter(item=>item.domain==='CRYPTO').map(item=>{const initial=MOCK_MARKET.find(asset=>asset.symbol===item.symbol);return {id:initial?.id??item.symbol.toLowerCase(),symbol:item.symbol,name:item.name,price:item.priceUsd,change1h:initial?.change1h??0,change24h:initial?.change24h??0,change7d:initial?.change7d??0,volume:initial?.volume??'—',cap:initial?.cap??'—',sparkline:initial?.sparkline??[item.priceUsd,item.priceUsd],status:item.status,quoteStatus:item.quoteStatus};});
  const stockMarket:MarketAsset[]=state.instruments.filter(item=>item.domain==='STOCK').map(item=>{const initial=MOCK_MARKET_ASSETS.find(asset=>asset.symbol===item.symbol);return {id:initial?.id??item.symbol,symbol:item.symbol,name:item.name,price:item.priceUsd,change24h:initial?.change24h??0,change7d:initial?.change7d??0,volume:initial?.volume??'—',marketCap:initial?.marketCap??'—',category:initial?.category??'Unclassified',region:initial?.region??'US',isFractional:item.fractional};});
  const holdings:StockHolding[]=state.instruments.filter(item=>item.domain==='STOCK'&&availableUnits(state,user?.email??'',item.symbol)>0).map(item=>{const initial=MOCK_STOCK_HOLDINGS.find(asset=>asset.symbol===item.symbol);return {symbol:item.symbol,name:item.name,shares:availableUnits(state,user?.email??'',item.symbol),avgCost:wallet.costBasis[item.symbol]??item.priceUsd,currentPrice:item.priceUsd,sector:initial?.sector??'Unclassified',change24h:initial?.change24h??0};});
  const cryptos=[...MOCK_CRYPTO.filter(asset => state.instruments.some(item => item.domain === "CRYPTO" && item.symbol === asset.symbol)).map(asset=>({...asset,balance:availableUnits(state,user?.email??'',asset.symbol)})),...state.instruments.filter(item=>item.domain==='CRYPTO'&&!MOCK_CRYPTO.some(asset=>asset.symbol===item.symbol)&&availableUnits(state,user?.email??'',item.symbol)>0).map(item=>({id:item.symbol,name:item.name,symbol:item.symbol,balance:availableUnits(state,user?.email??'',item.symbol),walletAddress:'Demo custody — no on-chain transfer'}))];
  const cryptoValue=state.instruments.filter(item=>item.domain==='CRYPTO').reduce((sum,item)=>sum+Math.round(availableUnits(state,user?.email??'',item.symbol)*item.priceUsd*100)/100,0);
  const fiatAccounts: FiatAccount[] = Object.entries(wallet.cash).map(([currency]) => ({ id: `account-${currency}`, currency, balance: availableCash(state, user?.email ?? '', currency), symbol: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency, iban: 'Demo custody account', region: currency === 'RON' ? 'RO' : currency === 'EUR' ? 'EU' : 'US' }));
  const cryptoTotal = state.accountBalances ? Number(decimal(valuation({ accounts: state.accountBalances }, "crypto"), 2)) : cryptoValue;
  const stockTotal = state.accountBalances ? Number(decimal(valuation({ accounts: state.accountBalances }, "stock"), 2)) : holdings.reduce((sum,item)=>sum+Math.round(item.shares*item.currentPrice*100)/100,0);
  return {fiatAccounts,state,wallet,cryptoMarket,stockMarket,holdings,cryptos,cryptoValue:cryptoTotal,stockValue:stockTotal,cashUsd:availableCash(state,user?.email??'')};
}
