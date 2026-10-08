"use client";

import CardSelect from "./CardSelect";
import { useState } from "react";
import {
    CheckCircle2,
    Circle,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Download,
    Search,
} from "lucide-react";
import type {
    CardCustomer,
    IssuedCard,
    IssuedCardStatus,
} from "@/app/lib/types/admin/card-issuing";
import {
    buttonClass,
    cardStatusStyles,
    formatCardMoney,
    inputClass,
    panelClass,
} from "./presentation";

interface Props {
    cards: IssuedCard[];
    customers: CardCustomer[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onManage: (id: string) => void;
    onExport: (cards: IssuedCard[]) => void;
}
export default function CardRegistry({
    cards,
    customers,
    selectedId,
    onSelect,
    onManage,
    onExport,
}: Props) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<IssuedCardStatus | "ALL">("ALL");
    const [type, setType] = useState("ALL");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(0);
    const customerById = new Map(
        customers.map((customer) => [customer.id, customer]),
    );
    const filtered = cards
        .filter((card) => {
            const owner = customerById.get(card.userId);
            return (
                (status === "ALL" || card.status === status) &&
                (type === "ALL" || card.type === type) &&
                [
                    card.id,
                    card.last4,
                    card.network,
                    card.currency,
                    owner?.name,
                    owner?.email,
                    card.userId,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(query.trim().toLowerCase())
            );
        })
        .sort((a, b) =>
            sort === "customer"
                ? (customerById.get(a.userId)?.name ?? "").localeCompare(
                      customerById.get(b.userId)?.name ?? "",
                  )
                : b.createdAt.localeCompare(a.createdAt) ||
                  a.id.localeCompare(b.id),
        );
    const pageCount = Math.max(1, Math.ceil(filtered.length / 8));
    const currentPage = Math.min(page, pageCount - 1);
    const visible = filtered.slice(currentPage * 8, currentPage * 8 + 8);

    return (
        <section className={panelClass} aria-labelledby="registry-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 bg-[#020816]/90 p-4">
                <div>
                    <h2
                        id="registry-title"
                        className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cyan-300"
                    >
                        <CreditCard size={17} /> Customer card registry
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                        All customers • Card lifecycle & payment authorization
                    </p>
                </div>
                <button
                    className={buttonClass}
                    disabled={!filtered.length}
                    onClick={() => onExport(filtered)}
                >
                    <Download size={13} /> Export filtered ({filtered.length})
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3 border-b border-cyan-500/20 p-4 sm:grid-cols-3 xl:grid-cols-4">
                <label className="col-span-2 block min-w-0 sm:col-span-3 xl:col-span-1">
                    <span className="mb-1.5 block text-[10px] text-slate-400">
                        Search customer or card
                    </span>
                    <span className="relative block min-w-0">
                        <Search
                            size={13}
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400"
                        />
                        <input
                            className={`${inputClass} min-h-11 pt-3 pl-9`}
                            placeholder="Name, email, ID, last 4…"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPage(0);
                            }}
                        />
                    </span>
                </label>
                <label className="block min-w-0">
                    <span className="mb-1.5 block text-[10px] text-slate-400">
                        Card status
                    </span>
                    <CardSelect
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value as typeof status);
                            setPage(0);
                        }}
                    >
                        {[
                            "ALL",
                            "ACTIVE",
                            "PENDING",
                            "FROZEN",
                            "BLOCKED",
                            "TERMINATED",
                        ].map((value) => (
                            <option key={value} value={value}>
                                {value === "ALL" ? "All statuses" : value}
                            </option>
                        ))}
                    </CardSelect>
                </label>
                <label className="block min-w-0">
                    <span className="mb-1.5 block text-[10px] text-slate-400">
                        Card type
                    </span>
                    <CardSelect
                        value={type}
                        onChange={(event) => {
                            setType(event.target.value);
                            setPage(0);
                        }}
                    >
                        <option value="ALL">All card types</option>
                        <option value="PHYSICAL">Physical</option>
                        <option value="VIRTUAL">Virtual</option>
                    </CardSelect>
                </label>
                <label className="col-span-2 block min-w-0 sm:col-span-1">
                    <span className="mb-1.5 block text-[10px] text-slate-400">
                        Sort registry
                    </span>
                    <CardSelect
                        value={sort}
                        onChange={(event) => {
                            setSort(event.target.value);
                            setPage(0);
                        }}
                    >
                        <option value="newest">Newest first</option>
                        <option value="customer">Customer name</option>
                    </CardSelect>
                </label>
            </div>
            <div className="divide-y divide-cyan-500/10 md:hidden">
                {visible.map((card) => {
                    const customer = customerById.get(card.userId);
                    const selected = selectedId === card.id;
                    return (
                        <article
                            key={card.id}
                            onClick={() => onSelect(card.id)}
                            className={`cursor-pointer p-3 transition-colors ${selected ? "bg-cyan-500/10" : "hover:bg-cyan-500/5"}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <button
                                    type="button"
                                    aria-label={`Select card ending ${card.last4} for ${customer?.name ?? card.userId}`}
                                    aria-pressed={selected}
                                    className="flex min-h-11 min-w-0 items-start gap-2 text-left focus-visible:outline-2 focus-visible:outline-cyan-300"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSelect(card.id);
                                    }}
                                >
                                    {selected ? (
                                        <CheckCircle2
                                            size={16}
                                            className="mt-0.5 shrink-0 text-cyan-300"
                                        />
                                    ) : (
                                        <Circle
                                            size={16}
                                            className="mt-0.5 shrink-0 text-slate-500"
                                        />
                                    )}
                                    <span className="min-w-0">
                                        <span className="block text-xs font-bold text-white">
                                            {customer?.name ?? card.userId}
                                        </span>
                                        <span className="mt-1 block text-[10px] text-slate-400">
                                            {card.userId} · •••• {card.last4}
                                        </span>
                                    </span>
                                </button>
                                <button
                                    className={`${buttonClass} min-h-11 shrink-0 px-4`}
                                    aria-label={`Manage card ending ${card.last4} for ${customer?.name ?? card.userId}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onManage(card.id);
                                    }}
                                >
                                    Manage
                                </button>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                                <span
                                    className={`rounded border px-2 py-1 text-[9px] font-bold ${cardStatusStyles[card.status]}`}
                                >
                                    {card.status}
                                </span>
                                <span className="text-slate-400">
                                    {card.type} · {card.network} ·{" "}
                                    {card.currency}
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[10px] text-slate-400">
                                <span>
                                    Monthly limit{" "}
                                    <span className="text-slate-200">
                                        {formatCardMoney(
                                            card.limits.monthly,
                                            card.currency,
                                        )}
                                    </span>
                                </span>
                                <span>
                                    {card.type === "VIRTUAL"
                                        ? "Digital issuance"
                                        : card.delivery.replaceAll("_", " ")}
                                </span>
                            </div>
                            {customer &&
                                (customer.accountStatus !== "ACTIVE" ||
                                    customer.kycStatus !== "VERIFIED") && (
                                    <p className="mt-2 text-[10px] text-rose-300">
                                        {customer.accountStatus === "BLOCKED"
                                            ? "Account blocked"
                                            : "KYC in review"}
                                    </p>
                                )}
                        </article>
                    );
                })}
            </div>
            <div className="hidden overflow-x-auto scrollbar-thin md:block">
                <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="bg-cyan-950/30 text-[10px] uppercase tracking-wider text-cyan-400">
                        <tr>
                            {[
                                "Customer / account",
                                "Card / network",
                                "Status",
                                "Monthly limit",
                                "Fulfilment",
                                "Management",
                            ].map((label) => (
                                <th
                                    key={label}
                                    scope="col"
                                    className="px-4 py-3 font-bold"
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-500/10">
                        {visible.map((card) => {
                            const customer = customerById.get(card.userId);
                            return (
                                <tr
                                    key={card.id}
                                    tabIndex={0}
                                    aria-selected={selectedId === card.id}
                                    aria-label={`Select card ending ${card.last4} for ${customer?.name ?? card.userId}`}
                                    onClick={() => onSelect(card.id)}
                                    onKeyDown={(event) => {
                                        if (
                                            event.target ===
                                                event.currentTarget &&
                                            (event.key === "Enter" ||
                                                event.key === " ")
                                        ) {
                                            event.preventDefault();
                                            onSelect(card.id);
                                        }
                                    }}
                                    className={`cursor-pointer transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-300 ${selectedId === card.id ? "bg-cyan-500/10" : "hover:bg-cyan-500/5"}`}
                                >
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2 font-bold text-white">
                                            {selectedId === card.id ? (
                                                <CheckCircle2
                                                    size={14}
                                                    className="shrink-0 text-cyan-300"
                                                />
                                            ) : (
                                                <Circle
                                                    size={14}
                                                    className="shrink-0 text-slate-500"
                                                />
                                            )}
                                            {customer?.name ?? card.userId}
                                        </div>
                                        <div className="mt-1 text-[10px] text-slate-400">
                                            {card.userId}
                                        </div>
                                        {customer &&
                                            (customer.accountStatus !==
                                                "ACTIVE" ||
                                                customer.kycStatus !==
                                                    "VERIFIED") && (
                                                <div className="mt-1 text-[10px] text-rose-300">
                                                    {customer.accountStatus ===
                                                    "BLOCKED"
                                                        ? "Account blocked"
                                                        : "KYC in review"}
                                                </div>
                                            )}
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="font-bold text-white">
                                            •••• {card.last4}{" "}
                                            <span className="font-normal text-slate-400">
                                                {card.network}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-[10px] text-slate-400">
                                            {card.type} · {card.currency}
                                        </div>
                                        <div className="mt-1 max-w-52 break-all text-[10px] text-slate-500">
                                            {card.id}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span
                                            className={`rounded border px-2 py-1 text-[9px] font-bold ${cardStatusStyles[card.status]}`}
                                        >
                                            {card.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="font-bold text-white">
                                            {formatCardMoney(
                                                card.limits.monthly,
                                                card.currency,
                                            )}
                                        </div>
                                        <div className="mt-1 text-[10px] text-slate-400">
                                            {formatCardMoney(
                                                card.spentThisMonth,
                                                card.currency,
                                            )}{" "}
                                            spent
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-[10px] text-slate-400">
                                        {card.type === "VIRTUAL"
                                            ? "Digital issuance"
                                            : card.delivery.replaceAll(
                                                  "_",
                                                  " ",
                                              )}
                                    </td>
                                    <td className="px-3 py-3">
                                        <button
                                            className={buttonClass}
                                            aria-label={`Manage card ending ${card.last4} for ${customer?.name ?? card.userId}`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onManage(card.id);
                                            }}
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {!filtered.length && (
                <div className="space-y-3 p-10 text-center text-xs text-slate-400">
                    <p>No customer cards match these filters.</p>
                    <button
                        className={buttonClass}
                        onClick={() => {
                            setQuery("");
                            setStatus("ALL");
                            setType("ALL");
                            setPage(0);
                        }}
                    >
                        Clear filters
                    </button>
                </div>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-cyan-500/20 p-3 text-[10px] text-slate-400">
                <span>
                    {filtered.length ? currentPage * 8 + 1 : 0}–
                    {Math.min((currentPage + 1) * 8, filtered.length)} of{" "}
                    {filtered.length} cards
                </span>
                <div className="flex items-center gap-2">
                    <button
                        className={buttonClass}
                        aria-label="Previous page"
                        disabled={!currentPage}
                        onClick={() => setPage(currentPage - 1)}
                    >
                        <ChevronLeft size={13} />
                    </button>
                    <span>
                        Page {currentPage + 1} / {pageCount}
                    </span>
                    <button
                        className={buttonClass}
                        aria-label="Next page"
                        disabled={currentPage + 1 >= pageCount}
                        onClick={() => setPage(currentPage + 1)}
                    >
                        <ChevronRight size={13} />
                    </button>
                </div>
            </div>
        </section>
    );
}
