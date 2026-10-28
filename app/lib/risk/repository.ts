import type { RiskActor, RiskRepository, RiskCustomer } from './contracts';
import { decodeRiskSnapshot, parseRiskSnapshot, riskWire } from './response';
export function createRiskRepository(actor: RiskActor): RiskRepository {
  if(actor.role!=='admin')throw new Error('Administrator access required.');
  const mode=process.env.NEXT_PUBLIC_RISK_MODE??process.env.NEXT_PUBLIC_TRANSFERS_MODE??'demo';
  if(mode==='demo')return {
    async getSnapshot(){
      const store=await import('./store'),{enrichRiskDemo}=await import('./demo');
      const before=store.readRiskForExecution(),state=enrichRiskDemo(before);if(state!==before)store.saveRiskDemo(state);
      const {readBaseMarketCatalog,projectAllCustomers}=await import('../markets/store');
      const {readManagedUsers}=await import('../user-management/store');
      const {MOCK_FIAT_EXPOSURES}=await import('../mock/admin/risk');
      const markets=projectAllCustomers(readBaseMarketCatalog());
      const users=readManagedUsers().users.filter(u=>u.role==='CLIENT');
      const customers=new Map<string,RiskCustomer>(users.map(u=>[u.login_email,{email:u.login_email,name:u.legal_name,status:u.status,kyc:u.kyc_status}]));
      state.cases.forEach(c=>{const existing=customers.get(c.email);if(!existing)customers.set(c.email,{email:c.email,name:c.subject,status:'EXTERNAL',kyc:'UNKNOWN'});else if(existing.name===existing.email&&c.subject!==c.email)customers.set(c.email,{...existing,name:c.subject});});
      return parseRiskSnapshot({schema_version:1,mode:'demo',as_of:new Date().toISOString(),state:{...state,cases:state.cases.map(c=>({...c,subject:customers.get(c.email)?.name??c.subject}))},customers:[...customers.values()],exposures:[...MOCK_FIAT_EXPOSURES.map(e=>({...e,domain:'FIAT',low:false,source:'TREASURY_FIXTURE'})),...markets.instruments.map(e=>({symbol:e.symbol,name:e.name,domain:e.domain,valueUsd:Math.round(e.reserveUnits*e.priceUsd*100)/100,reserveUsd:Math.round(e.reserveUsd*100)/100,low:Math.min(e.reserveUnits*e.priceUsd,e.reserveUsd)<e.lowLiquidityUsd,source:'SHARED_INVENTORY'}))]});
    },
    async execute(command,key){const store=await import('./store');store.executeRiskCommand(command,actor,{key});return this.getSnapshot();},
  };
  if(mode!=='http')throw new Error('Unknown risk service mode.');
  const base=(process.env.NEXT_PUBLIC_RISK_API_URL??process.env.NEXT_PUBLIC_TRANSFERS_API_URL??'').replace(/\/$/,'');
  async function request(path:string,init:RequestInit){
    const response=await fetch(`${base}/v1/admin/risk${path}`,{...init,credentials:'include',cache:'no-store',headers:{Accept:'application/json',...init.headers}});
    if(!response.ok){const body=await response.json().catch(()=>null);throw new Error(body?.error?.message??`Risk service unavailable (${response.status}).`);}
    const result=decodeRiskSnapshot(await response.json());if(result.mode!=='live')throw new Error('Risk service must return live data.');return result;
  }
  return {getSnapshot:signal=>request('',{signal}),execute:(command,key)=>{if(!key.trim())throw new Error('Idempotency key required.');return request('/commands',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({schema_version:1,command:riskWire(command)})});}};
}
