"use client";

import React, { useState } from "react";
import {
    Calculator,
    Play,
    Info,
    CheckCircle,
    ShieldAlert,
    FileText,
    ArrowRight,
} from "lucide-react";

interface SimulationResult {
    baseAmount: number;
    currency: string;
    matchedRuleId: string;
    allowanceExceeded: boolean;
    isWeekendShieldTriggered: boolean;
    breakdown: {
        variableFee: number;
        fixedFee: number;
        fxSpreadFee: number;
        weekendSurcharge: number;
        rawTotal: number;
    };
    enforcedCap: "NONE" | "FLOOR_LIMIT_APPLIED" | "CEILING_LIMIT_APPLIED";
    finalFeeCollected: number;
    auditLogs: string[];
}

export default function EngineSandbox() {
    // Input parameters state
    const [amount, setAmount] = useState<number>(1500);
    const [currency, setCurrency] = useState<string>("EUR");
    const [tier, setTier] = useState<"STANDARD" | "PREMIUM" | "METAL">(
        "STANDARD",
    );
    const [dayType, setDayType] = useState<"WEEKDAY" | "WEEKEND">("WEEKDAY");
    const [actionType, setActionType] = useState<string>("CRYPTO_BUY");

    const [result, setResult] = useState<SimulationResult | null>(null);

    const runSimulation = (e: React.FormEvent) => {
        e.preventDefault();

        // Algoritm de simulare determinist bazat pe regulile financiare
        let isWeekend = dayType === "WEEKEND";
        let isMetal = tier === "METAL";
        let isPremium = tier === "PREMIUM";

        let matchedRuleId = `RULE-${currency}-${actionType}-SIM`;
        let allowanceExceeded =
            amount > (isMetal ? 2000 : isPremium ? 500 : 100);

        // Calcule matematice ipotetice bazate pe regulile fintech setate anterior
        let pct =
            actionType === "CRYPTO_BUY"
                ? 1.95
                : actionType === "FX_SWAP"
                  ? 0.5
                  : 1.4;
        if (isMetal) pct -= 0.5;
        if (isPremium) pct -= 0.2;

        let variableFee = allowanceExceeded ? amount * (pct / 100) : 0;
        let fixedFee = actionType === "CRYPTO_BUY" ? 1.0 : 0.25;
        if (isMetal) fixedFee = 0;

        let fxSpreadFee =
            actionType === "FX_SWAP" || actionType === "CRYPTO_BUY"
                ? amount * 0.004
                : 0;
        let weekendSurcharge = isWeekend ? amount * 0.01 : 0; // +1% Weekend Shield

        let rawTotal = variableFee + fixedFee + fxSpreadFee + weekendSurcharge;

        // Verificare Caps & Floors de siguranță
        let enforcedCap: SimulationResult["enforcedCap"] = "NONE";
        let finalFeeCollected = rawTotal;
        let floorLimit = 0.5;
        let ceilingLimit = 250.0;

        if (finalFeeCollected < floorLimit && finalFeeCollected > 0) {
            finalFeeCollected = floorLimit;
            enforcedCap = "FLOOR_LIMIT_APPLIED";
        } else if (finalFeeCollected > ceilingLimit) {
            finalFeeCollected = ceilingLimit;
            enforcedCap = "CEILING_LIMIT_APPLIED";
        }

        const logs = [
            `[INIT] Se procesează payload-ul de simulare pentru suma de ${amount} ${currency}`,
            `[MATCH] Identificat cluster regulă: ${matchedRuleId} bazat pe tipul acțiunii.`,
            `[ALLOWANCE] Verificare gratuități plan ${tier}: ${allowanceExceeded ? "Limita lunară a fost depășită. Se aplică taxe brute." : "În limitele planului gratuit."}`,
            isWeekend
                ? `[SECURITY] Scutul de Weekend DETECTAT (+1.00% suplimentar adăugat).`
                : `[SECURITY] Zi de tranzacționare standard. Piețele valutare sunt deschise.`,
            enforcedCap !== "NONE"
                ? `[CAP ENFORCEMENT] Alertă de siguranță activată: ${enforcedCap}. Valoarea brută de ${rawTotal.toFixed(2)} a fost ajustată.`
                : `[CAP CHECK] Valorile de calcul se încadrează în limitele de siguranță înregistrate.`,
        ];

        setResult({
            baseAmount: amount,
            currency,
            matchedRuleId,
            allowanceExceeded,
            isWeekendShieldTriggered: isWeekend,
            breakdown: {
                variableFee,
                fixedFee,
                fxSpreadFee,
                weekendSurcharge,
                rawTotal,
            },
            enforcedCap,
            finalFeeCollected,
            auditLogs: logs,
        });
    };

    return (
        <div className="w-full bg-[#020617] border border-cyan-500/20 rounded-xl overflow-hidden font-mono shadow-xl p-5 lg:p-6">
            {/* COMPONENT TITLE */}
            <div className="border-b border-cyan-500/10 pb-3 mb-5">
                <div className="flex items-center gap-2">
                    <Calculator className="text-cyan-400" size={16} />
                    <h3 className="text-xs font-black tracking-widest text-white uppercase">
                        ENGINE SANDBOX // COMMISSION RUN CALCULATOR
                    </h3>
                </div>
                <p className="text-[9px] text-cyan-400/50 mt-0.5 uppercase tracking-wider font-bold">
                    Dry-Run Evaluation Matrix for Safety Boundary Audits
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* STÂNGA: FORMULARUL MARE DE DATE IPOTETICE */}
                <form
                    onSubmit={runSimulation}
                    className="xl:col-span-4 space-y-4 bg-[#040c29]/30 p-4 rounded-xl border border-cyan-500/10"
                >
                    <span className="block text-[10px] font-black text-cyan-400 uppercase tracking-widest border-b border-cyan-500/10 pb-1.5">
                        Simulation Parameters
                    </span>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase">
                            Suma de calcul (Hypothetical Volume)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            required
                            className="w-full bg-[#03091e] border border-zinc-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">
                                Valută ISO
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full bg-[#03091e] border border-zinc-800 rounded-lg p-2 text-white"
                            >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="RON">RON</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">
                                Zi Tranzacție
                            </label>
                            <select
                                value={dayType}
                                onChange={(e) =>
                                    setDayType(
                                        e.target.value as "WEEKDAY" | "WEEKEND",
                                    )
                                }
                                className="w-full bg-[#03091e] border border-zinc-800 rounded-lg p-2 text-white"
                            >
                                <option value="WEEKDAY">
                                    Săptămână (Open)
                                </option>
                                <option value="WEEKEND">
                                    Weekend (Shield On)
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase">
                            Plan Utilizator (Subscription Class)
                        </label>
                        <select
                            value={tier}
                            onChange={(e) => setTier(e.target.value as any)}
                            className="w-full bg-[#03091e] border border-zinc-800 rounded-lg p-2 text-white"
                        >
                            <option value="STANDARD">Standard Account</option>
                            <option value="PREMIUM">Premium Account</option>
                            <option value="METAL">Metal VIP Cluster</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase">
                            Tipul Operațiunii
                        </label>
                        <select
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value)}
                            className="w-full bg-[#03091e] border border-zinc-800 rounded-lg p-2 text-white"
                        >
                            <option value="CRYPTO_BUY">
                                CRYPTO_BUY (Cumpărare Crypto)
                            </option>
                            <option value="FX_SWAP">
                                FX_SWAP (Schimb Valutar)
                            </option>
                            <option value="CARD_TOPUP">
                                CARD_TOPUP (Depunere card)
                            </option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black font-black text-[10px] tracking-widest uppercase transition-all cursor-pointer"
                    >
                        <Play size={12} /> EXECUTE CALCULATION TRACE
                    </button>
                </form>

                {/* DREAPTA: TABELUL MARE DE ANALIZĂ / BREAKDOWN REZULTATE */}
                <div className="xl:col-span-8 w-full min-h-[350px]">
                    {!result ? (
                        <div className="h-full border border-zinc-800 border-dashed rounded-xl flex flex-col items-center justify-center py-16 text-zinc-500 text-xs text-center px-4">
                            <Info
                                size={28}
                                className="mb-2 text-zinc-600 animate-pulse"
                            />
                            <p className="uppercase tracking-widest">
                                Așteptare parametre injectare sandbox...
                            </p>
                            <p className="text-[10px] font-sans text-zinc-600 mt-1">
                                Rulează simularea pentru a vedea execuția pas cu
                                pas a formulei matematice.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* TABELUL MARE CU TOT CE E NEVOIE */}
                            <div className="border border-cyan-500/20 rounded-lg overflow-hidden bg-[#040c29]/10">
                                <div className="p-3 bg-cyan-950/20 text-[10px] font-black text-cyan-400 uppercase tracking-wider border-b border-cyan-500/20 flex justify-between items-center">
                                    <span>
                                        Calculated Operational Audit Sheet
                                    </span>
                                    <span className="text-white bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 text-[9px]">
                                        {result.matchedRuleId}
                                    </span>
                                </div>

                                <table className="w-full text-left border-collapse text-xs font-mono">
                                    <thead>
                                        <tr className="bg-[#020617] text-[8px] text-zinc-500 uppercase font-black border-b border-zinc-800">
                                            <th className="p-2.5">
                                                Calculation Node Component
                                            </th>
                                            <th className="p-2.5 text-right">
                                                Mathematical Equation Base
                                            </th>
                                            <th className="p-2.5 text-right">
                                                Applied Margin Fee
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900">
                                        <tr>
                                            <td className="p-2.5 font-bold text-zinc-300">
                                                Base Variable Yield Fee
                                            </td>
                                            <td className="p-2.5 text-right text-zinc-400">
                                                {result.allowanceExceeded
                                                    ? "Standard Percent"
                                                    : "Free Allowance Deduction"}
                                            </td>
                                            <td className="p-2.5 text-right text-white font-bold">
                                                {result.breakdown.variableFee.toFixed(
                                                    2,
                                                )}{" "}
                                                {result.currency}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-bold text-zinc-300">
                                                Fixed Network Component Fee
                                            </td>
                                            <td className="p-2.5 text-right text-zinc-400">
                                                Fixed Cost Per Rail Node
                                            </td>
                                            <td className="p-2.5 text-right text-white font-bold">
                                                {result.breakdown.fixedFee.toFixed(
                                                    2,
                                                )}{" "}
                                                {result.currency}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-bold text-zinc-300">
                                                Liquidity FX Spread Markup
                                            </td>
                                            <td className="p-2.5 text-right text-zinc-400">
                                                +0.40% Counterparty Spread
                                            </td>
                                            <td className="p-2.5 text-right text-white font-bold">
                                                {result.breakdown.fxSpreadFee.toFixed(
                                                    2,
                                                )}{" "}
                                                {result.currency}
                                            </td>
                                        </tr>
                                        <tr
                                            className={
                                                result.isWeekendShieldTriggered
                                                    ? "bg-purple-950/20"
                                                    : ""
                                            }
                                        >
                                            <td className="p-2.5 font-bold text-purple-400">
                                                Weekend Security Shield Premium
                                            </td>
                                            <td className="p-2.5 text-right text-purple-400/70">
                                                {result.isWeekendShieldTriggered
                                                    ? "+1.00% Anti-Volatility Protection"
                                                    : "Markets Open (No Surcharge)"}
                                            </td>
                                            <td className="p-2.5 text-right text-purple-400 font-bold">
                                                {result.breakdown.weekendSurcharge.toFixed(
                                                    2,
                                                )}{" "}
                                                {result.currency}
                                            </td>
                                        </tr>
                                        <tr className="bg-[#02081f] border-t border-cyan-500/20">
                                            <td className="p-3 text-cyan-400 font-black uppercase">
                                                Calculated Cumulative Fee (Raw)
                                            </td>
                                            <td className="p-3 text-right text-zinc-500 font-sans italic">
                                                Sum total prior guard review
                                            </td>
                                            <td className="p-3 text-right text-cyan-400 font-black text-sm">
                                                {result.breakdown.rawTotal.toFixed(
                                                    2,
                                                )}{" "}
                                                {result.currency}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* CRITICAL SAFETY INTERCEPT DETECTION ROW */}
                            <div
                                className={`p-3 rounded-lg border flex items-center justify-between text-[11px] ${
                                    result.enforcedCap !== "NONE"
                                        ? "bg-rose-950/30 border-rose-500/40 text-rose-300 animate-pulse"
                                        : "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {result.enforcedCap !== "NONE" ? (
                                        <ShieldAlert
                                            size={14}
                                            className="text-rose-400"
                                        />
                                    ) : (
                                        <CheckCircle
                                            size={14}
                                            className="text-emerald-400"
                                        />
                                    )}
                                    <span className="font-bold uppercase tracking-wide">
                                        Safety Caps State:{" "}
                                        {result.enforcedCap === "NONE"
                                            ? "SUCCESS // WITHIN BOUNDS"
                                            : `INTERCEPTED // ${result.enforcedCap}`}
                                    </span>
                                </div>
                                <span className="font-black text-white bg-black/40 px-2 py-0.5 border border-zinc-800 rounded">
                                    Final Realized Revenue:{" "}
                                    <span className="text-emerald-400 font-black text-xs ml-1">
                                        {result.finalFeeCollected.toFixed(2)}{" "}
                                        {result.currency}
                                    </span>
                                </span>
                            </div>

                            {/* STEP-BY-STEP forensinc audit trace logs */}
                            <div className="space-y-1.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                                    <FileText size={10} /> Step-by-Step
                                    Execution Forensic Trace Log
                                </span>
                                <div className="bg-[#020512] border border-zinc-900 rounded p-3 space-y-1 text-[10px] text-zinc-400 max-h-[110px] overflow-y-auto scrollbar-thin">
                                    {result.auditLogs.map((log, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2"
                                        >
                                            <ArrowRight
                                                size={8}
                                                className="text-cyan-500 shrink-0"
                                            />
                                            <span className="font-mono text-zinc-300">
                                                {log}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
