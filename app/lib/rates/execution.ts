/** Only called at new-quote / execution boundaries. Never read current pricing during journal replay. */
import { readRates } from './repository';
import { calculateRate } from './engine';
import type { RatePolicy, RateTier } from './contracts';
import type { MarketsState } from '../types/admin/markets';
import type { TransferSnapshot } from '../transfers/contracts';
import { customerMembership } from '../subscriptions/registry';
export interface ExecutionRate { policy: RatePolicy; tier: RateTier; weekend: boolean; version: number }
export function customerRateTier(email:string):RateTier {
  return customerMembership(email).tier;
}
export function executionRates(customer:string,at=new Date().toISOString()){
  if((process.env.NEXT_PUBLIC_RATES_MODE??'demo')!=='demo')throw new Error('Live pricing must be quoted by the backend. Local financial execution is unavailable in HTTP rates mode.');
  const state=readRates(),tier=customerRateTier(customer),day=new Date(at).getUTCDay();
  return {version:state.active.version,policies:state.active.policies,tier,weekend:day===0||day===6};
}
export function priceMarkets(catalog:MarketsState,customer:string):MarketsState {
  const rates=executionRates(customer),next=structuredClone(catalog);
  // Include the pricing version so a published release invalidates prior reviews.
  const pricingVersion=rates.version*1000000+(['STANDARD','PREMIUM','METAL'].indexOf(rates.tier))*100000+(rates.weekend?10000:0);
  next.revision+=pricingVersion;
  const context=(operation:RatePolicy['operation']):ExecutionRate=>({policy:rates.policies.find(p=>p.operation===operation)!,tier:rates.tier,weekend:rates.weekend,version:rates.version});
  next.fx_pricing=context('FX_EXCHANGE');
  next.instruments=next.instruments.map(i=>{const pricing=context(i.domain==='CRYPTO'?'CRYPTO_TRADE':'STOCK_TRADE');return {...i,version:i.version+pricingVersion,pricing,spreadBps:0,feeBps:pricing.policy.rate_bps};});
  return next;
}
export function executionFee(pricing:ExecutionRate,usd:number){return calculateRate(pricing.policy,Math.round(usd*100),pricing.tier,pricing.weekend).fee_minor/100;}
export function priceTransfers(snapshot:TransferSnapshot,customer:string):TransferSnapshot {
  const rates=executionRates(customer),next=structuredClone(snapshot);
  next.routes=next.routes.map(route=>{
    const account=next.accounts.find(a=>a.asset===route.asset)!;
    const operation=route.destination_kind==='phone'?'INTERNAL_TRANSFER':account.kind==='fiat'?'FIAT_TRANSFER':account.kind==='crypto'?'CRYPTO_TRANSFER':'STOCK_TRANSFER';
    const policy=rates.policies.find(p=>p.operation===operation)!;
    return {...route,enabled:route.enabled&&policy.enabled,pricing:{policy,tier:rates.tier,weekend:rates.weekend,version:rates.version}};
  });return next;
}
