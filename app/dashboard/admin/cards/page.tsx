"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    CreditCard,
    LockKeyhole,
    Plus,
    ShieldAlert,
    ShieldCheck,
    Users,
    Package,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import PageHeader from "@/app/components/ui/PageHeader";
import MetricCard from "@/app/components/ui/MetricCard";
import CardRegistry from "@/app/components/ui/admin/cards/CardRegistry";
import CardDetails from "@/app/components/ui/admin/cards/CardDetails";
import CardAuditTrail from "@/app/components/ui/admin/cards/CardAuditTrail";
import CardOperationDialog, {
    type CardDialogIntent,
} from "@/app/components/ui/admin/cards/CardOperationDialog";
import { notifyCardOperation } from "@/app/components/ui/admin/cards/CardIssuingNotification";
import {
    buttonClass,
    primaryButtonClass,
    cardActionLabels,
} from "@/app/components/ui/admin/cards/presentation";
import { MOCK_PAGE_DATES } from "@/app/lib/mock/page-dates";
import {
    cardCustomers,
    executeMockCardCommand,
    getCardStorageWarning,
    useCardIssuingState,
} from "@/app/lib/admin/mock-card-issuing-store";
import { cardRegistryCsv } from "@/app/lib/admin/card-issuing-export";
import type {
    CardCommand,
    CardOperator,
    IssuedCard,
} from "@/app/lib/types/admin/card-issuing";

