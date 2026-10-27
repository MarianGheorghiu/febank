import { MOCK_CARD_ISSUING_STATE } from "@/app/lib/mock/admin/card-issuing";
import type { AuditEvent } from "@/app/lib/types/admin/audit";
import type { CardAuditEntry } from "@/app/lib/types/admin/card-issuing";
import type { MarketAudit, MarketOrder } from "@/app/lib/types/admin/markets";
import type { RiskAudit } from "@/app/lib/types/admin/risk";
import type { AuditLog } from "@/app/lib/types/admin/users";
const seededCardIds = new Set(MOCK_CARD_ISSUING_STATE.audit.map(e => e.id));
const metadata = {outcome:"SUCCESS" as const,actorRole:"ADMIN" as const,correlationId:null,requestId:null,sessionId:null,ip:null,durationMs:null,origin:"LOCAL" as const};
export function cardAuditEvents(entries: CardAuditEntry[]): AuditEvent[] {
  return entries.map(e => ({...metadata,id:`cards:${e.id}`,timestamp:e.timestamp,source:"CARDS",domain:"FIAT",category:e.action==="EXPORT" ? "DATA_ACCESS" : "SECURITY",action:e.action,severity:["BLOCK","TERMINATE"].includes(e.action)?"CRITICAL":"WARNING",actor:e.actor,actorRole:e.id.startsWith("CCU-")?"CLIENT":e.actor==="demo-setup"?"SYSTEM":"ADMIN",target:e.cardId??e.userId??"card-registry",reason:e.reason,before:e.before,after:e.action==="EXPORT"?{card_ids:e.exportedCardIds??[],records:e.exportedCardIds?.length??null}:e.after,origin:seededCardIds.has(e.id) ? "DEMO" : "LOCAL"}));
}
export function marketAuditEvents(entries: MarketAudit[]): AuditEvent[] {
  return entries.map(e => ({...metadata,id:`markets:${e.id}`,timestamp:e.timestamp,source:"MARKETS",domain:e.domain,category:"CONFIGURATION",action:e.action,severity:["ROUTING","UPDATE"].includes(e.action)?"WARNING":"INFO",actor:e.actor,target:e.target,reason:e.reason,before:e.before,after:e.after}));
}
export function marketOrderEvents(orders: MarketOrder[]): AuditEvent[] {
  return orders.map(o => ({...metadata,id:`orders:${o.id}:${o.status}`,timestamp:o.updatedAt,source:"MARKETS",domain:o.domain,category:"FINANCIAL",action:`ORDER_${o.status}`,severity:o.status==="REJECTED"?"WARNING":"INFO",outcome:o.status==="REJECTED"?"DENIED":"SUCCESS",actor:o.userEmail,actorRole:"CLIENT",target:o.symbol,reason:o.note||`Recorded demo order is ${o.status.toLowerCase()}.`,correlationId:o.id.replace(/-(BUY|SELL)$/,""),before:null,after:{orderId:o.id,status:o.status,side:o.side,type:o.type,quantity:o.quantity,priceUsd:o.price,totalUsd:o.totalUsd,currency:o.currency},origin:"LOCAL"}));
}
function riskDomain(e: RiskAudit): AuditEvent["domain"] {
  const value = e.after && typeof e.after === "object" && "domain" in e.after ? e.after.domain : e.target;
  return value === "FIAT" || value === "CRYPTO" || value === "STOCK" ? value : "PLATFORM";
}
export function riskAuditEvents(entries: RiskAudit[]): AuditEvent[] {
  return entries.map(e => ({...metadata,id:`risk:${e.id}`,timestamp:e.timestamp,source:"RISK",domain:riskDomain(e),category:"COMPLIANCE",action:e.action,severity:["FREEZE","APPROVE_RELEASE","POLICY"].includes(e.action)?"WARNING":"INFO",actor:e.actor,target:e.target,reason:e.reason,before:e.before,after:e.after}));
}
// Historical fixture timestamps were written without an offset. Interpret explicitly as UTC.
export function userAuditEvent(e: AuditLog, origin: "LOCAL" | "DEMO" = "DEMO"): AuditEvent {
  const raw=e.timestamp;
  const timestamp=new Date(/[Zz]$|[+-]\d\d:\d\d$/.test(raw) ? raw : /^\d{4}-\d{2}-\d{2}/.test(raw) ? `${raw.replace(" ","T")}Z` : `${raw} UTC`).toISOString();
  return {...metadata,id:`users:${e.id}`,timestamp,source:"USERS",domain:"PLATFORM",category:e.action==="BINARY_DUMP"?"DATA_ACCESS":"SECURITY",action:e.action,severity:e.action==="HARD_ACCESS_FREEZE"?"CRITICAL":"WARNING",actor:e.actor,target:e.targetUserId,reason:"Recorded demo user-management operation; the original source has no reason field.",ip:e.ip,before:e.before,after:e.after,origin};
}
