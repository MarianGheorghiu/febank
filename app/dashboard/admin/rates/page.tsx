"use client";
import { createMockId } from "@/app/lib/mock/ids";
import { MOCK_PAGE_DATES } from "@/app/lib/mock/page-dates";

import React, { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { captureAdminAudit } from "@/app/components/ui/admin/audit/capture";
import {
    Percent,
    Sliders,
    AlertCircle,
    Plus,
    Wallet,
    Cpu,
    Layers,
    DollarSign,
    Terminal,
} from "lucide-react";
import PageHeader from "@/app/components/ui/PageHeader";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";
import RatesTable from "@/app/components/ui/admin/rates/RatesTable";
import RatesActionModal from "@/app/components/ui/admin/rates/RatesActionModal";
import RatesSpreadsPanel from "@/app/components/ui/admin/rates/RatesSpreadsPanel";
import SubscriptionMatrix from "@/app/components/ui/admin/rates/SubscriptionMatrix";
import EngineSandbox from "@/app/components/ui/admin/rates/EngineSandbox";

import { mockFeeRules, mockFxPairs, mockWeekendShield, mockSubscriptionMatrix } from "@/app/lib/mock/admin/rates";
import type { FeeRule, LiveFxPair, WeekendShieldConfig, SubscriptionMatrixRow } from "@/app/lib/types/admin/rates";

type ActiveTabType =
    | "FIAT_FEES"
    | "CRYPTO_FEES"
    | "STOCKS_FEES"
    | "FX_SPREADS"
    | "SIMULATOR";

export default function RatesFeeEngineDashboard() {
    const { user: operator } = useUser();
    // Tab configuration state
    const [activeTab, setActiveTab] = useState<ActiveTabType>("FIAT_FEES");

    const [rules, setRules] = useState<FeeRule[]>(mockFeeRules);
    const [fxPairs, setFxPairs] = useState<LiveFxPair[]>(mockFxPairs);
    const [weekendConfig, setWeekendConfig] =
        useState<WeekendShieldConfig>(mockWeekendShield);
    const [matrixRows, setMatrixRows] = useState<SubscriptionMatrixRow[]>(
        mockSubscriptionMatrix,
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<FeeRule | null>(null);
    const [modalMode, setModalMode] = useState<
        "view" | "edit" | "toggle" | "create" | null
    >(null);

    // Filter rules array dynamically for table views based on selected tabs
    const filteredRulesByTab = React.useMemo(() => {
        if (activeTab === "FIAT_FEES")
            return rules.filter(
                (r) => r.category === "PAY_IN" || r.category === "PAY_OUT",
            );
        if (activeTab === "CRYPTO_FEES")
            return rules.filter((r) => r.category === "CRYPTO_TRADE");
        if (activeTab === "STOCKS_FEES")
            return rules.filter((r) => r.category === "EQUITIES");
        return rules;
    }, [rules, activeTab]);

    const stats = React.useMemo(() => {
        return {
            activeRules:
                rules.filter((r) => r.status === "ACTIVE").length + 138,
            pendingReview: rules.filter((r) => r.status === "PENDING_APPROVAL")
                .length,
            activeOverrides: fxPairs.filter((f) => f.markupPercentage > 0.5)
                .length,
            exceptions: rules.filter((r) => r.status === "PAUSED").length,
        };
    }, [rules, fxPairs]);

    const handleAddNewRule = () => {
        setSelectedRule(null);
        setModalMode("create");
        setIsModalOpen(true);
    };

    const handleActionClick = (
        rule: FeeRule,
        mode: "view" | "edit" | "toggle",
    ) => {
        setSelectedRule(rule);
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const handleConfirmSave = (updatedFields: Partial<FeeRule>) => {
        if (modalMode === "create") {
            const newRule: FeeRule = {
                id: createMockId("RULE-NEW"),
                name: updatedFields.name || "Unnamed Rule Operand",
                category: updatedFields.category || "PAY_IN",
                channel: updatedFields.channel || "Manual System Injection",
                currency: updatedFields.currency || "EUR",
                baseFixedFee: updatedFields.baseFixedFee ?? 0,
                basePercentageFee: updatedFields.basePercentageFee ?? 0,
                fxSpreadMarkup: updatedFields.fxSpreadMarkup ?? 0,
                minFeeCap: updatedFields.minFeeCap ?? 0,
                maxFeeCap: updatedFields.maxFeeCap ?? 0,
                monthlyFreeAllowance: updatedFields.monthlyFreeAllowance ?? 0,
                volumeBrackets: [],
                status: "PENDING_APPROVAL",
                maker: operator?.email ?? "unknown administrator",
                checker: null,
                lastModified: new Date().toISOString(),
            };
            if (!captureAdminAudit({ source: "RATES", domain: newRule.category === "CRYPTO_TRADE" ? "CRYPTO" : newRule.category === "EQUITIES" ? "STOCK" : "FIAT", category: "CONFIGURATION", action: "FEE_RULE_CREATED", target: newRule.id, severity: "WARNING", reason: "Administrator proposed a demo fee rule.", before: null, after: newRule }, operator)) return;
            setRules((prev) => [newRule, ...prev]);
        } else if (selectedRule) {
            const nextRule: FeeRule = modalMode === "toggle"
                ? { ...selectedRule, status: selectedRule.status === "ACTIVE" ? "PAUSED" : "ACTIVE", checker: operator?.email ?? null }
                : { ...selectedRule, ...updatedFields, status: "PENDING_APPROVAL" };
            if (!captureAdminAudit({ source: "RATES", domain: selectedRule.category === "CRYPTO_TRADE" ? "CRYPTO" : selectedRule.category === "EQUITIES" ? "STOCK" : "FIAT", category: "CONFIGURATION", action: modalMode === "toggle" ? "FEE_RULE_STATUS_CHANGED" : "FEE_RULE_UPDATED", target: selectedRule.id, severity: "WARNING", reason: "Administrator confirmed a demo fee rule change.", before: selectedRule, after: nextRule }, operator)) return;
            setRules(prev => prev.map(rule => rule.id === selectedRule.id ? nextRule : rule));
        }
    };
    const toggleWeekendShield = () => {
        const next = { ...weekendConfig, isProtocolActive: !weekendConfig.isProtocolActive };
        if (!captureAdminAudit({ source: "RATES", domain: "FIAT", category: "CONFIGURATION", action: "WEEKEND_SHIELD_CHANGED", target: "weekend-shield", severity: "WARNING", reason: "Administrator changed the demo weekend FX safeguard.", before: weekendConfig, after: next }, operator)) return;
        setWeekendConfig(next);
    };
    if (!operator || operator.role !== "admin") return <p className="p-6 text-rose-300">Administrator access required.</p>;

    return (
        <div className="w-full bg-[#020617] text-white p-0 m-0 overflow-x-hidden min-h-[500px]">
            <PageHeader
                systemDate={MOCK_PAGE_DATES.admin_rates}
                statusText="Rates & Fee Engine Active"
            >
                <div className="grid grid-cols-2 min-[420px]:grid-cols-4 sm:flex items-center p-1 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md w-full sm:w-auto gap-1 sm:gap-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-zinc-400 font-bold">
                        <Percent size={14} className="text-cyan-500/70" />
                        <span>
                            ACTIVE RULES:{" "}
                            <span className="text-white font-black">
                                {stats.activeRules}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-amber-400 font-bold sm:border-l sm:border-white/[0.06]">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>
                            PENDING:{" "}
                            <span className="text-white font-black">
                                {stats.pendingReview}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-emerald-400 font-bold sm:border-l sm:border-white/[0.06]">
                        <Sliders size={14} className="text-emerald-500/70" />
                        <span>
                            FX SPREADS:{" "}
                            <span className="text-white font-black">
                                {stats.activeOverrides}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 font-mono text-xs text-rose-400 font-bold sm:border-l sm:border-white/[0.06]">
                        <AlertCircle size={14} className="text-rose-500/70" />
                        <span>
                            PAUSED:{" "}
                            <span className="text-white font-black">
                                {stats.exceptions}
                            </span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <ActionButton
                        variant="cyan"
                        icon={<Plus size={14} />}
                        onClick={handleAddNewRule}
                    >
                        ADD NEW RULE
                    </ActionButton>
                </div>
            </PageHeader>

            {/* TAB CONTROLS NAVIGATION BAR */}
            <div className="mx-auto">
                <div className="flex overflow-x-auto bg-[#040c29] p-1.5 border border-cyan-500/20 rounded-xl gap-1.5 scrollbar-none font-mono">
                    {[
                        {
                            id: "FIAT_FEES",
                            label: "Fiat Fees Table",
                            icon: <Wallet size={12} />,
                        },
                        {
                            id: "CRYPTO_FEES",
                            label: "Crypto Fees Table",
                            icon: <Cpu size={12} />,
                        },
                        {
                            id: "STOCKS_FEES",
                            label: "Stocks Fees Table",
                            icon: <DollarSign size={12} />,
                        },
                        {
                            id: "FX_SPREADS",
                            label: "FX Rates & Spreads Matrix",
                            icon: <Layers size={12} />,
                        },
                        {
                            id: "SIMULATOR",
                            label: "Engine Sandbox Simulator",
                            icon: <Terminal size={12} />,
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() =>
                                setActiveTab(tab.id as ActiveTabType)
                            }
                            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.25)] border border-cyan-400"
                                    : "text-cyan-400/70 hover:text-white hover:bg-cyan-950/30 border border-transparent"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN DYNAMIC CONTENT ROUTER AREA */}
            <main className="mx-auto mt-2">
                {/* TAB 1, 2, 3: AFISARE TABEL DE REGULI MARE, FILTRAT ADAPTIV */}
                {(activeTab === "FIAT_FEES" ||
                    activeTab === "CRYPTO_FEES" ||
                    activeTab === "STOCKS_FEES") && (
                    <div className="w-full animate-in fade-in duration-200">
                        <RatesTable
                            rules={filteredRulesByTab}
                            onActionClick={handleActionClick}
                            onExportRule={(r) => alert(JSON.stringify(r))}
                        />
                    </div>
                )}

                {/* TAB 4: FX RATES AND SUBSCRIPTION MATRICES */}
                {activeTab === "FX_SPREADS" && (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
                        <div className="xl:col-span-5 w-full">
                            <RatesSpreadsPanel
                                fxPairs={fxPairs}
                                weekendConfig={weekendConfig}
                                onUpdateMarkup={(pair, markup) =>
                                    alert(`Update markup for ${pair}`)
                                }
                                onToggleWeekendShield={toggleWeekendShield}
                            />
                        </div>
                        <div className="xl:col-span-7 w-full">
                            <SubscriptionMatrix
                                matrixRows={matrixRows}
                                onCellEdit={(id, label, tier, current) =>
                                    alert(`Override ${label} cell`)
                                }
                            />
                        </div>
                    </div>
                )}

                {/* TAB 5: ENGINE SANDBOX ENGINE SIMULATOR */}
                {activeTab === "SIMULATOR" && (
                    <div className="w-full animate-in fade-in duration-200">
                        <EngineSandbox />
                    </div>
                )}
            </main>

            <RatesActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                rule={selectedRule}
                mode={modalMode}
                onConfirmSave={handleConfirmSave}
            />
        </div>
    );
}
