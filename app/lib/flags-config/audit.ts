import type { ConfigState } from "@/app/lib/types/admin/flags-config";
import type { AuditEvent } from "@/app/lib/types/admin/audit";
import { configChanges } from "./engine";

export function configAuditEvents(state:ConfigState):AuditEvent[] {
  return Object.entries(state.environments).flatMap(([environment,config])=>config.releases.map(release=>({
    id:`config:${release.id}`,timestamp:release.timestamp,source:"SYSTEM" as const,domain:"PLATFORM" as const,
    category:"CONFIGURATION" as const,action:release.restored_from?"CONFIG_RESTORED":"CONFIG_PUBLISHED",
    severity:configChanges(release.before,release.after).some(c=>c.critical)?"CRITICAL" as const:"WARNING" as const,
    outcome:"SUCCESS" as const,actor:release.actor,actorRole:"ADMIN" as const,target:`flags-config:${environment}`,
    reason:release.reason,correlationId:release.id,requestId:release.request_id??null,sessionId:null,ip:null,durationMs:null,
    before:release.before,after:release.after,origin:release.id.startsWith("config-demo-")?"DEMO" as const:"LOCAL" as const,
  })));
}
