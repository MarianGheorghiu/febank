'use client';
import { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { createIssuingRepository } from './repository';
import type { IssuingSnapshot } from './contracts';
/** Global audit reads the same transport as Card Issuing, including HTTP mode. */
export function useIssuingSource(){
  const {user}=useUser(),email=user?.email??'',name=user?.name??'',role=user?.role;
  const [source,setSource]=useState<{snapshot:IssuingSnapshot|null;warning:string|null}>({snapshot:null,warning:null});
  useEffect(()=>{if(!email||role!=='admin')return;let disposed=false,generation=0;const repository=createIssuingRepository({email,name,role});
    const refresh=async()=>{const current=++generation;try{const snapshot=await repository.getSnapshot();if(!disposed&&current===generation)setSource({snapshot,warning:null});}catch(cause){if(!disposed&&current===generation)setSource({snapshot:null,warning:cause instanceof Error?cause.message:'Card source unavailable.'});}};
    const changed=()=>void refresh(),storage=(e:StorageEvent)=>{if(e.key==='mbank_admin_card_issuing_v1'||e.key==='mbank_user_registry_v1'||e.key===null)changed();};changed();window.addEventListener('mbank:cards-updated',changed);window.addEventListener('mbank:users-updated',changed);window.addEventListener('storage',storage);return()=>{disposed=true;window.removeEventListener('mbank:cards-updated',changed);window.removeEventListener('mbank:users-updated',changed);window.removeEventListener('storage',storage);};
  },[email,name,role]);return source;
}
