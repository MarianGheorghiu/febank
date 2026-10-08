"use client";
import { useUser } from "@/app/context/UserContext";
import { MOCK_MARKET } from "@/app/lib/mock/crypto";
import { MOCK_MARKET_ASSETS, MOCK_STOCK_HOLDINGS } from "@/app/lib/mock/stocks";
import { MOCK_CRYPTO } from "@/app/lib/mock/currencies";
import { availableCash, walletFor } from "./engine";
import { useMarketsState } from "./store";
import type { MarketAsset, StockHolding } from "@/app/lib/types/stocks";
export function useTradingPortfolio() {
  const state=useMarketsState();const {user}=useUser();const wallet=walletFor(state,user?.email??'');
  const cryptoMarket=state.instruments.filter(item=>item.domain==='CRYPTO').map(item=>{const initial=MOCK_MARKET.find(asset=>asset.symbol===item.symbol);return {id:initial?.id??item.symbol.toLowerCase(),symbol:item.symbol,name:item.name,price:item.priceUsd,change1h:initial?.change1h??0,change24h:initial?.change24h??0,change7d:initial?.change7d??0,volume:initial?.volume??'—',cap:initial?.cap??'—',sparkline:initial?.sparkline??[item.priceUsd,item.priceUsd],status:item.status,quoteStatus:item.quoteStatus};});
  const stockMarket:MarketAsset[]=state.instruments.filter(item=>item.domain==='STOCK').map(item=>{const initial=MOCK_MARKET_ASSETS.find(asset=>asset.symbol===item.symbol);return {id:initial?.id??item.symbol,symbol:item.symbol,name:item.name,price:item.priceUsd,change24h:initial?.change24h??0,change7d:initial?.change7d??0,volume:initial?.volume??'—',marketCap:initial?.marketCap??'—',category:initial?.category??'Unclassified',region:initial?.region??'US',isFractional:item.fractional};});
  const holdings:StockHolding[]=state.instruments.filter(item=>item.domain==='STOCK'&&(wallet.units[item.symbol]??0)>0).map(item=>{const initial=MOCK_STOCK_HOLDINGS.find(asset=>asset.symbol===item.symbol);return {symbol:item.symbol,name:item.name,shares:wallet.units[item.symbol],avgCost:wallet.costBasis[item.symbol]??item.priceUsd,currentPrice:item.priceUsd,sector:initial?.sector??'Unclassified',change24h:initial?.change24h??0};});
  const cryptos=[...MOCK_CRYPTO.map(asset=>({...asset,balance:wallet.units[asset.symbol]??asset.balance})),...state.instruments.filter(item=>item.domain==='CRYPTO'&&!MOCK_CRYPTO.some(asset=>asset.symbol===item.symbol)&&(wallet.units[item.symbol]??0)>0).map(item=>({id:item.symbol,name:item.name,symbol:item.symbol,balance:wallet.units[item.symbol],walletAddress:'Demo custody — no on-chain transfer'}))];
  const cryptoValue=state.instruments.filter(item=>item.domain==='CRYPTO').reduce((sum,item)=>sum+(wallet.units[item.symbol]??0)*item.priceUsd,0);
  return {state,wallet,cryptoMarket,stockMarket,holdings,cryptos,cryptoValue,stockValue:holdings.reduce((sum,item)=>sum+item.shares*item.currentPrice,0),cashUsd:availableCash(state,user?.email??'')};
}
