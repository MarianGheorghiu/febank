"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import SplitParticipants from "./SplitParticipants";
import SocialDialog, { socialField as field, socialLabel as label } from "./SocialDialog";
import { ActionButton } from "../dashboard/ActionButton";
import { notifyOperation } from "../OperationNotification";
import { createTransferRepository } from "@/app/lib/transfers/repository";
import { amountLabel } from "@/app/lib/transfers/engine";
import { SocialPagination } from "./SocialListControls";
import { pageOf } from "@/app/lib/social/directory";
import { splitShares } from "@/app/lib/social/engine";
import type { SocialCommand, SocialFriend } from "@/app/lib/social/contracts";
import type { TransferQuote, TransferSnapshot } from "@/app/lib/transfers/contracts";

export type SocialAction = { type: "invite" | "split" } | { type: "transfer" | "gift" | "request" | "remove" | "mute"; friend: SocialFriend };
export default function SocialActionModal({ action, friends, clientId, execute, onClose }: { action: SocialAction; friends: SocialFriend[]; clientId: string; execute: (command: SocialCommand, key: string) => Promise<void>; onClose: () => void }) {
  const friend = "friend" in action ? action.friend : undefined;
  const payment = action.type === "transfer" || action.type === "gift";
  const repository = useMemo(() => createTransferRepository(clientId), [clientId]);
  const [wallet, setWallet] = useState<TransferSnapshot | null>(null);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState(friend?.phone ?? "");
  const [previewPage, setPreviewPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<TransferQuote | null>(null);
  const [confirmationAttempted, setConfirmationAttempted] = useState(false);
  const lock = useRef(false);
  const key = useRef("");
  const payload = useRef("");
  useEffect(() => {
    if (!payment) return;
    const controller = new AbortController();
    repository.getSnapshot(controller.signal).then(value => { if (!controller.signal.aborted) { setWallet(value); setLoadError(""); } }).catch(cause => { if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : "Unable to load wallet."); });
    return () => controller.abort();
  }, [repository, payment, attempt]);
  const account = wallet?.accounts.find(a => a.asset === "USD");
  const route = wallet?.routes.find(r => r.asset === "USD" && r.enabled && r.destination_kind === "phone");
  const titles = { invite: "Add a friend", split: "Split a bill", transfer: "Send money", gift: "Send a gift", request: "Request money", remove: "Remove friend", mute: friend?.muted ? "Unmute friend" : "Mute friend" };
  let shares: string[] = [];
  if (action.type === "split" && amount && selected.length) { try { shares = splitShares(amount, selected.length + 1); } catch { /* Explain invalid splits on submit. */ } }
  const preview = pageOf(selected.map((id, i) => ({ id, share: shares[i + 1] })), previewPage, 5);
  const friendNames = useMemo(() => new Map(friends.map(f => [f.id, f.name])), [friends]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      if (payment) {
        if (!account || !route || !friend) throw new Error("A USD account and phone transfer route are required.");
        if (!quote) {
          const value = await repository.quote({ source_account_id: account.id, route_id: route.id, amount, recipient_name: friend.name, destination: phone, reference: `${action.type === "gift" ? "Gift" : "Friends transfer"}${note ? `: ${note}` : ""}` });
          key.current = crypto.randomUUID(); setConfirmationAttempted(false); setQuote(value); return;
        }
        setConfirmationAttempted(true);
        await repository.submit(quote.id, key.current);
      } else {
        let command: SocialCommand;
        switch (action.type) {
          case "invite": command = { type: "invite", username }; break;
          case "split": command = { type: "split", friend_ids: selected, amount, note }; break;
          case "request": command = { type: "request", friend_id: action.friend.id, amount, note }; break;
          case "remove": command = { type: "remove", friend_id: action.friend.id }; break;
          case "mute": command = { type: "mute", friend_id: action.friend.id, muted: !action.friend.muted }; break;
          default: throw new Error("Unsupported action.");
        }
        const nextPayload = JSON.stringify(command);
        if (payload.current !== nextPayload) { payload.current = nextPayload; key.current = crypto.randomUUID(); }
        await execute(command, key.current);
      }
      onClose();
      notifyOperation(payment ? "Transfer submitted" : "Social workspace updated", payment ? "Your wallet and transfer history have been updated. Track settlement in Transfers." : action.type === "split" || action.type === "request" ? "Requests created. No money has been moved." : "Your changes have been saved.", false, "Friends & Social", "purple", 3500);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The action failed. Please retry."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <SocialDialog title={titles[action.type]} subtitle={friend ? `${friend.name} · ${friend.username}` : "Keep your everyday finances connected"} busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={busy || !!quote} className="min-w-0 space-y-4 disabled:opacity-70">
        <legend className="sr-only">Action details</legend>
        {action.type === "invite" && <><label className={label}>Friend’s username<input required maxLength={33} placeholder="@username" className={field} value={username} onChange={e => setUsername(e.target.value)} /></label><p className="text-xs leading-relaxed text-slate-400">Send an invitation using their exact username. They will appear in your contacts after accepting.</p></>}
        {payment && <><div className="rounded-xl border border-blue-300/10 bg-[#0a1428] p-4 text-sm"><span className="text-slate-400">Available USD balance</span><p className="mt-1 font-mono font-bold">{account ? amountLabel(account.available, "USD") : "Loading wallet…"}</p></div><label className={label}>Recipient phone number<input required type="tel" maxLength={20} className={field} placeholder="+40712345678" value={phone} onChange={e => setPhone(e.target.value)} /></label><p className="text-xs text-slate-400">Confirm the international phone number. The transfer service verifies the recipient before settlement.</p></>}
        {action.type === "split" && <SplitParticipants friends={friends} selected={selected} onChange={setSelected} />}
        {(payment || action.type === "request" || action.type === "split") && <><label className={label}>{action.type === "split" ? "Total bill" : "Amount"} · USD<input required inputMode="decimal" maxLength={12} placeholder="0.00" className={field} value={amount} onChange={e => setAmount(e.target.value)} /></label><label className={label}>{action.type === "gift" ? "Gift message" : "Note"} <span className="sr-only">optional</span><input maxLength={110} placeholder={action.type === "gift" ? "A little something for you" : "What is this for?"} className={field} value={note} onChange={e => setNote(e.target.value)} /></label></>}
        {action.type === "remove" && <p className="rounded-xl border border-rose-300/15 bg-rose-400/5 p-4 text-sm leading-relaxed text-slate-300">Remove {friend?.name} from your contacts? Pending money requests must be resolved first. Your financial history is retained.</p>}
        {action.type === "mute" && <p className="rounded-xl border border-blue-300/10 bg-blue-400/5 p-4 text-sm leading-relaxed text-slate-300">{friend?.muted ? "Enable" : "Pause"} social notifications for this contact. Money requests and transfers remain available.</p>}
      </fieldset>
      {shares.length > 0 && <div className="space-y-2 rounded-xl border border-purple-300/15 bg-purple-400/5 p-4 text-xs"><h3 className="font-semibold text-purple-200">Split preview</h3><div className="flex justify-between gap-3"><span>Your share</span><span>{amountLabel(shares[0], "USD")}</span></div>{preview.rows.map(({ id, share }) => <div key={id} className="flex justify-between gap-3"><span className="min-w-0 truncate text-slate-400">{friendNames.get(id)}</span><span className="shrink-0">{amountLabel(share, "USD")}</span></div>)}{selected.length > 5 && <SocialPagination label="Split preview" total={selected.length} page={preview.page} pageSize={5} onPageChange={setPreviewPage} />}<p className="pt-2 text-slate-400">Remainder cents are distributed in order. Only your friends’ shares become requests.</p></div>}
      {quote && <div role="region" aria-label="Review transfer" className="space-y-3 rounded-xl border border-cyan-300/20 bg-cyan-400/5 p-4 text-sm"><h3 className="font-semibold text-cyan-200">Review before sending</h3><p className="break-words">{quote.draft.recipient_name}<br /><span className="font-mono text-slate-400">{quote.draft.destination}</span></p><dl className="space-y-2">{[["Amount", amountLabel(quote.draft.amount, quote.asset)], ["Fee", amountLabel(quote.fee, quote.fee_asset ?? quote.asset)], ["Total reserved", amountLabel(quote.total, quote.asset)]].map(([name, value]) => <div key={name} className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">{name}</dt><dd className="font-mono">{value}</dd></div>)}</dl><p className="text-xs text-slate-400">{quote.eta} · Expires {new Date(quote.expires_at).toLocaleTimeString("en-GB")}</p></div>}
      {loadError && <div role="alert" className="space-y-2 text-sm text-rose-300"><p>{loadError}</p><button type="button" className="underline" onClick={() => setAttempt(n => n + 1)}>Retry loading wallet</button></div>}
      {error && <p role="alert" className="text-sm text-rose-300">{error}{confirmationAttempted ? " Retry confirmation with the same request. Check Transfers before starting a new review to avoid a duplicate payment." : ""}</p>}
      <div data-social-dialog-footer className="space-y-3"><div className="flex gap-2">{quote && <ActionButton variant="blue" disabled={busy} onClick={() => { setQuote(null); setError(""); }}>{confirmationAttempted ? "New review" : "Edit details"}</ActionButton>}<ActionButton type="submit" fullWidth variant={action.type === "remove" ? "rose" : "purple"} disabled={busy || (payment && (!wallet || !account || !route)) || (action.type === "split" && selected.length === 0)} icon={busy ? <Loader2 size={16} className="animate-spin" /> : undefined}>{busy ? "Please wait…" : payment ? quote ? "Confirm transfer" : "Review transfer" : action.type === "split" ? "Create split requests" : titles[action.type]}</ActionButton></div>
      <p className="text-center text-[10px] leading-relaxed text-slate-500">{payment ? wallet?.mode === "demo" ? "Demo wallet · no real funds moved" : "Funds are reserved on confirmation; settlement is tracked in Transfers." : "Money requests record shared expenses; they do not move funds."}</p></div>
    </form>
  </SocialDialog>;
}