function CardIssuingWorkspace({ operator }: { operator: CardOperator }) {
    const state = useCardIssuingState();
    const customers = cardCustomers(state);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [intent, setIntent] = useState<CardDialogIntent | null>(null);
    const selectedCard =
        state.cards.find((card) => card.id === selectedId) ??
        state.cards[0] ??
        null;
    const selectedCustomer =
        customers.find(
            (customer) => customer.id === selectedCard?.userId,
        ) ?? null;
    const active = state.cards.filter(
        (card) => card.status === "ACTIVE",
    ).length;
    const pending = state.cards.filter(
        (card) => card.status === "PENDING",
    ).length;
    const restricted = state.cards.filter(
        (card) => card.status === "FROZEN" || card.status === "BLOCKED",
    ).length;
    const customerCount = new Set(state.cards.map((card) => card.userId)).size;

    useEffect(() => {
        const warning = getCardStorageWarning();
        if (warning)
            notifyCardOperation(
                "Registry restore needs attention",
                warning,
                true,
            );
    }, []);

    const confirm = async (command: CardCommand) => {
        try {
            const next = executeMockCardCommand(command, operator);
            const target =
                command.action === "ISSUE"
                    ? next.cards[0]
                    : command.action === "EXPORT"
                      ? null
                      : next.cards.find((card) => card.id === command.cardId);
            if (target) setSelectedId(target.replacedByCardId ?? target.id);
            const owner = customers.find(
                (customer) => customer.id === target?.userId,
            );
            const title =
                command.action === "ISSUE"
                    ? "Customer card issued"
                    : command.action === "EXPORT"
                      ? "Registry exported"
                      : `${cardActionLabels[command.action]} — completed`;
            notifyCardOperation(
                title,
                target
                    ? `${owner?.name ?? target.userId} · •••• ${target.last4}. ${command.action === "ISSUE" || command.action === "REPLACE" ? "The new card is pending activation. " : ""}Operation recorded in the audit trail.`
                    : "Filtered customer card registry exported.",
            );
        } catch (cause) {
            notifyCardOperation(
                "Card operation not applied",
                cause instanceof Error
                    ? cause.message
                    : "Review the operation and try again.",
                true,
            );
            throw cause;
        }
    };
    const exportCards = (cards: IssuedCard[]) => {
        let url: string | null = null;
        try {
            const csv = cardRegistryCsv(cards, customers);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            url = URL.createObjectURL(blob);
            executeMockCardCommand(
                {
                    action: "EXPORT",
                    reason: `Exported ${cards.length} filtered customer card records for operational review.`,
                },
                operator,
            );
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `admin-card-registry-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.append(anchor);
            anchor.click();
            anchor.remove();
            notifyCardOperation(
                "Card registry exported",
                `${cards.length} filtered card records exported with masked card numbers. Export recorded in the audit trail.`,
            );
        } catch (cause) {
            notifyCardOperation(
                "Export failed",
                cause instanceof Error
                    ? cause.message
                    : "The registry could not be exported.",
                true,
            );
        } finally {
            if (url) {
                const downloadUrl = url;
                window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            }
        }
    };
    return (
        <div className="w-full space-y-4 bg-[#02050e] font-mono text-white">
            <div className="space-y-2">
            <PageHeader
                compact
                sessionId={operator.email}
                systemDate={MOCK_PAGE_DATES.admin_cards}
                statusText="ADMINISTRATOR · CARD OPERATIONS"
            >
                <button
                    className={primaryButtonClass}
                    onClick={() => setIntent({ action: "ISSUE" })}
                >
                    <Plus size={15} /> Issue customer card
                </button>
            </PageHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-widest text-white sm:text-2xl">
                        Card Issuing
                    </h1>
                    <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
                        Manage cards issued to customers. Review eligibility,
                        control payment access and maintain an accountable
                        issuance lifecycle.
                    </p>
                </div>
                <span className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3 py-2 text-[10px] text-cyan-300">
                    <ShieldCheck size={14} /> Administrator console · Demo
                    environment
                </span>
            </div>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MetricCard
                    compact
                    glowColor="hover:border-cyan-400/60 hover:bg-[#0c1930] hover:shadow-[0_0_22px_rgba(6,182,212,0.16)] motion-safe:hover:-translate-y-0.5"
                    title="Active cards"
                    value={active}
                    icon={CreditCard}
                    iconColor="text-emerald-400"
                    subtext="Payment authorization enabled"
                />
                <MetricCard
                    compact
                    glowColor="hover:border-cyan-400/60 hover:bg-[#0c1930] hover:shadow-[0_0_22px_rgba(6,182,212,0.16)] motion-safe:hover:-translate-y-0.5"
                    title="Pending activation"
                    value={pending}
                    icon={Package}
                    iconColor="text-amber-400"
                    subtext="Issuance & fulfilment queue"
                />
                <MetricCard
                    compact
                    glowColor="hover:border-cyan-400/60 hover:bg-[#0c1930] hover:shadow-[0_0_22px_rgba(6,182,212,0.16)] motion-safe:hover:-translate-y-0.5"
                    title="Restricted cards"
                    value={restricted}
                    icon={LockKeyhole}
                    iconColor="text-rose-400"
                    subtext="Frozen or permanently blocked"
                />
                <MetricCard
                    compact
                    glowColor="hover:border-cyan-400/60 hover:bg-[#0c1930] hover:shadow-[0_0_22px_rgba(6,182,212,0.16)] motion-safe:hover:-translate-y-0.5"
                    title="Cardholders"
                    value={customerCount}
                    icon={Users}
                    iconColor="text-cyan-400"
                    subtext={`${state.cards.length} cards in the registry, including closed`}
                />
            </div>
            <CardRegistry
                cards={state.cards}
                customers={customers}
                selectedId={selectedCard?.id ?? null}
                onSelect={setSelectedId}
                onManage={(id) => {
                    setSelectedId(id);
                    document
                        .getElementById("card-details")
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                }}
                onExport={exportCards}
            />
            <div className="grid items-start gap-4 lg:grid-cols-2">
                <div className="min-w-0 lg:order-2">
                    <CardDetails
                        card={selectedCard}
                        customer={selectedCustomer}
                        onAction={(action, card) => setIntent({ action, card })}
                        onSelect={setSelectedId}
                    />
                </div>
                <CardAuditTrail
                    entries={state.audit}
                    customers={customers}
                    selectedId={selectedCard?.id ?? null}
                />
            </div>
            {intent && (
                <CardOperationDialog
                    key={
                        intent.action +
                        ("card" in intent ? intent.card.id : "new")
                    }
                    intent={intent}
                    customers={customers}
                    operator={operator.email}
                    onClose={() => setIntent(null)}
                    onConfirm={confirm}
                />
            )}
        </div>
    );
}

export default function AdminCardIssuingPage() {
    const { user, loading } = useUser();
    if (loading || !user) return null;
    if (user.role !== "admin")
        return (
            <div className="mx-auto max-w-lg rounded-xl border border-rose-500/30 bg-[#0a1024] p-8 text-center font-mono">
                <ShieldAlert size={30} className="mx-auto mb-4 text-rose-400" />
                <h1 className="text-lg font-bold text-white">
                    Administrator access required
                </h1>
                <p className="my-4 text-xs leading-relaxed text-slate-400">
                    Card Issuing manages cards belonging to bank customers. This
                    area is restricted to administrators.
                </p>
                <Link className={buttonClass} href="/dashboard">
                    Return to dashboard
                </Link>
            </div>
        );
    return <CardIssuingWorkspace operator={user} />;
}
