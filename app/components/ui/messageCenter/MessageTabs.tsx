// app/components/ui/MessageTabs.tsx
type TabType = "all" | "bank" | "friend";

interface MessageTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  counts: { all: number; bank: number; friend: number };
}

export default function MessageTabs({
  activeTab,
  setActiveTab,
  counts,
}: MessageTabsProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "All Streams" },
    { id: "bank", label: "Core Security" },
    { id: "friend", label: "P2P Network" },
  ];

  return (
    <div className="flex ml-[5px] border-b border-white/[0.04] p-1 gap-2 overflow-x-auto no-scrollbar flex-shrink-0 w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex cursor-pointer items-center gap-3 px-5 py-3 rounded-xl font-mono text-xs font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap border
              ${
                isActive
                  ? "bg-blue-950/60 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                  : "text-zinc-400 hover:text-zinc-200 border-transparent bg-transparent hover:bg-white/5"
              }`}
          >
            {tab.label}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-black font-mono transition-colors duration-200
                ${isActive ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-zinc-900 text-zinc-500"}`}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
