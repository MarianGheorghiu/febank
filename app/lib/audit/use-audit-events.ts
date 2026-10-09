"use client";
import { useMemo } from "react";
import { useCardIssuingState, getCardStorageWarning } from "@/app/lib/admin/mock-card-issuing-store";
import { useMarketsState, marketStorageWarning } from "@/app/lib/markets/store";
import { useRiskState, riskStorageWarning } from "@/app/lib/risk/store";
import { initialLogs } from "@/app/lib/mock/admin/users";
import { MOCK_AUDIT_EVENTS } from "@/app/lib/mock/admin/audit";
import { AUDIT_SOURCES, type AuditSourceHealth } from "@/app/lib/types/admin/audit";
import { useAuditJournal, auditJournalWarning } from "./store";
import { mergeAudit } from "./engine";
import { cardAuditEvents, marketAuditEvents, marketOrderEvents, riskAuditEvents, userAuditEvent } from "./adapters";
export function useAuditEvents() {
  const cards=useCardIssuingState(); const markets=useMarketsState(); const risk=useRiskState(); const journal=useAuditJournal();
  const cardWarning=getCardStorageWarning(); const marketsWarning=marketStorageWarning(); const riskWarning=riskStorageWarning(); const journalWarning=auditJournalWarning();
  const events=useMemo(() => mergeAudit(MOCK_AUDIT_EVENTS,initialLogs.map(e => userAuditEvent(e)),journalWarning?[]:journal.events,cardWarning?[]:cardAuditEvents(cards.audit),marketsWarning?[]:[...marketAuditEvents(markets.audit),...marketOrderEvents(markets.orders)],riskWarning?[]:riskAuditEvents(risk.audit)),[cards,markets,risk,journal,cardWarning,marketsWarning,riskWarning,journalWarning]);
  const health: AuditSourceHealth[]=AUDIT_SOURCES.map(source => {
    const error=source==="CARDS"?cardWarning:source==="MARKETS"?marketsWarning:source==="RISK"?riskWarning:["USERS","TRANSACTIONS","RATES","AUDIT"].includes(source)?journalWarning:null;
    const connected=["CARDS","MARKETS","RISK","USERS","TRANSACTIONS","RATES","AUDIT"].includes(source);
    return {source,status:error?"ERROR":connected?"CONNECTED":"DEMO_ONLY",localCount:events.filter(e => e.source===source && e.origin==="LOCAL").length,message:error??(connected ? source==="MARKETS"?"Admin history + latest order snapshots; not a complete order lifecycle.":"Local demo operations; no server ingestion.":"Fixtures only; no live authentication or system telemetry feed.")};
  });
  return {events,journal,health,warnings:[cardWarning,marketsWarning,riskWarning,journalWarning].filter((v): v is string => !!v)};
}
