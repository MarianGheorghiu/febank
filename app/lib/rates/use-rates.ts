'use client';
import { useEffect, useState } from 'react';
import { RATES_EVENT, RATES_KEY, createRatesRepository } from './repository';
import { RATES_SEED } from './seed';
/** Audit source reader; failures are explicit and exclude the pricing source. */
export function useRatesSource(){
  const [source,setSource]=useState({snapshot:RATES_SEED,warning:null as string|null});
  useEffect(()=>{
    let generation=0,disposed=false;
    const repository=createRatesRepository({email:'',role:'admin'});
    const refresh=async()=>{const current=++generation;try{const snapshot=await repository.getSnapshot();if(!disposed&&current===generation)setSource({snapshot,warning:null});}catch(cause){if(!disposed&&current===generation)setSource({snapshot:RATES_SEED,warning:cause instanceof Error?cause.message:'Rates unavailable.'});}};
    const changed=()=>{void refresh();},storage=(e:StorageEvent)=>{if(e.key===RATES_KEY||e.key===null)changed();};
    changed();window.addEventListener(RATES_EVENT,changed);window.addEventListener('storage',storage);
    return()=>{disposed=true;window.removeEventListener(RATES_EVENT,changed);window.removeEventListener('storage',storage);};
  },[]);
  return source;
}
