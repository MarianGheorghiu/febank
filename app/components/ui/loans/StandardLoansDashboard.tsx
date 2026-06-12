"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  Car,
  UserCheck,
  GraduationCap,
  HeartPulse,
  Leaf,
  Briefcase,
  Cpu,
  TrendingUp,
  Box,
  Rocket,
  GitCommit,
  DollarSign,
  Calendar,
  Activity,
} from "lucide-react";

// Definim tipurile pentru ambele moduri într-un singur loc
type RetailLoanType =
  | "HOME"
  | "AUTO"
  | "PERSONAL"
  | "STUDENT"
  | "HEALTH"
  | "GREEN";
type BusinessLoanType =
  | "WORKING_CAPITAL"
  | "EQUIPMENT"
  | "EXPANSION"
  | "INVENTORY"
  | "SEED_DEBT"
  | "BRIDGE";
type CombinedLoanType = RetailLoanType | BusinessLoanType;

interface LoanConfig {
  minAmount: number;
  maxAmount: number;
  stepAmount: number;
  minYears: number;
  maxYears: number;
  baseAPR: number;
  label: string;
}

// 1. CONFIGURAȚIA DE RETAIL (Cea originală)
const RETAIL_CONFIGS: Record<RetailLoanType, LoanConfig> = {
  HOME: {
    label: "RESTRUCTURING & MORTGAGE",
    minAmount: 50000,
    maxAmount: 1000000,
    stepAmount: 10000,
    minYears: 10,
    maxYears: 30,
    baseAPR: 4.85,
  },
  AUTO: {
    label: "HYPERDRIVE AUTO CAPITAL",
    minAmount: 5000,
    maxAmount: 120000,
    stepAmount: 2500,
    minYears: 2,
    maxYears: 7,
    baseAPR: 3.75,
  },
  PERSONAL: {
    label: "LIQUIDITY PERSONAL LINE",
    minAmount: 1000,
    maxAmount: 60000,
    stepAmount: 1000,
    minYears: 1,
    maxYears: 5,
    baseAPR: 7.25,
  },
  STUDENT: {
    label: "ACADEMIC & FUTURE ACCELERATOR",
    minAmount: 2000,
    maxAmount: 50000,
    stepAmount: 1000,
    minYears: 1,
    maxYears: 7,
    baseAPR: 3.25,
  },
  HEALTH: {
    label: "MEDICAL & LONGEVITY RESOURCE",
    minAmount: 1000,
    maxAmount: 40000,
    stepAmount: 500,
    minYears: 1,
    maxYears: 5,
    baseAPR: 4.5,
  },
  GREEN: {
    label: "ECO-GRID & SUSTAINABLE UPGRADE",
    minAmount: 3000,
    maxAmount: 80000,
    stepAmount: 2000,
    minYears: 2,
    maxYears: 10,
    baseAPR: 3.95,
  },
};

// 2. CONFIGURAȚIA DE BUSINESS (Limite mari, dobânzi corporate)
const BUSINESS_CONFIGS: Record<BusinessLoanType, LoanConfig> = {
  WORKING_CAPITAL: {
    label: "OPERATIONAL CASH INFUSION",
    minAmount: 10000,
    maxAmount: 500000,
    stepAmount: 5000,
    minYears: 1,
    maxYears: 5,
    baseAPR: 5.85,
  },
  EQUIPMENT: {
    label: "HARDWARE &INFRASTRUCTURE SCALE",
    minAmount: 5000,
    maxAmount: 250000,
    stepAmount: 5000,
    minYears: 2,
    maxYears: 7,
    baseAPR: 4.25,
  },
  EXPANSION: {
    label: "GLOBAL HUB PLACEMENT CAPITAL",
    minAmount: 100000,
    maxAmount: 5000000,
    stepAmount: 50000,
    minYears: 5,
    maxYears: 15,
    baseAPR: 6.15,
  },
  INVENTORY: {
    label: "STOCK MATRIX DEPOT LINE",
    minAmount: 5000,
    maxAmount: 300000,
    stepAmount: 5000,
    minYears: 1,
    maxYears: 3,
    baseAPR: 5.5,
  },
  SEED_DEBT: {
    label: "STARTUP INFRASTRUCTURE LEVERAGE",
    minAmount: 20000,
    maxAmount: 400000,
    stepAmount: 10000,
    minYears: 1,
    maxYears: 4,
    baseAPR: 7.5,
  },
  BRIDGE: {
    label: "RUNWAY EXTENSION BRIDGE FACILITY",
    minAmount: 10000,
    maxAmount: 750000,
    stepAmount: 10000,
    minYears: 1,
    maxYears: 2,
    baseAPR: 8.25,
  },
};

