import { OPERATIONS, TIERS, type RatePolicy } from './contracts';
import { calculateRate } from './engine';
/** Stable synthetic basket: 126 transactions, not booked bank revenue. */
export const IMPACT_BASKET=OPERATIONS.flatMap(operation=>TIERS.flatMap(tier=>[10000,100000,1000000].flatMap(amount_minor=>[false,true].map(weekend=>({operation,tier,amount_minor,weekend})))));
export function policyImpact(before:RatePolicy[],after:RatePolicy[]){
  return OPERATIONS.map(operation=>{
    let current=0,proposed=0,blocked=0;
    const a=before.find(p=>p.operation===operation)!,b=after.find(p=>p.operation===operation)!;
    for(const row of IMPACT_BASKET.filter(r=>r.operation===operation)){
      if(a.enabled)current+=calculateRate(a,row.amount_minor,row.tier,row.weekend).fee_minor;
      if(b.enabled)proposed+=calculateRate(b,row.amount_minor,row.tier,row.weekend).fee_minor;else blocked++;
    }
    return {operation,current,proposed,delta:proposed-current,blocked};
  });
}
export function policyChanges(before:RatePolicy[],after:RatePolicy[]){return after.flatMap(p=>{const previous=before.find(r=>r.id===p.id);return JSON.stringify(previous)===JSON.stringify(p)?[]:[{before:previous,after:p}];});}
