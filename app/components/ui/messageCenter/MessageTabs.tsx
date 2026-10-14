import type { MessageCategory } from "@/app/lib/types/messages";
import { ActionButton } from "../dashboard/ActionButton";
export default function MessageTabs({ activeTab, onChange, counts, disabled = false }: {
  activeTab: MessageCategory; onChange: (tab: MessageCategory) => void;
  counts: Record<MessageCategory, number>; disabled?: boolean;
}) {
  return <div className="ml-auto flex shrink-0 gap-2" role="group" aria-label="Message category">
    {([{ id: "all", label: "All" }, { id: "bank", label: "Bank" }, { id: "friend", label: "Friends" }] as const).map(tab => <ActionButton key={tab.id} variant={activeTab === tab.id ? "cyan" : "blue"} size="medium" iconGap="tight" autoWidth className="shrink-0 whitespace-nowrap" disabled={disabled} aria-pressed={activeTab === tab.id} onClick={() => onChange(tab.id)}>{tab.label}<span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-md border border-white/10 bg-white/5 px-1 py-0.5 text-[11px] tabular-nums text-slate-200">{counts[tab.id]}</span></ActionButton>)}
  </div>;
}