interface StandardLoansDashboardProps {
  mode: "RETAIL" | "BUSINESS";
}

export default function StandardLoansDashboard({
  mode,
}: StandardLoansDashboardProps) {
  // Selectăm dinamic setul de date pe baza prop-ului introdus
  const currentPool = mode === "RETAIL" ? RETAIL_CONFIGS : BUSINESS_CONFIGS;
  const initialKey = Object.keys(currentPool)[0] as CombinedLoanType;

  const [activeType, setActiveType] = useState<CombinedLoanType>(initialKey);
  const config = currentPool[
    activeType as keyof typeof currentPool
  ] as LoanConfig;

  const [amount, setAmount] = useState(config.minAmount);
  const [termYears, setTermYears] = useState(config.maxYears);

  // Forțăm resetarea tab-ului activ când se comută modul principal din header
  useEffect(() => {
    const keys = Object.keys(currentPool);
    setActiveType(keys[0] as CombinedLoanType);
  }, [mode]);

  // Recalibrare valori slidere la comutarea sub-tipului de credit active
  useEffect(() => {
    if (config) {
      setAmount(config.minAmount * 2);
      setTermYears(config.maxYears);
    }
  }, [activeType, config]);

  if (!config) return null;

  const monthlyRate = config.baseAPR / 12 / 100;
  const totalMonths = termYears * 12;

  const monthlyPayment =
    monthlyRate > 0
      ? (amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : amount / totalMonths;

  const totalRepayment = monthlyPayment * totalMonths;
  const totalInterest = totalRepayment - amount;

  // Funcție utilitară pentru a randa dinamic iconița corespunzătoare
  const renderLoanIcon = (type: CombinedLoanType, isSelected: boolean) => {
    const cls = isSelected ? "text-cyan-400" : "";
    switch (type) {
      // Retail
      case "HOME":
        return <Home size={15} className={cls} />;
      case "AUTO":
        return <Car size={15} className={cls} />;
      case "PERSONAL":
        return <UserCheck size={15} className={cls} />;
      case "STUDENT":
        return <GraduationCap size={15} className={cls} />;
      case "HEALTH":
        return <HeartPulse size={15} className={cls} />;
      case "GREEN":
        return <Leaf size={15} className={cls} />;
      // Business
      case "WORKING_CAPITAL":
        return <Briefcase size={15} className={cls} />;
      case "EQUIPMENT":
        return <Cpu size={15} className={cls} />;
      case "EXPANSION":
        return <TrendingUp size={15} className={cls} />;
      case "INVENTORY":
        return <Box size={15} className={cls} />;
      case "SEED_DEBT":
        return <Rocket size={15} className={cls} />;
      case "BRIDGE":
        return <GitCommit size={15} className={cls} />;
      default:
        return <Activity size={15} className={cls} />;
    }
  };

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] sm:backdrop-blur-xl rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col w-full overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-5">
        {/* HEADER CONTROL COMPONENT */}
        <div className="flex justify-between items-center pb-3 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Activity size={14} />
            </div>
            {mode === "RETAIL"
              ? "Standard Debt Allocation"
              : "Corporate Debt Dispatch"}
          </h2>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
            {mode} CORE ACTIVE
          </span>
        </div>

        {/* STEP 1: EXTENDED TYPE SELECTION GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
          {Object.keys(currentPool).map((type) => {
            const isSelected = activeType === type;
            const formattedLabel = type.replace("_", " ");
            return (
              <button
                key={type}
                onClick={() => setActiveType(type as CombinedLoanType)}
                className={`cursor-pointer flex flex-col items-center justify-center p-2.5 rounded-lg border font-mono transition-all ${
                  isSelected
                    ? "bg-[#02040f] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] text-white"
                    : "bg-[#02040f]/50 border-blue-500/10 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400"
                }`}
              >
                {renderLoanIcon(type as CombinedLoanType, isSelected)}
                <span className="text-[8px] font-black mt-1.5 tracking-wider uppercase text-center block max-w-full truncate">
                  {formattedLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* STEP 2: INTERACTIVE SLIDERS AND CONFIG PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#02040f]/40 border border-blue-500/5 p-4 rounded-lg flex-1">
          {/* LEFT: SLIDERS CONTROL LAYER */}
          <div className="flex flex-col justify-center gap-4 font-mono">
            {/* AMOUNT SLIDER */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <DollarSign size={11} className="text-cyan-400" /> Capital
                  Allocation
                </span>
                <span className="text-cyan-400 font-black">
                  ${amount.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={config.minAmount}
                max={config.maxAmount}
                step={config.stepAmount}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer border border-cyan-500/20"
              />
              <div className="flex justify-between text-[8px] text-slate-600">
                <span>MIN: ${config.minAmount.toLocaleString()}</span>
                <span>MAX: ${config.maxAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* TIME HORIZON TERM SLIDER */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={11} className="text-cyan-400" /> Time Horizon
                  Term
                </span>
                <span className="text-cyan-400 font-black">
                  {termYears} Years
                </span>
              </div>
              <input
                type="range"
                min={config.minYears}
                max={config.maxYears}
                step={1}
                value={termYears}
                onChange={(e) => setTermYears(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer border border-cyan-500/20"
              />
              <div className="flex justify-between text-[8px] text-slate-600">
                <span>MIN: {config.minYears} YRS</span>
                <span>MAX: {config.maxYears} YRS</span>
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE CALCULATION LEDGER MATRIX */}
          <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-cyan-500/10 pt-4 md:pt-0 md:pl-4 font-mono text-xs">
            <div className="space-y-2">
              <span className="text-[8px] text-slate-500 font-black uppercase block tracking-widest">
                {config.label}
              </span>

              <div className="flex justify-between items-center p-2 rounded bg-[#02040f] border border-blue-500/10">
                <span className="text-slate-400 text-[10px]">
                  FIXED BASE APR
                </span>
                <span className="text-cyan-400 font-black">
                  {config.baseAPR}%
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded bg-[#02040f] border border-blue-500/10">
                <span className="text-slate-400 text-[10px]">
                  TOTAL INTEREST COST
                </span>
                <span className="text-rose-400 font-black">
                  ${Math.round(totalInterest).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded bg-[#02040f] border border-blue-500/10">
                <span className="text-slate-400 text-[10px]">
                  TOTAL OVERALL RETURN
                </span>
                <span className="text-white font-black">
                  ${Math.round(totalRepayment).toLocaleString()}
                </span>
              </div>
            </div>

            {/* MONTHLY RATE HIGHLIGHT IMMERSIVE PLATE */}
            <div className="mt-4 p-2.5 rounded border border-cyan-500/30 bg-[#02040f] flex justify-between items-center shadow-[inset_0_0_12px_rgba(34,211,238,0.05)]">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                MONTHLY INSTALMENT
              </span>
              <span className="text-base font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                ${Math.round(monthlyPayment).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* STEP 3: SUBMIT EXECUTION BUTTON */}
        <div className="shrink-0 pt-1">
          <button className="cursor-pointer w-full py-3 rounded bg-cyan-400 hover:bg-cyan-300 text-[#02040f] font-mono font-black text-[11px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]">
            {mode === "RETAIL"
              ? "INITIATE LOAN APPROVAL DISPATCH"
              : "EXECUTE CORPORATE UNDERWRITING"}
          </button>
        </div>
      </div>
    </div>
  );
}
