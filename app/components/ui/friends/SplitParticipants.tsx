"use client";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { SocialFriend } from "@/app/lib/social/contracts";
import { matchesSocialSearch, pageOf } from "@/app/lib/social/directory";
import { SocialPagination, SocialSearch } from "./SocialListControls";

export default function SplitParticipants({ friends, selected, onChange }: { friends: SocialFriend[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [onlySelected, setOnlySelected] = useState(false);
  const selectedIds = useMemo(() => new Set(selected), [selected]);
  const byId = useMemo(() => new Map(friends.map(friend => [friend.id, friend])), [friends]);
  const matches = useMemo(() => friends.filter(friend => (!onlySelected || selectedIds.has(friend.id)) && matchesSocialSearch(friend.name, friend.username, query)).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }) || a.id.localeCompare(b.id)), [friends, onlySelected, selectedIds, query]);
  const visible = pageOf(matches, page, 5);
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><p className="text-slate-300">Participants · you are included</p><span className="text-purple-200">{selected.length}/50 friends selected</span></div>
    <SocialSearch label="Search split participants" value={query} placeholder="Find a friend" onChange={value => { setQuery(value); setPage(1); }} />
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><button type="button" aria-pressed={onlySelected} onClick={() => { setOnlySelected(value => !value); setPage(1); }} className="min-h-10 rounded-lg border border-white/10 px-3 text-slate-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-cyan-300">{onlySelected ? "Show all friends" : `Show selected (${selected.length})`}</button>{selected.length > 0 && <button type="button" className="min-h-10 rounded-lg px-2 text-slate-400 hover:text-white" onClick={() => { onChange([]); setOnlySelected(false); setPage(1); }}>Clear selection</button>}</div>
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#060d1b]">
      <div className="divide-y divide-white/5">{visible.rows.map(friend => <label key={friend.id} className={`flex min-h-12 items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 ${!selectedIds.has(friend.id) && selected.length >= 50 ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}><input type="checkbox" className="h-4 w-4 shrink-0 accent-cyan-400" checked={selectedIds.has(friend.id)} disabled={!selectedIds.has(friend.id) && selected.length >= 50} onChange={event => onChange(event.target.checked ? [...selected, friend.id] : selected.filter(id => id !== friend.id))} /><span className="min-w-0"><span className="block break-words">{friend.name}</span><span className="block break-all text-[10px] text-slate-500">{friend.username}</span></span></label>)}{!matches.length && <p className="px-3 py-5 text-center text-xs text-slate-500">{onlySelected ? "No selected friends match this search." : "No friends found. Try another name."}</p>}</div>
      <SocialPagination total={matches.length} page={visible.page} pageSize={5} label="Split participants" onPageChange={setPage} />
    </div>
    {selected.length > 0 && <div className="flex flex-wrap gap-1.5" aria-label="Selected participants">{selected.slice(0, 4).map(id => <button key={id} type="button" aria-label={`Remove ${byId.get(id)?.name ?? "participant"} from split`} onClick={() => onChange(selected.filter(value => value !== id))} className="flex min-h-9 max-w-full items-center gap-2 rounded-lg border border-purple-300/15 bg-purple-400/5 px-2 text-[10px] text-purple-200"><span className="truncate">{byId.get(id)?.name}</span><X size={12} className="shrink-0" /></button>)}{selected.length > 4 && <button type="button" onClick={() => { setOnlySelected(true); setQuery(""); setPage(1); }} className="min-h-9 rounded-lg px-2 text-[10px] text-purple-200">View all {selected.length} selected</button>}</div>}
  </div>;
}
