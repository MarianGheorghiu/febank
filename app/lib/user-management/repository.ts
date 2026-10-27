import type { UserDetail, UserOperator, UserRegistrySnapshot, UsersRepository } from "./contracts";
import { assertUserOperator, validateRegistry } from "./engine";
import { commitUserCommand, ensureManagedUser, readManagedUsers } from "./store";
import { readWallet, walletCustomers } from "../wallet/store";
import { decimal, units, usdValue } from "../transfers/engine";
import { outstanding } from "../loans/engine";
export function parseUsersSnapshot(value: unknown): UserRegistrySnapshot {
  validateRegistry(value);
  const s=value as UserRegistrySnapshot;
  if(!["demo","http"].includes(s.mode)||!Number.isFinite(Date.parse(s.as_of)))throw new Error("Invalid user-service snapshot.");
  return s;
}
export function parseUserDetail(value: unknown, id: string): UserDetail {
  const d=value as UserDetail, money=(v:unknown)=>typeof v==="string"&&/^\d+\.\d{2}$/.test(v), str=(v:unknown)=>typeof v==="string";
  if(!d||d.user_id!==id||!Number.isFinite(Date.parse(d.as_of))||!d.financials||typeof d.financials.observed!=="boolean"||![d.financials.available_usd,d.financials.reserved_usd,d.financials.personal_credit_usd].every(money)||!Number.isSafeInteger(d.financials.pending_orders)||d.financials.pending_orders<0||!Array.isArray(d.financials.accounts)||!d.financials.accounts.every(a=>a&&[a.asset,a.kind,a.available,a.reserved].every(str)&&money(a.usd_value))||!Array.isArray(d.financials.transfers)||!d.financials.transfers.every(t=>t&&[t.id,t.asset,t.amount,t.status,t.direction].every(str)&&Number.isFinite(Date.parse(t.at)))||!Array.isArray(d.cards)||!d.cards.every(c=>c&&[c.id,c.last4,c.type,c.status,c.currency].every(str))||!Array.isArray(d.subscriptions)||!d.subscriptions.every(s=>s&&[s.id,s.plan,s.status].every(str))||!Array.isArray(d.risk_cases)||!d.risk_cases.every(r=>r&&[r.id,r.domain,r.status,r.severity].every(str))||typeof d.risk_restriction!=="boolean")throw new Error("Invalid user-detail response.");
  return d;
}
export function createUsersRepository(actor: UserOperator): UsersRepository {
  const mode=process.env.NEXT_PUBLIC_USER_MANAGEMENT_MODE??"demo";
  if(mode==="http"){
    const base=(process.env.NEXT_PUBLIC_USER_MANAGEMENT_API_URL??"").replace(/\/$/,"");
    const request=async(path:string,body?:unknown,key?:string,signal?:AbortSignal)=>{
      if(actor.role!=="admin")throw new Error("Administrator access required.");
      if(key!==undefined&&!/^[a-zA-Z0-9_-]{8,120}$/.test(key))throw new Error("Invalid request key.");
      const response=await fetch(`${base}/v1/admin/users${path}`,{method:body?"POST":"GET",credentials:"include",cache:"no-store",signal,headers:{Accept:"application/json",...(body?{"Content-Type":"application/json","Idempotency-Key":key!}:{})},...(body?{body:JSON.stringify(body)}:{})});
      if(!response.ok)throw new Error(`User service failed (${response.status}). Refresh and review before retrying.`);
      return response.json();
    };
    const snapshot=(value:unknown)=>{const s=parseUsersSnapshot(value);if(s.mode!=="http")throw new Error("Expected a live user-service response.");return s;};
    return {getSnapshot:async signal=>snapshot(await request("",undefined,undefined,signal)),getDetail:async(id,signal)=>parseUserDetail(await request(`/${encodeURIComponent(id)}`,undefined,undefined,signal),id),execute:async(command,key)=>snapshot(await request("/commands",command,key))};
  }
  if(mode!=="demo")throw new Error("Unsupported User Management mode.");
  const getSnapshot=async()=>{
    assertUserOperator(readManagedUsers(),actor);
    const cards=await import("../admin/mock-card-issuing-store");
    const profiles=cards.cardCustomers(cards.readCardIssuingState());
    for(const p of profiles)ensureManagedUser(p.email,p.name,p.id);
    const {SUBSCRIPTION_CUSTOMERS}=await import("../mock/admin/subscriptions");
    for(const p of SUBSCRIPTION_CUSTOMERS)ensureManagedUser(p.email,p.name,p.id);
    for(const email of walletCustomers())ensureManagedUser(email,email.split("@")[0]);
    return {...readManagedUsers(),mode:"demo" as const,as_of:new Date().toISOString()};
  };
  return {getSnapshot,execute:async(command,key)=>({...commitUserCommand(command,actor,key),mode:"demo",as_of:new Date().toISOString()}),getDetail:async id=>{
    const state=readManagedUsers();assertUserOperator(state,actor);
    const u=state.users.find(u=>u.id===id);if(!u)throw new Error("User not found.");
    const observed=walletCustomers().includes(u.login_email), wallet=observed?readWallet(u.login_email).state:null;
    const {cardCustomers,readCardIssuingState}=await import("../admin/mock-card-issuing-store");
    const cards=readCardIssuingState(), customerIds=cardCustomers(cards).filter(c=>c.email===u.login_email).map(c=>c.id);
    const {readRiskForExecution}=await import("../risk/store"),risk=readRiskForExecution();
    const {mockSubscriptionsRepository}=await import("../subscriptions/store");
    const subscriptions=(await mockSubscriptionsRepository.list()).subscriptions;
    const accounts=wallet?.transfers.accounts??[];
    const total=(field:"available"|"reserved")=>decimal(accounts.reduce((n,a)=>n+usdValue(units(a[field],a.decimals),a.decimals,a.usd_price,"nearest"),BigInt(0)),2);
    return {user_id:id,as_of:new Date().toISOString(),financials:{observed,available_usd:total("available"),reserved_usd:total("reserved"),accounts:accounts.map(a=>({asset:a.asset,kind:a.kind,available:a.available,reserved:a.reserved,usd_value:decimal(usdValue(units(a.available,a.decimals)+units(a.reserved,a.decimals),a.decimals,a.usd_price,"nearest"),2)})),transfers:(wallet?.transfers.transfers??[]).slice(0,10).map(t=>({id:t.id,asset:t.asset,amount:t.amount,status:t.status,direction:t.direction,at:t.created_at})),pending_orders:wallet?.trading.orders.filter(o=>o.status==="PENDING").length??0,personal_credit_usd:wallet?outstanding(wallet.credit,"personal"):"0.00"},cards:cards.cards.filter(c=>customerIds.includes(c.userId)&&!c.customerDeletedAt).map(c=>({id:c.id,last4:c.last4,type:c.type,status:c.status,currency:c.currency})),subscriptions:subscriptions.filter(s=>s.customer_id===u.id||customerIds.includes(s.customer_id)).map(s=>({id:s.id,plan:s.plan_id,status:s.status})),risk_cases:risk.cases.filter(c=>c.email.toLowerCase()===u.login_email).map(c=>({id:c.id,domain:c.domain,status:c.status,severity:c.severity})),risk_restriction:risk.restrictions.some(r=>r.email===u.login_email)};
  }};
}
