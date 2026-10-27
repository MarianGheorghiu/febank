import type { RatePolicy, RateRelease, RatesSnapshot } from './contracts';
const rule = (id: string, name: string, operation: RatePolicy['operation'], rate_bps: number, fixed_minor: number, minimum_minor: number, maximum_minor: number | null, spread_bps=0): RatePolicy => ({id,name,operation,enabled:true,rate_bps,fixed_minor,minimum_minor,maximum_minor,spread_bps,weekend_bps:0,tier_discount_bps:{STANDARD:0,PREMIUM:2500,METAL:5000},brackets:[]});
export const RATES_SEED: RatesSnapshot = {
  schema_version:1,revision:0,mode:'demo',
  active:{version:1,published_at:'2026-10-26T09:00:00.000Z',policies:[
    rule('rate-bank','Global bank transfer','FIAT_TRANSFER',10,100,100,5000),
    rule('rate-internal','Member-to-member transfer','INTERNAL_TRANSFER',5,0,10,1000),
    rule('rate-crypto-out','Digital asset withdrawal','CRYPTO_TRANSFER',5,100,100,10000),
    rule('rate-custody','Broker custody transfer','STOCK_TRANSFER',0,250,250,10000),
    {...rule('rate-crypto','Digital asset trading','CRYPTO_TRADE',100,0,0,250000,25),brackets:[{up_to_minor:500000,rate_bps:100},{up_to_minor:2500000,rate_bps:75},{up_to_minor:null,rate_bps:50}]},
    rule('rate-stocks','Equities execution','STOCK_TRADE',15,0,0,10000,5),
    {...rule('rate-fx','Fiat currency conversion','FX_EXCHANGE',0,0,0,50000,35),weekend_bps:100},
  ]}, releases:[],audit:[],processed_requests:[],
};

// A coherent synthetic release lifecycle, kept separate from operator-generated evidence.
const originalPolicies:RatePolicy[]=RATES_SEED.active.policies.map(p=>({...structuredClone(p),rate_bps:p.operation==='FIAT_TRANSFER'?20:p.rate_bps}));
const published:RateRelease={origin:'DEMO',id:'release-demo-october-baseline',version:1,policies:structuredClone(RATES_SEED.active.policies),maker:'pricing@mbank.demo',checker:'compliance@mbank.demo',created_at:'2026-10-25T10:15:00.000Z',decided_at:'2026-10-26T09:00:00.000Z',status:'PUBLISHED',reason:'October pricing review: reduce bank-transfer rate from 0.20% to 0.10% and retain published plan discounts and fee caps.'};
const rejected:RateRelease={origin:'DEMO',id:'release-demo-weekend-proposal',version:2,policies:RATES_SEED.active.policies.map(p=>p.operation==='FX_EXCHANGE'?{...structuredClone(p),weekend_bps:175,maximum_minor:75000}:structuredClone(p)),maker:'treasury@mbank.demo',checker:'risk@mbank.demo',created_at:'2026-10-26T12:20:00.000Z',decided_at:'2026-10-26T14:45:00.000Z',status:'REJECTED',reason:'Proposed weekend FX protection of 1.75% and a $750 fee ceiling for review against provider volatility costs.'};
RATES_SEED.releases=[rejected,published];
const auditBase={source:'RATES' as const,domain:'PLATFORM' as const,category:'CONFIGURATION' as const,severity:'INFO' as const,outcome:'SUCCESS' as const,actorRole:'ADMIN' as const,origin:'DEMO' as const,correlationId:null,requestId:null,sessionId:null,ip:null,durationMs:null};
RATES_SEED.audit=[
  {...auditBase,id:'rates:demo-weekend-rejected',timestamp:rejected.decided_at!,action:'RATES_REJECT',actor:rejected.checker!,target:rejected.id,reason:'Rejected after impact review: the 1.75% weekend charge increases customer cost beyond the approved tolerance. Keep current 1.00% protection and $500 cap.',before:{...rejected,status:'PENDING',checker:null,decided_at:null},after:rejected},
  {...auditBase,id:'rates:demo-weekend-proposed',timestamp:rejected.created_at,action:'RATES_PROPOSE',actor:rejected.maker,target:rejected.id,reason:rejected.reason,before:structuredClone(RATES_SEED.active),after:{...rejected,status:'PENDING',checker:null,decided_at:null}},
  {...auditBase,id:'rates:demo-baseline-published',timestamp:published.decided_at!,action:'RATES_APPROVE',actor:published.checker!,target:published.id,reason:'Independent review complete: seven product scopes covered, fee bounds validated and subscription discounts checked against the synthetic transaction basket.',before:{version:0,policies:originalPolicies,published_at:'2026-10-01T09:00:00.000Z'},after:published},
  {...auditBase,id:'rates:demo-baseline-proposed',timestamp:published.created_at,action:'RATES_PROPOSE',actor:published.maker,target:published.id,reason:published.reason,before:{version:0,policies:originalPolicies,published_at:'2026-10-01T09:00:00.000Z'},after:{...published,status:'PENDING',checker:null,decided_at:null}},
];
