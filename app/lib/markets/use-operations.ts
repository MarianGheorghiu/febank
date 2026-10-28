'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MOCK_MARKETS_STATE } from './seed';
import { createMarketOperationsRepository } from './repository';
import type { MarketActor, MarketAdminCommand } from '../types/admin/markets';
import type { MarketOperationsSnapshot } from './contracts';
import { WALLET_EVENT } from '../wallet/store';
export function useMarketOperationsSource(actor: MarketActor) {
  const demo = (process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? 'demo') === 'demo';

  const repository = useMemo(()=>createMarketOperationsRepository({email:actor.email,role:actor.role}),[actor.email,actor.role]);
  const [snapshot,setSnapshot] = useState<MarketOperationsSnapshot|null>(null);
  const [busy,setBusy] = useState(true), [error,setError] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async()=>{
    const current = ++generation.current;
    setBusy(true);
    try { const next = await repository.getSnapshot(); if(current===generation.current){setSnapshot(next);setError('');} }
    catch(cause){if(current===generation.current)setError(cause instanceof Error?cause.message:'Market service unavailable.');}
    finally{if(current===generation.current)setBusy(false);}
  },[repository]);
  useEffect(()=>{
    let timer:number;
    const run=()=>{window.clearTimeout(timer);timer=window.setTimeout(()=>void refresh(),0);};run();
    window.addEventListener('focus',run);window.addEventListener('storage',run);window.addEventListener(WALLET_EVENT,run);
    return()=>{window.clearTimeout(timer);
      // This ref tracks requests rather than a mounted DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;window.removeEventListener('focus',run);window.removeEventListener('storage',run);window.removeEventListener(WALLET_EVENT,run);};
  },[refresh]);
  const execute=async(command:MarketAdminCommand,key:string)=>{
    if(busy||error)throw new Error('Refresh market data before applying an operation.');
    generation.current++;
    setBusy(true);
    try { const next=await repository.execute(command,key);generation.current++;setSnapshot(next);setError('');return next.state; }
    finally { generation.current++;setBusy(false); }
  };
  return {state:snapshot?.state??MOCK_MARKETS_STATE,ready:!!snapshot,busy,error,refresh,execute,mode:demo?'demo':'http'};
}
