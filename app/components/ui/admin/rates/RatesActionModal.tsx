"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Eye,
    Edit3,
    ShieldAlert,
    Cpu,
    Layers,
    DollarSign,
    Percent,
    ShieldCheck,
} from "lucide-react";
import { FeeRule } from "@/app/lib/admin/mockRates";

type ModalMode = "view" | "edit" | "toggle" | "create";

interface RatesActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    rule: FeeRule | null;
    mode: ModalMode | null;
    onConfirmSave: (updatedRule: Partial<FeeRule>) => void;
}

export default function RatesActionModal({
    isOpen,
    onClose,
    rule,
    mode,
    onConfirmSave,
}: RatesActionModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [category, setCategory] = useState<FeeRule["category"]>("PAY_IN");
    const [channel, setChannel] = useState("");
    const [currency, setCurrency] = useState("EUR");
    const [baseFixedFee, setBaseFixedFee] = useState(0);
    const [basePercentageFee, setBasePercentageFee] = useState(0);
    const [fxSpreadMarkup, setFxSpreadMarkup] = useState(0);
    const [minFeeCap, setMinFeeCap] = useState(0);
    const [maxFeeCap, setMaxFeeCap] = useState(0);
    const [monthlyFreeAllowance, setMonthlyFreeAllowance] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false);
        } else if (mode === "create") {
            setName("");
            setCategory("PAY_IN");
            setChannel("");
            setCurrency("EUR");
            setBaseFixedFee(0);
            setBasePercentageFee(0);
            setFxSpreadMarkup(0);
            setMinFeeCap(0);
            setMaxFeeCap(0);
            setMonthlyFreeAllowance(0);
        } else if (rule) {
            setName(rule.name);
            setCategory(rule.category);
            setChannel(rule.channel);
            setCurrency(rule.currency);
            setBaseFixedFee(rule.baseFixedFee);
            setBasePercentageFee(rule.basePercentageFee);
            setFxSpreadMarkup(rule.fxSpreadMarkup);
            setMinFeeCap(rule.minFeeCap);
            setMaxFeeCap(rule.maxFeeCap);
            setMonthlyFreeAllowance(rule.monthlyFreeAllowance);
        }
    }, [isOpen, rule, mode]);

    if (!isOpen || !mode) return null;
    if (mode !== "create" && !rule) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        setTimeout(() => {
            onConfirmSave({
                name,
                category,
                channel,
                currency,
                baseFixedFee: Number(baseFixedFee),
                basePercentageFee: Number(basePercentageFee),
                fxSpreadMarkup: Number(fxSpreadMarkup),
                minFeeCap: Number(minFeeCap),
                maxFeeCap: Number(maxFeeCap),
                monthlyFreeAllowance: Number(monthlyFreeAllowance),
            });
            setIsProcessing(false);
            onClose();
        }, 1000);
    };

    const config = {
        view: {
            title: "Policy Telemetry Readout",
            subtitle: "Deep Calculator Properties Inspection",
            icon: <Eye size={18} />,
            colorClass: "text-cyan-400",
            borderClass: "border-cyan-500/60",
            bgGradient: "from-[#020617] to-[#04163a]",
            shadowClass: "shadow-[0_0_40px_rgba(6,182,212,0.25)]",
            accentBorder: "border-cyan-500/30",
            buttonHover: "hover:bg-cyan-500",
            accentBgDim: "bg-cyan-500/10",
        },
        edit: {
            title: "Propose Ruleset Mutation",
            subtitle: "Maker Pipeline Realignment Request",
            icon: <Edit3 size={18} />,
            colorClass: "text-amber-400",
            borderClass: "border-amber-500/60",
            bgGradient: "from-[#020617] to-[#2a1405]",
            shadowClass: "shadow-[0_0_40px_rgba(245,158,11,0.25)]",
            accentBorder: "border-amber-500/30",
            buttonHover: "hover:bg-amber-400",
            accentBgDim: "bg-amber-500/10",
        },
        create: {
            title: "Deploy New Fee Rail",
            subtitle: "Initialize Core Calculation Structure",
            icon: <Layers size={18} />,
            colorClass: "text-emerald-400",
            borderClass: "border-emerald-500/60",
            bgGradient: "from-[#020617] to-[#052416]",
            shadowClass: "shadow-[0_0_40px_rgba(16,185,129,0.25)]",
            accentBorder: "border-emerald-500/30",
            buttonHover: "hover:bg-emerald-500",
            accentBgDim: "bg-emerald-500/10",
        },
        toggle: {
            title: "Compliance Governance Authorization",
            subtitle: "4-Eyes Checker Sign-Off Sequence",
            icon: <ShieldCheck size={18} />,
            colorClass: "text-purple-400",
            borderClass: "border-purple-500/60",
            bgGradient: "from-[#020617] to-[#1e0a3a]",
            shadowClass: "shadow-[0_0_40px_rgba(168,85,247,0.25)]",
            accentBorder: "border-purple-500/30",
            buttonHover: "hover:bg-purple-500",
            accentBgDim: "bg-purple-500/10",
        },
    }[mode];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-md"
                onClick={!isProcessing ? onClose : undefined}
            />

            <div
                className={`relative w-full sm:max-w-xl bg-gradient-to-br ${config.bgGradient} border-t sm:border-2 ${config.borderClass} rounded-t-[20px] sm:rounded-xl p-5 sm:p-6 ${config.shadowClass} z-10 max-h-[92vh] overflow-y-auto text-white font-mono`}
            >
                {/* HEAD */}
                <div
                    className={`flex items-center justify-between mb-4 pb-3 border-b ${config.accentBorder}`}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded border bg-[#020510] ${config.borderClass} ${config.colorClass}`}
                        >
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-xs font-black tracking-widest uppercase text-white">
                                {config.title}
                            </h3>
                            <p
                                className={`${config.colorClass}/80 text-[9px] font-bold tracking-wider uppercase mt-0.5`}
                            >
                                {config.subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className={`p-1.5 rounded border bg-[#03091e] ${config.borderClass} ${config.colorClass} hover:text-white transition-all cursor-pointer`}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* SIGNATURE ID HUD */}
                {mode !== "create" && rule && (
                    <div
                        className={`mb-4 bg-[#03091e] border ${config.accentBorder} rounded-lg p-3 flex items-center justify-between shadow-md`}
                    >
                        <div>
                            <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                SCHEMA HARDWARE ID
                            </span>
                            <span className="text-xs font-black text-white block tracking-wide">
                                {rule.id}
                            </span>
                        </div>
                        <span
                            className={`text-[9px] font-black text-white bg-[#020510] border ${config.borderClass} px-2 py-0.5 rounded tracking-wider uppercase`}
                        >
                            {rule.currency} ENGINE TARGET
                        </span>
                    </div>
                )}

                {/* VIEW CONFIG */}
                {mode === "view" && rule && (
                    <div className="space-y-3 text-xs">
                        <div
                            className={`space-y-2 bg-[#020510]/90 border ${config.accentBorder} rounded-lg p-4`}
                        >
                            <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                                <span className="text-cyan-400 font-bold">
                                    Ruleset Label:
                                </span>
                                <span className="text-white font-bold">
                                    {rule.name}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                                <span className="text-cyan-400 font-bold">
                                    Processor Routing:
                                </span>
                                <span className="text-white font-mono font-bold">
                                    {rule.channel}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                                <span className="text-cyan-400 font-bold">
                                    Variable Percentage:
                                </span>
                                <span className="text-white font-bold">
                                    {rule.basePercentageFee}%
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                                <span className="text-cyan-400 font-bold">
                                    Fixed Operational Fee:
                                </span>
                                <span className="text-white font-bold">
                                    {rule.baseFixedFee} {rule.currency}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                                <span className="text-cyan-400 font-bold">
                                    FX Spread Markup:
                                </span>
                                <span className="text-white font-bold">
                                    +{rule.fxSpreadMarkup}%
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                                <span className="text-cyan-400 font-bold">
                                    Safety Execution Caps:
                                </span>
                                <span className="text-white font-bold">
                                    Floor: {rule.minFeeCap} / Ceiling:{" "}
                                    {rule.maxFeeCap} {rule.currency}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-cyan-400 font-bold">
                                    Dual Auth Deployment:
                                </span>
                                <span className="text-amber-400 font-bold">
                                    Maker: {rule.maker}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`w-full py-2.5 rounded-lg border font-black text-[10px] tracking-widest uppercase transition-all ${config.colorClass} ${config.borderClass} ${config.accentBgDim} ${config.buttonHover} hover:text-black cursor-pointer`}
                        >
                            CLOSE DECK DATASTREAM
                        </button>
                    </div>
                )}

                {/* FORM FOR CREATE AND EDIT */}
                {(mode === "edit" || mode === "create") && (
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-3.5 text-xs"
                    >
                        {/* ALERT SAFETY WARNING */}
                        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-[10px] text-zinc-300 flex items-start gap-2 leading-relaxed">
                            <ShieldAlert
                                className="text-rose-400 shrink-0 mt-0.5"
                                size={14}
                            />
                            <p>
                                <span className="text-rose-400 font-black">
                                    CRITICAL RISK ZONE:
                                </span>{" "}
                                Orice modificare greșită (ex: 0.01% în loc de
                                1.00%) intră direct în structura de calcul a
                                profitabilității globale. Verificați virgula și
                                plafoanele matematice!
                            </p>
                        </div>

                        {/* LINE 1 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                                    Ruleset Internal Descriptor
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-[#03091e] border border-zinc-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                                    placeholder="e.g. Card Pay-In Corporate"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                                    Gateway Channel Rail
                                </label>
                                <input
                                    type="text"
                                    value={channel}
                                    onChange={(e) => setChannel(e.target.value)}
                                    required
                                    className="w-full bg-[#03091e] border border-zinc-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                                    placeholder="e.g. Stripe API Engine V4"
                                />
                            </div>
                        </div>

                        {/* LINE 2 */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                                    Rail Cluster Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) =>
                                        setCategory(
                                            e.target
                                                .value as FeeRule["category"],
                                        )
                                    }
                                    className="w-full bg-[#03091e] border border-zinc-800 rounded-lg px-2 py-2 text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="PAY_IN">
                                        PAY_IN (Deposit)
                                    </option>
                                    <option value="PAY_OUT">
                                        PAY_OUT (Withdrawal)
                                    </option>
                                    <option value="FX_SWAP">
                                        FX_SWAP (Conversion)
                                    </option>
                                    <option value="CRYPTO_TRADE">
                                        CRYPTO_TRADE
                                    </option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                                    Sovereign Asset Iso
                                </label>
                                <input
                                    type="text"
                                    value={currency}
                                    onChange={(e) =>
                                        setCurrency(
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    max={3}
                                    required
                                    className="w-full bg-[#03091e] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                                    Free Monthly Allowance
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={monthlyFreeAllowance}
                                    onChange={(e) =>
                                        setMonthlyFreeAllowance(
                                            Number(e.target.value),
                                        )
                                    }
                                    required
                                    className="w-full bg-[#03091e] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* CORE CALCULATION VALUES GRID */}
                        <div className="p-3 bg-black/40 rounded-lg border border-zinc-800 space-y-3">
                            <span className="block text-[9px] font-black tracking-widest text-cyan-400 uppercase">
                                CORE CALCULATION METRICS
                            </span>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-zinc-400 flex items-center gap-1 uppercase">
                                        <Percent size={10} /> Percentage Fee
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={basePercentageFee}
                                        onChange={(e) =>
                                            setBasePercentageFee(
                                                Number(e.target.value),
                                            )
                                        }
                                        className="w-full bg-[#040c2b] border border-zinc-700 rounded p-1.5 text-white text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-zinc-400 flex items-center gap-1 uppercase">
                                        <DollarSign size={10} /> Fixed Fee Base
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={baseFixedFee}
                                        onChange={(e) =>
                                            setBaseFixedFee(
                                                Number(e.target.value),
                                            )
                                        }
                                        className="w-full bg-[#040c2b] border border-zinc-700 rounded p-1.5 text-white text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-zinc-400 flex items-center gap-1 uppercase">
                                        <Cpu size={10} /> FX Spread Markup %
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={fxSpreadMarkup}
                                        onChange={(e) =>
                                            setFxSpreadMarkup(
                                                Number(e.target.value),
                                            )
                                        }
                                        className="w-full bg-[#040c2b] border border-zinc-700 rounded p-1.5 text-white text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* HARD SAFETY BOUNDS */}
                        <div className="p-3 bg-black/40 rounded-lg border border-zinc-800 space-y-3">
                            <span className="block text-[9px] font-black tracking-widest text-amber-400 uppercase">
                                HARD REGULATORY SAFETY BOUNDS (CAPS)
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-zinc-400 uppercase">
                                        Minimum Fee Floor Limit ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={minFeeCap}
                                        onChange={(e) =>
                                            setMinFeeCap(Number(e.target.value))
                                        }
                                        className="w-full bg-[#040c2b] border border-zinc-700 rounded p-1.5 text-white text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-zinc-400 uppercase">
                                        Maximum Fee Ceiling Limit ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={maxFeeCap}
                                        onChange={(e) =>
                                            setMaxFeeCap(Number(e.target.value))
                                        }
                                        className="w-full bg-[#040c2b] border border-zinc-700 rounded p-1.5 text-white text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`w-full py-3 rounded-lg border font-black text-[10px] tracking-widest uppercase transition-all ${config.colorClass} ${config.borderClass} ${config.accentBgDim} ${config.buttonHover} hover:text-black cursor-pointer`}
                        >
                            {isProcessing
                                ? "PROCESSING SECURE ENGINE DEPLOYMENT..."
                                : mode === "create"
                                  ? "PROPOSE NEW OPERAND TO PIPELINE"
                                  : "COMMIT OVERRIDE FOR CHECKER VERIFICATION"}
                        </button>
                    </form>
                )}

                {/* MODAL ACTION: DUAL BLOCK / MULTI-SIG CHECKER COMPLIANCE */}
                {mode === "toggle" && rule && (
                    <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-lg bg-purple-950/30 border border-purple-500/30 text-zinc-200 leading-relaxed text-[11px] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 animate-pulse" />
                            <span className="font-black text-purple-400 block mb-1 uppercase tracking-widest">
                                ⚠️ DUAL-CONTROL AUTHORIZATION PROTOCOL:
                            </span>
                            Ești pe cale să acționezi ca autorizator tip{" "}
                            <span className="text-purple-400 font-bold">
                                CHECKER
                            </span>{" "}
                            pentru regula{" "}
                            <span className="text-white font-bold">
                                {rule.id}
                            </span>{" "}
                            propusă inițial de{" "}
                            <span className="text-cyan-400 font-mono">
                                {rule.maker}
                            </span>
                            . Această operațiune comută starea operațională
                            direct în producția nucleului de calcul sau
                            blochează instant pipeline-ul.
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isProcessing}
                            className="w-full py-3.5 rounded-lg font-black text-[10px] tracking-widest uppercase text-white shadow-lg transition-all border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500 hover:text-black cursor-pointer"
                        >
                            {isProcessing
                                ? "SYNCHRONIZING SECURE POLICIES..."
                                : rule.status === "PENDING_APPROVAL"
                                  ? "SIGN-OFF AND DEPLOY TO PRODUCTION"
                                  : rule.status === "ACTIVE"
                                    ? "EXECUTE EMERGENCY PIPELINE HALT"
                                    : "RE-ACTIVATE FINANCIAL RULESET"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
