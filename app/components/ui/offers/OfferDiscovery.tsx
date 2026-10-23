"use client";
import { useState } from "react";
import { Bookmark, Check, Gift, Plane, ShoppingBag, Sparkles, Utensils } from "lucide-react";
import type { MerchantOffer, OffersSnapshot } from "@/app/lib/offers/contracts";
import { canUse, offerIsLive, offerMoney } from "@/app/lib/offers/engine";
import { ActionButton } from "../dashboard/ActionButton";
import { Empty, Pager, Segments, StockSearch, match } from "../stocks/StockUI";
import { OfferBadge, OfferPanel, offerOption, shortDate } from "./OffersUI";
import CardSurface from "../CardSurface";
const categories = ["All", "Travel", "Dining", "Shopping", "Wellness"] as const;
const icons = { Travel: Plane, Dining: Utensils, Shopping: ShoppingBag, Wellness: Sparkles };
export default function OfferDiscovery({ snapshot, busy, onView, onSave }: { snapshot: OffersSnapshot; busy: boolean; onView: (offer: MerchantOffer) => void; onSave: (offer: MerchantOffer) => void }) {
  const [category, setCategory] = useState<typeof categories[number]>("All"), [filter, setFilter] = useState<"Discover" | "Saved" | "Activated">("Discover"), [search, setSearch] = useState(""), [page, setPage] = useState(0);
  const offers = snapshot.catalog.offers.filter(offer => offerIsLive(offer, snapshot.as_of) && (category === "All" || offer.category === category) && match(search, offer.merchant, offer.title, offer.category) && (filter === "Discover" || (filter === "Saved" ? snapshot.saved_offer_ids.includes(offer.id) : snapshot.activations.some(item => item.offer_id === offer.id))));
  const safePage = Math.min(page, Math.max(0, Math.ceil(offers.length / 4) - 1));
  return <OfferPanel title="Find your next benefit" icon={Gift} tone="cyan" aside={<span className="text-xs text-slate-400">Activate before you spend</span>}>
    <div className="flex flex-wrap items-center gap-3"><div className="w-full min-w-0 sm:w-auto sm:min-w-56 sm:flex-1"><StockSearch label="Search merchants or benefits" value={search} onChange={value => { setSearch(value); setPage(0); }} /></div><Segments label="Offer collection" values={["Discover", "Saved", "Activated"] as const} value={filter} onChange={value => { setFilter(value); setPage(0); }} /></div>
    <div className="mt-3"><Segments label="Offer category" values={categories} value={category} onChange={value => { setCategory(value); setPage(0); }} /></div>
    <div className="mt-4 grid min-w-0 auto-rows-fr items-stretch gap-3 sm:grid-cols-2">{offers.slice(safePage * 4, safePage * 4 + 4).map(offer => {
      const Icon = icons[offer.category], saved = snapshot.saved_offer_ids.includes(offer.id), activated = snapshot.activations.some(item => item.offer_id === offer.id), eligible = canUse(snapshot, offer.plans);
      return <CardSurface key={offer.id} tone={offer.category === "Travel" ? "blue" : offer.category === "Dining" ? "purple" : "cyan"} className="flex min-w-0 flex-col p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5"><span className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-cyan-200"><Icon size={17} /></span><div className="min-w-0"><h3 className="break-words text-sm font-semibold">{offer.merchant}</h3><p className="mt-1 text-[11px] text-slate-400">{offer.category}</p></div></div><button type="button" aria-label={`${saved ? "Unsave" : "Save"} ${offer.merchant}`} aria-pressed={saved} disabled={busy} onClick={() => onSave(offer)} className={`${offerOption} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-cyan-200`}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button></div>
        <div className="mt-5 flex flex-wrap items-end gap-x-2 gap-y-1"><span className="text-3xl font-semibold tracking-tight text-cyan-200">{offer.rate_bps / 100}%</span><span className="pb-1 text-sm text-slate-300">cashback</span></div><p className="mt-2 text-sm text-slate-200">{offer.title}</p><p className="mt-2 text-xs leading-relaxed text-slate-400">Spend {offerMoney(offer.min_spend)} or more · up to {offerMoney(offer.max_cashback)} back</p><p className="mt-2 text-xs text-slate-400">Valid until {shortDate(offer.expires_at)}</p>
        <div className="mt-4 flex flex-wrap gap-2">{activated ? <OfferBadge active><Check size={12} className="mr-1" />Activated</OfferBadge> : <OfferBadge active={eligible}>{eligible ? "Included in your plan" : `${offer.plans.join(" / ")} benefit`}</OfferBadge>}</div><div className="mt-auto pt-4"><ActionButton variant={activated ? "blue" : "cyan"} fullWidth onClick={() => onView(offer)}>{activated ? "View activated offer" : eligible ? "View offer & activate" : "View benefit"}</ActionButton></div>
      </CardSurface>;
    })}</div>{!offers.length && <Empty>{filter === "Saved" ? "Save an offer to find it here later." : filter === "Activated" ? "Your activated offers will appear here." : "No offers match these filters. Try another category or search."}</Empty>}
    <Pager count={offers.length} page={safePage} onChange={setPage} />
    <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Cashback follows an eligible purchase on your enrolled card and merchant verification. Activating an offer does not spend points or credit money.</p>
  </OfferPanel>;
}
