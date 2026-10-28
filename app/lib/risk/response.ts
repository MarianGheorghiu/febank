import type { RiskSnapshot } from './contracts';
import { validRiskState } from './validation';
const moneyKeys = new Set(['amountUsd','maxTransactionUsd','exposureLimitUsd','valueUsd','reserveUsd']);
const internalKeys = new Set(['processedRequests','demoFixtureVersion']);
/** Money remains exact decimal strings on the Go transport, including nested audit evidence. */
export function riskWire(value: unknown): unknown {
  if(Array.isArray(value))return value.map(riskWire);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!internalKeys.has(key)).map(([key,item])=>[key,moneyKeys.has(key)&&typeof item==='number'?item.toFixed(2):riskWire(item)]));
  return value;
}
function decode(value: unknown): unknown {
  if(Array.isArray(value))return value.map(decode);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>{
    if(internalKeys.has(key))throw new Error('Unexpected local state in risk service response.');
    if(moneyKeys.has(key)){if(typeof item!=='string'||!/^\d+\.\d{2}$/.test(item)||!Number.isFinite(Number(item))||Number(item)>1e12)throw new Error('Risk monetary values must be bounded decimal strings.');return [key,Number(item)];}
    return [key,decode(item)];
  }));return value;
}
export function parseRiskSnapshot(value: unknown): RiskSnapshot {
  if(!value||typeof value!=='object')throw new Error('Invalid risk service response.');
  const s=value as RiskSnapshot;
  if(s.schema_version!==1||!['demo','live'].includes(s.mode)||typeof s.as_of!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(s.as_of)||!Number.isFinite(Date.parse(s.as_of))||!validRiskState(s.state)||!Array.isArray(s.exposures)||!Array.isArray(s.customers))throw new Error('Invalid risk snapshot.');
  if(!s.exposures.every(e=>e&&typeof e.symbol==='string'&&typeof e.name==='string'&&['FIAT','CRYPTO','STOCK'].includes(e.domain)&&['TREASURY_FIXTURE','SHARED_INVENTORY','SERVICE'].includes(e.source)&&[e.valueUsd,e.reserveUsd].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e12)&&typeof e.low==='boolean')||new Set(s.exposures.map(e=>`${e.domain}:${e.symbol}`)).size!==s.exposures.length)throw new Error('Invalid risk exposure data.');
  if(!s.customers.every(c=>c&&typeof c.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)&&typeof c.name==='string'&&typeof c.status==='string'&&typeof c.kyc==='string')||new Set(s.customers.map(c=>c.email.toLowerCase())).size!==s.customers.length)throw new Error('Invalid risk customer data.');
  if(s.mode==='live'&&s.exposures.some(e=>e.source!=='SERVICE'))throw new Error('Live risk exposures must come from the service.');
  return s;
}
export function decodeRiskSnapshot(value:unknown){return parseRiskSnapshot(decode(value));}
