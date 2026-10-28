'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { createRiskRepository } from './repository';
import type { RiskSnapshot } from './contracts';
export function useRiskSource(){
  const {user}=useUser(),email=user?.email??'',role=user?.role;
  const repository=useMemo(()=>role==='admin'?createRiskRepository({email,role}):null,[email,role]);
  const [snapshot,setSnapshot]=useState<RiskSnapshot|null>(null),[warning,setWarning]=useState<string|null>(null),[loading,setLoading]=useState(true);
  const generation=useRef(0);
  const refresh=useCallback(async()=>{if(!repository)return;const current=++generation.current;setLoading(true);try{const next=await repository.getSnapshot();if(current===generation.current){setSnapshot(next);setWarning(null);}}catch(cause){if(current===generation.current)setWarning(cause instanceof Error?cause.message:'Risk source unavailable.');}finally{if(current===generation.current)setLoading(false);}},[repository]);
  const invalidate=useCallback(()=>{generation.current++;},[]);
  useEffect(()=>{if(!repository)return;const changed=()=>void refresh(),storage=(event:StorageEvent)=>{if(event.key===null||['mbank_risk_v1','mbank_markets_v1','mbank_user_registry_v1'].includes(event.key)||event.key.startsWith('mbank_wallet'))changed();};const timer=window.setTimeout(changed,0);const events=['mbank:risk-updated','mbank:markets-updated','mbank:wallet-updated','mbank:users-updated','focus'];events.forEach(event=>window.addEventListener(event,changed));window.addEventListener('storage',storage);return()=>{invalidate();window.clearTimeout(timer);events.forEach(event=>window.removeEventListener(event,changed));window.removeEventListener('storage',storage);};},[repository,refresh,invalidate]);
  return {snapshot,warning,loading,refresh,repository};
}
