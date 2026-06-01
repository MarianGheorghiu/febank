"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import GlassCard from "../GlassCard";

type TimePeriod = "1W" | "1M" | "3M" | "6M" | "1Y";

interface PeriodDetails {
  val: string;
  change: string;
  pos: boolean;
  data: number[];
  labels: string[];
}

interface DashboardChartProps {
  title: string;
  datasets: Record<TimePeriod, PeriodDetails>;
  variant: "crypto" | "stocks" | "expenses";
}

export default function DashboardChart({
  title,
  datasets,
  variant,
}: DashboardChartProps) {
  const [period, setPeriod] = useState<TimePeriod>("1M");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stocăm dimensiunile reale ale containerului pentru randare pixel-perfect
  const [dimensions, setDimensions] = useState({ width: 0, height: 144 });

  const currentData = datasets[period];
  const { data, labels, val, change, pos } = currentData;

  // Monitorizăm dimensiunile containerului în timp real
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height: height || 144 });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculare min/max pentru scalare precisă
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;

  // Calculăm punctele în coordonate absolute (pixeli) în loc de procente standard
  const points = useMemo(() => {
    if (dimensions.width === 0) return [];

    const paddingX = 0; // Edge-to-edge look premium
    const paddingTop = 15;
    const paddingBottom = 10;
    const usableWidth = dimensions.width - paddingX * 2;
    const usableHeight = dimensions.height - paddingTop - paddingBottom;

    return data.map((val, index) => {
      const x = paddingX + (index / (data.length - 1)) * usableWidth;
      const y =
        dimensions.height -
        paddingBottom -
        ((val - minVal) / range) * usableHeight;
      return { x, y, rawValue: val, label: labels[index] || "" };
    });
  }, [data, labels, minVal, range, dimensions]);

  // Algoritm avansat de netezire cu control de tensiune orizontală (Stil Apple / High-End Fintech)
  const paths = useMemo(() => {
    if (points.length < 2) return { linePath: "", areaPath: "" };

    let linePath = `M ${points[0].x} ${points[0].y}`;
    const tension = 0.28; // Tensiunea ideală pentru curbe fluide fără "burtă" artificială

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      const cp1x = p0.x + (p1.x - p0.x) * tension;
      const cp1y = p0.y;
      const cp2x = p1.x - (p1.x - p0.x) * tension;
      const cp2y = p1.y;

      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const areaPath = `
      ${linePath} 
      L ${points[points.length - 1].x} ${dimensions.height} 
      L ${points[0].x} ${dimensions.height} 
      Z
    `;

    return { linePath, areaPath };
  }, [points, dimensions.height]);

  // Teme vizuale cu straturi multiple de glow liquid glass
  const themes = {
    crypto: {
      line: "#a855f7",
      gradientId: `grad-c-${title.replace(/\s+/g, "")}`,
      stopColor: "rgba(168, 85, 247, 0.16)",
      glow: "hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.08)]",
      accentBg: "bg-purple-500/10",
      accentText: "text-purple-400",
    },
    stocks: {
      line: "#00f0ff", // Neon Cyan pur
      gradientId: `grad-s-${title.replace(/\s+/g, "")}`,
      stopColor: "rgba(0, 240, 255, 0.14)",
      glow: "hover:border-cyan-500/30 hover:shadow-[0_0_40px_rgba(0,240,255,0.08)]",
      accentBg: "bg-cyan-500/10",
      accentText: "text-cyan-400",
    },
    expenses: {
      line: "#f43f5e",
      gradientId: `grad-e-${title.replace(/\s+/g, "")}`,
      stopColor: "rgba(244, 63, 94, 0.14)",
      glow: "hover:border-rose-500/30 hover:shadow-[0_0_40px_rgba(244,63,94,0.08)]",
      accentBg: "bg-rose-500/10",
      accentText: "text-rose-400",
    },
  };
  const theme = themes[variant];

  // Interactivitate: Detecție ultra-precisă bazată pe pixeli
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    let closestIndex = 0;
    let minDiff = Infinity;

    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });
    setHoveredIndex(closestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const isHovering = hoveredIndex !== null;
  const activePoint = isHovering ? points[hoveredIndex!] : null;

  const displayValue = isHovering
    ? variant === "crypto"
      ? `${activePoint!.rawValue} BTC`
      : `$${activePoint!.rawValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : val;

  const displaySubtext = isHovering ? `Index on ${activePoint!.label}` : change;

  return (
    <GlassCard
      className={`!p-6 flex flex-col justify-between border border-white/[0.04] bg-[#05070f]/60 backdrop-blur-3xl transition-all duration-500 rounded-3xl ${theme.glow} group/card relative overflow-hidden`}
    >
      {/* Background radial soft ambient glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/[0.01] rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover/card:bg-white/[0.03]" />

      {/* HEADER FINTECH DESIGN */}
      <div className="flex justify-between items-start gap-4 mb-6 z-10">
        <div className="min-w-0">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-[0.15em] block">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h3 className="text-2xl font-semibold font-mono tracking-tight text-white tabular-nums transition-all duration-150">
              {displayValue}
            </h3>
          </div>
          <p
            className={`text-[11px] font-mono font-medium mt-1 flex items-center gap-1 transition-all duration-300 ${
              isHovering
                ? theme.accentText
                : pos
                  ? "text-emerald-400"
                  : "text-rose-400"
            }`}
          >
            {!isHovering && (pos ? "↑" : "↓")}
            <span>{displaySubtext}</span>
          </p>
        </div>

        {/* TIME CONTROLLER */}
        <div className="flex bg-zinc-950/80 p-0.5 rounded-xl border border-white/[0.05] font-mono shrink-0 shadow-2xl backdrop-blur-md">
          {(["1W", "1M", "3M", "6M", "1Y"] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={(e) => {
                e.preventDefault();
                setPeriod(p);
                setHoveredIndex(null);
              }}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                period === p
                  ? "bg-white/[0.08] text-white border border-white/[0.05] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ZONA DE TRADING & SVG COMPONENT */}
      <div
        className="w-full h-36 relative cursor-crosshair select-none touch-none"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {dimensions.width > 0 && (
          <svg
            className="w-full h-full overflow-visible"
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            <defs>
              <linearGradient id={theme.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.stopColor} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>

            {/* Grid Orizontal Ultra Discret */}
            <g stroke="rgba(255,255,255,0.02)" strokeWidth="1">
              <line
                x1="0"
                y1={dimensions.height * 0.25}
                x2={dimensions.width}
                y2={dimensions.height * 0.25}
              />
              <line
                x1="0"
                y1={dimensions.height * 0.5}
                x2={dimensions.width}
                y2={dimensions.height * 0.5}
              />
              <line
                x1="0"
                y1={dimensions.height * 0.75}
                x2={dimensions.width}
                y2={dimensions.height * 0.75}
              />
            </g>

            {/* Gradient sub curbă */}
            {paths.areaPath && (
              <path
                d={paths.areaPath}
                fill={`url(#${theme.gradientId})`}
                className="transition-all duration-300 ease-in-out"
              />
            )}

            {/* Linia principală de trend */}
            {paths.linePath && (
              <path
                d={paths.linePath}
                fill="none"
                stroke={theme.line}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300 ease-in-out"
              />
            )}

            {/* Interactive Crosshair Tracking Line */}
            {isHovering && activePoint && (
              <>
                <line
                  x1={activePoint.x}
                  y1="0"
                  x2={activePoint.x}
                  y2={dimensions.height}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1.25"
                  strokeDasharray="4,3"
                />

                {/* Glow Ring Exterior */}
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="7"
                  fill={`${theme.line}20`}
                  className="animate-pulse"
                />
                {/* Core Dot-ul alb */}
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke={theme.line}
                  strokeWidth="1.5"
                />
              </>
            )}
          </svg>
        )}

        {/* PREMIUM FLOATING TOOLTIP MICRO-UI (Urmărește cursorul pe axa X) */}
        {isHovering && activePoint && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-75 ease-out rounded-xl border border-white/[0.08] bg-black/70 backdrop-blur-md px-2.5 py-1.5 shadow-2xl flex flex-col gap-0.5"
            style={{
              left: `${Math.min(Math.max(activePoint.x - 50, 4), dimensions.width - 104)}px`,
              top: `${Math.min(Math.max(activePoint.y - 55, 4), dimensions.height - 50)}px`,
              width: "100px",
            }}
          >
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider block text-center truncate">
              {activePoint.label}
            </span>
            <span className="text-[11px] font-mono font-black text-white text-center block tracking-tight">
              {variant === "crypto"
                ? `${activePoint.rawValue}`
                : `$${activePoint.rawValue.toLocaleString("en-US")}`}
            </span>
          </div>
        )}
      </div>

      {/* AXA TIMPULUI (Proporțională și curată) */}
      <div className="flex justify-between items-center pt-4 mt-2 border-t border-white/[0.03] text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest z-10">
        <span>{labels[0]}</span>
        <span className="hidden sm:inline opacity-60">
          {labels[Math.floor(labels.length / 2)]}
        </span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </GlassCard>
  );
}
