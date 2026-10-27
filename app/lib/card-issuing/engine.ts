import { cardExpired, customerIsEligible } from '../admin/card-issuing';
import type { CardCustomer, IssuedCard, CardAuditEntry } from '../types/admin/card-issuing';

const normalizeCustomerSearch=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function searchCardCustomers(customers:CardCustomer[],query:string){const words=normalizeCustomerSearch(query).trim().split(/\s+/).filter(Boolean);return customers.filter(customer=>customerIsEligible(customer)&&words.every(word=>normalizeCustomerSearch([customer.name,customer.email,customer.id].join(' ')).includes(word))).sort((a,b)=>a.name.localeCompare(b.name));}

export function filterIssuingCards(cards:IssuedCard[],customers:CardCustomer[],query:string,status='ALL',type='ALL',currency='ALL'){
  const owners=new Map(customers.map(c=>[c.id,c]));const q=query.trim().toLowerCase();
  return cards.filter(c=>(status==='ALL'||c.status===status)&&(type==='ALL'||c.type===type)&&(currency==='ALL'||c.currency===currency)&&(!q||[c.id,c.last4,c.network,c.currency,c.userId,owners.get(c.userId)?.name,owners.get(c.userId)?.email].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
}
export function issuingPage<T>(rows:T[],requested:number,size=8){const pages=Math.max(1,Math.ceil(rows.length/size)),page=Math.max(0,Math.min(Number.isInteger(requested)?requested:0,pages-1));return {rows:rows.slice(page*size,(page+1)*size),page,pages,total:rows.length,from:rows.length?page*size+1:0,to:Math.min((page+1)*size,rows.length)};}
export function issuingPortfolio(cards:IssuedCard[],customers:CardCustomer[],asOf:string){
  const eligible=new Set(customers.filter(customerIsEligible).map(c=>c.id));
  const open=cards.filter(c=>c.status!=='TERMINATED');
  const ready=cards.filter(c=>c.status==='ACTIVE'&&eligible.has(c.userId)&&!cardExpired(c,asOf));
  const statuses=['ACTIVE','PENDING','FROZEN','BLOCKED','TERMINATED'].map(status=>({status,count:cards.filter(c=>c.status===status).length}));
  const pipeline=['ORDERED','DISPATCHED','DELIVERED'].map(delivery=>({delivery,count:cards.filter(c=>c.type==='PHYSICAL'&&c.status==='PENDING'&&c.delivery===delivery).length}));
  const currencies=['EUR','USD','RON'].map(currency=>{const rows=open.filter(c=>c.currency===currency);return {currency,cards:rows.length,usage_minor:rows.reduce((n,c)=>n+Math.round(c.spentThisMonth*100),0),limit_minor:rows.reduce((n,c)=>n+Math.round(c.limits.monthly*100),0)};});
  return {total:cards.length,open:open.length,ready:ready.length,restricted:cards.filter(c=>['FROZEN','BLOCKED'].includes(c.status)).length,expired:open.filter(c=>cardExpired(c,asOf)).length,pending:cards.filter(c=>c.status==='PENDING').length,holders:new Set(cards.map(c=>c.userId)).size,eligible:eligible.size,statuses,pipeline,currencies};
}
export function issuingTrend(cards:IssuedCard[],asOf:string){const now=new Date(asOf),end=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());return Array.from({length:14},(_,i)=>{const at=new Date(end-(13-i)*86400000).toISOString().slice(0,10);return {day:at.slice(5),created:cards.filter(c=>c.createdAt.slice(0,10)===at).length};});}
export function filterIssuingAudit(entries:CardAuditEntry[],query:string,action:string,cardId:string|null){const q=query.trim().toLowerCase();return entries.filter(e=>(action==='ALL'||e.action===action)&&(!cardId||e.cardId===cardId||e.after?.replacedByCardId===cardId||e.after?.replacesCardId===cardId)&&(!q||[e.id,e.actor,e.reason,e.action,e.cardId,e.userId].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.timestamp.localeCompare(a.timestamp)||b.id.localeCompare(a.id));}
export interface AuthorizationInput { amount_minor:number; channel:'ONLINE'|'ATM'|'CONTACTLESS'; international:boolean }
export interface AuthorizationCheck { name:string; status:'PASS'|'FAIL'|'UNKNOWN'; detail:string }
export function evaluateCardAuthorization(card:IssuedCard,customer:CardCustomer,input:AuthorizationInput,at:string,balance_minor:number|null,riskReason:string|null,atmSpentMinor:number|null=null){
  if(!Number.isSafeInteger(input.amount_minor)||input.amount_minor<=0||input.amount_minor>1e11||!['ONLINE','ATM','CONTACTLESS'].includes(input.channel)||typeof input.international!=='boolean')throw new Error('Enter a positive amount of up to one billion, with at most two decimals.');
  const channel=input.channel==='ONLINE'?'online':input.channel==='ATM'?'atm':'contactless';
  const check=(name:string,pass:boolean,detail:string):AuthorizationCheck=>({name,status:pass?'PASS':'FAIL',detail});
  const checks:AuthorizationCheck[]=[check('Card lifecycle',card.status==='ACTIVE',`Card is ${card.status.toLowerCase()}.`),check('Expiry',!cardExpired(card,at),`Expires ${card.expiry}.`),check('Account & verification',customerIsEligible(customer),`Account ${customer.accountStatus} · KYC ${customer.kycStatus}.`),check('Payment channel',card.channels[channel]&&(input.channel!=='ATM'||card.type==='PHYSICAL')&&(input.channel!=='CONTACTLESS'||card.type==='PHYSICAL'),`${input.channel.toLowerCase()} ${card.channels[channel]?'enabled':'disabled'}.`),check('International permission',!input.international||card.channels.international,input.international?'International controls apply.':'Domestic payment.'),check('Daily purchase limit',Math.round(card.spentToday*100)+input.amount_minor<=Math.round(card.limits.daily*100),'Includes recorded daily usage.'),check('Monthly limit',Math.round(card.spentThisMonth*100)+input.amount_minor<=Math.round(card.limits.monthly*100),'Includes recorded monthly usage.')];
  if(input.channel==='ATM')checks.push(atmSpentMinor===null?{name:'Daily ATM allowance',status:input.amount_minor>Math.round(card.limits.atmDaily*100)?'FAIL':'UNKNOWN',detail:'Processor ATM usage is unavailable; an approval cannot be confirmed.'}:check('Daily ATM allowance',atmSpentMinor+input.amount_minor<=Math.round(card.limits.atmDaily*100),'Includes processor-reported ATM usage.'));
  checks.push(balance_minor===null?{name:'Funding account',status:'UNKNOWN',detail:'No observed shared wallet in this session. Open the customer wallet to inspect available funds.'}:check('Funding account',balance_minor>=input.amount_minor,'Uses shared available balance in the card currency; no automatic FX assumed.'));
  checks.push(riskReason===null?{name:'Risk controls',status:'PASS',detail:'No active account restriction or FIAT emergency stop.'}:{name:'Risk controls',status:'FAIL',detail:riskReason});
  const decision=checks.some(c=>c.status==='FAIL')?'DECLINED':checks.some(c=>c.status==='UNKNOWN')?'INCOMPLETE':'ELIGIBLE';
  return {decision,checks};
}
