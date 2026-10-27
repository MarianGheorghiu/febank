import type { RatesRepository, RatesSnapshot, RatesCommand } from './contracts';
import { applyRatesCommand, validRates } from './engine';
import { RATES_SEED } from './seed';
export const RATES_KEY='mbank_rates_v1', RATES_EVENT='mbank:rates-updated';
export function readRates():RatesSnapshot {
  if(typeof localStorage==='undefined')return structuredClone(RATES_SEED);
  const raw=localStorage.getItem(RATES_KEY);if(!raw)return structuredClone(RATES_SEED);
  const data:unknown=JSON.parse(raw);if(!validRates(data))throw new Error('Fee configuration is invalid. Preserve browser storage and repair it before continuing.');return data;
}
export function createRatesRepository(actor:{email:string;role:string}):RatesRepository {
  const mode=process.env.NEXT_PUBLIC_RATES_MODE??'demo';
  if(mode!=='demo'&&mode!=='http')throw new Error('Unknown rates service mode.');
  async function request(command?:RatesCommand,key?:string,signal?:AbortSignal){
    const response=await fetch(`${(process.env.NEXT_PUBLIC_RATES_API_URL??'').replace(/\/$/,'')}/v1/admin/rates${command?'/commands':''}`,{method:command?'POST':'GET',credentials:'include',cache:'no-store',signal,headers:{Accept:'application/json',...(command?{'Content-Type':'application/json','Idempotency-Key':key!}:{})},...(command?{body:JSON.stringify(command)}:{})});
    if(!response.ok){const body=await response.json().catch(()=>null);throw new Error(body?.error?.message??`Rates service unavailable (${response.status}).`);}
    const result:unknown=await response.json();if(!validRates(result))throw new Error('Invalid rates service response.');return result;
  }
  return {
    async getSnapshot(signal){if(actor.role!=='admin')throw new Error('Administrator access required.');return mode==='http'?request(undefined,undefined,signal):readRates();},
    async execute(command,key){
      if(actor.role!=='admin')throw new Error('Administrator access required.');
      const next=mode==='http'?await request(command,key):applyRatesCommand(readRates(),command,actor,key,new Date().toISOString());
      if(mode==='demo'){if(!validRates(next))throw new Error('Invalid rates result.');localStorage.setItem(RATES_KEY,JSON.stringify(next));}
      if(typeof window!=='undefined'){window.dispatchEvent(new Event(RATES_EVENT));window.dispatchEvent(new Event('mbank:wallet-updated'));window.dispatchEvent(new Event('mbank:transfers-updated'));}
      return next;
    },
  };
}
