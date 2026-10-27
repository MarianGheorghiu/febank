import type { CardOperator } from '../types/admin/card-issuing';
import type { IssuingCommand, IssuingRepository, IssuingSnapshot } from './contracts';
import { decodeIssuingSnapshot, parseIssuingSnapshot } from './response';
import { MOCK_ISSUING_POLICY } from '../mock/admin/card-issuing';
export function createIssuingRepository(actor:CardOperator):IssuingRepository {
  const mode=process.env.NEXT_PUBLIC_CARDS_MODE??process.env.NEXT_PUBLIC_TRANSFERS_MODE??'demo';
  if(!['demo','http'].includes(mode))throw new Error('Unknown card issuing mode.');
  const store=mode==='demo'?import('../admin/mock-card-issuing-store'):null;
  async function demoSnapshot():Promise<IssuingSnapshot>{const shared=await store!;const state=shared.readCardIssuingState();return parseIssuingSnapshot({...state,schema_version:1,mode:'demo',as_of:new Date().toISOString(),customers:shared.cardCustomers(state),policy:MOCK_ISSUING_POLICY});}
  async function request(command?:IssuingCommand,key?:string,signal?:AbortSignal){
    const base=(process.env.NEXT_PUBLIC_CARDS_API_URL??process.env.NEXT_PUBLIC_TRANSFERS_API_URL??'').replace(/\/$/,'');
    const body=command?{...command,...('limits' in command&&command.limits?{limits:Object.fromEntries(Object.entries(command.limits).map(([k,v])=>[k,v.toFixed(2)]))}:{})}:undefined;
    const response=await fetch(`${base}/v1/admin/cards${command?'/commands':''}`,{method:command?'POST':'GET',credentials:'include',cache:'no-store',signal,headers:{Accept:'application/json',...(command?{'Content-Type':'application/json','Idempotency-Key':key!}:{})},...(body?{body:JSON.stringify(body)}:{})});
    if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(error?.error?.message??`Card issuing service unavailable (${response.status}).`);}
    const next=decodeIssuingSnapshot(await response.json());
    if(next.mode!=="live")throw new Error("Expected a live card issuing service response.");
    return next;
  }
  function authorize(){if(actor.role!=='admin'||!actor.email.trim())throw new Error('Administrator access required.');}
  return {async getSnapshot(signal){authorize();return mode==='demo'?demoSnapshot():request(undefined,undefined,signal);},async execute(command,key){authorize();if(!/^[\w-]{8,100}$/.test(key)||!Number.isSafeInteger(command.expected_revision)||command.expected_revision<0)throw new Error('Invalid command metadata.');
    const {expected_revision,...operation}=command;
    if('limits' in operation&&operation.limits&&Object.values(operation.limits).some(v=>!Number.isFinite(v)||v<0||Math.abs(v*100-Math.round(v*100))>1e-5))throw new Error('Invalid card limits.');
    if(mode==='demo'){(await store!).executeMockCardCommand(operation,actor,{key,expected_revision});return demoSnapshot();}
    const next=await request(command,key);if(typeof window!=='undefined')window.dispatchEvent(new Event('mbank:cards-updated'));return next;
  }};
}
