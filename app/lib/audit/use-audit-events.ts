'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { createAuditRepository } from './repository';
import type { AuditSnapshot } from './contracts';
export function useAuditEvents(){
 const {user}=useUser(),email=user?.email??'',role=user?.role;
 const repository=useMemo(()=>role==='admin'?createAuditRepository({email,role}):null,[email,role]);
 const [snapshot,setSnapshot]=useState<AuditSnapshot|null>(null),[error,setError]=useState<string|null>(null),[loading,setLoading]=useState(true);
 const generation=useRef(0),accessKey=useRef<{actor:string;key:string}|null>(null);
 const refresh=useCallback(async()=>{if(!repository)return;const current=++generation.current;setLoading(true);try{const next=await repository.getSnapshot();if(current===generation.current){setSnapshot(next);setError(null);}}catch(cause){if(current===generation.current)setError(cause instanceof Error?cause.message:'Audit evidence unavailable.');}finally{if(current===generation.current)setLoading(false);}},[repository]);
 const invalidate=useCallback(()=>{generation.current++;},[]);
 useEffect(()=>{if(!repository)return;let stopped=false,timer:number|undefined;const schedule=()=>{window.clearTimeout(timer);timer=window.setTimeout(()=>void refresh(),100);};const storage=(e:StorageEvent)=>{if(e.key===null||e.key.startsWith('mbank_'))schedule();};const events=['mbank:audit-updated','mbank:cards-updated','mbank:risk-updated','mbank:wallet-updated','mbank:rates-updated','mbank:users-updated','mbank:config-updated','focus'];events.forEach(e=>window.addEventListener(e,schedule));window.addEventListener('storage',storage);
  if(accessKey.current?.actor!==email)accessKey.current={actor:email,key:crypto.randomUUID()};void repository.recordAccess(accessKey.current.key).then(()=>{if(!stopped)void refresh();},cause=>{if(!stopped){setError(cause instanceof Error?cause.message:'Console access could not be recorded.');setLoading(false);}});
  return()=>{stopped=true;invalidate();window.clearTimeout(timer);events.forEach(e=>window.removeEventListener(e,schedule));window.removeEventListener('storage',storage);};
 },[repository,refresh,invalidate,email]);
 return {snapshot,events:snapshot?.events??[],journal:{revision:snapshot?.revision??0,notes:snapshot?.notes??[]},health:snapshot?.health??[],warnings:snapshot?.warnings??[],error,loading,refresh,repository};
}
