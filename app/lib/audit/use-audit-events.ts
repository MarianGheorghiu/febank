"use client";
import { useRatesSource } from "../rates/use-rates";
import { useSubscriptions, subscriptionStorageWarning } from "@/app/lib/subscriptions/store";
import { useUserRegistry, usersStorageWarning } from "../user-management/store";
import { useMemo } from "react";
import { useFlagsConfig, configStorageWarning } from "@/app/lib/flags-config/repository";
import { configAuditEvents } from "@/app/lib/flags-config/audit";
import { useCardIssuingState, getCardStorageWarning } from "@/app/lib/admin/mock-card-issuing-store";
import { marketStorageWarning } from "@/app/lib/markets/store";
import { useMarketsState } from "@/app/lib/markets/use-markets";
import { useRiskState, riskStorageWarning } from "@/app/lib/risk/store";
import { initialLogs } from "@/app/lib/mock/admin/users";
import { MOCK_AUDIT_EVENTS } from "@/app/lib/mock/admin/audit";
import { AUDIT_SOURCES, type AuditSourceHealth } from "@/app/lib/types/admin/audit";
import { useAuditJournal, auditJournalWarning } from "./store";
import { useTransactionAudit } from "../transactions/audit";
import { mergeAudit } from "./engine";
import { cardAuditEvents, marketAuditEvents, marketOrderEvents, riskAuditEvents, userAuditEvent } from "./adapters";
export function useAuditEvents() {
  const rates = useRatesSource();
  const transactions = useTransactionAudit();
  const users = useUserRegistry(); const usersWarning = usersStorageWarning();
  const config=useFlagsConfig(); const configWarning=configStorageWarning();
  const subscriptions=useSubscriptions(); const subscriptionsWarning=subscriptionStorageWarning();
  const cards=useCardIssuingState(); const markets=useMarketsState(); const risk=useRiskState(); const journal=useAuditJournal();
  const cardWarning=getCardStorageWarning(); const marketsWarning=marketStorageWarning(); const riskWarning=riskStorageWarning(); const journalWarning=auditJournalWarning();
  const events=useMemo(() => mergeAudit(rates.warning?[]:rates.snapshot.audit,transactions.events,usersWarning?[]:users.audit,configWarning?[]:configAuditEvents(config),subscriptionsWarning?[]:subscriptions.audit,MOCK_AUDIT_EVENTS,initialLogs.map(e => userAuditEvent(e)),journalWarning?[]:journal.events,cardWarning?[]:cardAuditEvents(cards.audit),marketsWarning?[]:[...marketAuditEvents(markets.audit),...marketOrderEvents(markets.orders)],riskWarning?[]:riskAuditEvents(risk.audit)),[rates,transactions,users,usersWarning,config,configWarning,subscriptions,subscriptionsWarning,cards,markets,risk,journal,cardWarning,marketsWarning,riskWarning,journalWarning]);
  const health: AuditSourceHealth[]=AUDIT_SOURCES.map(source => {
    const error=source==="RATES"?rates.warning:source==="TRANSACTIONS"?transactions.warning??journalWarning:source==="USERS"?usersWarning??journalWarning:source==="SYSTEM"?configWarning??journalWarning:source==="SUBSCRIPTIONS"?subscriptionsWarning:source==="CARDS"?cardWarning:source==="MARKETS"?marketsWarning:source==="RISK"?riskWarning:["USERS","TRANSACTIONS","RATES","AUDIT","ANALYTICS"].includes(source)?journalWarning:null;
    const connected=["SYSTEM","CARDS","MARKETS","RISK","USERS","TRANSACTIONS","RATES","AUDIT","SUBSCRIPTIONS","ANALYTICS"].includes(source);
    return {source,status:error?"ERROR":connected?"CONNECTED":"DEMO_ONLY",localCount:events.filter(e => e.source===source && e.origin==="LOCAL").length,message:error??(connected ? source==="SYSTEM"?"Local configuration releases and health acknowledgements; no server telemetry.":source==="MARKETS"?"Admin history + latest order snapshots; not a complete order lifecycle.":"Local demo operations; no server ingestion.":"Fixtures only; no live authentication or system telemetry feed.")};
  });
  return {events,journal,health,warnings:[rates.warning,transactions.warning,usersWarning,configWarning,subscriptionsWarning,cardWarning,marketsWarning,riskWarning,journalWarning].filter((v): v is string => !!v)};
}
