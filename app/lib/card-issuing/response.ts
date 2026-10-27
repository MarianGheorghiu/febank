import { validateCardLimits } from "../admin/card-issuing";
import type { CardAuditEntry, CardCustomer, IssuedCard } from '../types/admin/card-issuing';
import type { IssuingSnapshot } from './contracts';
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const date=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v));
const money=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e9&&Math.abs(v*100-Math.round(v*100))<1e-5;
export function validCardCustomer(v:unknown):v is CardCustomer{return obj(v)&&['id','email','name'].every(k=>typeof v[k]==='string'&&!!v[k])&&['ACTIVE','BLOCKED'].includes(String(v.accountStatus))&&['VERIFIED','IN_REVIEW'].includes(String(v.kycStatus))&&(v.deliveryAddress===null||typeof v.deliveryAddress==='string');}
export function validIssuedCard(v:unknown):v is IssuedCard {
  return obj(v)&&typeof v.id==='string'&&!!v.id&&typeof v.userId==='string'&&/^\d{4}$/.test(String(v.last4))&&/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(v.expiry))&&['PHYSICAL','VIRTUAL'].includes(String(v.type))&&['VISA','MASTERCARD'].includes(String(v.network))&&['EUR','USD','RON'].includes(String(v.currency))&&['ACTIVE','PENDING','FROZEN','BLOCKED','TERMINATED'].includes(String(v.status))&&['ORDERED','DISPATCHED','DELIVERED','NOT_REQUIRED'].includes(String(v.delivery))&&obj(v.limits)&&['daily','monthly','atmDaily'].every(k=>money((v.limits as Record<string,unknown>)[k]))&&obj(v.channels)&&['online','atm','contactless','international'].every(k=>typeof (v.channels as Record<string,unknown>)[k]==='boolean')&&money(v.spentToday)&&money(v.spentThisMonth)&&Number.isSafeInteger(v.version)&&Number(v.version)>0&&date(v.createdAt)&&date(v.updatedAt)&&['deliveryAddress','trackingReference','replacesCardId','replacedByCardId'].every(k=>v[k]===null||typeof v[k]==='string')&&(v.customerDeletedAt===undefined||v.customerDeletedAt===null||date(v.customerDeletedAt));
}
function secretFree(v:unknown):boolean {return Array.isArray(v)?v.every(secretFree):!obj(v)||Object.entries(v).every(([k,value])=>!['pan','cvv','cvc','pin','full_card_number'].includes(k.toLowerCase())&&secretFree(value));}
export function parseIssuingSnapshot(value:unknown):IssuingSnapshot {
  const s=value as IssuingSnapshot;
  if(!s||!secretFree(s)||s.schema_version!==1||!['demo','live'].includes(s.mode)||!date(s.as_of)||!Number.isSafeInteger(s.revision)||s.revision<0||!Array.isArray(s.customers)||!s.customers.every(validCardCustomer)||new Set(s.customers.map(c=>c.id)).size!==s.customers.length||new Set(s.customers.map(c=>c.email.toLowerCase())).size!==s.customers.length||!Array.isArray(s.cards)||!s.cards.every(c=>validIssuedCard(c)&&s.customers.some(u=>u.id===c.userId))||new Set(s.cards.map(c=>c.id)).size!==s.cards.length||!Array.isArray(s.audit)||!s.audit.every(validAudit)||new Set(s.audit.map(a=>a.id)).size!==s.audit.length)throw new Error('Invalid card issuing service response.');
  const p=s.policy;
  if(!p||!Number.isInteger(p.maxOpenCardsPerCustomer)||p.maxOpenCardsPerCustomer<1||!money(p.maxMonthlyLimit)||!p.defaultLimits||!Object.values(p.defaultLimits).every(money)||!Array.isArray(p.currencies)||!p.currencies.length||p.currencies.some(c=>!['EUR','USD','RON'].includes(c))||!Array.isArray(p.networks)||!p.networks.length||p.networks.some(n=>!['VISA','MASTERCARD'].includes(n)))throw new Error('Invalid card issuing policy.');
  validateCardLimits(p.defaultLimits,"PHYSICAL",p);
  return s;
}
function validAudit(a:unknown):a is CardAuditEntry{return obj(a)&&typeof a.id==='string'&&date(a.timestamp)&&typeof a.actor==='string'&&typeof a.reason==='string'&&['ISSUE','EXPORT','ACTIVATE','FREEZE','UNFREEZE','BLOCK','TERMINATE','REPLACE','DISPATCH','DELIVER','UPDATE_CONTROLS'].includes(String(a.action))&&(a.cardId===null||typeof a.cardId==='string')&&(a.userId===null||typeof a.userId==='string')&&(a.before===null||validIssuedCard(a.before))&&(a.after===null||validIssuedCard(a.after));}
/** Transport uses exact decimal strings, while the established card UI keeps cent-precision numbers. */
function fromDecimal(v:unknown):number {if(typeof v!=='string'||!/^\d+\.\d{2}$/.test(v)||!money(Number(v)))throw new Error('Invalid card monetary field.');return Number(v);}
function decodeCard(v:unknown):unknown {if(!obj(v)||!obj(v.limits))throw new Error('Invalid card record.');return {...v,limits:Object.fromEntries(Object.entries(v.limits).map(([k,n])=>[k,fromDecimal(n)])),spentToday:fromDecimal(v.spentToday),spentThisMonth:fromDecimal(v.spentThisMonth)};}
export function decodeIssuingSnapshot(v:unknown):IssuingSnapshot {
  if(!obj(v)||!Array.isArray(v.cards)||!Array.isArray(v.audit)||!obj(v.policy)||!obj(v.policy.defaultLimits)||!secretFree(v))throw new Error('Invalid card issuing response.');
  return parseIssuingSnapshot({...v,cards:v.cards.map(decodeCard),audit:v.audit.map(a=>{if(!obj(a))throw new Error('Invalid card audit.');return {...a,before:a.before===null?null:decodeCard(a.before),after:a.after===null?null:decodeCard(a.after)};}),policy:{...v.policy,maxMonthlyLimit:fromDecimal(v.policy.maxMonthlyLimit),defaultLimits:Object.fromEntries(Object.entries(v.policy.defaultLimits).map(([k,n])=>[k,fromDecimal(n)]))}});
}
