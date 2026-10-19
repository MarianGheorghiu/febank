"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, Split, Users, UserPlus } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import CardSurface from "@/app/components/ui/CardSurface";
import MetricCard from "@/app/components/ui/MetricCard";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import SocialActionModal, { type SocialAction } from "@/app/components/ui/friends/SocialActionModal";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
import { createSocialRepository, SOCIAL_EVENT } from "@/app/lib/social/repository";
import { indexSocialDirectory } from "@/app/lib/social/directory";
import SocialDirectory from "@/app/components/ui/friends/SocialDirectory";
import { amountLabel } from "@/app/lib/transfers/engine";
import type { SocialCommand, SocialSnapshot } from "@/app/lib/social/contracts";

const smallButton = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-blue-400/5 p-2 text-slate-400 transition-colors hover:border-blue-300/30 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40";
function FriendsWorkspace({ clientId }: { clientId: string }) {
  const repository = useMemo(() => createSocialRepository(clientId), [clientId]);
  const [snapshot, setSnapshot] = useState<SocialSnapshot | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState(false);
  const [action, setAction] = useState<SocialAction | null>(null);
  const revision = useRef(0);
  const mutation = useRef(false);
  const actionKeys = useRef(new Map<string, string>());
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (mutation.current) return;
    const request = ++revision.current;
    setRefreshing(true);
    try {
      const next = await repository.getSnapshot(signal);
      if (!signal?.aborted && request === revision.current) { setSnapshot(next); setError(""); }
    } catch (cause) { if (!signal?.aborted && request === revision.current) setError(cause instanceof Error ? cause.message : "Unable to load your friends."); }
    finally { if (!signal?.aborted && request === revision.current) setRefreshing(false); }
  }, [repository]);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => { void refresh(controller.signal); };
    load();
    window.addEventListener("focus", load);
    window.addEventListener(SOCIAL_EVENT, load);
    return () => { controller.abort(); window.removeEventListener("focus", load); window.removeEventListener(SOCIAL_EVENT, load); };
  }, [refresh]);
  async function execute(command: SocialCommand, key: string) {
    if (mutation.current) throw new Error("Please wait for the current action to finish.");
    mutation.current = true; revision.current++; setPending(true); setRefreshing(false);
    try { setSnapshot(await repository.execute(command, key)); setError(""); }
    finally { mutation.current = false; setPending(false); }
  }
  async function run(command: SocialCommand) {
    const payload = JSON.stringify(command);
    const key = actionKeys.current.get(payload) ?? crypto.randomUUID();
    actionKeys.current.set(payload, key);
    try { await execute(command, key); notifyOperation("Request updated", "Your social workspace is up to date.", false, "Friends & Social", "purple", 2500); }
    catch (cause) { notifyOperation("Unable to update request", cause instanceof Error ? cause.message : "Please try again.", true, "Friends & Social", "purple", 4000); }
  }
  const index = useMemo(() => snapshot ? indexSocialDirectory(snapshot) : null, [snapshot]);
  const online = snapshot?.friends.filter(f => f.presence === "online").length ?? 0;
  const connections = snapshot?.connections.filter(r => r.status === "pending") ?? [];
  return <div data-social-workspace className="w-full min-w-0 space-y-3 text-white">
    <h1 className="sr-only">Friends & Social</h1>
    <PageHeader inlineActions actionsPosition="right" statusText="Friends & Social">
      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
        <button type="button" aria-label="Refresh social workspace" title="Refresh" className={smallButton} disabled={refreshing || pending} onClick={() => void refresh()}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></button>
        <ActionButton autoWidth className="social-header-action" labelClassName="hidden md:inline" variant="purple" aria-label="Split bill" title="Split bill" disabled={pending || !snapshot?.friends.length} icon={<Split size={15} />} onClick={() => setAction({ type: "split" })}>Split bill</ActionButton>
        <ActionButton autoWidth className="social-header-action" labelClassName="hidden md:inline" variant="cyan" aria-label="Add friend" title="Add friend" disabled={pending || !snapshot} icon={<Plus size={15} />} onClick={() => setAction({ type: "invite" })}>Add friend</ActionButton>
      </div>
    </PageHeader>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200"><p>{error}</p><button type="button" className="min-h-10 underline" disabled={refreshing || pending} onClick={() => void refresh()}>Retry</button></div>}
    {!snapshot ? <CardSurface className="p-8"><p role="status" className="text-sm text-slate-400">{error ? "Your social workspace is unavailable." : "Loading your friends and shared expenses…"}</p></CardSurface> : <>
      <div data-social-summary className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-4">
        <MetricCard compact title="Your circle" value={snapshot.friends.length.toLocaleString("en-GB")} icon={Users} tone="blue" iconColor="text-blue-300" subtext={`${online} online · ${snapshot.friends.filter(f => f.muted).length} muted`} />
        <MetricCard compact title="Invitations" value={connections.length.toLocaleString("en-GB")} icon={UserPlus} tone="purple" iconColor="text-purple-300" subtext={`${connections.filter(r => r.direction === "incoming").length} received · ${connections.filter(r => r.direction === "outgoing").length} sent`} />
        <MetricCard compact title="Requested by you" value={amountLabel(index?.receivable ?? "0.00", "USD")} icon={ArrowDownLeft} tone="cyan" iconColor="text-cyan-300" subtext="Pending requests you sent" />
        <MetricCard compact title="Requested from you" value={amountLabel(index?.payable ?? "0.00", "USD")} icon={ArrowUpRight} tone="amber" iconColor="text-amber-300" subtext="Pending requests you received" />
      </div>
      <SocialDirectory snapshot={snapshot} index={index!} pending={pending} onAction={setAction} run={run} />
      <p data-social-footnote className="px-1 text-[10px] leading-relaxed text-slate-500">{snapshot.mode === "demo" ? "Demo workspace · changes are saved for this customer in this browser session." : "Connected to your social account."}</p>
    </>}
    {action && snapshot && <SocialActionModal action={action} friends={snapshot.friends} clientId={clientId} execute={execute} onClose={() => setAction(null)} />}
  </div>;
}
export default function FriendsPage() {
  const { user, loading } = useUser();
  if (loading || !user) return <p role="status" className="p-6 text-slate-400">Loading your social workspace…</p>;
  if (user.role !== "client") return <p className="p-6 text-slate-400">Switch to a customer account to access Friends & Social.</p>;
  return <FriendsWorkspace key={user.email} clientId={user.email} />;
}
